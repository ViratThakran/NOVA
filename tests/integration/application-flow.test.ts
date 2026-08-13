/**
 * APPLICATION BACKEND FLOW TESTS (Integration) — Phase 4B
 *
 * Exercises the real application submission / review workflow against local
 * Supabase — not a mocked database. Covers the three security-relevant
 * paths added in this phase:
 *   - Student: INSERT into applications (what submitApplicationAction wraps)
 *   - Admin:   mark_application_under_review() RPC
 *   - Admin:   review_application() RPC (what reviewApplicationAction wraps)
 *
 * These tests talk to Supabase directly rather than importing the Server
 * Actions themselves — the Server Actions are thin wrappers around exactly
 * these calls (see src/app/student/actions.ts, src/app/admin/actions.ts),
 * and Next.js's request-scoped cookies()/headers() context isn't available
 * outside a real request, matching the pattern already established by
 * rls-negative.test.ts and transaction.test.ts.
 *
 * Each test creates its own fresh student/internship fixtures rather than
 * reusing supabase/seed.sql's single pre-seeded pending application, since
 * that row is already consumed by rls-negative.test.ts and
 * transaction.test.ts — sharing it here would make all three files
 * order-dependent.
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

const newTestEmail = () => `application-flow-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;

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

/** Admin-created internship fixture, isolated per test so nothing collides with seed.sql or other test files. */
async function createFreshInternship(status: "draft" | "open" | "closed" | "archived" = "open") {
  const { data, error } = await admin
    .from("internships")
    .insert({
      title: `Test Internship ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      description: "Integration test fixture internship.",
      requirements: "None.",
      eligibility: "Any enrolled student.",
      status,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Setup failure: could not create internship: ${error?.message}`);
  }
  return data.id as string;
}

/**
 * Fresh, throwaway student — signs up, then creates the student_profiles row
 * the same way completeOnboardingAction does (applications.student_id
 * references student_profiles(id), not profiles(id) directly, so this must
 * exist before the student can apply to anything).
 */
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

describe("Student application submission", () => {
  it("1. a student can submit an application to an open internship", async () => {
    const { client, userId } = await createFreshStudent();
    const internshipId = await createFreshInternship("open");

    const { error } = await client.from("applications").insert({
      student_id: userId,
      internship_id: internshipId,
      cover_letter: "I would love to contribute to this internship program.",
    });
    expect(error).toBeNull();

    const { data: app } = await client
      .from("applications")
      .select("status")
      .eq("student_id", userId)
      .eq("internship_id", internshipId)
      .single();
    expect(app?.status).toBe("pending");
  });

  it("2. an unauthenticated client cannot submit an application", async () => {
    const anon = trackedClient(); // never signed in
    const internshipId = await createFreshInternship("open");

    const { data, error } = await anon.from("applications").insert({
      student_id: "00000000-0000-0000-0000-000000000000",
      internship_id: internshipId,
      cover_letter: "Anonymous submission attempt.",
    });

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("3. a student cannot submit an application on behalf of another student", async () => {
    const { client: studentOne } = await createFreshStudent();
    const { userId: studentTwoId } = await createFreshStudent();
    const internshipId = await createFreshInternship("open");

    // Student One authenticated, but attempts to set student_id to Student Two's id.
    const { data, error } = await studentOne
      .from("applications")
      .insert({
        student_id: studentTwoId,
        internship_id: internshipId,
        cover_letter: "Impersonation attempt via client-supplied student_id.",
      })
      .select();

    // RLS's WITH CHECK (auth.uid() = student_id) rejects this outright.
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("4. a duplicate application to the same internship is rejected", async () => {
    const { client, userId } = await createFreshStudent();
    const internshipId = await createFreshInternship("open");

    const { error: firstError } = await client.from("applications").insert({
      student_id: userId,
      internship_id: internshipId,
      cover_letter: "First application attempt.",
    });
    expect(firstError).toBeNull();

    const { error: secondError } = await client.from("applications").insert({
      student_id: userId,
      internship_id: internshipId,
      cover_letter: "Second application attempt to the same internship.",
    });

    expect(secondError).not.toBeNull();
    expect(secondError?.code).toBe("23505");
  });
});

describe("Admin mark_application_under_review() RPC", () => {
  it("5. a student cannot call mark_application_under_review", async () => {
    const { client, userId } = await createFreshStudent();
    const internshipId = await createFreshInternship("open");
    const { data: app } = await client
      .from("applications")
      .insert({ student_id: userId, internship_id: internshipId, cover_letter: "Pending application fixture." })
      .select("id")
      .single();

    const { error } = await client.rpc("mark_application_under_review", { app_uuid: app!.id });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });

  it("6. an admin can mark a pending application under_review and it is audit logged", async () => {
    const { client, userId } = await createFreshStudent();
    const internshipId = await createFreshInternship("open");
    const { data: app } = await client
      .from("applications")
      .insert({ student_id: userId, internship_id: internshipId, cover_letter: "Pending application fixture." })
      .select("id")
      .single();

    const { error } = await admin.rpc("mark_application_under_review", { app_uuid: app!.id });
    expect(error).toBeNull();

    const { data: updated } = await admin.from("applications").select("status").eq("id", app!.id).single();
    expect(updated?.status).toBe("under_review");

    const { data: auditLog } = await admin
      .from("audit_logs")
      .select("id, action")
      .eq("resource_id", app!.id)
      .eq("action", "application_marked_under_review")
      .maybeSingle();
    expect(auditLog).not.toBeNull();
  });

  it("7. an admin cannot mark an already-accepted application under_review", async () => {
    const { client, userId } = await createFreshStudent();
    const internshipId = await createFreshInternship("open");
    const { data: app } = await client
      .from("applications")
      .insert({ student_id: userId, internship_id: internshipId, cover_letter: "Application to be accepted first." })
      .select("id")
      .single();

    const { error: reviewError } = await admin.rpc("review_application", {
      app_uuid: app!.id,
      review_status: "accepted",
      feedback: null,
    });
    expect(reviewError).toBeNull();

    const { error: markError } = await admin.rpc("mark_application_under_review", { app_uuid: app!.id });
    expect(markError).not.toBeNull();
    expect(markError!.message).toMatch(/Invalid State/);

    const { data: unchanged } = await admin.from("applications").select("status").eq("id", app!.id).single();
    expect(unchanged?.status).toBe("accepted");
  });
});

describe("Admin review_application() RPC — accept/reject paths", () => {
  it("8. an admin can accept an application that is under_review (enrollment + notification + audit log created)", async () => {
    const { client, userId } = await createFreshStudent();
    const internshipId = await createFreshInternship("open");
    const { data: app } = await client
      .from("applications")
      .insert({ student_id: userId, internship_id: internshipId, cover_letter: "Application accepted from under_review." })
      .select("id")
      .single();

    await admin.rpc("mark_application_under_review", { app_uuid: app!.id });

    const { error } = await admin.rpc("review_application", {
      app_uuid: app!.id,
      review_status: "accepted",
      feedback: "Great candidate.",
    });
    expect(error).toBeNull();

    const { data: updated } = await admin.from("applications").select("status").eq("id", app!.id).single();
    expect(updated?.status).toBe("accepted");

    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id, status")
      .eq("application_id", app!.id)
      .maybeSingle();
    expect(enrollment).not.toBeNull();
    expect(enrollment?.status).toBe("active");

    // notifications has no admin-bypass SELECT policy — read as the owning student.
    const { data: notification } = await client
      .from("notifications")
      .select("id, title")
      .eq("user_id", userId)
      .maybeSingle();
    expect(notification).not.toBeNull();
    expect(notification?.title).toMatch(/Accepted/i);

    const { data: auditLog } = await admin
      .from("audit_logs")
      .select("id")
      .eq("resource_id", app!.id)
      .eq("action", "application_review_accepted")
      .maybeSingle();
    expect(auditLog).not.toBeNull();
  });

  it("9. an admin can reject an application that is under_review (notification created, no enrollment)", async () => {
    const { client, userId } = await createFreshStudent();
    const internshipId = await createFreshInternship("open");
    const { data: app } = await client
      .from("applications")
      .insert({ student_id: userId, internship_id: internshipId, cover_letter: "Application rejected from under_review." })
      .select("id")
      .single();

    await admin.rpc("mark_application_under_review", { app_uuid: app!.id });

    const { error } = await admin.rpc("review_application", {
      app_uuid: app!.id,
      review_status: "rejected",
      feedback: "Not a fit at this time.",
    });
    expect(error).toBeNull();

    const { data: updated } = await admin.from("applications").select("status").eq("id", app!.id).single();
    expect(updated?.status).toBe("rejected");

    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id")
      .eq("application_id", app!.id)
      .maybeSingle();
    expect(enrollment).toBeNull();

    const { data: notification } = await client
      .from("notifications")
      .select("id, title")
      .eq("user_id", userId)
      .maybeSingle();
    expect(notification).not.toBeNull();
    expect(notification?.title).toMatch(/Reviewed/i);
  });

  it("10. a student cannot execute review_application() on a real pending application", async () => {
    const { client, userId } = await createFreshStudent();
    const internshipId = await createFreshInternship("open");
    const { data: app } = await client
      .from("applications")
      .insert({ student_id: userId, internship_id: internshipId, cover_letter: "Application a student tries to self-approve." })
      .select("id")
      .single();

    const { error } = await client.rpc("review_application", {
      app_uuid: app!.id,
      review_status: "accepted",
      feedback: "Self-approval attempt.",
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);

    const { data: unchanged } = await admin.from("applications").select("status").eq("id", app!.id).single();
    expect(unchanged?.status).toBe("pending");
  });
});

describe("Application visibility and status-mutation boundaries", () => {
  it("11. a student cannot see or apply to a draft internship", async () => {
    const { client, userId } = await createFreshStudent();
    const internshipId = await createFreshInternship("draft");

    // RLS hides non-open internships from students entirely.
    const { data: visible } = await client.from("internships").select("id").eq("id", internshipId).maybeSingle();
    expect(visible).toBeNull();

    // RLS on applications doesn't itself check internship status — a
    // direct INSERT with a known draft internship_id is only blocked by
    // application-layer logic (see submitApplicationAction's explicit
    // status='open' check), not by a database constraint. Documented as a
    // known architectural gap in the Phase 4B report; this test proves the
    // gap exists rather than asserting a guarantee the schema doesn't make.
    const { error } = await client.from("applications").insert({
      student_id: userId,
      internship_id: internshipId,
      cover_letter: "Attempting to apply to a draft internship directly.",
    });
    expect(error).toBeNull();
  });

  it("12. a student cannot directly UPDATE their own application's status", async () => {
    const { client, userId } = await createFreshStudent();
    const internshipId = await createFreshInternship("open");
    const { data: app } = await client
      .from("applications")
      .insert({ student_id: userId, internship_id: internshipId, cover_letter: "Application for direct-mutation test." })
      .select("id")
      .single();

    const { error } = await client.from("applications").update({ status: "accepted" }).eq("id", app!.id);
    expect(error).not.toBeNull();
  });

  it("13. even an admin cannot directly UPDATE an application's status (no UPDATE policy exists for anyone)", async () => {
    const { client, userId } = await createFreshStudent();
    const internshipId = await createFreshInternship("open");
    const { data: app } = await client
      .from("applications")
      .insert({ student_id: userId, internship_id: internshipId, cover_letter: "Application for admin direct-mutation test." })
      .select("id")
      .single();

    const { error } = await admin.from("applications").update({ status: "accepted" }).eq("id", app!.id);
    expect(error).not.toBeNull();

    const { data: unchanged } = await admin.from("applications").select("status").eq("id", app!.id).single();
    expect(unchanged?.status).toBe("pending");
  });

  it("14. even an admin cannot directly INSERT an enrollment (created only via review_application())", async () => {
    const { userId } = await createFreshStudent();
    const internshipId = await createFreshInternship("open");

    const { error } = await admin.from("enrollments").insert({
      student_id: userId,
      internship_id: internshipId,
      application_id: "00000000-0000-0000-0000-000000000000",
      status: "active",
    });

    expect(error).not.toBeNull();
  });
});
