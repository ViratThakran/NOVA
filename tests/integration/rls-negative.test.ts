/**
 * RLS NEGATIVE SECURITY TESTS
 *
 * These tests prove that a normal authenticated student CANNOT perform
 * unauthorized database operations. Each test asserts that the operation
 * is rejected by Row Level Security.
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

// Freshly signed-up students rather than the shared seeded
// student-a@test.nova / student-b@test.nova pair — several other
// integration test files also authenticate as those literal accounts
// concurrently (Vitest runs test files in parallel). Every test below is a
// "must fail" RLS assertion, so it's not really the unique_student_internship
// collision class fixed elsewhere, but there's no reason to depend on the
// shared accounts either when a fresh pair works exactly the same.
let studentA: SupabaseClient;
let studentB: SupabaseClient;
let studentAId: string;
let studentBId: string;
const makePdfBlob = (size: number = 1024) => {
  const header = "%PDF-1.4\n";
  const padding = "a".repeat(Math.max(0, size - header.length));
  return new Blob([header + padding], { type: "application/pdf" });
};

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

async function signUpStudent() {
  const email = `${unique("rls-negative-student")}@test.nova`;
  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) {
    throw new Error(`Setup failure: could not sign up a fresh student: ${error?.message}`);
  }
  const { error: profileError } = await client.from("student_profiles").insert({ id: data.user.id });
  if (profileError) {
    throw new Error(`Setup failure: could not create student_profiles row: ${profileError.message}`);
  }
  return { client, userId: data.user.id };
}

beforeAll(async () => {
  const admin = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  const { error: adminError } = await admin.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (adminError) {
    throw new Error(`Setup failed: could not authenticate ${ADMIN_EMAIL}: ${adminError.message}`);
  }

  const dataA = await signUpStudent();
  const dataB = await signUpStudent();
  studentA = dataA.client;
  studentB = dataB.client;
  studentAId = dataA.userId;
  studentBId = dataB.userId;

  // Test 6/7 need Student A to already have an application to attempt (and
  // fail) an UPDATE against.
  const { data: internship, error: internshipError } = await admin
    .from("internships")
    .insert({
      title: `RLS Negative Fixture Internship ${unique("internship")}`,
      description: "Integration test fixture internship.",
      requirements: "None.",
      eligibility: "None.",
      status: "open",
    })
    .select("id")
    .single();
  if (internshipError || !internship) {
    throw new Error(`Setup failure: could not create fixture internship: ${internshipError?.message}`);
  }
  const { error: applyError } = await studentA
    .from("applications")
    .insert({ student_id: studentAId, internship_id: internship.id, cover_letter: "RLS negative test fixture." });
  if (applyError) {
    throw new Error(`Setup failure: could not create fixture application: ${applyError.message}`);
  }

  // Test 14 needs Student B to actually have a resume uploaded, otherwise
  // "Student A cannot read it" would trivially pass on a missing-file error
  // rather than an RLS denial.
  const { error: uploadError } = await studentB.storage
    .from("resumes")
    .upload(`${studentBId}/resume.pdf`, makePdfBlob(), { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    throw new Error(`Setup failure: could not upload Student B's fixture resume: ${uploadError.message}`);
  }

  await admin.auth.signOut();
});

afterAll(async () => {
  await studentA.auth.signOut();
  await studentB.auth.signOut();
});

describe("RLS Negative Tests — Student Unauthorized Operations", () => {
  // ---- PROFILE ISOLATION ----

  it("1. Student A cannot UPDATE Student B's profile", async () => {
    // RLS filters Student B's row out of the update target entirely, so
    // PostgREST returns 200 with zero affected rows rather than an error —
    // the real security invariant is "no row was changed", not "error is set".
    const { data, error } = await studentA
      .from("profiles")
      .update({ first_name: "Hacked" })
      .eq("id", studentBId)
      .select();

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("2. Student A cannot SELECT Student B's private student_profile", async () => {
    const { data, error } = await studentA
      .from("student_profiles")
      .select("*")
      .eq("id", studentBId);

    // RLS ensures only own rows returned — no data for B
    expect(data).toHaveLength(0);
  });

  // ---- ROLE ESCALATION ----

  it("3. Student A cannot INSERT a user_role", async () => {
    const { error } = await studentA
      .from("user_roles")
      .insert({ user_id: studentAId, role: "admin" });

    expect(error).not.toBeNull();
  });

  it("4. Student A cannot UPDATE their own role via user_roles table", async () => {
    const { error } = await studentA
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", studentAId);

    expect(error).not.toBeNull();
  });

  it("5. Student A cannot DELETE a role", async () => {
    const { error } = await studentA
      .from("user_roles")
      .delete()
      .eq("user_id", studentAId);

    expect(error).not.toBeNull();
  });

  // ---- APPLICATION SECURITY ----

  it("6. Student A cannot directly UPDATE an application row", async () => {
    // First get any application id via studentA's own application
    const { data: apps } = await studentA
      .from("applications")
      .select("id")
      .limit(1);

    if (!apps || apps.length === 0) {
      throw new Error("Setup failure: expected Student A to have at least one seeded application but found none.");
    }

    const { error } = await studentA
      .from("applications")
      .update({ status: "accepted" })
      .eq("id", apps[0].id);

    expect(error).not.toBeNull();
  });

  it("7. Student A cannot change application status (no UPDATE policy)", async () => {
    const { data: apps } = await studentA
      .from("applications")
      .select("id")
      .limit(1);

    if (!apps || apps.length === 0) {
      throw new Error("Setup failure: expected Student A to have at least one seeded application but found none.");
    }

    const { error } = await studentA
      .from("applications")
      .update({ status: "rejected" })
      .eq("id", apps[0].id);

    expect(error).not.toBeNull();
  });

  // ---- ENROLLMENT SECURITY ----

  it("8. Student A cannot INSERT an enrollment directly", async () => {
    const { error } = await studentA.from("enrollments").insert({
      student_id: studentAId,
      internship_id: "00000000-0000-0000-0000-000000000001",
      application_id: "00000000-0000-0000-0000-000000000002",
      status: "active",
    });

    expect(error).not.toBeNull();
  });

  // ---- AUDIT LOG SECURITY ----

  it("9. Student A cannot INSERT an audit_log directly", async () => {
    const { error } = await studentA.from("audit_logs").insert({
      actor_id: studentAId,
      action: "fake_action",
      resource_type: "application",
      resource_id: "00000000-0000-0000-0000-000000000001",
      changes: {},
    });

    expect(error).not.toBeNull();
  });

  it("10. Student A cannot UPDATE an audit_log", async () => {
    const { error } = await studentA
      .from("audit_logs")
      .update({ action: "tampered" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    expect(error).not.toBeNull();
  });

  it("11. Student A cannot DELETE an audit_log", async () => {
    const { error } = await studentA
      .from("audit_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    expect(error).not.toBeNull();
  });

  it("12. Student A cannot execute write_audit_log() directly via RPC", async () => {
    const { error } = await studentA.rpc("write_audit_log", {
      action_name: "fake_action",
      res_type: "application",
      res_uuid: "00000000-0000-0000-0000-000000000001",
      payload: {},
    });

    // Must receive a permission denied error
    expect(error).not.toBeNull();
    expect(error!.message.toLowerCase()).toMatch(/permission denied|not found|does not exist/);
  });

  it("13. Student A cannot execute review_application() to approve/reject", async () => {
    const { error } = await studentA.rpc("review_application", {
      app_uuid: "00000000-0000-0000-0000-000000000001",
      review_status: "accepted",
      feedback: "hacked",
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });

  // ---- STORAGE SECURITY ----

  it("14. Student A cannot read Student B's private resume", async () => {
    const { data, error } = await studentA.storage
      .from("resumes")
      .download(`${studentBId}/resume.pdf`);

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  // ---- NOTIFICATION SECURITY ----

  it("15. Student A cannot UPDATE Student B's notification", async () => {
    // Same RLS-silent-filter behavior as test 1: zero rows affected, no error.
    const { data, error } = await studentA
      .from("notifications")
      .update({ read: true })
      .eq("user_id", studentBId)
      .select();

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  // ---- PRIVILEGED USER CREATION ----

  it("16. Student A cannot create privileged roles via user_roles INSERT", async () => {
    const privilegedRoles = [
      "admin",
      "super_admin",
      "mentor",
      "recruiter",
      "finance_user",
      "company_admin",
    ];

    for (const role of privilegedRoles) {
      const { error } = await studentA
        .from("user_roles")
        .insert({ user_id: studentAId, role });

      expect(error).not.toBeNull();
    }
  });
});
