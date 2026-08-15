// Developer Agent. Builds the website-creation workflow's "development"
// and "deployment" tasks — the same agent, two different tools, gated very
// differently: generate_website (generate_code, no approval) vs
// deploy_website (deploy, approval-required).
//
// This agent does NOT get shell/filesystem/machine access. "Building a
// website" here means generating a small, capped set of virtual files
// (schema-validated, stored as an ai_artifacts row) — never written to the
// real NOVA repository and never executed. No sandbox/container/shell
// capability was introduced; giving an AI agent real command execution is
// explicitly out of scope for "the smallest safe production workflow".
//
// Deployment is a deterministic MOCK hosting integration: no real
// hosting/DNS credential exists in this environment, and none is invented.
// The recorded artifact is explicitly labeled as a sandbox deployment so
// nothing downstream can mistake it for a real production release.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAiProvider } from "../providers";
import { websiteBuildSchema, checkWebsiteBuildStructure, type WebsiteBuild } from "../schemas";
import { authorizeToolUse } from "../tools";
import { recordArtifact } from "../artifacts";

export interface RunDeveloperTaskResult {
  status: "success" | "waiting_for_approval" | "error";
  message?: string;
  output?: unknown;
  approvalId?: string;
}

interface TaskRow {
  id: string;
  status: string;
  agent_definition_id: string | null;
  input: Record<string, unknown> | null;
  service_request_id: string;
}

async function getResearchContext(supabase: SupabaseClient, serviceRequestId: string): Promise<string> {
  const { data } = await supabase
    .from("ai_tasks")
    .select("output")
    .eq("service_request_id", serviceRequestId)
    .eq("input->>workflow_key", "research")
    .eq("status", "completed")
    .maybeSingle();
  return data?.output ? JSON.stringify(data.output) : "No research findings available.";
}

export async function runDevelopmentTask(supabase: SupabaseClient, taskId: string): Promise<RunDeveloperTaskResult> {
  const { data: agent, error: agentError } = await supabase.from("agent_definitions").select("id, status").eq("slug", "developer-agent").maybeSingle();
  if (agentError || !agent || agent.status !== "active") {
    return { status: "error", message: "Developer Agent is not configured or is inactive." };
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
    toolSlug: "generate_website",
    reason: "Developer Agent needs to generate the website's source files.",
  });
  if (authorization.waitingForApproval) {
    return { status: "waiting_for_approval", approvalId: authorization.approvalId };
  }
  if (!authorization.authorized) {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: authorization.reason ?? "Tool authorization failed." });
    return { status: "error", message: authorization.reason ?? "Tool authorization failed." };
  }

  const description = typeof task.input?.description === "string" ? task.input.description : "";
  const researchContext = await getResearchContext(supabase, task.service_request_id);

  let build: WebsiteBuild;
  try {
    const raw = await getAiProvider().complete({
      responseFormat: "website_build",
      systemPrompt:
        "You are NOVA's Developer Agent. Generate a small, complete static website (HTML/CSS) grounded in the research findings provided. Respond with JSON only, matching the required schema.",
      userPrompt: `Task: ${description}\nResearch findings: ${researchContext}`,
    });
    build = websiteBuildSchema.parse(JSON.parse(raw));
  } catch {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "AI returned invalid or unparseable website build output." });
    return { status: "error", message: "AI returned invalid output. The task was marked failed." };
  }

  const { issues } = checkWebsiteBuildStructure(build);
  if (issues.length > 0) {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: `Generated website failed structural self-check: ${issues.join(" ")}` });
    return { status: "error", message: "The generated website failed a basic structural check. The task was marked failed." };
  }

  await recordArtifact(supabase, {
    serviceRequestId: task.service_request_id,
    taskId,
    agentId: agent.id,
    type: "website_source",
    title: "Generated website source",
    content: { files: build.files },
  });

  const summary = `Generated ${build.files.length} file(s): ${build.files.map((file) => file.path).join(", ")}.`;
  const { error: completeError } = await supabase.rpc("complete_agent_run", {
    run_id: runId,
    outcome: "succeeded",
    summary,
    output: { file_count: build.files.length, filenames: build.files.map((file) => file.path) },
  });
  if (completeError) {
    return { status: "error", message: completeError.message };
  }

  return { status: "success", output: build };
}

export async function runDeploymentTask(supabase: SupabaseClient, taskId: string): Promise<RunDeveloperTaskResult> {
  const { data: agent, error: agentError } = await supabase.from("agent_definitions").select("id, status").eq("slug", "developer-agent").maybeSingle();
  if (agentError || !agent || agent.status !== "active") {
    return { status: "error", message: "Developer Agent is not configured or is inactive." };
  }

  const { data: task, error: taskError } = await supabase
    .from("ai_tasks")
    .select("id, status, agent_definition_id, input, service_request_id")
    .eq("id", taskId)
    .maybeSingle<TaskRow>();
  if (taskError || !task) {
    return { status: "error", message: "Task not found." };
  }
  if (task.agent_definition_id !== agent.id) {
    return { status: "error", message: "Task is assigned to a different agent." };
  }

  let runId: string;
  if (task.status === "assigned") {
    const { data: newRunId, error: startError } = await supabase.rpc("start_agent_run", { task_id: taskId, agent_definition_id: agent.id });
    if (startError) return { status: "error", message: startError.message };
    runId = newRunId as string;
  } else if (task.status === "running") {
    // Resuming after an approval decision — the original run from the first
    // invocation is still open (we returned early on waiting_for_approval
    // without completing it). Reuse it rather than starting a second one.
    const { data: openRun } = await supabase
      .from("agent_runs")
      .select("id")
      .eq("ai_task_id", taskId)
      .eq("status", "running")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!openRun) {
      return { status: "error", message: "No active run to resume for this task." };
    }
    runId = openRun.id as string;
  } else {
    return { status: "error", message: `Task is in status '${task.status}', which cannot be run.` };
  }

  // Re-checked fresh, immediately before the sensitive operation — never
  // trusts that a prior call already established authorization.
  const authorization = await authorizeToolUse(supabase, {
    taskId,
    toolSlug: "deploy_website",
    reason: "Developer Agent wants to deploy the completed, QA-passed website to production.",
  });
  if (authorization.waitingForApproval) {
    return { status: "waiting_for_approval", approvalId: authorization.approvalId };
  }
  if (!authorization.authorized) {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: authorization.reason ?? "Tool authorization failed." });
    return { status: "error", message: authorization.reason ?? "Tool authorization failed." };
  }

  // Idempotency: if a deployment record already exists for this task (e.g. a
  // retried call after a partial failure), don't deploy a second time.
  const { data: existingDeployment } = await supabase
    .from("ai_artifacts")
    .select("content")
    .eq("ai_task_id", taskId)
    .eq("type", "deployment_record")
    .maybeSingle();

  const deployment = existingDeployment?.content ?? {
    url: `https://site-${task.service_request_id.slice(0, 8)}.nova-sites.example`,
    provider: "mock-hosting",
    deployed_at: new Date().toISOString(),
    note: "Sandbox deployment — no real hosting provider is configured in this environment.",
  };

  if (!existingDeployment) {
    await recordArtifact(supabase, {
      serviceRequestId: task.service_request_id,
      taskId,
      agentId: agent.id,
      type: "deployment_record",
      title: "Deployment record (sandbox)",
      content: deployment,
    });
  }

  const { error: completeError } = await supabase.rpc("complete_agent_run", {
    run_id: runId,
    outcome: "succeeded",
    summary: `Deployed (sandbox) to ${(deployment as { url: string }).url}.`,
    output: deployment,
  });
  if (completeError) {
    return { status: "error", message: completeError.message };
  }

  return { status: "success", output: deployment };
}
