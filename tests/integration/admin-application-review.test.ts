/**
 * ADMIN APPLICATION REVIEW TESTS (Integration) — Phase 4D
 *
 * Exercises the query/RPC behavior the admin review pages depend on:
 *   - /admin/applications        : the admin-only application queue
 *   - /admin/applications/[id]   : detail + audit-log-derived review history
 *   - mark_application_under_review() / review_application() via the RPCs
 *     the admin UI's Server Actions wrap (see src/app/admin/actions.ts)
 *
 * These talk to Supabase directly, the same way the Server Components do —
 * matching the pattern established in application-flow.test.ts (Phase 4B)
 * and student-internship-experience.test.ts (Phase 4C). Every fixture is
 * created fresh per test rather than reusing seed.sql's shared rows, to stay
 * immune to the cross-file race documented in the Phase 4B report.
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

const newTestEmail = () => `admin-review-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;

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
  if (error) {
    throw new Error(`Setup failed: could not authenticate ${ADMIN_EMAIL}: ${error.message}`);
  }
});

afterAll(async () => {
  await Promise.all(clientsToSignOut.map((client) => client.auth.signOut()));
});

async function createFreshInternship() {
  const { data, error } = await admin
    .from("internships")
    .insert({
      title: `Admin Review Internship ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      description: "Integration test fixture internship.",
      requirements: "None.",
      eligibility: "Any enrolled student.",
      status: "open",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Setup failure: could not create internship: ${error?.message}`);
  }
  return data.id as string;
}

async function createFreshStudent() {
  const email = newTestEmail();
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) {
    throw new Error(`Setup failure: could not sign up ${email}: ${error?.message}`);
  }
  const userId = data.user.id;

  const { error: profileError } = await client.from("student_profiles").upsert({
    id: userId,
    education_info: { school: "Test University", degree: "CS", grad_year: 2028 },
    skills: ["TypeScript"],
  });
  if (profileError) {
    throw new Error(`Setup failure: could not create student_profiles for ${email}: ${profileError.message}`);
  }

  return { client, userId };
}

async function createPendingApplication() {
  const { client, userId } = await createFreshStudent();
  const internshipId = await createFreshInternship();
  const { data: app, error } = await client
    .from("applications")
    .insert({ student_id: userId, internship_id: internshipId, cover_letter: "Admin review test fixture application." })
    .select("id")
    .single();
  if (error || !app) {
    throw new Error(`Setup failure: could not create application: ${error?.message}`);
  }
  return { applicationId: app.id as string, studentClient: client, studentId: userId, internshipId };
}

describe("Admin application queue access", () => {
  it("1. admin can retrieve applications", async () => {
    const { applicationId } = await createPendingApplication();

    const { data, error } = await admin.from("applications").select("id, status");

    expect(error).toBeNull();
    expect(data?.some((row) => row.id === applicationId)).toBe(true);
  });

  it("2. a student's unfiltered applications query never returns the full admin queue — only their own rows", async () => {
    const { studentClient, studentId, applicationId } = await createPendingApplication();
    // A second, unrelated application belonging to a different student.
    await createPendingApplication();

    const { data, error } = await studentClient.from("applications").select("id, student_id");

    expect(error).toBeNull();
    expect(data?.every((row) => row.student_id === studentId)).toBe(true);
    expect(data?.some((row) => row.id === applicationId)).toBe(true);
  });

  it("3. an unauthenticated client cannot access the admin application area", async () => {
    const anon = trackedClient(); // never signed in
    const { data, error } = await anon.from("applications").select("id");

    // No base table GRANT exists for the `anon` role at all — every RLS
    // policy in this schema is `TO authenticated` only.
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("4. admin can view a single application's details", async () => {
    const { applicationId } = await createPendingApplication();

    const { data, error } = await admin
      .from("applications")
      .select(
        "id, status, cover_letter, internship:internships(id, title), student:student_profiles(id, profiles(first_name, last_name, email))"
      )
      .eq("id", applicationId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id).toBe(applicationId);
    expect((data as any)?.internship?.title).toBeTruthy();
    expect((data as any)?.student?.profiles?.email).toBeTruthy();
  });

  it("5. a student cannot view another student's application details (the admin detail page's query, run as a student)", async () => {
    const { applicationId } = await createPendingApplication();
    const { client: otherStudent } = await createFreshStudent();

    const { data, error } = await otherStudent
      .from("applications")
      .select("id, status")
      .eq("id", applicationId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});

describe("Mark under review", () => {
  it("6. admin can mark a pending application under_review", async () => {
    const { applicationId } = await createPendingApplication();

    const { error } = await admin.rpc("mark_application_under_review", { app_uuid: applicationId });
    expect(error).toBeNull();

    const { data } = await admin.from("applications").select("status").eq("id", applicationId).single();
    expect(data?.status).toBe("under_review");
  });

  it("7. admin cannot mark an already-accepted application under_review", async () => {
    const { applicationId } = await createPendingApplication();
    await admin.rpc("review_application", { app_uuid: applicationId, review_status: "accepted", feedback: null });

    const { error } = await admin.rpc("mark_application_under_review", { app_uuid: applicationId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State/);

    const { data } = await admin.from("applications").select("status").eq("id", applicationId).single();
    expect(data?.status).toBe("accepted");
  });

  it("10. a student cannot call mark_application_under_review", async () => {
    const { applicationId, studentClient } = await createPendingApplication();

    const { error } = await studentClient.rpc("mark_application_under_review", { app_uuid: applicationId });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });
});

describe("Accept / reject", () => {
  it("8. admin can accept an under_review application", async () => {
    const { applicationId } = await createPendingApplication();
    await admin.rpc("mark_application_under_review", { app_uuid: applicationId });

    const { error } = await admin.rpc("review_application", {
      app_uuid: applicationId,
      review_status: "accepted",
      feedback: "Strong candidate.",
    });
    expect(error).toBeNull();

    const { data } = await admin.from("applications").select("status").eq("id", applicationId).single();
    expect(data?.status).toBe("accepted");
  });

  it("9. admin can reject an under_review application", async () => {
    const { applicationId } = await createPendingApplication();
    await admin.rpc("mark_application_under_review", { app_uuid: applicationId });

    const { error } = await admin.rpc("review_application", {
      app_uuid: applicationId,
      review_status: "rejected",
      feedback: "Not a fit at this time.",
    });
    expect(error).toBeNull();

    const { data } = await admin.from("applications").select("status").eq("id", applicationId).single();
    expect(data?.status).toBe("rejected");
  });

  it("11. a student cannot call review_application", async () => {
    const { applicationId, studentClient } = await createPendingApplication();

    const { error } = await studentClient.rpc("review_application", {
      app_uuid: applicationId,
      review_status: "accepted",
      feedback: "Self-approval attempt.",
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });
});

describe("Enrollment side effects", () => {
  it("12. acceptance creates exactly one enrollment", async () => {
    const { applicationId } = await createPendingApplication();
    await admin.rpc("review_application", { app_uuid: applicationId, review_status: "accepted", feedback: null });

    const { data, count } = await admin
      .from("enrollments")
      .select("id", { count: "exact" })
      .eq("application_id", applicationId);

    expect(count).toBe(1);
    expect(data).toHaveLength(1);
  });

  it("13. rejection creates no enrollment", async () => {
    const { applicationId } = await createPendingApplication();
    await admin.rpc("review_application", { app_uuid: applicationId, review_status: "rejected", feedback: null });

    const { count } = await admin
      .from("enrollments")
      .select("id", { count: "exact" })
      .eq("application_id", applicationId);

    expect(count).toBe(0);
  });
});

describe("Notification side effects", () => {
  it("14. acceptance creates the expected notification", async () => {
    const { applicationId, studentClient, studentId } = await createPendingApplication();
    await admin.rpc("review_application", { app_uuid: applicationId, review_status: "accepted", feedback: null });

    // notifications has no admin-bypass SELECT policy — read as the owning student.
    const { data } = await studentClient.from("notifications").select("id, title").eq("user_id", studentId);
    expect(data?.some((n) => /Accepted/i.test(n.title))).toBe(true);
  });

  it("15. rejection creates the expected notification", async () => {
    const { applicationId, studentClient, studentId } = await createPendingApplication();
    await admin.rpc("review_application", { app_uuid: applicationId, review_status: "rejected", feedback: null });

    const { data } = await studentClient.from("notifications").select("id, title").eq("user_id", studentId);
    expect(data?.some((n) => /Reviewed/i.test(n.title))).toBe(true);
  });
});

describe("Audit log side effects (admin review history)", () => {
  it("16. marking under_review, accepting, and rejecting each create an audit record readable by admin", async () => {
    // under_review
    const underReviewFixture = await createPendingApplication();
    await admin.rpc("mark_application_under_review", { app_uuid: underReviewFixture.applicationId });
    const { data: underReviewLog } = await admin
      .from("audit_logs")
      .select("id, action")
      .eq("resource_id", underReviewFixture.applicationId)
      .eq("action", "application_marked_under_review")
      .maybeSingle();
    expect(underReviewLog).not.toBeNull();

    // accepted
    const acceptedFixture = await createPendingApplication();
    await admin.rpc("review_application", {
      app_uuid: acceptedFixture.applicationId,
      review_status: "accepted",
      feedback: "Great fit.",
    });
    const { data: acceptedLog } = await admin
      .from("audit_logs")
      .select("id, action, changes")
      .eq("resource_id", acceptedFixture.applicationId)
      .eq("action", "application_review_accepted")
      .maybeSingle();
    expect(acceptedLog).not.toBeNull();
    expect((acceptedLog as any)?.changes?.feedback).toBe("Great fit.");

    // rejected
    const rejectedFixture = await createPendingApplication();
    await admin.rpc("review_application", {
      app_uuid: rejectedFixture.applicationId,
      review_status: "rejected",
      feedback: null,
    });
    const { data: rejectedLog } = await admin
      .from("audit_logs")
      .select("id, action")
      .eq("resource_id", rejectedFixture.applicationId)
      .eq("action", "application_review_rejected")
      .maybeSingle();
    expect(rejectedLog).not.toBeNull();
  });

  it("students cannot read audit logs, even for their own application (feedback stays admin-only)", async () => {
    const { applicationId, studentClient } = await createPendingApplication();
    await admin.rpc("review_application", { app_uuid: applicationId, review_status: "accepted", feedback: "Secret admin note." });

    const { data, error } = await studentClient.from("audit_logs").select("id").eq("resource_id", applicationId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe("Direct mutation stays blocked (even for the admin UI's own client)", () => {
  it("17. even an admin cannot directly UPDATE an application's status", async () => {
    const { applicationId } = await createPendingApplication();

    const { error } = await admin.from("applications").update({ status: "accepted" }).eq("id", applicationId);
    expect(error).not.toBeNull();

    const { data } = await admin.from("applications").select("status").eq("id", applicationId).single();
    expect(data?.status).toBe("pending");
  });

  it("18. even an admin cannot directly INSERT an enrollment", async () => {
    const { applicationId, studentId, internshipId } = await createPendingApplication();

    const { error } = await admin.from("enrollments").insert({
      student_id: studentId,
      internship_id: internshipId,
      application_id: applicationId,
      status: "active",
    });

    expect(error).not.toBeNull();
  });
});
