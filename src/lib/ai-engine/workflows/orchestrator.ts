// Workflow auto-advance orchestrator. Only workflow-driven tasks (ones
// created from a typed WorkflowDefinition, carrying workflow_slug/
// workflow_key in their `input`) ever auto-advance — the generic,
// model-decomposed plan path stays manual-per-task, exactly as before.
// This is a deliberate scope boundary: only a reviewed, known-safe,
// fixed-shape workflow gets full automation.
//
// decideNextWorkflowStep() is pure — no database access — so the actual
// branching logic (advance vs. return-to-Developer vs. wait) is directly
// unit-testable without a running Supabase instance, the same "pure logic
// extraction" convention used throughout this codebase (see
// findInvalidDependencyIndex in schemas/index.ts).
//
// Loop protection: MAX_AUTO_ADVANCE_STEPS bounds the recursion depth
// defensively, but the real guarantee is structural — every workflow is a
// small, fixed-length list of typed task templates (never model-generated,
// never recursively decomposed), and every RPC transition this module
// triggers (assign_ai_task, retry_ai_task) is itself guarded by the
// database's own state-machine checks, so no task can ever be advanced or
// retried more times than its own max_retries allows.

import type { SupabaseClient } from "@supabase/supabase-js";
import { findWorkflowBySlug } from "./registry";
import type { WorkflowDefinition } from "./types";
import { WORKFLOW_TASK_RUNNERS } from "../agents";
import { MAX_AUTO_ADVANCE_STEPS } from "../config";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function outputIndicatesFailure(output: unknown): boolean {
  return isRecord(output) && output.status === "failed";
}

export interface WorkflowTaskState {
  key: string;
  status: string;
  output: unknown;
}

export type WorkflowDecision =
  | { action: "return_for_revision"; returnToKey: string }
  | { action: "advance"; nextKey: string }
  | { action: "wait" };

// Pure: given the workflow definition and the current status/output of each
// of its tasks (keyed by template key), decide what should happen next.
export function decideNextWorkflowStep(workflow: WorkflowDefinition, statesByKey: Map<string, WorkflowTaskState>): WorkflowDecision {
  for (const template of workflow.tasks) {
    const state = statesByKey.get(template.key);
    if (!state) continue;
    if (state.status === "completed" && outputIndicatesFailure(state.output) && template.onFailureReturnToKey) {
      return { action: "return_for_revision", returnToKey: template.onFailureReturnToKey };
    }
  }

  for (const template of workflow.tasks) {
    const state = statesByKey.get(template.key);
    if (!state || state.status !== "pending") continue;
    if (!template.dependsOnKey) {
      return { action: "advance", nextKey: template.key };
    }
    const depState = statesByKey.get(template.dependsOnKey);
    const depSatisfied = depState?.status === "completed" && !outputIndicatesFailure(depState.output);
    if (depSatisfied) {
      return { action: "advance", nextKey: template.key };
    }
  }

  return { action: "wait" };
}

interface WorkflowTaskRow {
  id: string;
  status: string;
  output: unknown;
  input: Record<string, unknown> | null;
}

// Database-touching orchestration on top of the pure decision above. Called
// after every successful task completion (from engine.ts) so the happy
// path — research -> development -> QA -> (approval) -> deploy — runs to
// completion (or the next human-needed stop) without a separate click per
// step, while any failure or approval requirement halts the chain for a
// human to act on.
export async function advanceWorkflow(supabase: SupabaseClient, serviceRequestId: string, depth = 0): Promise<void> {
  if (depth >= MAX_AUTO_ADVANCE_STEPS) return;

  const { data: tasks } = await supabase
    .from("ai_tasks")
    .select("id, status, output, input")
    .eq("service_request_id", serviceRequestId)
    .not("parent_task_id", "is", null);
  const rows = (tasks ?? []) as unknown as WorkflowTaskRow[];
  if (rows.length === 0) return;

  const workflowSlugRow = rows.find((row) => typeof row.input?.workflow_slug === "string");
  const workflowSlug = workflowSlugRow?.input?.workflow_slug as string | undefined;
  const workflow = workflowSlug ? findWorkflowBySlug(workflowSlug) : null;
  if (!workflow) return;

  const byKey = new Map<string, WorkflowTaskRow>();
  for (const row of rows) {
    const key = typeof row.input?.workflow_key === "string" ? (row.input.workflow_key as string) : null;
    if (key) byKey.set(key, row);
  }

  const statesByKey = new Map<string, WorkflowTaskState>();
  for (const [key, row] of byKey) statesByKey.set(key, { key, status: row.status, output: row.output });

  const decision = decideNextWorkflowStep(workflow, statesByKey);
  if (decision.action === "wait") return;

  if (decision.action === "return_for_revision") {
    const returnTask = byKey.get(decision.returnToKey);
    if (!returnTask || returnTask.status !== "completed") return;

    const { error } = await supabase.rpc("retry_ai_task", { task_id: returnTask.id });
    if (error) return; // retry budget exhausted, or otherwise blocked — leave for a human

    const runner = WORKFLOW_TASK_RUNNERS[decision.returnToKey];
    if (runner) {
      const result = await runner(supabase, returnTask.id);
      if (result.status === "success") await advanceWorkflow(supabase, serviceRequestId, depth + 1);
    }
    return;
  }

  const template = workflow.tasks.find((t) => t.key === decision.nextKey);
  const nextTask = byKey.get(decision.nextKey);
  if (!template || !nextTask) return;

  const { data: agentRow } = await supabase.from("agent_definitions").select("id").eq("slug", template.agentSlug).maybeSingle();
  if (!agentRow) return;

  const { error: assignError } = await supabase.rpc("assign_ai_task", { task_id: nextTask.id, agent_definition_id: agentRow.id });
  if (assignError) return;

  const runner = WORKFLOW_TASK_RUNNERS[decision.nextKey];
  if (!runner) return;

  const result = await runner(supabase, nextTask.id);
  if (result.status === "success") {
    await advanceWorkflow(supabase, serviceRequestId, depth + 1);
  }
  // waiting_for_approval or error -> stop here, a human is needed.
}
