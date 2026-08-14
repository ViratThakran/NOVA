// AI Project Manager (Phase 8D) — the first real orchestration agent.
// Turns an accepted service_request into a validated set of child ai_tasks.
//
// The PM's own planning work is itself run through the exact same
// assign_ai_task/start_agent_run/complete_agent_run RPC lifecycle every
// other agent uses (Phase 8C) — it is a real, auditable agent_run, not a
// bypass. Its structured plan becomes that run's `output`.
//
// Every claim the model makes is independently re-verified before anything
// is created: an agent_slug that doesn't resolve to a real, active
// agent_definitions row fails the whole plan (no tasks are created at all,
// see Step 4/10 of the Phase 8D spec — "never blindly execute arbitrary
// instructions returned by the model" and "fail safely"). capability_slugs
// are informational planning metadata only, stored in the task's own
// `input` — the real authorization boundary is authorizeToolUse() in
// tools.ts, checked again at execution time, not here.
//
// Dependencies are expressed as a backward-pointing index into the plan's
// own task list (depends_on_index). Only the task(s) with no dependency are
// actually started (assigned + run) here — the rest are created as
// 'pending' children of the PM task, matching "do not start every task
// simultaneously" (Step 12/13).

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAiProvider } from "./provider";
import { taskPlanSchema, findInvalidDependencyIndex, type TaskPlan } from "./schemas";
import { findWorkflowForService, type WorkflowDefinition } from "./workflows";
import { advanceWorkflow } from "./workflow-engine";

export interface PlanServiceRequestResult {
  status: "success" | "error";
  message?: string;
  planTaskId?: string;
  childTaskIds?: string[];
  startedTaskId?: string;
}

const PLANNABLE_REQUEST_STATUSES = ["accepted", "in_progress"];

export async function planServiceRequest(supabase: SupabaseClient, serviceRequestId: string): Promise<PlanServiceRequestResult> {
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("id, status, details, services(name, description, slug)")
    .eq("id", serviceRequestId)
    .maybeSingle();
  if (requestError || !request) {
    return { status: "error", message: "Service request not found." };
  }
  if (!PLANNABLE_REQUEST_STATUSES.includes(request.status)) {
    return { status: "error", message: `A request in status '${request.status}' cannot be planned.` };
  }

  // Idempotency: refuse to create a second plan while one already exists
  // and hasn't failed/been cancelled — prevents duplicate decomposition
  // from a double click or a retried request (Step 13).
  const { data: pmAgent, error: pmAgentError } = await supabase
    .from("agent_definitions")
    .select("id")
    .eq("slug", "ai-project-manager")
    .maybeSingle();
  if (pmAgentError || !pmAgent) {
    return { status: "error", message: "AI Project Manager agent is not configured." };
  }

  const { data: existingPlanTasks } = await supabase
    .from("ai_tasks")
    .select("id, status")
    .eq("service_request_id", serviceRequestId)
    .eq("agent_definition_id", pmAgent.id)
    .is("parent_task_id", null);
  const activePlan = (existingPlanTasks ?? []).find((t) => !["failed", "cancelled"].includes(t.status));
  if (activePlan) {
    return { status: "error", message: "A plan already exists for this request." };
  }

  const service = Array.isArray(request.services) ? request.services[0] : request.services;
  const userPrompt = `Service: ${service?.name ?? "Unknown service"}\nService description: ${service?.description ?? ""}\nCustomer request details: ${request.details}`;

  // Typed workflow lookup (Phase 8E) — a service with a reviewed,
  // deterministic task graph skips the model-driven decomposition entirely
  // (no hallucination risk, no AI call needed for planning). Any other
  // service falls through to the original Phase 8D model-driven plan,
  // unchanged. Adding a workflow for another service means adding an entry
  // to workflows.ts, never a branch here.
  const workflow = findWorkflowForService(service?.slug ?? "");

  // The PM task is created and run through the real lifecycle before we
  // even know whether the model's output will validate — a failed/invalid
  // plan still produces a real, auditable failed task, not a silent no-op.
  const { data: planTask, error: planTaskError } = await supabase
    .from("ai_tasks")
    .insert({ service_request_id: serviceRequestId, title: "AI Project Manager: plan service request", input: { kind: "plan" } })
    .select("id")
    .single();
  if (planTaskError || !planTask) {
    return { status: "error", message: "Could not create the planning task." };
  }
  const planTaskId = planTask.id as string;

  const { error: assignError } = await supabase.rpc("assign_ai_task", { task_id: planTaskId, agent_definition_id: pmAgent.id });
  if (assignError) {
    return { status: "error", message: assignError.message };
  }
  const { data: runId, error: startError } = await supabase.rpc("start_agent_run", { task_id: planTaskId, agent_definition_id: pmAgent.id });
  if (startError) {
    return { status: "error", message: startError.message };
  }

  let plan: TaskPlan;
  try {
    if (workflow) {
      plan = buildDeterministicPlan(workflow);
    } else {
      const raw = await getAiProvider().complete({
        responseFormat: "task_plan",
        systemPrompt:
          "You are NOVA's AI Project Manager. Break the given service request into a short, ordered list of concrete tasks. Respond with JSON only, matching the required schema.",
        userPrompt,
      });
      plan = taskPlanSchema.parse(JSON.parse(raw));
    }
  } catch {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "AI returned invalid or unparseable plan output." });
    return { status: "error", message: "AI returned invalid output. The task was marked failed." };
  }

  // Structural validation of the dependency graph — reject the whole plan
  // rather than guessing what the model meant by a forward/self-referencing
  // dependency.
  const invalidIndex = findInvalidDependencyIndex(plan);
  if (invalidIndex !== null) {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: `Malformed plan: task ${invalidIndex} has an invalid dependency index.` });
    return { status: "error", message: "AI returned a malformed task plan. The task was marked failed." };
  }

  // Resolve every referenced agent up front — an unknown/inactive agent
  // fails the whole plan before any child task is created.
  const agentSlugs = [...new Set(plan.tasks.map((t) => t.agent_slug))];
  const { data: agents, error: agentsError } = await supabase.from("agent_definitions").select("id, slug, status").in("slug", agentSlugs);
  if (agentsError) {
    await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "Could not resolve agents referenced in the plan." });
    return { status: "error", message: "Could not resolve agents referenced in the plan." };
  }
  const agentBySlug = new Map((agents ?? []).map((a) => [a.slug, a]));
  const unresolvedOrInactive = agentSlugs.filter((slug) => !agentBySlug.get(slug) || agentBySlug.get(slug)!.status !== "active");
  if (unresolvedOrInactive.length > 0) {
    await supabase.rpc("complete_agent_run", {
      run_id: runId,
      outcome: "failed",
      summary: `Plan references unknown or inactive agents: ${unresolvedOrInactive.join(", ")}`,
    });
    return { status: "error", message: `The plan references an agent that doesn't exist or isn't active: ${unresolvedOrInactive.join(", ")}` };
  }

  // Capability claims are filtered against what each agent is actually
  // granted (Phase 8C data) — a hallucinated capability is silently
  // dropped from the stored plan metadata, never trusted. This is
  // informational only; the real gate is authorizeToolUse() at execution time.
  const { data: allGrants } = await supabase.from("agent_definition_capabilities").select("agent_definition_id, ai_capabilities(slug)");
  const grantedByAgent = new Map<string, Set<string>>();
  for (const grant of allGrants ?? []) {
    const capSlug = Array.isArray(grant.ai_capabilities) ? grant.ai_capabilities[0]?.slug : (grant.ai_capabilities as { slug: string } | null)?.slug;
    if (!capSlug) continue;
    const set = grantedByAgent.get(grant.agent_definition_id) ?? new Set<string>();
    set.add(capSlug);
    grantedByAgent.set(grant.agent_definition_id, set);
  }

  const childTaskIds: string[] = [];
  const indexToTaskId: (string | null)[] = [];

  for (let i = 0; i < plan.tasks.length; i++) {
    const planned = plan.tasks[i];
    const agentId = agentBySlug.get(planned.agent_slug)!.id;
    const grantedCapabilities = grantedByAgent.get(agentId) ?? new Set<string>();
    const filteredCapabilities = planned.capability_slugs.filter((slug) => grantedCapabilities.has(slug));

    const { data: childTask, error: childError } = await supabase
      .from("ai_tasks")
      .insert({
        service_request_id: serviceRequestId,
        parent_task_id: planTaskId,
        agent_definition_id: agentId,
        title: planned.title,
        input: {
          description: planned.description,
          capability_slugs: filteredCapabilities,
          sequence_order: i,
          depends_on_index: planned.depends_on_index ?? null,
          ...(workflow ? { workflow_slug: workflow.slug, workflow_key: workflow.tasks[i].key } : {}),
        },
      })
      .select("id")
      .single();
    if (childError || !childTask) {
      await supabase.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "Failed to create one or more child tasks." });
      return { status: "error", message: "Failed to create the planned tasks." };
    }
    childTaskIds.push(childTask.id as string);
    indexToTaskId.push(childTask.id as string);
  }

  await supabase.rpc("complete_agent_run", {
    run_id: runId,
    outcome: "succeeded",
    summary: `Created ${childTaskIds.length} task(s).`,
    output: plan,
  });

  let startedTaskId: string | undefined;

  if (workflow) {
    // A typed workflow gets full auto-advance: assign AND run the first
    // step, then keep chaining through completed steps up to the next
    // approval gate or the end of the workflow (Phase 8E). The generic
    // model-decomposed path below is untouched from Phase 8D.
    await advanceWorkflow(supabase, serviceRequestId);
  } else {
    // Only the dependency-free task(s) get ASSIGNED now — everything else
    // stays 'pending' until its dependency completes, and nothing is
    // auto-RUN. This is the original Phase 8D behavior, preserved exactly
    // for any service without a defined workflow.
    const firstIndex = plan.tasks.findIndex((t) => t.depends_on_index === null || t.depends_on_index === undefined);
    if (firstIndex >= 0) {
      const firstTaskId = indexToTaskId[firstIndex];
      const firstAgentId = agentBySlug.get(plan.tasks[firstIndex].agent_slug)!.id;
      const { error: firstAssignError } = await supabase.rpc("assign_ai_task", { task_id: firstTaskId, agent_definition_id: firstAgentId });
      if (!firstAssignError) startedTaskId = firstTaskId!;
    }
  }

  return { status: "success", planTaskId, childTaskIds, startedTaskId };
}

// Builds the exact same shape the model would have returned for a typed
// workflow, deterministically — no AI call, no hallucination risk. Run
// through taskPlanSchema.parse() anyway as a cheap guard against a future
// workflows.ts typo producing something structurally invalid.
function buildDeterministicPlan(workflow: WorkflowDefinition): TaskPlan {
  const keyToIndex = new Map(workflow.tasks.map((template, index) => [template.key, index]));
  return taskPlanSchema.parse({
    tasks: workflow.tasks.map((template) => ({
      title: template.title,
      description: template.title,
      agent_slug: template.agentSlug,
      capability_slugs: template.capabilitySlugs,
      depends_on_index: template.dependsOnKey ? (keyToIndex.get(template.dependsOnKey) ?? null) : null,
    })),
  });
}
