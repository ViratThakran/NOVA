// AI Engine — the single, explicit entry point the rest of NOVA talks to.
// Admin Server Actions call these functions instead of importing agents,
// providers, or tools directly; UI components never import anything from
// this subsystem at all (UI -> Server Action -> AI Engine -> Database/RPC).
//
// NOVA's database remains the authority: every function here ultimately
// defers to a SECURITY DEFINER RPC (assign_ai_task, start_agent_run,
// complete_agent_run, retry_ai_task, cancel_ai_task, decide_ai_approval,
// consume_ai_approval, ...) for any actual state transition. The engine
// never mutates ai_tasks/ai_approvals state directly — it only ever asks
// the database to, and the database's own RLS/state-machine checks are
// what actually enforce the decision. An AI model may propose an action
// ("deploy the website"); only this layer, backed by the database, decides
// whether that action is currently permitted.

import type { SupabaseClient } from "@supabase/supabase-js";
import { planServiceRequest, type PlanServiceRequestResult } from "./agents/project-manager";
import { WORKFLOW_TASK_RUNNERS, GENERIC_AGENT_RUNNERS, type AgentRunResult } from "./agents";
import { advanceWorkflow } from "./workflows/orchestrator";
import { decideApproval as decideApprovalRpc, type ApprovalDecision } from "./approvals";

export type { PlanServiceRequestResult } from "./agents/project-manager";
export type { AgentRunResult } from "./agents";
export type { ApprovalDecision } from "./approvals";

interface EngineTaskRow {
  id: string;
  status: string;
  input: Record<string, unknown> | null;
  service_request_id: string;
  retry_count: number;
  max_retries: number;
  agent_definitions: { slug: string } | { slug: string }[] | null;
}

export interface TaskStatus {
  id: string;
  status: string;
  serviceRequestId: string;
  agentSlug: string | null;
  workflowKey: string | null;
  retryCount: number;
  maxRetries: number;
}

// getStatus() — reads a task's current status/dispatch metadata. The one
// place the engine (and any future caller) asks "what is this task doing
// right now" — never a raw ai_tasks query duplicated at each call site.
export async function getStatus(supabase: SupabaseClient, taskId: string): Promise<TaskStatus | null> {
  const { data, error } = await supabase
    .from("ai_tasks")
    .select("id, status, input, service_request_id, retry_count, max_retries, agent_definitions(slug)")
    .eq("id", taskId)
    .maybeSingle<EngineTaskRow>();
  if (error || !data) return null;

  const agentDefinition = Array.isArray(data.agent_definitions) ? data.agent_definitions[0] : data.agent_definitions;
  const workflowKey = typeof data.input?.workflow_key === "string" ? (data.input.workflow_key as string) : null;

  return {
    id: data.id,
    status: data.status,
    serviceRequestId: data.service_request_id,
    agentSlug: agentDefinition?.slug ?? null,
    workflowKey,
    retryCount: data.retry_count,
    maxRetries: data.max_retries,
  };
}

// plan() — turns an accepted service_request into a validated task graph.
// Delegates to the AI Project Manager agent; see agents/project-manager.ts
// for the full authorization/validation story (agent resolution, capability
// filtering, dependency validation, and — for a typed workflow — the
// deterministic plan + immediate auto-advance).
export async function plan(supabase: SupabaseClient, serviceRequestId: string): Promise<PlanServiceRequestResult> {
  return planServiceRequest(supabase, serviceRequestId);
}

async function dispatch(supabase: SupabaseClient, taskId: string): Promise<AgentRunResult> {
  const status = await getStatus(supabase, taskId);
  if (!status) {
    return { status: "error", message: "This task could not be found." };
  }

  // Workflow-driven tasks dispatch by their workflow key; anything else
  // falls back to the generic, agent-slug-keyed runner table (only agents
  // with a real tested runner are executable through the engine).
  const runner = (status.workflowKey && WORKFLOW_TASK_RUNNERS[status.workflowKey]) || (status.agentSlug && GENERIC_AGENT_RUNNERS[status.agentSlug]);
  if (!runner) {
    return { status: "error", message: "This task cannot be run from here yet." };
  }

  const result = await runner(supabase, taskId);

  if (result.status === "success" && status.workflowKey) {
    // Continue the chain if this run unblocked a subsequent workflow step —
    // relevant both for the initial auto-advance kicked off by plan() and
    // for a manual resume (e.g. re-running deployment after an approval
    // decision).
    await advanceWorkflow(supabase, status.serviceRequestId);
  }

  return result;
}

// execute() — runs (or continues) a single task: assigns it to its agent if
// still pending, starts/continues its agent_run, authorizes whatever tool
// that agent needs, and completes the run. Every actual authorization
// decision happens inside authorizeToolUse() (tools/index.ts) against the
// database's own capability grants and approval state — this function
// never grants permission itself, it only asks the right agent to try, and
// the database decides.
export async function execute(supabase: SupabaseClient, taskId: string): Promise<AgentRunResult> {
  return dispatch(supabase, taskId);
}

// resume() — semantically the same call as execute(), used when the caller
// specifically knows this is a resumption (e.g. immediately after an
// approval was granted). The underlying runners already handle a task in
// 'running' state as a resume case (see agents/developer-agent.ts's
// deployment runner, which reuses its still-open agent_run); this alias
// exists so call sites can express that intent clearly.
export async function resume(supabase: SupabaseClient, taskId: string): Promise<AgentRunResult> {
  return dispatch(supabase, taskId);
}

export interface EngineRpcResult {
  status: "success" | "error";
  message?: string;
}

// retry() — requeues a failed task, bounded by its own max_retries
// (enforced by retry_ai_task() in the database, not here). Does not
// re-execute the task itself; a subsequent execute() call does that,
// mirroring the existing "requeue, then run" flow.
export async function retry(supabase: SupabaseClient, taskId: string): Promise<EngineRpcResult> {
  const { error } = await supabase.rpc("retry_ai_task", { task_id: taskId });
  if (error) return { status: "error", message: error.message };
  return { status: "success" };
}

// cancel() — moves a task to 'cancelled' via cancel_ai_task(), which itself
// only allows the transition from a non-terminal, non-running state. A
// running task must fail, complete, or request approval — it cannot be
// yanked away mid-execution.
export async function cancel(supabase: SupabaseClient, taskId: string): Promise<EngineRpcResult> {
  const { error } = await supabase.rpc("cancel_ai_task", { task_id: taskId });
  if (error) return { status: "error", message: error.message };
  return { status: "success" };
}

// decideApproval() — the only path a human decision reaches the database
// through. approved -> the gated task resumes to 'running'; rejected -> it
// moves to 'cancelled'. The engine never resumes execution on its own
// after this call — a caller must separately call execute()/resume() to
// actually continue, so the human decision and the next side effect stay
// two distinct, auditable actions. The model itself never sees or decides
// this outcome.
export async function decideApproval(supabase: SupabaseClient, approvalId: string, decision: ApprovalDecision): Promise<EngineRpcResult> {
  const { error } = await decideApprovalRpc(supabase, approvalId, decision);
  if (error) return { status: "error", message: error.message };
  return { status: "success" };
}
