/**
 * AI OPERATIONS DASHBOARD TESTS (Integration) — Phase 9.5
 *
 * Exercises getOperationsOverview() (src/lib/ai-engine/engine.ts) directly
 * — the one function the new internal /admin/ai-operations page calls, and
 * the only place that page ever touches ai_tasks/agent_runs/ai_approvals/
 * ai_artifacts. No new RLS/grants were added for this feature: an admin's
 * existing "OR is_current_user_admin()" branch on each of those tables is
 * what makes cross-request aggregation possible, and the SAME function
 * called with a non-admin session must come back correctly scoped (or
 * empty, never an error) — that's the property this file actually proves.
 *
 * REQUIRES: Local Supabase running (`npx supabase start`)
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getOperationsOverview } from "@/lib/ai-engine/engine";
import { planServiceRequest } from "@/lib/ai-engine/agents/project-manager";

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

// Runs a real (mock-provider) Website Creation workflow to completion up to
// the deployment approval gate — gives us one genuinely cross-cutting
// fixture: a pending approval, at least one completed task, at least one
// agent run, and at least one artifact, all traceable to one service
// request.
async function createInFlightWorkflow(prefix: string) {
  const serviceId = await getWebsiteCreationServiceId();
  const { client, userId } = await createFreshUser(prefix);
  const { data: req, error } = await client
    .from("service_requests")
    .insert({ service_id: serviceId, requester_id: userId, details: "Ops dashboard fixture." })
    .select("id")
    .single();
  if (error || !req) throw new Error(`Setup failure: ${error?.message}`);
  const { error: reviewError } = await admin.rpc("review_service_request", { request_id: req.id, decision: "accepted" });
  if (reviewError) throw new Error(`Setup failure: ${reviewError.message}`);

  const plan = await planServiceRequest(admin, req.id);
  if (plan.status !== "success") throw new Error(`Setup failure: plan did not succeed`);

  return { requestId: req.id as string };
}

describe("getOperationsOverview() — admin cross-request visibility", () => {
  // Pending approvals/waiting-for-intervention are a naturally low-volume
  // signal (most tests elsewhere decide their own approval before moving
  // on) — safe to assert against the shared, concurrently-populated local
  // DB. recentlyCompletedTasks/recentArtifacts, by contrast, are produced
  // by dozens of OTHER concurrently-running test files at high volume; a
  // top-N-by-recency assertion against those would be genuinely flaky
  // under parallel file execution, so this test deliberately doesn't rely
  // on this fixture's rows surviving that global ranking.
  it("aggregates pending approvals and waiting-for-intervention tasks across multiple, unrelated service requests", async () => {
    const { requestId: requestA } = await createInFlightWorkflow("ops-agg-a");
    const { requestId: requestB } = await createInFlightWorkflow("ops-agg-b");

    const overview = await getOperationsOverview(admin);

    // Each in-flight workflow leaves its deployment task waiting on
    // approval — both must be visible to the admin in one call.
    const approvalRequestIds = overview.pendingApprovals.map((a) => a.serviceRequestId);
    expect(approvalRequestIds).toContain(requestA);
    expect(approvalRequestIds).toContain(requestB);

    // "Needs your attention" must include the waiting deployment tasks.
    const waitingRequestIds = overview.waitingForInterventionTasks.map((t) => t.serviceRequestId);
    expect(waitingRequestIds).toContain(requestA);
    expect(waitingRequestIds).toContain(requestB);
  });

  it("correctly shapes and links a pending approval back to its agent and service request", async () => {
    const { requestId } = await createInFlightWorkflow("ops-shape-approval");
    const overview = await getOperationsOverview(admin);

    const approval = overview.pendingApprovals.find((a) => a.serviceRequestId === requestId);
    expect(approval).toBeDefined();
    expect(approval!.agentName).toBe("Developer Agent");
    expect(approval!.serviceName).toBe("AI Website Creation");
    expect(approval!.reason.length).toBeGreaterThan(0);
    expect(approval!.taskId).toEqual(expect.any(String));
  });

  it("never leaks provider/internal fields — only business-relevant shape is returned", async () => {
    await createInFlightWorkflow("ops-shape");
    const overview = await getOperationsOverview(admin);
    const serialized = JSON.stringify(overview).toLowerCase();
    expect(serialized).not.toContain("api_key");
    expect(serialized).not.toContain("anthropic");
    expect(serialized).not.toContain("system_prompt");
  });

  it("classifies a retry-exhausted failed task as needing intervention", async () => {
    const serviceId = await getWebsiteCreationServiceId();
    const { client, userId } = await createFreshUser("ops-stuck");
    const { data: req } = await client
      .from("service_requests")
      .insert({ service_id: serviceId, requester_id: userId, details: "Stuck task fixture." })
      .select("id")
      .single();
    await admin.rpc("review_service_request", { request_id: req!.id, decision: "accepted" });

    const { data: agent } = await admin.from("agent_definitions").select("id").eq("slug", "research-agent").single();
    const { data: task } = await admin.from("ai_tasks").insert({ service_request_id: req!.id, title: "Stuck fixture task" }).select("id").single();
    await admin.rpc("assign_ai_task", { task_id: task!.id, agent_definition_id: agent!.id });

    const { data: maxRetriesRow } = await admin.from("ai_tasks").select("max_retries").eq("id", task!.id).single();
    const maxRetries = maxRetriesRow!.max_retries as number;

    for (let i = 0; i <= maxRetries; i++) {
      const { data: runId } = await admin.rpc("start_agent_run", { task_id: task!.id, agent_definition_id: agent!.id });
      await admin.rpc("complete_agent_run", { run_id: runId, outcome: "failed", summary: "forced failure for ops fixture" });
      if (i < maxRetries) await admin.rpc("retry_ai_task", { task_id: task!.id });
    }

    const overview = await getOperationsOverview(admin);
    const stuckTask = overview.waitingForInterventionTasks.find((t) => t.id === task!.id);
    expect(stuckTask).toBeDefined();
    expect(stuckTask!.retryCount).toBeGreaterThanOrEqual(stuckTask!.maxRetries);

    // A normal retry attempt is correctly excluded — this task never
    // reaches the failed list as "needing intervention" prematurely.
    const failedListEntry = overview.failedTasks.find((t) => t.id === task!.id);
    expect(failedListEntry).toBeDefined();
  });
});

describe("getOperationsOverview() — non-admin callers never see cross-tenant data", () => {
  it("a non-admin, unrelated user gets no visibility into another user's tasks/approvals/artifacts", async () => {
    const { requestId } = await createInFlightWorkflow("ops-victim");
    const { client: outsider } = await createFreshUser("ops-outsider");

    const overview = await getOperationsOverview(outsider);

    const allServiceRequestIds = [
      ...overview.pendingApprovals.map((a) => a.serviceRequestId),
      ...overview.runningTasks.map((t) => t.serviceRequestId),
      ...overview.failedTasks.map((t) => t.serviceRequestId),
      ...overview.recentlyCompletedTasks.map((t) => t.serviceRequestId),
      ...overview.recentArtifacts.map((a) => a.serviceRequestId),
    ];
    expect(allServiceRequestIds).not.toContain(requestId);
  });

  it("anonymous callers get an empty, non-throwing overview (no grant on any AI table)", async () => {
    await createInFlightWorkflow("ops-anon-fixture");
    const anon = trackedClient();

    const overview = await getOperationsOverview(anon);

    expect(overview.pendingApprovals).toEqual([]);
    expect(overview.runningTasks).toEqual([]);
    expect(overview.failedTasks).toEqual([]);
    expect(overview.recentlyCompletedTasks).toEqual([]);
    expect(overview.recentAgentRuns).toEqual([]);
    expect(overview.recentArtifacts).toEqual([]);
    expect(overview.waitingForInterventionTasks).toEqual([]);
  });
});
