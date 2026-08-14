// QA Agent (Phase 8E). Independently inspects the Developer Agent's actual
// persisted artifact — never the Developer's own in-process return value —
// combining a deterministic structural check (checkWebsiteBuildStructure,
// schemas.ts) with a qualitative AI judgment. The deterministic check always
// wins: if it finds real structural issues, the QA verdict is forced to
// "failed" regardless of what the model says, so a model that's inclined to
// rubber-stamp its own kind of work can't override a concrete defect.
//
// A QA task itself always completes successfully as an execution (it did
// its job of inspecting the work) — the pass/fail VERDICT lives in the
// task's structured output, which workflow-engine.ts reads to decide
// whether to advance the workflow or send the work back to the Developer
// Agent for revision.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAiProvider } from "./provider";
import { qaResultSchema, websiteBuildSchema, checkWebsiteBuildStructure, type QaResult } from "./schemas";
import { authorizeToolUse } from "./tools";

export interface RunQaTaskResult {
  status: "success" | "waiting_for_approval" | "error";
  message?: string;
  output?: QaResult;
  approvalId?: string;
}

interface TaskRow {
  id: string;
  status: string;
  agent_definition_id: string | null;
  input: Record<string, unknown> | null;
  service_request_id: string;
}

export async function runQaTask(supabase: SupabaseClient, taskId: string): Promise<RunQaTaskResult> {
  const { data: agent, error: agentError } = await supabase.from("agent_definitions").select("id, status").eq("slug", "qa-agent").maybeSingle();
  if (agentError || !agent || agent.status !== "active") {
    return { status: "error", message: "QA Agent is not configured or is inactive." };
  }

  const { data: task, error: taskError } = await supabase
    .from("ai_tasks")
    .select("id, status, agent_definition_id, input, service_request_id")
    .eq("id", taskId)
    .maybeSingle<TaskRow>();
  if (taskError || !task) {
    return { status: "error", message: "Task not found." };
  }

  if (task.status === "pending" && !task.agent_definition_id) {
    const { error: assignError } = await supabase.rpc("assign_ai_task", { task_id: taskId, agent_definition_id: agent.id });
    if (assignError) return { status: "error", message: assignError.message };
  } else if (task.status !== "assigned") {
    return { status: "error", message: `Task is in status '${task.status}', which cannot be run.` };
  } else if (task.agent_definition_id !== agent.id) {
    return { status: "error", message: "Task is assigned to a different agent." };
  }

  const { data: runId, error: startError } = await supabase.rpc("start_agent_run", { task_id: taskId, agent_definition_id: agent.id });
  if (startError) {
    return { status: "error", message: startError.message };
  }

  const authorization = await authorizeToolUse(supabase, {
    taskId,
    toolSlug: "run_website_checks",
    reason: "QA Agent needs to validate the generated website before delivery.",
  });
  if (authorization.waitingForApproval) {
    return { status: "waiting_for_approval", approvalId: authorization.approvalId };
  }
  if (!authorization.authorized) {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: authorization.reason ?? "Tool authorization failed." });
    return { status: "error", message: authorization.reason ?? "Tool authorization failed." };
  }

  // Independent inspection: fetch the LATEST persisted website artifact for
  // this request directly from the database — never trust a value handed to
  // this function in-process. Picking the most recent one also means a
  // regenerated build (after a QA-fail -> Developer retry) is what actually
  // gets re-tested.
  const { data: artifact } = await supabase
    .from("ai_artifacts")
    .select("content")
    .eq("service_request_id", task.service_request_id)
    .eq("type", "website_source")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!artifact) {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "No website build found to test." });
    return { status: "error", message: "No website build found to test. The task was marked failed." };
  }

  let issues: string[];
  try {
    const build = websiteBuildSchema.parse(artifact.content);
    issues = checkWebsiteBuildStructure(build).issues;
  } catch {
    issues = ["The stored website build could not be parsed — it does not match the expected structure."];
  }

  const description = typeof task.input?.description === "string" ? task.input.description : "";

  let result: QaResult;
  try {
    const raw = await getAiProvider().complete({
      responseFormat: "qa_result",
      systemPrompt:
        "You are NOVA's QA Agent. Independently assess whether the generated website meets requirements. Respond with JSON only, matching the required schema.",
      userPrompt: `Task: ${description}\nSTRUCTURAL_ISSUES:${issues.length}`,
    });
    result = qaResultSchema.parse(JSON.parse(raw));
  } catch {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "AI returned invalid or unparseable QA output." });
    return { status: "error", message: "AI returned invalid output. The task was marked failed." };
  }

  // The deterministic check always wins — it inspected real content, the
  // model only inspected a summary of it.
  if (issues.length > 0) {
    result = { ...result, status: "failed", issues: [...issues, ...result.issues] };
  }

  await supabase.from("ai_artifacts").insert({
    service_request_id: task.service_request_id,
    ai_task_id: taskId,
    created_by_agent_id: agent.id,
    type: "qa_report",
    title: `QA report: ${result.status}`,
    content: result,
  });

  const { error: completeError } = await supabase.rpc("complete_agent_run", {
    run_id: runId,
    outcome: "succeeded",
    summary: `QA ${result.status}: ${result.issues.length} issue(s) found.`,
    output: result,
  });
  if (completeError) {
    return { status: "error", message: completeError.message };
  }

  return { status: "success", output: result };
}
