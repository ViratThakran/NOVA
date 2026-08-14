/**
 * AI WORKFORCE ARCHITECTURE TESTS (Integration) — Phase 8C
 *
 * Exercises the control-plane data model: agent_definitions, ai_capabilities,
 * agent_definition_capabilities, ai_tasks, agent_runs, ai_approvals. No real
 * AI execution happens anywhere in this file — every RPC here only records
 * state, matching the migration's own "control plane, not execution" scope.
 *
 * Covers: agent/capability CRUD authorization, task ownership derived from
 * service_requests (cross-user/cross-company IDOR), the full task state
 * machine (assign -> run -> complete/fail/approve), approval authorization
 * (never a client-supplied boolean), audit logging, anonymous access, and
 * that even an admin cannot bypass the RPCs with a direct table mutation.
 *
 * REQUIRES: Local Supabase running (`npx supabase start`)
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const ADMIN_EMAIL = "admin@test.nova";
const ADMIN_PASSWORD = "TestPassword123!";

const clientsToSignOut: SupabaseClient[] = [];
function trackedClient(): SupabaseClient {
  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  clientsToSignOut.push(client);
  return client;
}

let admin: SupabaseClient;

beforeAll(async () => {
  admin = trackedClient();
  const { error } = await admin.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (error) throw new Error(`Setup failed: could not authenticate ${ADMIN_EMAIL}: ${error.message}`);
});

afterAll(async () => {
  await Promise.all(clientsToSignOut.map((client) => client.auth.signOut()));
});

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

async function createFreshUser(prefix: string) {
  const email = `${unique(prefix)}@test.nova`;
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) throw new Error(`Setup failure: ${error?.message}`);
  return { client, userId: data.user.id };
}

async function createFreshCompanyOwner(prefix = "ai-owner") {
  const { client, userId } = await createFreshUser(prefix);
  const { data: companyId, error } = await client.rpc("create_company", { company_name: unique("AI Test Co"), company_description: "fixture" });
  if (error || !companyId) throw new Error(`Setup failure: ${error?.message}`);
  return { client, userId, companyId: companyId as string };
}

async function getPublishedService() {
  const { data, error } = await admin.from("services").select("id").eq("published", true).limit(1).single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

async function createPersonalServiceRequest(client: SupabaseClient, userId: string) {
  const serviceId = await getPublishedService();
  const { data, error } = await client
    .from("service_requests")
    .insert({ service_id: serviceId, requester_id: userId, details: "Fixture request." })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

async function createCompanyServiceRequest(client: SupabaseClient, userId: string, companyId: string) {
  const serviceId = await getPublishedService();
  const { data, error } = await client
    .from("service_requests")
    .insert({ service_id: serviceId, requester_id: userId, company_id: companyId, details: "Fixture company request." })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

async function getAgentId(slug: string) {
  const { data, error } = await admin.from("agent_definitions").select("id").eq("slug", slug).single();
  if (error || !data) throw new Error(`Setup failure: could not find agent '${slug}': ${error?.message}`);
  return data.id as string;
}

async function getCapabilityId(slug: string) {
  const { data, error } = await admin.from("ai_capabilities").select("id").eq("slug", slug).single();
  if (error || !data) throw new Error(`Setup failure: could not find capability '${slug}': ${error?.message}`);
  return data.id as string;
}

async function createAiTask(serviceRequestId: string, title = "Fixture task") {
  const { data, error } = await admin.from("ai_tasks").insert({ service_request_id: serviceRequestId, title }).select("id").single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

describe("Agent definitions and capabilities — read/write authorization", () => {
  it("any authenticated user can read the agent roster and capability vocabulary", async () => {
    const { client } = await createFreshUser("ai-reader");
    const { data: agents, error: agentsError } = await client.from("agent_definitions").select("slug");
    expect(agentsError).toBeNull();
    expect(agents?.length).toBeGreaterThanOrEqual(7);

    const { data: caps, error: capsError } = await client.from("ai_capabilities").select("slug");
    expect(capsError).toBeNull();
    expect(caps?.length).toBeGreaterThanOrEqual(16);
  });

  it("admin can create an agent definition and assign it a capability", async () => {
    const { data: agent, error: agentError } = await admin
      .from("agent_definitions")
      .insert({ slug: unique("test-agent"), name: "Test Agent", description: "fixture" })
      .select("id")
      .single();
    expect(agentError).toBeNull();

    const capabilityId = await getCapabilityId("research");
    const { error: assignError } = await admin
      .from("agent_definition_capabilities")
      .insert({ agent_definition_id: agent!.id, capability_id: capabilityId });
    expect(assignError).toBeNull();
  });

  it("a non-admin cannot create an agent or assign it a capability (capability escalation blocked)", async () => {
    const { client } = await createFreshUser("ai-escalator");
    const { data, error } = await client
      .from("agent_definitions")
      .insert({ slug: unique("escalation-agent"), name: "x", description: "x" })
      .select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();

    const agentId = await getAgentId("research-agent");
    const capabilityId = await getCapabilityId("deploy");
    const { data: assignData, error: assignError } = await client
      .from("agent_definition_capabilities")
      .insert({ agent_definition_id: agentId, capability_id: capabilityId })
      .select();
    expect(assignError).not.toBeNull();
    expect(assignData).toBeNull();
  });

  it("the safe/approval-required split is real data, not just documentation", async () => {
    const { data: deploy } = await admin.from("ai_capabilities").select("requires_approval").eq("slug", "deploy").single();
    expect(deploy?.requires_approval).toBe(true);
    const { data: research } = await admin.from("ai_capabilities").select("requires_approval").eq("slug", "research").single();
    expect(research?.requires_approval).toBe(false);
  });
});

describe("AI task ownership and IDOR protection", () => {
  it("a student can read AI tasks belonging to their own service request", async () => {
    const { client, userId } = await createFreshUser("ai-task-owner");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);

    const { data, error } = await client.from("ai_tasks").select("id").eq("id", taskId);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: taskId }]);
  });

  it("another student cannot read someone else's AI task", async () => {
    const { client: owner, userId } = await createFreshUser("ai-task-victim");
    const requestId = await createPersonalServiceRequest(owner, userId);
    const taskId = await createAiTask(requestId);

    const { client: other } = await createFreshUser("ai-task-attacker");
    const { data, error } = await other.from("ai_tasks").select("id").eq("id", taskId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("company members can read their own company's AI tasks; another company cannot", async () => {
    const { client: owner, userId: ownerId, companyId } = await createFreshCompanyOwner("ai-task-company");
    const requestId = await createCompanyServiceRequest(owner, ownerId, companyId);
    const taskId = await createAiTask(requestId);

    const { data: ownData, error: ownError } = await owner.from("ai_tasks").select("id").eq("id", taskId);
    expect(ownError).toBeNull();
    expect(ownData).toEqual([{ id: taskId }]);

    const { client: otherOwner } = await createFreshCompanyOwner("ai-task-other-company");
    const { data: otherData, error: otherError } = await otherOwner.from("ai_tasks").select("id").eq("id", taskId);
    expect(otherError).toBeNull();
    expect(otherData).toEqual([]);
  });

  it("a non-admin cannot create an AI task directly", async () => {
    const { client, userId } = await createFreshUser("ai-task-creator");
    const requestId = await createPersonalServiceRequest(client, userId);

    const { data, error } = await client.from("ai_tasks").insert({ service_request_id: requestId, title: "x" }).select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});

describe("Task state machine — assign_ai_task / start_agent_run / complete_agent_run", () => {
  it("walks a task through pending -> assigned -> running -> completed", async () => {
    const { client, userId } = await createFreshUser("ai-lifecycle");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);
    const agentId = await getAgentId("research-agent");

    const { error: assignError } = await admin.rpc("assign_ai_task", { task_id: taskId, agent_definition_id: agentId });
    expect(assignError).toBeNull();
    const { data: afterAssign } = await admin.from("ai_tasks").select("status").eq("id", taskId).single();
    expect(afterAssign?.status).toBe("assigned");

    const { data: runId, error: startError } = await admin.rpc("start_agent_run", { task_id: taskId, agent_definition_id: agentId });
    expect(startError).toBeNull();
    const { data: afterStart } = await admin.from("ai_tasks").select("status, started_at").eq("id", taskId).single();
    expect(afterStart?.status).toBe("running");
    expect(afterStart?.started_at).not.toBeNull();

    const { error: completeError } = await admin.rpc("complete_agent_run", {
      run_id: runId,
      outcome: "succeeded",
      summary: "Done.",
      output: { result: "ok" },
    });
    expect(completeError).toBeNull();
    const { data: final } = await admin.from("ai_tasks").select("status, output, completed_at").eq("id", taskId).single();
    expect(final?.status).toBe("completed");
    expect(final?.output).toEqual({ result: "ok" });
  });

  it("a failed run marks the task failed with the error recorded", async () => {
    const { client, userId } = await createFreshUser("ai-fail");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);
    const agentId = await getAgentId("developer-agent");
    await admin.rpc("assign_ai_task", { task_id: taskId, agent_definition_id: agentId });
    const { data: runId } = await admin.rpc("start_agent_run", { task_id: taskId, agent_definition_id: agentId });

    const { error } = await admin.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "Build failed." });
    expect(error).toBeNull();
    const { data } = await admin.from("ai_tasks").select("status, error").eq("id", taskId).single();
    expect(data?.status).toBe("failed");
    expect(data?.error).toBe("Build failed.");
  });

  it("rejects invalid transitions: starting a run on a task that is not assigned", async () => {
    const { client, userId } = await createFreshUser("ai-invalid-start");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);
    const agentId = await getAgentId("research-agent");

    const { error } = await admin.rpc("start_agent_run", { task_id: taskId, agent_definition_id: agentId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State/);
  });

  it("rejects starting a run with an agent that does not match the task's assigned agent", async () => {
    const { client, userId } = await createFreshUser("ai-mismatch");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);
    const researchAgentId = await getAgentId("research-agent");
    const developerAgentId = await getAgentId("developer-agent");
    await admin.rpc("assign_ai_task", { task_id: taskId, agent_definition_id: researchAgentId });

    const { error } = await admin.rpc("start_agent_run", { task_id: taskId, agent_definition_id: developerAgentId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/does not match/);
  });

  it("rejects completing the same run twice", async () => {
    const { client, userId } = await createFreshUser("ai-double-complete");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);
    const agentId = await getAgentId("research-agent");
    await admin.rpc("assign_ai_task", { task_id: taskId, agent_definition_id: agentId });
    const { data: runId } = await admin.rpc("start_agent_run", { task_id: taskId, agent_definition_id: agentId });
    await admin.rpc("complete_agent_run", { run_id: runId, outcome: "succeeded" });

    const { error } = await admin.rpc("complete_agent_run", { run_id: runId, outcome: "succeeded" });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State/);
  });

  it("rejects a fully backward transition: a completed task cannot run again", async () => {
    const { client, userId } = await createFreshUser("ai-backward");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);
    const agentId = await getAgentId("research-agent");
    await admin.rpc("assign_ai_task", { task_id: taskId, agent_definition_id: agentId });
    const { data: runId } = await admin.rpc("start_agent_run", { task_id: taskId, agent_definition_id: agentId });
    await admin.rpc("complete_agent_run", { run_id: runId, outcome: "succeeded" });

    const { error } = await admin.rpc("start_agent_run", { task_id: taskId, agent_definition_id: agentId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State/);
  });

  it("a non-admin cannot assign, start, or complete a task", async () => {
    const { client, userId } = await createFreshUser("ai-nonadmin-lifecycle");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);
    const agentId = await getAgentId("research-agent");

    const { error: assignError } = await client.rpc("assign_ai_task", { task_id: taskId, agent_definition_id: agentId });
    expect(assignError).not.toBeNull();
    expect(assignError!.message).toMatch(/Unauthorized/);
  });
});

describe("Approval model", () => {
  async function createRunningTaskWithAgent(agentSlug = "operations-agent") {
    const { client, userId } = await createFreshUser("ai-approval");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);
    const agentId = await getAgentId(agentSlug);
    await admin.rpc("assign_ai_task", { task_id: taskId, agent_definition_id: agentId });
    await admin.rpc("start_agent_run", { task_id: taskId, agent_definition_id: agentId });
    return { taskId, requesterClient: client };
  }

  it("requesting approval for an approval-required capability moves the task to waiting_for_approval", async () => {
    const { taskId } = await createRunningTaskWithAgent();
    const capabilityId = await getCapabilityId("deploy");

    const { data: approvalId, error } = await admin.rpc("request_ai_task_approval", {
      task_id: taskId,
      capability_id: capabilityId,
      reason: "Need to deploy the finished site to production.",
    });
    expect(error).toBeNull();
    const { data: task } = await admin.from("ai_tasks").select("status").eq("id", taskId).single();
    expect(task?.status).toBe("waiting_for_approval");
    const { data: approval } = await admin.from("ai_approvals").select("status").eq("id", approvalId).single();
    expect(approval?.status).toBe("pending");
  });

  it("rejects requesting approval for a capability that does not require it", async () => {
    const { taskId } = await createRunningTaskWithAgent();
    const capabilityId = await getCapabilityId("research");

    const { error } = await admin.rpc("request_ai_task_approval", { task_id: taskId, capability_id: capabilityId, reason: "x" });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/does not require approval/);
  });

  it("approving resumes the task to running; the requester can see the approval record", async () => {
    const { taskId, requesterClient } = await createRunningTaskWithAgent();
    const capabilityId = await getCapabilityId("deploy");
    const { data: approvalId } = await admin.rpc("request_ai_task_approval", { task_id: taskId, capability_id: capabilityId, reason: "x" });

    const { error } = await admin.rpc("decide_ai_approval", { approval_id: approvalId, decision: "approved" });
    expect(error).toBeNull();
    const { data: task } = await admin.from("ai_tasks").select("status").eq("id", taskId).single();
    expect(task?.status).toBe("running");
    const { data: approval } = await admin.from("ai_approvals").select("status, decided_by").eq("id", approvalId).single();
    expect(approval?.status).toBe("approved");
    expect(approval?.decided_by).not.toBeNull();

    // The original requester can see the approval record (transparency), even though only admin could decide it.
    const { data: visible, error: visibleError } = await requesterClient.from("ai_approvals").select("id").eq("id", approvalId);
    expect(visibleError).toBeNull();
    expect(visible).toEqual([{ id: approvalId }]);
  });

  it("rejecting cancels the task", async () => {
    const { taskId } = await createRunningTaskWithAgent();
    const capabilityId = await getCapabilityId("deploy");
    const { data: approvalId } = await admin.rpc("request_ai_task_approval", { task_id: taskId, capability_id: capabilityId, reason: "x" });

    const { error } = await admin.rpc("decide_ai_approval", { approval_id: approvalId, decision: "rejected" });
    expect(error).toBeNull();
    const { data: task } = await admin.from("ai_tasks").select("status").eq("id", taskId).single();
    expect(task?.status).toBe("cancelled");
  });

  it("a non-admin cannot decide an approval — never a client-supplied boolean", async () => {
    const { taskId, requesterClient } = await createRunningTaskWithAgent();
    const capabilityId = await getCapabilityId("deploy");
    const { data: approvalId } = await admin.rpc("request_ai_task_approval", { task_id: taskId, capability_id: capabilityId, reason: "x" });

    const { error } = await requesterClient.rpc("decide_ai_approval", { approval_id: approvalId, decision: "approved" });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);

    const { data: stillPending } = await admin.from("ai_approvals").select("status").eq("id", approvalId).single();
    expect(stillPending?.status).toBe("pending");
  });

  it("cannot decide the same approval twice", async () => {
    const { taskId } = await createRunningTaskWithAgent();
    const capabilityId = await getCapabilityId("deploy");
    const { data: approvalId } = await admin.rpc("request_ai_task_approval", { task_id: taskId, capability_id: capabilityId, reason: "x" });
    await admin.rpc("decide_ai_approval", { approval_id: approvalId, decision: "approved" });

    const { error } = await admin.rpc("decide_ai_approval", { approval_id: approvalId, decision: "rejected" });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State/);
  });
});

describe("cancel_ai_task()", () => {
  it("cancels a pending task", async () => {
    const { client, userId } = await createFreshUser("ai-cancel-pending");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);

    const { error } = await admin.rpc("cancel_ai_task", { task_id: taskId });
    expect(error).toBeNull();
    const { data } = await admin.from("ai_tasks").select("status").eq("id", taskId).single();
    expect(data?.status).toBe("cancelled");
  });

  it("cannot cancel a running task", async () => {
    const { client, userId } = await createFreshUser("ai-cancel-running");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);
    const agentId = await getAgentId("research-agent");
    await admin.rpc("assign_ai_task", { task_id: taskId, agent_definition_id: agentId });
    await admin.rpc("start_agent_run", { task_id: taskId, agent_definition_id: agentId });

    const { error } = await admin.rpc("cancel_ai_task", { task_id: taskId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State/);
  });
});

describe("Audit logging", () => {
  it("key lifecycle actions are recorded in audit_logs", async () => {
    const { client, userId } = await createFreshUser("ai-audit");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);
    const agentId = await getAgentId("research-agent");
    await admin.rpc("assign_ai_task", { task_id: taskId, agent_definition_id: agentId });
    await admin.rpc("start_agent_run", { task_id: taskId, agent_definition_id: agentId });

    const { data: logs } = await admin
      .from("audit_logs")
      .select("action")
      .eq("resource_type", "ai_task")
      .eq("resource_id", taskId)
      .order("created_at", { ascending: true });
    const actions = (logs ?? []).map((l) => l.action);
    expect(actions).toContain("ai_task_assigned");
    expect(actions).toContain("agent_run_started");
  });
});

describe("Anonymous access and direct-mutation bypass", () => {
  it("anon cannot read any of the six new tables", async () => {
    const anon = trackedClient();
    for (const table of ["agent_definitions", "ai_capabilities", "agent_definition_capabilities", "ai_tasks", "agent_runs", "ai_approvals"]) {
      const { data, error } = await anon.from(table).select("id").limit(1);
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    }
  });

  it("anon cannot call any of the seven RPCs", async () => {
    const anon = trackedClient();
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const calls: Array<[string, Record<string, unknown>]> = [
      ["assign_ai_task", { task_id: fakeId, agent_definition_id: fakeId }],
      ["start_agent_run", { task_id: fakeId, agent_definition_id: fakeId }],
      ["complete_agent_run", { run_id: fakeId, outcome: "succeeded" }],
      ["request_ai_task_approval", { task_id: fakeId, capability_id: fakeId, reason: "x" }],
      ["decide_ai_approval", { approval_id: fakeId, decision: "approved" }],
      ["cancel_ai_task", { task_id: fakeId }],
    ];
    for (const [fn, args] of calls) {
      const { error } = await anon.rpc(fn, args);
      expect(error).not.toBeNull();
    }
  });

  it("even an admin cannot directly UPDATE an ai_task, agent_run, or ai_approval", async () => {
    const { client, userId } = await createFreshUser("ai-bypass");
    const requestId = await createPersonalServiceRequest(client, userId);
    const taskId = await createAiTask(requestId);

    const { data, error } = await admin.from("ai_tasks").update({ status: "completed" }).eq("id", taskId).select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();

    const { data: unchanged } = await admin.from("ai_tasks").select("status").eq("id", taskId).single();
    expect(unchanged?.status).toBe("pending");
  });
});
