/**
 * COMPANY PLATFORM APPLICATION REVIEW + IDENTITY TESTS (Integration) — Phase 5B-3
 *
 * Covers the three blockers closed in this phase, talking to
 * Supabase/PostgREST directly (Server Actions can't run outside a Next.js
 * request context):
 *   - review_application() / mark_application_under_review() now also accept
 *     a company owner/admin via can_review_company_application()
 *   - find_user_for_company_membership(): exact-email identity lookup for
 *     member invites, gated to company owner/admin
 *   - company_member_profiles() / company_applicant_profiles(): company-scoped
 *     identity reads replacing the always-null profiles embed
 *
 * Every fixture is created fresh per test (never touches seed.sql's shared
 * rows), following the convention in company-platform-foundation.test.ts /
 * company-platform-backend.test.ts. Phase 5B-1's 48 tests and
 * admin-application-review.test.ts's 18 platform-admin scenarios are the
 * regression baseline for "existing behavior stays green" — not repeated here.
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

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;
}

async function createFreshUser(prefix = "review") {
  const email = uniqueEmail(prefix);
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) throw new Error(`Setup failure: ${error?.message}`);
  return { client, userId: data.user.id, email };
}

async function createFreshStudent() {
  const { client, userId, email } = await createFreshUser("review-student");
  const { error } = await client.from("student_profiles").upsert({ id: userId, education_info: {}, skills: [] });
  if (error) throw new Error(`Setup failure: ${error.message}`);
  return { client, userId, email };
}

async function createFreshCompanyOwner(prefix = "review-owner") {
  const { client, userId, email } = await createFreshUser(prefix);
  const { data: companyId, error } = await client.rpc("create_company", {
    company_name: `Review Test Co ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    company_description: "fixture",
  });
  if (error || !companyId) throw new Error(`Setup failure: ${error?.message}`);
  return { client, userId, email, companyId: companyId as string };
}

async function addCompanyMember(ownerClient: SupabaseClient, companyId: string, role: "admin" | "member" = "member") {
  const { client, userId, email } = await createFreshUser("review-member");
  const { error } = await ownerClient.from("company_members").insert({ company_id: companyId, user_id: userId, company_role: role });
  if (error) throw new Error(`Setup failure: ${error.message}`);
  return { client, userId, email };
}

async function createCompanyInternship(ownerClient: SupabaseClient, companyId: string) {
  const { data, error } = await ownerClient
    .from("internships")
    .insert({
      title: `Review Internship ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      description: "x",
      requirements: "x",
      eligibility: "x",
      company_id: companyId,
      status: "open",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

async function createPendingCompanyApplication(ownerClient: SupabaseClient, companyId: string) {
  const internshipId = await createCompanyInternship(ownerClient, companyId);
  const { client: studentClient, userId: studentId } = await createFreshStudent();
  const { data: app, error } = await studentClient
    .from("applications")
    .insert({ student_id: studentId, internship_id: internshipId, cover_letter: "Company review test fixture." })
    .select("id")
    .single();
  if (error || !app) throw new Error(`Setup failure: ${error?.message}`);
  return { applicationId: app.id as string, studentClient, studentId, internshipId };
}

describe("Review authorization", () => {
  it("1. platform admin can still review an application belonging to a company internship", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { applicationId } = await createPendingCompanyApplication(owner, companyId);

    const { error } = await admin.rpc("review_application", { app_uuid: applicationId, review_status: "accepted", feedback: null });
    expect(error).toBeNull();
  });

  it("2. company owner can review their company's application", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { applicationId } = await createPendingCompanyApplication(owner, companyId);

    const { error } = await owner.rpc("review_application", { app_uuid: applicationId, review_status: "accepted", feedback: "Great fit." });
    expect(error).toBeNull();
    const { data } = await admin.from("applications").select("status").eq("id", applicationId).single();
    expect(data?.status).toBe("accepted");
  });

  it("3. company admin (promoted member) can review their company's application", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: companyAdmin } = await addCompanyMember(owner, companyId, "admin");
    const { applicationId } = await createPendingCompanyApplication(owner, companyId);

    const { error } = await companyAdmin.rpc("mark_application_under_review", { app_uuid: applicationId });
    expect(error).toBeNull();
    const { data } = await admin.from("applications").select("status").eq("id", applicationId).single();
    expect(data?.status).toBe("under_review");
  });

  it("4. a plain company member (read-only) cannot review", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: member } = await addCompanyMember(owner, companyId, "member");
    const { applicationId } = await createPendingCompanyApplication(owner, companyId);

    const { error } = await member.rpc("mark_application_under_review", { app_uuid: applicationId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });

  it("5. company A admin cannot review company B's application", async () => {
    const { client: ownerA } = await createFreshCompanyOwner("review-owner-a");
    const { client: ownerB, companyId: companyB } = await createFreshCompanyOwner("review-owner-b");
    const { applicationId } = await createPendingCompanyApplication(ownerB, companyB);

    const { error } = await ownerA.rpc("mark_application_under_review", { app_uuid: applicationId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });

  it("6. a random authenticated user with no company membership cannot review", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { applicationId } = await createPendingCompanyApplication(owner, companyId);
    const { client: randomUser } = await createFreshUser("review-random");

    const { error } = await randomUser.rpc("mark_application_under_review", { app_uuid: applicationId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });

  it("7. an unauthenticated client cannot call the review RPCs at all", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { applicationId } = await createPendingCompanyApplication(owner, companyId);
    const anon = trackedClient();

    const { error } = await anon.rpc("mark_application_under_review", { app_uuid: applicationId });
    expect(error).not.toBeNull();
  });

  it("8. a random/invalid application UUID does not bypass authorization or leak existence", async () => {
    const { client: owner } = await createFreshCompanyOwner();
    const { error } = await owner.rpc("review_application", {
      app_uuid: "00000000-0000-0000-0000-000000000000",
      review_status: "accepted",
      feedback: null,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });

  it("9. state-machine restrictions remain enforced for a company reviewer", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { applicationId } = await createPendingCompanyApplication(owner, companyId);
    await owner.rpc("review_application", { app_uuid: applicationId, review_status: "accepted", feedback: null });

    const { error } = await owner.rpc("mark_application_under_review", { app_uuid: applicationId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State/);
  });

  it("10. company-reviewer acceptance still creates an enrollment and a student notification", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { applicationId, studentClient, studentId } = await createPendingCompanyApplication(owner, companyId);

    const { error } = await owner.rpc("review_application", { app_uuid: applicationId, review_status: "accepted", feedback: null });
    expect(error).toBeNull();

    const { count } = await admin.from("enrollments").select("id", { count: "exact" }).eq("application_id", applicationId);
    expect(count).toBe(1);

    const { data: notifications } = await studentClient.from("notifications").select("title").eq("user_id", studentId);
    expect(notifications?.some((n) => /Accepted/i.test(n.title))).toBe(true);
  });

  it("11. company-reviewer review still writes an audit log entry", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { applicationId } = await createPendingCompanyApplication(owner, companyId);

    await owner.rpc("review_application", { app_uuid: applicationId, review_status: "rejected", feedback: "Not a fit." });

    const { data: log } = await admin
      .from("audit_logs")
      .select("id, action, changes")
      .eq("resource_id", applicationId)
      .eq("action", "application_review_rejected")
      .maybeSingle();
    expect(log).not.toBeNull();
    expect((log as any)?.changes?.feedback).toBe("Not a fit.");
  });
});

describe("Secure email lookup (find_user_for_company_membership)", () => {
  it("13. a company admin can resolve an exact existing email", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { email: targetEmail, userId: targetId } = await createFreshUser("review-lookup-target");

    const { data, error } = await owner.rpc("find_user_for_company_membership", { lookup_email: targetEmail });
    expect(error).toBeNull();
    expect(data?.[0]?.user_id).toBe(targetId);
    expect(data?.[0]?.email).toBe(targetEmail.toLowerCase());
  });

  it("14. a plain company member cannot perform the lookup", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: member } = await addCompanyMember(owner, companyId, "member");
    const { email: targetEmail } = await createFreshUser("review-lookup-target2");

    const { error } = await member.rpc("find_user_for_company_membership", { lookup_email: targetEmail });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });

  it("15. the lookup is exact-match only — a partial email cannot be used to enumerate users", async () => {
    const { client: owner } = await createFreshCompanyOwner();
    const { email: targetEmail } = await createFreshUser("review-lookup-target3");
    const partial = targetEmail.slice(0, targetEmail.indexOf("@"));

    const { data, error } = await owner.rpc("find_user_for_company_membership", { lookup_email: partial });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("16. an unknown email returns no user (no error, empty result)", async () => {
    const { client: owner } = await createFreshCompanyOwner();
    const { data, error } = await owner.rpc("find_user_for_company_membership", { lookup_email: "nobody-here@test.nova" });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("17. adding the same resolved user twice is rejected on the second attempt", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { email: targetEmail, userId: targetId } = await createFreshUser("review-lookup-target4");

    const { error: firstInsert } = await owner.from("company_members").insert({ company_id: companyId, user_id: targetId, company_role: "member" });
    expect(firstInsert).toBeNull();

    const { data } = await owner.rpc("find_user_for_company_membership", { lookup_email: targetEmail });
    const { error: secondInsert } = await owner.from("company_members").insert({ company_id: companyId, user_id: data![0].user_id, company_role: "member" });
    expect(secondInsert).not.toBeNull();
    expect(secondInsert!.code).toBe("23505");
  });

  it("18. an owner-role membership cannot be created through this path — RLS silently rejects it even for the admin's own client", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { userId: targetId } = await createFreshUser("review-lookup-target5");

    const { data, error } = await owner
      .from("company_members")
      .insert({ company_id: companyId, user_id: targetId, company_role: "owner" })
      .select("user_id");
    // Same silent-RLS-filter pattern established in Phase 5B-1: the INSERT's
    // WITH CHECK excludes company_role = 'owner' entirely, so this returns
    // zero rows rather than a Postgres error.
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("19. platform admin's direct company_members access is unaffected by the new lookup RPC", async () => {
    const { companyId } = await createFreshCompanyOwner();
    const { data, error } = await admin.from("company_members").select("user_id").eq("company_id", companyId);
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
  });
});

describe("Company-scoped identity reads", () => {
  it("20. company A can see applicant identity for company A's own applications", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { applicationId, studentId } = await createPendingCompanyApplication(owner, companyId);

    const { data, error } = await owner.rpc("company_applicant_profiles", { target_company_id: companyId });
    expect(error).toBeNull();
    const match = data?.find((row: any) => row.application_id === applicationId);
    expect(match?.user_id).toBe(studentId);
  });

  it("21. company A cannot see company B's applicant identities (empty, not an error)", async () => {
    const { client: ownerA } = await createFreshCompanyOwner("review-owner-a2");
    const { client: ownerB, companyId: companyB } = await createFreshCompanyOwner("review-owner-b2");
    await createPendingCompanyApplication(ownerB, companyB);

    const { data, error } = await ownerA.rpc("company_applicant_profiles", { target_company_id: companyB });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("22. a plain company member can see applicant identity too (read-only, not review)", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: member } = await addCompanyMember(owner, companyId, "member");
    const { applicationId } = await createPendingCompanyApplication(owner, companyId);

    const { data, error } = await member.rpc("company_applicant_profiles", { target_company_id: companyId });
    expect(error).toBeNull();
    expect(data?.some((row: any) => row.application_id === applicationId)).toBe(true);
  });

  it("23. a non-member cannot use an arbitrary company_id to enumerate identities", async () => {
    const { companyId } = await createFreshCompanyOwner("review-owner-c");
    const { client: outsider } = await createFreshUser("review-outsider");

    const { data: applicants, error: applicantsError } = await outsider.rpc("company_applicant_profiles", { target_company_id: companyId });
    expect(applicantsError).toBeNull();
    expect(applicants).toEqual([]);

    const { data: members, error: membersError } = await outsider.rpc("company_member_profiles", { target_company_id: companyId });
    expect(membersError).toBeNull();
    expect(members).toEqual([]);
  });

  it("24. a student's own access is unaffected — calling the company RPCs as a student returns nothing, not an error", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { studentClient } = await createPendingCompanyApplication(owner, companyId);

    const { data, error } = await studentClient.rpc("company_applicant_profiles", { target_company_id: companyId });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("25. platform admin's own application/profile access is unaffected", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { applicationId } = await createPendingCompanyApplication(owner, companyId);

    const { data, error } = await admin.from("applications").select("id, student:student_profiles(profiles(email))").eq("id", applicationId).maybeSingle();
    expect(error).toBeNull();
    expect((data as any)?.student?.profiles?.email).toBeTruthy();
  });

  it("company_member_profiles resolves fellow members' identities for a member of that company", async () => {
    const { client: owner, companyId, userId: ownerId, email: ownerEmail } = await createFreshCompanyOwner();
    const { data, error } = await owner.rpc("company_member_profiles", { target_company_id: companyId });
    expect(error).toBeNull();
    expect(data?.find((row: any) => row.user_id === ownerId)?.email).toBe(ownerEmail.toLowerCase());
  });
});
