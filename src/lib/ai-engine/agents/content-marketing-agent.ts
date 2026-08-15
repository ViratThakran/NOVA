// Content & Marketing Agent. Produces drafts only — website copy, SEO
// content, social posts, email drafts, product descriptions,
// advertisements. generate_content (capability: write_draft) is NOT
// approval-required and is the only tool this module calls. Publishing or
// sending that content anywhere is a deliberately separate, approval-gated
// capability (publish_content / send_email, see tools/index.ts's
// publish_content_externally entry) that no code in this agent invokes
// automatically — nothing here ever publishes or sends on its own.
//
// This agent is not wired into the Website Creation workflow (that
// workflow's "development" step covers the site itself); it's implemented
// and tested standalone so it can be assigned directly to a task for any
// content-generation service.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAiProvider } from "../providers";
import { contentDraftSchema, type ContentDraft } from "../schemas";
import { authorizeToolUse } from "../tools";
import { recordArtifact } from "../artifacts";

export interface RunContentTaskResult {
  status: "success" | "waiting_for_approval" | "error";
  message?: string;
  output?: ContentDraft;
  approvalId?: string;
}

export async function runContentTask(supabase: SupabaseClient, taskId: string): Promise<RunContentTaskResult> {
  const { data: agent, error: agentError } = await supabase.from("agent_definitions").select("id, status").eq("slug", "content-marketing-agent").maybeSingle();
  if (agentError || !agent || agent.status !== "active") {
    return { status: "error", message: "Content & Marketing Agent is not configured or is inactive." };
  }

  const { data: task, error: taskError } = await supabase
    .from("ai_tasks")
    .select("id, status, agent_definition_id, input, service_request_id")
    .eq("id", taskId)
    .maybeSingle();
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
    toolSlug: "generate_content",
    reason: "Content & Marketing Agent needs to draft the requested content.",
  });
  if (authorization.waitingForApproval) {
    return { status: "waiting_for_approval", approvalId: authorization.approvalId };
  }
  if (!authorization.authorized) {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: authorization.reason ?? "Tool authorization failed." });
    return { status: "error", message: authorization.reason ?? "Tool authorization failed." };
  }

  const input = (task.input ?? {}) as Record<string, unknown>;
  const description = typeof input.description === "string" ? input.description : "";
  const format = typeof input.format === "string" ? input.format : "website_copy";

  let draft: ContentDraft;
  try {
    const raw = await getAiProvider().complete({
      responseFormat: "content_draft",
      systemPrompt:
        "You are NOVA's Content & Marketing Agent. Produce a single draft, not a final publish-ready send. Respond with JSON only, matching the required schema.",
      userPrompt: `Brief: ${description}\nFormat: ${format}`,
    });
    draft = contentDraftSchema.parse(JSON.parse(raw));
  } catch {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "AI returned invalid or unparseable content draft output." });
    return { status: "error", message: "AI returned invalid output. The task was marked failed." };
  }

  await recordArtifact(supabase, {
    serviceRequestId: task.service_request_id,
    taskId,
    agentId: agent.id,
    type: "content_draft",
    title: draft.title,
    content: draft,
  });

  const { error: completeError } = await supabase.rpc("complete_agent_run", {
    run_id: runId,
    outcome: "succeeded",
    summary: `Drafted ${draft.format.replace(/_/g, " ")}: ${draft.title}`,
    output: draft,
  });
  if (completeError) {
    return { status: "error", message: completeError.message };
  }

  return { status: "success", output: draft };
}
