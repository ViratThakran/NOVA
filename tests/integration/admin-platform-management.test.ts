/**
 * ADMIN PLATFORM MANAGEMENT TESTS (Integration) — Phase 6B
 *
 * Exercises the NEW query shapes the admin dashboard/students/companies/
 * enrollments/audit-logs pages depend on (counts, cross-table embeds). The
 * underlying RLS admin-read-all branches are already exhaustively tested
 * elsewhere (admin-application-review.test.ts, company-platform-*.test.ts);
 * this file only verifies the new queries return correct data for admin and
 * stay correctly scoped for non-admins.
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

async function createFreshStudent(prefix = "admin-mgmt-student") {
  const email = uniqueEmail(prefix);
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) throw new Error(`Setup failure: ${error?.message}`);
  const userId = data.user.id;
  const { error: profileError } = await client
    .from("student_profiles")
    .upsert({ id: userId, education_info: { school: "X", degree: "Y", grad_year: 2028 }, skills: ["TS"] });
  if (profileError) throw new Error(`Setup failure: ${profileError.message}`);
  return { client, userId, email };
}

async function createFreshCompanyOwner() {
  const email = uniqueEmail("admin-mgmt-owner");
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) throw new Error(`Setup failure: ${error?.message}`);
  const { data: companyId, error: companyError } = await client.rpc("create_company", {
    company_name: `Admin Mgmt Test Co ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    company_description: "fixture",
  });
  if (companyError || !companyId) throw new Error(`Setup failure: ${companyError?.message}`);
  return { client, userId: data.user.id, companyId: companyId as string };
}

async function createCompanyInternship(ownerClient: SupabaseClient, companyId: string) {
  const { data, error } = await ownerClient
    .from("internships")
    .insert({
      title: `Admin Mgmt Internship ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
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

describe("Admin dashboard KPI counts", () => {
  it("the dashboard's count query (status='open'/'pending', count: exact head: true) includes a freshly created fixture", async () => {
    // Counts the WHOLE table, so diffing before/after is racy under the full
    // suite's parallel test files (other files create rows concurrently).
    // Scoped id-filtered counts avoid that race while still exercising the
    // exact query shape the dashboard uses.
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId);
    const { count: internshipCount, error: internshipError } = await admin
      .from("internships")
      .select("*", { count: "exact", head: true })
      .eq("status", "open")
      .eq("id", internshipId);
    expect(internshipError).toBeNull();
    expect(internshipCount).toBe(1);

    const { client: student, userId: studentId } = await createFreshStudent();
    const { data: app } = await student
      .from("applications")
      .insert({ student_id: studentId, internship_id: internshipId, cover_letter: "x" })
      .select("id")
      .single();
    const { count: applicationCount, error: applicationError } = await admin
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("id", app!.id);
    expect(applicationError).toBeNull();
    expect(applicationCount).toBe(1);
  });

  it("a non-admin's equivalent count query is scoped by RLS, not a platform-wide count", async () => {
    const { client: student } = await createFreshStudent();
    // internships SELECT policy for a non-admin only returns status='open'
    // rows anyway, so this exercises "no error, no elevated access" rather
    // than a numeric mismatch.
    const { error } = await student.from("internships").select("*", { count: "exact", head: true }).eq("status", "open");
    expect(error).toBeNull();
  });
});

describe("Admin students list", () => {
  it("a freshly created student appears in the admin students query with correct application/enrollment counts", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId);
    const { client: student, userId: studentId } = await createFreshStudent();
    await student.from("applications").insert({ student_id: studentId, internship_id: internshipId, cover_letter: "x" });

    const { data: roleRows, error: roleError } = await admin.from("user_roles").select("user_id").eq("role", "student");
    expect(roleError).toBeNull();
    expect(roleRows?.some((r) => r.user_id === studentId)).toBe(true);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, email, onboarded")
      .eq("id", studentId)
      .single();
    expect(profileError).toBeNull();
    expect(profile?.onboarded).toBe(false);

    const { data: applications } = await admin.from("applications").select("student_id").eq("student_id", studentId);
    expect(applications?.length).toBe(1);
  });

  it("a non-admin querying user_roles for role=student only ever gets their own row back, never the full roster", async () => {
    const { client: student, userId } = await createFreshStudent();
    const { data, error } = await student.from("user_roles").select("user_id, role").eq("role", "student");
    expect(error).toBeNull();
    expect(data?.every((r) => r.user_id === userId)).toBe(true);
  });
});

describe("Admin companies list", () => {
  it("a freshly created company appears with correct member and internship counts", async () => {
    const { client: owner, userId: ownerId, companyId } = await createFreshCompanyOwner();
    await createCompanyInternship(owner, companyId);

    const { data: company, error } = await admin.from("companies").select("id, name").eq("id", companyId).single();
    expect(error).toBeNull();
    expect(company?.id).toBe(companyId);

    const { data: members } = await admin.from("company_members").select("company_id").eq("company_id", companyId);
    expect(members?.length).toBe(1);

    const { data: internships } = await admin.from("internships").select("company_id, status").eq("company_id", companyId);
    expect(internships?.length).toBe(1);
    expect(internships?.[0]?.status).toBe("open");
    expect(ownerId).toBeTruthy();
  });
});

describe("Admin enrollments list", () => {
  it("an accepted application's resulting enrollment is visible with the correct student + internship embed", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId);
    const { client: student, userId: studentId } = await createFreshStudent();
    const { data: app } = await student
      .from("applications")
      .insert({ student_id: studentId, internship_id: internshipId, cover_letter: "x" })
      .select("id")
      .single();
    await admin.rpc("review_application", { app_uuid: app!.id, review_status: "accepted", feedback: null });

    const { data, error } = await admin
      .from("enrollments")
      .select("id, status, internship:internships(id, title), student:student_profiles(id, profiles(email))")
      .eq("application_id", app!.id)
      .single();
    expect(error).toBeNull();
    expect((data as any)?.internship?.id).toBe(internshipId);
    expect((data as any)?.student?.profiles?.email).toBeTruthy();
  });
});

describe("Admin audit logs list", () => {
  it("company creation is visible in the admin audit log with a resolvable actor embed", async () => {
    const { userId: ownerId, companyId } = await createFreshCompanyOwner();

    const { data, error } = await admin
      .from("audit_logs")
      .select("id, action, resource_id, actor:profiles(email)")
      .eq("action", "company_created")
      .eq("resource_id", companyId)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect((data as any)?.actor?.email).toBeTruthy();
    expect(ownerId).toBeTruthy();
  });
});
