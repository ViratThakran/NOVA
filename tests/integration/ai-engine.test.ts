/**
 * AI ENGINE — SINGLE ENTRY POINT TESTS (Integration)
 *
 * Exercises src/lib/ai-engine/engine.ts directly — the one module the rest
 * of NOVA is allowed to call into (see src/app/admin/actions.ts, the only
 * application file that imports from lib/ai-engine at all). Covers
 * dispatch by workflow key, dispatch by generic agent slug, an
 * unrunnable-task error, cancel()'s own state-machine guard (not exercised
 * anywhere else in the suite), retry()/decideApproval() as thin RPC
 * wrappers, and getStatus()'s read shape.
 *
 * Lower-level agent/tool/schema behavior is covered in
 * ai-orchestration.test.ts and ai-workflow.test.ts — this file is
 * specifically about the facade's own dispatch and error-shape guarantees.
 *
 * REQUIRES: Local Supabase running (`npx supabase start`)
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as aiEngine from "@/lib/ai-engine/engine";

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

async function getWebsiteCreationServiceId() {
  const { data, error } = await admin.from("services").select("id").eq("slug", "ai-website-creation").single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

async function getAnyOtherServiceId() {
  const { data, error } = await admin.from("services").select("id").eq("published", true).neq("slug", "ai-website-creation").limit(1).single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

async function createAcceptedRequest(serviceId: string, prefix: string) {
  const { client, userId } = await createFreshUser(prefix);
  const { data: req, error } = await client
    .from("service_requests")
    .insert({ service_id: serviceId, requester_id: userId, details: "Test request for the AI Engine facade." })
    .select("id")
    .single();
  if (error || !req) throw new Error(`Setup failure: ${error?.message}`);
  const { error: reviewError } = await admin.rpc("review_service_request", { request_id: req.id, decision: "accepted" });
  if (reviewError) throw new Error(`Setup failure: ${reviewError.message}`);
  return req.id as string;
}

async function getAgentId(slug: string) {
  const { data, error } = await admin.from("agent_definitions").select("id").eq("slug", slug).single();
  if (error || !data) throw new Error(`Setup failure: could not find agent '${slug}': ${error?.message}`);
  return data.id as string;
}

describe("engine.plan()", () => {
  it("delegates to the Project Manager and auto-advances a typed workflow", async () => {
    const serviceId = await getWebsiteCreationServiceId();
    const requestId = await createAcceptedRequest(serviceId, "engine-plan");

    const result = await aiEngine.plan(admin, requestId);
    expect(result.status).toBe("success");
    expect(result.childTaskIds).toHaveLength(4);

    const { data: tasks } = await admin.from("ai_tasks").select("status").eq("service_request_id", requestId).not("parent_task_id", "is", null);
    // The workflow auto-advances past research/development/QA to the
    // approval-gated deployment step.
    expect((tasks ?? []).some((t) => t.status === "waiting_for_approval")).toBe(true);
  });
});

describe("engine.execute() — dispatch", () => {
  it("dispatches a workflow-keyed task to the right agent runner", async () => {
    const serviceId = await getWebsiteCreationServiceId();
    const requestId = await createAcceptedRequest(serviceId, "engine-exec-workflow");
    const plan = await aiEngine.plan(admin, requestId);
    expect(plan.status).toBe("success");

    // plan() already auto-ran research/development/QA; deployment is
    // waiting for approval. Confirm the QA task (workflow-keyed) actually
    // completed via the engine's own dispatch, not a direct RPC call.
    const { data: qaTask } = await admin
      .from("ai_tasks")
      .select("status, output")
      .eq("service_request_id", requestId)
      .eq("input->>workflow_key", "qa")
      .single();
    expect(qaTask?.status).toBe("completed");
    expect((qaTask?.output as { status?: string } | null)?.status).toBe("passed");
  });

  it("dispatches a generic (non-workflow) task by agent slug", async () => {
    const serviceId = await getAnyOtherServiceId();
    const requestId = await createAcceptedRequest(serviceId, "engine-exec-generic");
    const researchAgentId = await getAgentId("research-agent");
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: requestId, title: "Generic research task" }).select("id").single();
    await admin.rpc("assign_ai_task", { task_id: task!.id, agent_definition_id: researchAgentId });

    const result = await aiEngine.execute(admin, task!.id);
    expect(result.status).toBe("success");

    const { data: after } = await admin.from("ai_tasks").select("status").eq("id", task!.id).single();
    expect(after?.status).toBe("completed");
  });

  it("returns a clear error for a task with no runnable dispatch", async () => {
    const serviceId = await getAnyOtherServiceId();
    const requestId = await createAcceptedRequest(serviceId, "engine-exec-norunner");
    // operations-agent has no registered runner in agents/index.ts.
    const opsAgentId = await getAgentId("operations-agent");
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: requestId, title: "Unrunnable task" }).select("id").single();
    await admin.rpc("assign_ai_task", { task_id: task!.id, agent_definition_id: opsAgentId });

    const result = await aiEngine.execute(admin, task!.id);
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/cannot be run/);
  });

  it("returns an error for a nonexistent task", async () => {
    const result = await aiEngine.execute(admin, "00000000-0000-0000-0000-000000000000");
    expect(result.status).toBe("error");
  });
});

describe("engine.getStatus()", () => {
  it("returns the task's status, agent slug, and workflow key", async () => {
    const serviceId = await getWebsiteCreationServiceId();
    const requestId = await createAcceptedRequest(serviceId, "engine-status");
    await aiEngine.plan(admin, requestId);

    const { data: researchTask } = await admin.from("ai_tasks").select("id").eq("service_request_id", requestId).eq("input->>workflow_key", "research").single();
    const status = await aiEngine.getStatus(admin, researchTask!.id);

    expect(status).not.toBeNull();
    expect(status?.status).toBe("completed");
    expect(status?.agentSlug).toBe("research-agent");
    expect(status?.workflowKey).toBe("research");
    expect(status?.serviceRequestId).toBe(requestId);
  });

  it("returns null for a nonexistent task", async () => {
    const status = await aiEngine.getStatus(admin, "00000000-0000-0000-0000-000000000000");
    expect(status).toBeNull();
  });
});

describe("engine.cancel()", () => {
  it("cancels a pending task", async () => {
    const serviceId = await getAnyOtherServiceId();
    const requestId = await createAcceptedRequest(serviceId, "engine-cancel-pending");
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: requestId, title: "To cancel" }).select("id").single();

    const result = await aiEngine.cancel(admin, task!.id);
    expect(result.status).toBe("success");

    const { data: after } = await admin.from("ai_tasks").select("status").eq("id", task!.id).single();
    expect(after?.status).toBe("cancelled");
  });

  it("refuses to cancel a task that is already running", async () => {
    const serviceId = await getAnyOtherServiceId();
    const requestId = await createAcceptedRequest(serviceId, "engine-cancel-running");
    const researchAgentId = await getAgentId("research-agent");
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: requestId, title: "Running task" }).select("id").single();
    await admin.rpc("assign_ai_task", { task_id: task!.id, agent_definition_id: researchAgentId });
    await admin.rpc("start_agent_run", { task_id: task!.id, agent_definition_id: researchAgentId });

    const result = await aiEngine.cancel(admin, task!.id);
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/Invalid State/);
  });

  it("a non-admin cannot cancel a task through the engine", async () => {
    const serviceId = await getAnyOtherServiceId();
    const requestId = await createAcceptedRequest(serviceId, "engine-cancel-nonadmin");
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: requestId, title: "To cancel" }).select("id").single();
    const { client: nonAdmin } = await createFreshUser("engine-cancel-nonadmin-caller");

    const result = await aiEngine.cancel(nonAdmin, task!.id);
    expect(result.status).toBe("error");
  });
});

describe("engine.retry()", () => {
  it("requeues a failed task", async () => {
    const serviceId = await getAnyOtherServiceId();
    const requestId = await createAcceptedRequest(serviceId, "engine-retry");
    const researchAgentId = await getAgentId("research-agent");
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: requestId, title: "To retry" }).select("id").single();
    await admin.rpc("assign_ai_task", { task_id: task!.id, agent_definition_id: researchAgentId });
    const { data: runId } = await admin.rpc("start_agent_run", { task_id: task!.id, agent_definition_id: researchAgentId });
    await admin.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "forced failure for test" });

    const result = await aiEngine.retry(admin, task!.id);
    expect(result.status).toBe("success");

    const { data: after } = await admin.from("ai_tasks").select("status, retry_count").eq("id", task!.id).single();
    expect(after?.status).toBe("assigned");
    expect(after?.retry_count).toBe(1);
  });
});

describe("engine.decideApproval()", () => {
  it("approves a pending approval and resumes the gated task", async () => {
    const serviceId = await getWebsiteCreationServiceId();
    const requestId = await createAcceptedRequest(serviceId, "engine-approve");
    await aiEngine.plan(admin, requestId);

    const { data: deploymentTask } = await admin.from("ai_tasks").select("id").eq("service_request_id", requestId).eq("input->>workflow_key", "deployment").single();
    const { data: approval } = await admin.from("ai_approvals").select("id").eq("ai_task_id", deploymentTask!.id).eq("status", "pending").single();

    const result = await aiEngine.decideApproval(admin, approval!.id, "approved");
    expect(result.status).toBe("success");

    const { data: after } = await admin.from("ai_tasks").select("status").eq("id", deploymentTask!.id).single();
    expect(after?.status).toBe("running");
  });

  it("rejects a pending approval and cancels the gated task", async () => {
    const serviceId = await getWebsiteCreationServiceId();
    const requestId = await createAcceptedRequest(serviceId, "engine-reject");
    await aiEngine.plan(admin, requestId);

    const { data: deploymentTask } = await admin.from("ai_tasks").select("id").eq("service_request_id", requestId).eq("input->>workflow_key", "deployment").single();
    const { data: approval } = await admin.from("ai_approvals").select("id").eq("ai_task_id", deploymentTask!.id).eq("status", "pending").single();

    const result = await aiEngine.decideApproval(admin, approval!.id, "rejected");
    expect(result.status).toBe("success");

    const { data: after } = await admin.from("ai_tasks").select("status").eq("id", deploymentTask!.id).single();
    expect(after?.status).toBe("cancelled");
  });

  it("a non-admin cannot decide an approval through the engine", async () => {
    const serviceId = await getWebsiteCreationServiceId();
    const requestId = await createAcceptedRequest(serviceId, "engine-approve-nonadmin");
    await aiEngine.plan(admin, requestId);

    const { data: deploymentTask } = await admin.from("ai_tasks").select("id").eq("service_request_id", requestId).eq("input->>workflow_key", "deployment").single();
    const { data: approval } = await admin.from("ai_approvals").select("id").eq("ai_task_id", deploymentTask!.id).eq("status", "pending").single();
    const { client: nonAdmin } = await createFreshUser("engine-approve-nonadmin-caller");

    const result = await aiEngine.decideApproval(nonAdmin, approval!.id, "approved");
    expect(result.status).toBe("error");
  });
});
