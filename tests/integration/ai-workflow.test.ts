/**
 * AI WORKFLOW + PRODUCTION AUTONOMY TESTS (Integration) — Phase 8E
 *
 * Exercises the real, typed Website Creation workflow end-to-end (research
 * -> development -> QA -> approval-gated deployment -> delivery), plus the
 * new Phase 8E primitives: retry_ai_task (bounded loop protection),
 * consume_ai_approval (single-use approval / replay protection), and
 * ai_artifacts (service-request-scoped deliverables, IDOR-checked).
 *
 * Deliberately uses the 'ai-website-creation' service (excluded from
 * ai-orchestration.test.ts's generic-path fixtures) so the two files never
 * collide on which planning path gets exercised.
 *
 * REQUIRES: Local Supabase running (`npx supabase start`)
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { planServiceRequest } from "@/lib/ai/project-manager";
import { runDeploymentTask } from "@/lib/ai/developer-agent";
import { authorizeToolUse } from "@/lib/ai/tools";

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

async function createAcceptedWebsiteRequest(prefix = "wf") {
  const serviceId = await getWebsiteCreationServiceId();
  const { client, userId } = await createFreshUser(prefix);
  const { data: req, error } = await client
    .from("service_requests")
    .insert({ service_id: serviceId, requester_id: userId, details: "Build a website for my bakery in Austin, Texas." })
    .select("id")
    .single();
  if (error || !req) throw new Error(`Setup failure: ${error?.message}`);
  const { error: reviewError } = await admin.rpc("review_service_request", { request_id: req.id, decision: "accepted" });
  if (reviewError) throw new Error(`Setup failure: ${reviewError.message}`);
  return { requestId: req.id as string, requesterClient: client, requesterId: userId };
}

async function getAgentId(slug: string) {
  const { data, error } = await admin.from("agent_definitions").select("id").eq("slug", slug).single();
  if (error || !data) throw new Error(`Setup failure: could not find agent '${slug}': ${error?.message}`);
  return data.id as string;
}

async function getTasksByKey(requestId: string) {
  const { data } = await admin.from("ai_tasks").select("id, status, input, output, retry_count, max_retries").eq("service_request_id", requestId);
  const byKey = new Map<string, { id: string; status: string; output: unknown; retry_count: number; max_retries: number }>();
  for (const row of data ?? []) {
    const key = (row.input as Record<string, unknown> | null)?.workflow_key;
    if (typeof key === "string") byKey.set(key, row);
  }
  return byKey;
}

describe("Website Creation workflow — full end-to-end", () => {
  it("plans, auto-runs research/development/QA, gates deployment on approval, and deploys once approved", async () => {
    const { requestId } = await createAcceptedWebsiteRequest("wf-e2e");

    const plan = await planServiceRequest(admin, requestId);
    expect(plan.status).toBe("success");
    expect(plan.childTaskIds).toHaveLength(4);

    const byKey = await getTasksByKey(requestId);
    expect(byKey.get("research")?.status).toBe("completed");
    expect(byKey.get("development")?.status).toBe("completed");
    expect(byKey.get("qa")?.status).toBe("completed");
    expect((byKey.get("qa")?.output as { status?: string } | null)?.status).toBe("passed");
    expect(byKey.get("deployment")?.status).toBe("waiting_for_approval");

    // Artifacts recorded for every completed step so far.
    const { data: artifactsBefore } = await admin.from("ai_artifacts").select("type").eq("service_request_id", requestId);
    const typesBefore = (artifactsBefore ?? []).map((a) => a.type).sort();
    expect(typesBefore).toEqual(["qa_report", "research_report", "website_source"]);

    // Human approval, then resume deployment.
    const { data: approval } = await admin.from("ai_approvals").select("id").eq("ai_task_id", byKey.get("deployment")!.id).eq("status", "pending").single();
    const { error: decideError } = await admin.rpc("decide_ai_approval", { approval_id: approval!.id, decision: "approved" });
    expect(decideError).toBeNull();

    const deployResult = await runDeploymentTask(admin, byKey.get("deployment")!.id);
    expect(deployResult.status).toBe("success");

    const afterDeploy = await getTasksByKey(requestId);
    expect(afterDeploy.get("deployment")?.status).toBe("completed");

    const { data: deploymentArtifact } = await admin
      .from("ai_artifacts")
      .select("content")
      .eq("service_request_id", requestId)
      .eq("type", "deployment_record")
      .single();
    expect((deploymentArtifact!.content as { provider?: string }).provider).toBe("mock-hosting");
    // Never claims a real production release without a real provider configured.
    expect(JSON.stringify(deploymentArtifact!.content).toLowerCase()).toContain("sandbox");

    // The service request itself can now progress through delivery.
    const { error: advanceError } = await admin.rpc("advance_service_request", { request_id: requestId, new_status: "in_progress" });
    expect(advanceError).toBeNull();
    const { error: deliverError } = await admin.rpc("advance_service_request", {
      request_id: requestId,
      new_status: "delivered",
      notes: "Website generated and deployed to sandbox hosting.",
    });
    expect(deliverError).toBeNull();
  });

  it("does not auto-run any step for a service with no defined workflow (generic path untouched)", async () => {
    const serviceId = await getAnyOtherServiceId();
    const { client, userId } = await createFreshUser("wf-generic");
    const { data: req } = await client
      .from("service_requests")
      .insert({ service_id: serviceId, requester_id: userId, details: "Generic request." })
      .select("id")
      .single();
    await admin.rpc("review_service_request", { request_id: req!.id, decision: "accepted" });

    const plan = await planServiceRequest(admin, req!.id);
    expect(plan.status).toBe("success");

    const { data: tasks } = await admin.from("ai_tasks").select("status").eq("service_request_id", req!.id).not("parent_task_id", "is", null);
    const statuses = (tasks ?? []).map((t) => t.status);
    // Exactly one task assigned (the Phase 8D behavior), everything else
    // still pending — nothing auto-ran.
    expect(statuses.filter((s) => s === "assigned")).toHaveLength(1);
    expect(statuses.filter((s) => s === "completed")).toHaveLength(0);
  });
});

describe("retry_ai_task() — bounded loop protection", () => {
  async function createFailedTask(prefix: string) {
    const { requestId } = await createAcceptedWebsiteRequest(prefix);
    const agentId = await getAgentId("research-agent");
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: requestId, title: "t" }).select("id").single();
    await admin.rpc("assign_ai_task", { task_id: task!.id, agent_definition_id: agentId });
    const { data: runId } = await admin.rpc("start_agent_run", { task_id: task!.id, agent_definition_id: agentId });
    await admin.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "forced failure for test" });
    return task!.id as string;
  }

  it("retries a failed task up to max_retries, then refuses", async () => {
    const taskId = await createFailedTask("retry-bound");
    const { data: initial } = await admin.from("ai_tasks").select("max_retries").eq("id", taskId).single();
    const maxRetries = initial!.max_retries as number;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { error: retryError } = await admin.rpc("retry_ai_task", { task_id: taskId });
      expect(retryError).toBeNull();
      // Put it back into 'failed' so the next retry attempt is meaningful.
      const agentId = await getAgentId("research-agent");
      const { data: runId } = await admin.rpc("start_agent_run", { task_id: taskId, agent_definition_id: agentId });
      await admin.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "forced failure for test" });
    }

    const { error: overLimitError } = await admin.rpc("retry_ai_task", { task_id: taskId });
    expect(overLimitError).not.toBeNull();
    expect(overLimitError!.message).toMatch(/retry limit/);
  });

  it("rejects retrying a task that is not failed", async () => {
    const { requestId } = await createAcceptedWebsiteRequest("retry-notfailed");
    const agentId = await getAgentId("research-agent");
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: requestId, title: "t" }).select("id").single();
    await admin.rpc("assign_ai_task", { task_id: task!.id, agent_definition_id: agentId });

    const { error } = await admin.rpc("retry_ai_task", { task_id: task!.id });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State/);
  });

  it("a non-admin cannot retry a task, even their own", async () => {
    const taskId = await createFailedTask("retry-nonadmin");
    const { client } = await createFreshUser("retry-nonadmin-caller");
    const { error } = await client.rpc("retry_ai_task", { task_id: taskId });
    expect(error).not.toBeNull();
  });

  it("anonymous cannot retry a task", async () => {
    const taskId = await createFailedTask("retry-anon");
    const anon = trackedClient();
    const { error } = await anon.rpc("retry_ai_task", { task_id: taskId });
    expect(error).not.toBeNull();
  });
});

describe("consume_ai_approval() — single-use / replay protection", () => {
  async function createApprovedDeploymentApproval(prefix: string) {
    const { requestId } = await createAcceptedWebsiteRequest(prefix);
    const agentId = await getAgentId("developer-agent");
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: requestId, title: "Deploy" }).select("id").single();
    await admin.rpc("assign_ai_task", { task_id: task!.id, agent_definition_id: agentId });
    await admin.rpc("start_agent_run", { task_id: task!.id, agent_definition_id: agentId });
    const capabilityId = (await admin.from("ai_capabilities").select("id").eq("slug", "deploy").single()).data!.id;
    const { data: approvalId } = await admin.rpc("request_ai_task_approval", { task_id: task!.id, capability_id: capabilityId, reason: "test" });
    await admin.rpc("decide_ai_approval", { approval_id: approvalId, decision: "approved" });
    return { approvalId: approvalId as string, taskId: task!.id as string };
  }

  it("consumes a granted approval exactly once", async () => {
    const { approvalId } = await createApprovedDeploymentApproval("consume-once");
    const { error: firstConsume } = await admin.rpc("consume_ai_approval", { approval_id: approvalId });
    expect(firstConsume).toBeNull();

    const { error: replayConsume } = await admin.rpc("consume_ai_approval", { approval_id: approvalId });
    expect(replayConsume).not.toBeNull();
    expect(replayConsume!.message).toMatch(/already been used/);
  });

  it("refuses to consume an approval that was never granted (still pending)", async () => {
    const { requestId } = await createAcceptedWebsiteRequest("consume-pending");
    const agentId = await getAgentId("developer-agent");
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: requestId, title: "Deploy" }).select("id").single();
    await admin.rpc("assign_ai_task", { task_id: task!.id, agent_definition_id: agentId });
    await admin.rpc("start_agent_run", { task_id: task!.id, agent_definition_id: agentId });
    const capabilityId = (await admin.from("ai_capabilities").select("id").eq("slug", "deploy").single()).data!.id;
    const { data: approvalId } = await admin.rpc("request_ai_task_approval", { task_id: task!.id, capability_id: capabilityId, reason: "test" });

    const { error } = await admin.rpc("consume_ai_approval", { approval_id: approvalId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State/);
  });

  it("a non-admin cannot consume an approval directly", async () => {
    const { approvalId } = await createApprovedDeploymentApproval("consume-nonadmin");
    const { client } = await createFreshUser("consume-nonadmin-caller");
    const { error } = await client.rpc("consume_ai_approval", { approval_id: approvalId });
    expect(error).not.toBeNull();
  });

  it("anonymous cannot consume an approval", async () => {
    const { approvalId } = await createApprovedDeploymentApproval("consume-anon");
    const anon = trackedClient();
    const { error } = await anon.rpc("consume_ai_approval", { approval_id: approvalId });
    expect(error).not.toBeNull();
  });

  it("authorizeToolUse consumes an existing granted approval instead of requesting a new one, and only once", async () => {
    const { taskId } = await createApprovedDeploymentApproval("authz-consume");

    const first = await authorizeToolUse(admin, { taskId, toolSlug: "deploy_website", reason: "resume" });
    expect(first.authorized).toBe(true);
    expect(first.waitingForApproval).toBe(false);

    // The approval is now consumed — a second call must NOT silently
    // authorize again; it must fall through to requesting a fresh approval.
    const second = await authorizeToolUse(admin, { taskId, toolSlug: "deploy_website", reason: "resume again" });
    expect(second.authorized).toBe(false);
    expect(second.waitingForApproval).toBe(true);
  });
});

describe("Deployment approval gate — cannot be bypassed", () => {
  it("a task waiting for approval cannot be re-run to slip past the gate", async () => {
    const { requestId } = await createAcceptedWebsiteRequest("gate-bypass");
    const agentId = await getAgentId("developer-agent");
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: requestId, title: "Deploy" }).select("id").single();
    await admin.rpc("assign_ai_task", { task_id: task!.id, agent_definition_id: agentId });

    const first = await runDeploymentTask(admin, task!.id);
    expect(first.status).toBe("waiting_for_approval");

    const second = await runDeploymentTask(admin, task!.id);
    expect(second.status).toBe("error");
    expect(second.message).toMatch(/waiting_for_approval/);
  });

  it("escalation blocked: an agent without the deploy capability cannot use deploy_website", async () => {
    const { requestId } = await createAcceptedWebsiteRequest("gate-escalate");
    const researchAgentId = await getAgentId("research-agent");
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: requestId, title: "t" }).select("id").single();
    await admin.rpc("assign_ai_task", { task_id: task!.id, agent_definition_id: researchAgentId });
    await admin.rpc("start_agent_run", { task_id: task!.id, agent_definition_id: researchAgentId });

    const result = await authorizeToolUse(admin, { taskId: task!.id, toolSlug: "deploy_website", reason: "test" });
    expect(result.authorized).toBe(false);
    expect(result.reason).toMatch(/does not have the required capability/);
  });
});

describe("ai_artifacts — access control (IDOR)", () => {
  it("the requester can read their own service request's artifacts", async () => {
    const { requestId, requesterClient } = await createAcceptedWebsiteRequest("artifact-owner");
    await planServiceRequest(admin, requestId);

    const { data, error } = await requesterClient.from("ai_artifacts").select("id").eq("service_request_id", requestId);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it("a different, unrelated user cannot read another user's artifacts (cross-user IDOR)", async () => {
    const { requestId } = await createAcceptedWebsiteRequest("artifact-victim");
    await planServiceRequest(admin, requestId);
    const { client: attacker } = await createFreshUser("artifact-attacker");

    const { data, error } = await attacker.from("ai_artifacts").select("id").eq("service_request_id", requestId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("anonymous cannot read any artifacts", async () => {
    const { requestId } = await createAcceptedWebsiteRequest("artifact-anon");
    await planServiceRequest(admin, requestId);
    const anon = trackedClient();

    // ai_artifacts never grants SELECT to anon at all (matching
    // agent_runs/ai_approvals' own restrictive convention) — this fails at
    // the grant level, not via a silently-filtered RLS result.
    const { data, error } = await anon.from("ai_artifacts").select("id").eq("service_request_id", requestId);
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("anonymous cannot insert an artifact", async () => {
    const { requestId } = await createAcceptedWebsiteRequest("artifact-anon-insert");
    await planServiceRequest(admin, requestId);
    const { data: task } = await admin.from("ai_tasks").select("id").eq("service_request_id", requestId).limit(1).single();
    const anon = trackedClient();

    const { error } = await anon.from("ai_artifacts").insert({
      service_request_id: requestId,
      ai_task_id: task!.id,
      type: "research_report",
      title: "Injected",
      content: {},
    });
    expect(error).not.toBeNull();
  });

  it("a non-admin authenticated user cannot directly insert an artifact for someone else's request", async () => {
    const { requestId } = await createAcceptedWebsiteRequest("artifact-nonadmin-insert");
    await planServiceRequest(admin, requestId);
    const { data: task } = await admin.from("ai_tasks").select("id").eq("service_request_id", requestId).limit(1).single();
    const { client: outsider } = await createFreshUser("artifact-nonadmin-caller");

    const { error } = await outsider.from("ai_artifacts").insert({
      service_request_id: requestId,
      ai_task_id: task!.id,
      type: "research_report",
      title: "Forged",
      content: {},
    });
    expect(error).not.toBeNull();
  });

  it("even an admin cannot directly UPDATE an artifact (immutable once created)", async () => {
    const { requestId } = await createAcceptedWebsiteRequest("artifact-immutable");
    await planServiceRequest(admin, requestId);
    const { data: artifact } = await admin.from("ai_artifacts").select("id").eq("service_request_id", requestId).limit(1).single();

    // No UPDATE grant exists at all for this table (matching ai_tasks'
    // own convention of only granting the operations a direct caller is
    // ever allowed to perform) — this fails at the grant level.
    const { data: updateData, error: updateError } = await admin.from("ai_artifacts").update({ title: "Tampered" }).eq("id", artifact!.id).select("id");
    expect(updateError).not.toBeNull();
    expect(updateData).toBeNull();
  });
});

describe("MockProvider / stored artifacts never resemble a leaked credential", () => {
  it("no artifact for a full workflow run contains an API-key-shaped string", async () => {
    const { requestId } = await createAcceptedWebsiteRequest("no-secrets-8e");
    await planServiceRequest(admin, requestId);

    const { data: artifacts } = await admin.from("ai_artifacts").select("content").eq("service_request_id", requestId);
    const serialized = JSON.stringify(artifacts).toLowerCase();
    expect(serialized).not.toMatch(/sk-[a-z0-9]{20,}/);
    expect(serialized).not.toContain("anthropic_api_key");
    expect(serialized).not.toContain("service_role");
  });
});
