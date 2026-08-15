// Research Agent — the first specialized agent implemented end-to-end,
// chosen because it needs no dangerous production privileges. The full
// path: assign -> start a real agent_run -> authorize the one tool it uses
// (web_search, gated on read_public_web) -> produce a schema-validated
// structured result -> complete the run -> complete the task. Every step
// re-uses the shared RPCs and tools/index.ts's authorization gate —
// nothing here bypasses either.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAiProvider } from "../providers";
import { researchResultSchema, type ResearchResult } from "../schemas";
import { authorizeToolUse, webSearch } from "../tools";
import { recordArtifact } from "../artifacts";

export interface RunResearchTaskResult {
  status: "success" | "waiting_for_approval" | "error";
  message?: string;
  output?: ResearchResult;
  approvalId?: string;
}

export async function runResearchTask(supabase: SupabaseClient, taskId: string): Promise<RunResearchTaskResult> {
  const { data: agent, error: agentError } = await supabase.from("agent_definitions").select("id, status").eq("slug", "research-agent").maybeSingle();
  if (agentError || !agent || agent.status !== "active") {
    return { status: "error", message: "Research Agent is not configured or is inactive." };
  }

  const { data: task, error: taskError } = await supabase
    .from("ai_tasks")
    .select("id, status, agent_definition_id, input, service_request_id")
    .eq("id", taskId)
    .maybeSingle();
  if (taskError || !task) {
    return { status: "error", message: "Task not found." };
  }

  // A task freshly created by the PM (or created directly) may still be
  // 'pending' with no agent yet — auto-assign to Research Agent as a
  // convenience ONLY when nothing else has claimed it. Anything already
  // assigned to a different agent, or in any other status, is left alone.
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
    // start_agent_run() itself is what makes double-execution safe: a
    // second concurrent call for the same task will fail here with
    // "Invalid State" because the first call already moved the task past
    // 'assigned' — this function does not need its own separate lock.
    return { status: "error", message: startError.message };
  }

  const topic = typeof task.input === "object" && task.input && "description" in task.input ? String((task.input as { description?: unknown }).description ?? "") : "";

  const authorization = await authorizeToolUse(supabase, {
    taskId,
    toolSlug: "web_search",
    reason: `Research Agent needs to gather public information for: ${topic || "this task"}`,
  });
  if (authorization.waitingForApproval) {
    // Task is now 'waiting_for_approval' (set by authorizeToolUse via
    // request_ai_task_approval) — the run itself stays 'running' until a
    // future resumption completes it. Nothing more happens here.
    return { status: "waiting_for_approval", approvalId: authorization.approvalId };
  }
  if (!authorization.authorized) {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: authorization.reason ?? "Tool authorization failed." });
    return { status: "error", message: authorization.reason ?? "Tool authorization failed." };
  }

  const search = await webSearch(topic || "general research for this request");

  let result: ResearchResult;
  try {
    const raw = await getAiProvider().complete({
      responseFormat: "research_result",
      systemPrompt:
        "You are NOVA's Research Agent. Summarize findings for the given topic using only the provided search context. Respond with JSON only, matching the required schema.",
      userPrompt: `Topic: ${topic}\nSearch context: ${JSON.stringify(search.results)}`,
    });
    result = researchResultSchema.parse(JSON.parse(raw));
  } catch {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "AI returned invalid or unparseable research output." });
    return { status: "error", message: "AI returned invalid output. The task was marked failed." };
  }

  const { error: completeError } = await supabase.rpc("complete_agent_run", {
    run_id: runId,
    outcome: "succeeded",
    summary: result.summary,
    output: result,
  });
  if (completeError) {
    return { status: "error", message: completeError.message };
  }

  // Addressable, typed record of this deliverable at the service-request
  // level — separate from ai_tasks.output, which stays this run's own
  // record. Safe execution metadata only: provider name and result count,
  // never raw scraped content beyond what's already in the
  // schema-validated result.
  await recordArtifact(supabase, {
    serviceRequestId: task.service_request_id,
    taskId,
    agentId: agent.id,
    type: "research_report",
    title: `Research: ${topic || "service request"}`,
    content: { ...result, search_provider: search.provider, search_result_count: search.resultCount },
  });

  return { status: "success", output: result };
}
