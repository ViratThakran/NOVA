/**
 * SERVICE REQUESTS TESTS (Integration) — Phase 8B
 *
 * Exercises the RLS/RPC model for service_requests: ownership (personal vs
 * company-scoped), cross-user/cross-company IDOR protection, the three
 * SECURITY DEFINER RPCs (review_service_request, advance_service_request,
 * cancel_service_request), and the state-machine transitions they enforce.
 * service_requests has NO direct UPDATE/DELETE RLS policy at all — every
 * mutation goes through an RPC — mirroring applications' own
 * review_application()-only precedent, verified explicitly below.
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

async function createFreshCompanyOwner(prefix = "sr-owner") {
  const { client, userId } = await createFreshUser(prefix);
  const { data: companyId, error } = await client.rpc("create_company", { company_name: unique("SR Test Co"), company_description: "fixture" });
  if (error || !companyId) throw new Error(`Setup failure: ${error?.message}`);
  return { client, userId, companyId: companyId as string };
}

async function addCompanyMember(ownerClient: SupabaseClient, companyId: string, role: "admin" | "member" = "member") {
  const { client, userId } = await createFreshUser("sr-member");
  const { error } = await ownerClient.from("company_members").insert({ company_id: companyId, user_id: userId, company_role: role });
  if (error) throw new Error(`Setup failure: ${error.message}`);
  return { client, userId };
}

async function getPublishedService() {
  const { data, error } = await admin.from("services").select("id").eq("published", true).limit(1).single();
  if (error || !data) throw new Error(`Setup failure: could not find a published service: ${error?.message}`);
  return data.id as string;
}

async function createPersonalRequest(client: SupabaseClient, userId: string, serviceId: string) {
  const { data, error } = await client
    .from("service_requests")
    .insert({ service_id: serviceId, requester_id: userId, details: "Fixture request." })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

async function createCompanyRequest(client: SupabaseClient, userId: string, companyId: string, serviceId: string) {
  const { data, error } = await client
    .from("service_requests")
    .insert({ service_id: serviceId, requester_id: userId, company_id: companyId, details: "Fixture company request." })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

describe("Ownership and creation", () => {
  it("a student can create and read their own personal request", async () => {
    const serviceId = await getPublishedService();
    const { client, userId } = await createFreshUser("sr-student");
    const requestId = await createPersonalRequest(client, userId, serviceId);

    const { data, error } = await client.from("service_requests").select("id, status").eq("id", requestId).single();
    expect(error).toBeNull();
    expect(data?.status).toBe("pending");
  });

  it("a user cannot create a request with a spoofed requester_id", async () => {
    const serviceId = await getPublishedService();
    const { client } = await createFreshUser("sr-spoofer");
    const { userId: victimId } = await createFreshUser("sr-victim");

    const { data, error } = await client
      .from("service_requests")
      .insert({ service_id: serviceId, requester_id: victimId, details: "x" })
      .select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("a company member can create a request on behalf of their company", async () => {
    const serviceId = await getPublishedService();
    const { client: owner, userId: ownerId, companyId } = await createFreshCompanyOwner();
    const requestId = await createCompanyRequest(owner, ownerId, companyId, serviceId);

    const { data, error } = await owner.from("service_requests").select("id, company_id").eq("id", requestId).single();
    expect(error).toBeNull();
    expect(data?.company_id).toBe(companyId);
  });

  it("a user cannot create a request on behalf of a company they are not a member of", async () => {
    const serviceId = await getPublishedService();
    const { companyId } = await createFreshCompanyOwner("sr-owner-target");
    const { client: outsider, userId: outsiderId } = await createFreshUser("sr-outsider");

    const { data, error } = await outsider
      .from("service_requests")
      .insert({ service_id: serviceId, requester_id: outsiderId, company_id: companyId, details: "x" })
      .select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});

describe("Cross-user / cross-company IDOR protection", () => {
  it("a student cannot read another student's personal request", async () => {
    const serviceId = await getPublishedService();
    const { client: owner, userId: ownerId } = await createFreshUser("sr-idor-owner");
    const requestId = await createPersonalRequest(owner, ownerId, serviceId);

    const { client: other } = await createFreshUser("sr-idor-other");
    const { data, error } = await other.from("service_requests").select("id").eq("id", requestId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("company members share visibility into their own company's requests", async () => {
    const serviceId = await getPublishedService();
    const { client: owner, userId: ownerId, companyId } = await createFreshCompanyOwner("sr-shared-owner");
    const requestId = await createCompanyRequest(owner, ownerId, companyId, serviceId);
    const { client: member } = await addCompanyMember(owner, companyId, "member");

    const { data, error } = await member.from("service_requests").select("id").eq("id", requestId);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: requestId }]);
  });

  it("company A cannot see company B's requests", async () => {
    const serviceId = await getPublishedService();
    const { client: ownerB, userId: ownerBId, companyId: companyB } = await createFreshCompanyOwner("sr-cross-b");
    const requestId = await createCompanyRequest(ownerB, ownerBId, companyB, serviceId);

    const { client: ownerA } = await createFreshCompanyOwner("sr-cross-a");
    const { data, error } = await ownerA.from("service_requests").select("id").eq("id", requestId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe("No direct mutation — even admin cannot bypass the RPCs", () => {
  it("an admin cannot directly UPDATE a request's status", async () => {
    const serviceId = await getPublishedService();
    const { client, userId } = await createFreshUser("sr-directmutate");
    const requestId = await createPersonalRequest(client, userId, serviceId);

    const { data, error } = await admin.from("service_requests").update({ status: "accepted" }).eq("id", requestId).select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();

    const { data: unchanged } = await admin.from("service_requests").select("status").eq("id", requestId).single();
    expect(unchanged?.status).toBe("pending");
  });

  it("anonymous cannot select, insert, update, or call any of the three RPCs", async () => {
    const serviceId = await getPublishedService();
    const { client, userId } = await createFreshUser("sr-anon-target");
    const requestId = await createPersonalRequest(client, userId, serviceId);

    const anon = trackedClient();
    const { data: selectData, error: selectError } = await anon.from("service_requests").select("id").eq("id", requestId);
    expect(selectError).not.toBeNull();
    expect(selectData).toBeNull();

    const { error: insertError } = await anon.from("service_requests").insert({ service_id: serviceId, requester_id: userId, details: "x" });
    expect(insertError).not.toBeNull();

    const { error: reviewError } = await anon.rpc("review_service_request", { request_id: requestId, decision: "accepted" });
    expect(reviewError).not.toBeNull();

    const { error: advanceError } = await anon.rpc("advance_service_request", { request_id: requestId, new_status: "in_progress" });
    expect(advanceError).not.toBeNull();

    const { error: cancelError } = await anon.rpc("cancel_service_request", { request_id: requestId });
    expect(cancelError).not.toBeNull();
  });
});

describe("review_service_request()", () => {
  it("admin can accept a pending request", async () => {
    const serviceId = await getPublishedService();
    const { client, userId } = await createFreshUser("sr-review-accept");
    const requestId = await createPersonalRequest(client, userId, serviceId);

    const { error } = await admin.rpc("review_service_request", { request_id: requestId, decision: "accepted" });
    expect(error).toBeNull();
    const { data } = await admin.from("service_requests").select("status").eq("id", requestId).single();
    expect(data?.status).toBe("accepted");
  });

  it("admin can reject a pending request", async () => {
    const serviceId = await getPublishedService();
    const { client, userId } = await createFreshUser("sr-review-reject");
    const requestId = await createPersonalRequest(client, userId, serviceId);

    const { error } = await admin.rpc("review_service_request", { request_id: requestId, decision: "rejected" });
    expect(error).toBeNull();
    const { data } = await admin.from("service_requests").select("status").eq("id", requestId).single();
    expect(data?.status).toBe("rejected");
  });

  it("a non-admin (student, company owner, random user) cannot review a request", async () => {
    const serviceId = await getPublishedService();
    const { client: requester, userId } = await createFreshUser("sr-review-nonadmin");
    const requestId = await createPersonalRequest(requester, userId, serviceId);

    const { error: selfError } = await requester.rpc("review_service_request", { request_id: requestId, decision: "accepted" });
    expect(selfError).not.toBeNull();
    expect(selfError!.message).toMatch(/Unauthorized/);

    const { client: companyOwner } = await createFreshCompanyOwner("sr-review-company-owner");
    const { error: companyError } = await companyOwner.rpc("review_service_request", { request_id: requestId, decision: "accepted" });
    expect(companyError).not.toBeNull();
    expect(companyError!.message).toMatch(/Unauthorized/);
  });

  it("cannot review an already-reviewed request", async () => {
    const serviceId = await getPublishedService();
    const { client, userId } = await createFreshUser("sr-review-twice");
    const requestId = await createPersonalRequest(client, userId, serviceId);
    await admin.rpc("review_service_request", { request_id: requestId, decision: "accepted" });

    const { error } = await admin.rpc("review_service_request", { request_id: requestId, decision: "rejected" });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State/);
  });

  it("an invalid decision value is rejected", async () => {
    const serviceId = await getPublishedService();
    const { client, userId } = await createFreshUser("sr-review-invalid");
    const requestId = await createPersonalRequest(client, userId, serviceId);

    const { error } = await admin.rpc("review_service_request", { request_id: requestId, decision: "maybe" });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid Status/);
  });
});

describe("advance_service_request()", () => {
  async function createAcceptedRequest() {
    const serviceId = await getPublishedService();
    const { client, userId } = await createFreshUser("sr-advance");
    const requestId = await createPersonalRequest(client, userId, serviceId);
    await admin.rpc("review_service_request", { request_id: requestId, decision: "accepted" });
    return requestId;
  }

  it("advances accepted -> in_progress -> delivered -> completed in order", async () => {
    const requestId = await createAcceptedRequest();

    const { error: e1 } = await admin.rpc("advance_service_request", { request_id: requestId, new_status: "in_progress" });
    expect(e1).toBeNull();

    const { error: e2 } = await admin.rpc("advance_service_request", { request_id: requestId, new_status: "delivered", notes: "Done." });
    expect(e2).toBeNull();

    const { data: afterDelivered } = await admin.from("service_requests").select("status, deliverable_notes").eq("id", requestId).single();
    expect(afterDelivered?.status).toBe("delivered");
    expect(afterDelivered?.deliverable_notes).toBe("Done.");

    const { error: e3 } = await admin.rpc("advance_service_request", { request_id: requestId, new_status: "completed" });
    expect(e3).toBeNull();
    const { data: final } = await admin.from("service_requests").select("status").eq("id", requestId).single();
    expect(final?.status).toBe("completed");
  });

  it("rejects skipping a step (accepted -> delivered directly)", async () => {
    const requestId = await createAcceptedRequest();
    const { error } = await admin.rpc("advance_service_request", { request_id: requestId, new_status: "delivered", notes: "x" });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State/);
  });

  it("rejects moving to 'delivered' without notes", async () => {
    const requestId = await createAcceptedRequest();
    await admin.rpc("advance_service_request", { request_id: requestId, new_status: "in_progress" });
    const { error } = await admin.rpc("advance_service_request", { request_id: requestId, new_status: "delivered" });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid Input/);
  });

  it("a non-admin cannot advance a request", async () => {
    const requestId = await createAcceptedRequest();
    const { client: outsider } = await createFreshUser("sr-advance-outsider");
    const { error } = await outsider.rpc("advance_service_request", { request_id: requestId, new_status: "in_progress" });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });
});

describe("cancel_service_request()", () => {
  it("the original requester can cancel their own pending request", async () => {
    const serviceId = await getPublishedService();
    const { client, userId } = await createFreshUser("sr-cancel-self");
    const requestId = await createPersonalRequest(client, userId, serviceId);

    const { error } = await client.rpc("cancel_service_request", { request_id: requestId });
    expect(error).toBeNull();
    const { data } = await admin.from("service_requests").select("status").eq("id", requestId).single();
    expect(data?.status).toBe("cancelled");
  });

  it("a company admin can cancel a pending request filed under their company", async () => {
    const serviceId = await getPublishedService();
    const { client: owner, userId: ownerId, companyId } = await createFreshCompanyOwner("sr-cancel-company");
    const { client: member, userId: memberId } = await addCompanyMember(owner, companyId, "member");
    const requestId = await createCompanyRequest(member, memberId, companyId, serviceId);

    const { error } = await owner.rpc("cancel_service_request", { request_id: requestId });
    expect(error).toBeNull();
    const { data } = await admin.from("service_requests").select("status").eq("id", requestId).single();
    expect(data?.status).toBe("cancelled");
  });

  it("a plain company member (not the requester, not company admin) cannot cancel another member's request", async () => {
    const serviceId = await getPublishedService();
    const { client: owner, companyId } = await createFreshCompanyOwner("sr-cancel-denied");
    const { client: memberA, userId: memberAId } = await addCompanyMember(owner, companyId, "member");
    const requestId = await createCompanyRequest(memberA, memberAId, companyId, serviceId);
    const { client: memberB } = await addCompanyMember(owner, companyId, "member");

    const { error } = await memberB.rpc("cancel_service_request", { request_id: requestId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });

  it("a random authenticated user cannot cancel someone else's request", async () => {
    const serviceId = await getPublishedService();
    const { client, userId } = await createFreshUser("sr-cancel-victim");
    const requestId = await createPersonalRequest(client, userId, serviceId);
    const { client: randomUser } = await createFreshUser("sr-cancel-random");

    const { error } = await randomUser.rpc("cancel_service_request", { request_id: requestId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });

  it("only a pending request can be cancelled — not once accepted", async () => {
    const serviceId = await getPublishedService();
    const { client, userId } = await createFreshUser("sr-cancel-late");
    const requestId = await createPersonalRequest(client, userId, serviceId);
    await admin.rpc("review_service_request", { request_id: requestId, decision: "accepted" });

    const { error } = await client.rpc("cancel_service_request", { request_id: requestId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State/);
  });

  it("admin can also cancel any pending request", async () => {
    const serviceId = await getPublishedService();
    const { client, userId } = await createFreshUser("sr-cancel-admin");
    const requestId = await createPersonalRequest(client, userId, serviceId);

    const { error } = await admin.rpc("cancel_service_request", { request_id: requestId });
    expect(error).toBeNull();
  });
});
