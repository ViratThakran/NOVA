/**
 * APPLICATION TRANSACTION TESTS (Integration)
 *
 * Proves that review_application() is fully atomic:
 * - On success: status, enrollment, notification, and audit log all exist.
 * - On failure: no partial state remains.
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

let admin: SupabaseClient;
const clientsToSignOut: SupabaseClient[] = [];

beforeAll(async () => {
  admin = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  const { error } = await admin.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (error) {
    throw new Error(`Setup failed: could not authenticate ${ADMIN_EMAIL}: ${error.message}`);
  }
});

afterAll(async () => {
  await admin.auth.signOut();
  await Promise.all(clientsToSignOut.map((client) => client.auth.signOut()));
});

// A freshly signed-up student, not the shared seeded `student-a@test.nova`
// account. This test used to authenticate as that literal shared account —
// but several other integration test files also sign in as student-a
// concurrently (Vitest runs test files in parallel), and GoTrue sessions for
// the very same account raced across workers: one worker's sign-in could
// invalidate another's still-in-flight session, surfacing as "no
// authenticated user" or, in another file, a stray duplicate-application
// error. A dynamically generated, never-reused email has no such collision
// risk — nothing else in the suite could ever sign in as this exact address.
function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

async function createFreshStudent() {
  const email = `${unique("txn-student")}@test.nova`;
  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  clientsToSignOut.push(client);
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) {
    throw new Error(`Setup failure: could not sign up a fresh student: ${error?.message}`);
  }
  // handle_new_user() (see the migration) assigns the 'student' role to every
  // new signup by default, but applications.student_id is a foreign key into
  // student_profiles (not profiles directly) — that row is only ever created
  // during onboarding, never automatically. Insert the minimal row (every
  // other column has a NOT NULL DEFAULT) so this fresh student can actually
  // apply.
  const { error: profileError } = await client.from("student_profiles").insert({ id: data.user.id });
  if (profileError) {
    throw new Error(`Setup failure: could not create student_profiles row: ${profileError.message}`);
  }

  return { client, userId: data.user.id };
}

describe("Application Transaction Tests", () => {
  // Both tests in this file operate on one deterministic application,
  // created fresh below rather than picked up via an unscoped
  // `eq("status", "pending").limit(1).single()` / `eq("status", "accepted")...`
  // query. That query previously had no student/internship scoping, so in
  // the full suite (which now has many other files creating their own
  // pending/accepted applications concurrently) it could silently pick up
  // an unrelated application belonging to a different student — the
  // notification-ownership assertion below would then legitimately find
  // nothing, since the intended student never actually applied to that
  // other application's internship. Creating and reusing one specific,
  // uniquely-owned application id removes that ambiguity entirely.
  let transactionTestApplicationId: string;

  it("Accepted application atomically creates enrollment + notification + audit log", async () => {
    // A dedicated internship + application owned by a freshly created
    // student — this test never depends on which pending application (or
    // which student) happens to exist already.
    const { data: internship, error: internshipError } = await admin
      .from("internships")
      .insert({
        title: "Transaction test fixture internship",
        description: "Fixture internship for the atomicity test.",
        requirements: "None.",
        eligibility: "None.",
        status: "open",
      })
      .select("id")
      .single();
    if (internshipError || !internship) {
      throw new Error(`Setup failure: ${internshipError?.message}`);
    }

    const { client: student, userId: studentId } = await createFreshStudent();

    // "Students can insert applications" RLS requires auth.uid() = student_id
    // — inserting as the student's own session is what makes this a real,
    // RLS-authorized application, not an admin-fabricated row.
    const { data: app, error: applyError } = await student
      .from("applications")
      .insert({ student_id: studentId, internship_id: internship.id })
      .select("id, student_id, internship_id")
      .single();
    if (applyError || !app) {
      throw new Error(`Setup failure: ${applyError?.message}`);
    }
    transactionTestApplicationId = app.id;

    // Execute the review
    const { error: rpcError } = await admin.rpc("review_application", {
      app_uuid: app.id,
      review_status: "accepted",
      feedback: "Transaction test acceptance.",
    });

    expect(rpcError).toBeNull();

    // Verify application status updated
    const { data: updatedApp } = await admin
      .from("applications")
      .select("status")
      .eq("id", app.id)
      .single();

    expect(updatedApp?.status).toBe("accepted");

    // Verify enrollment created
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id, status")
      .eq("application_id", app.id)
      .single();

    expect(enrollment).not.toBeNull();
    expect(enrollment?.status).toBe("active");

    // Verify notification created (read as the owning student). Unlike every
    // other table's SELECT policy, notifications has no admin-bypass clause
    // (`USING (auth.uid() = user_id)` only) — confirming one exists requires
    // reading it as its owner, not as admin. Ordered by recency and scoped to
    // this test's own freshly-created student — deterministic since nothing
    // else in the suite could ever touch this student's notifications.
    const { data: notification } = await student
      .from("notifications")
      .select("id, title")
      .eq("user_id", app.student_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    expect(notification).not.toBeNull();
    expect(notification?.title).toMatch(/Accepted/i);

    // Verify audit log exists
    const { data: auditLog } = await admin
      .from("audit_logs")
      .select("id, action, resource_id")
      .eq("resource_id", app.id)
      .eq("action", "application_review_accepted")
      .single();

    expect(auditLog).not.toBeNull();
  });

  it("Attempting to review an already-accepted application fails entirely (idempotency guard)", async () => {
    // The exact application the prior test accepted — not a re-query.
    const appId = transactionTestApplicationId;
    if (!appId) {
      throw new Error("Setup failure: expected the application accepted in the prior test but found none.");
    }

    const countBefore = await admin
      .from("enrollments")
      .select("id", { count: "exact" })
      .eq("application_id", appId);

    const { error } = await admin.rpc("review_application", {
      app_uuid: appId,
      review_status: "rejected",
      feedback: "Attempted second review",
    });

    // Must fail — application already processed
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State|already been processed/);

    // Verify enrollment count unchanged
    const countAfter = await admin
      .from("enrollments")
      .select("id", { count: "exact" })
      .eq("application_id", appId);

    expect(countAfter.count).toBe(countBefore.count);
  });
});
