/**
 * RLS POSITIVE AUTHORIZATION TESTS
 *
 * Proves that students and admins CAN perform the operations they are permitted.
 *
 * REQUIRES: Local Supabase running (`npx supabase start`)
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const STUDENT_A_EMAIL = "student-a@test.nova";
const STUDENT_A_PASSWORD = "TestPassword123!";
const ADMIN_EMAIL = "admin@test.nova";
const ADMIN_PASSWORD = "TestPassword123!";

let studentA: SupabaseClient;
let admin: SupabaseClient;
let studentAId: string;

beforeAll(async () => {
  studentA = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  admin = createClient(SUPABASE_URL, PUBLISHABLE_KEY);

  const { data: dataA, error: errorA } = await studentA.auth.signInWithPassword({
    email: STUDENT_A_EMAIL,
    password: STUDENT_A_PASSWORD,
  });
  if (errorA || !dataA.user) {
    throw new Error(
      `Setup failed: could not authenticate ${STUDENT_A_EMAIL}: ${errorA?.message ?? "no user returned"}`
    );
  }

  const { data: dataAdmin, error: errorAdmin } = await admin.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (errorAdmin || !dataAdmin.user) {
    throw new Error(
      `Setup failed: could not authenticate ${ADMIN_EMAIL}: ${errorAdmin?.message ?? "no user returned"}`
    );
  }

  studentAId = dataA.user.id;
});

afterAll(async () => {
  await studentA.auth.signOut();
  await admin.auth.signOut();
});

describe("Positive Authorization Tests — Student Permitted Operations", () => {
  it("Student can read own profile", async () => {
    const { data, error } = await studentA
      .from("profiles")
      .select("*")
      .eq("id", studentAId)
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data.id).toBe(studentAId);
  });

  it("Student can create own student_profile if not exists", async () => {
    // Attempt upsert of own profile
    const { error } = await studentA.from("student_profiles").upsert({
      id: studentAId,
      education_info: { school: "Test University", degree: "CS", grad_year: 2027 },
      skills: ["TypeScript", "SQL"],
    });

    expect(error).toBeNull();
  });

  it("Student can update own student_profile", async () => {
    const { error } = await studentA
      .from("student_profiles")
      .update({ skills: ["TypeScript", "SQL", "React"] })
      .eq("id", studentAId);

    expect(error).toBeNull();
  });

  it("Student can read own applications", async () => {
    const { error } = await studentA
      .from("applications")
      .select("*")
      .eq("student_id", studentAId);

    expect(error).toBeNull();
  });

  it("Student can create an application for themselves", async () => {
    // Student A already has a seeded pending application against the primary
    // seeded internship (see supabase/seed.sql), so re-using it here would
    // collide with the unique_student_internship constraint. This test targets
    // the separately seeded "unclaimed" internship instead — isolated fixture
    // data with no pre-existing application for Student A.
    const { data: internship } = await studentA
      .from("internships")
      .select("id")
      .eq("title", "Test Data Internship — Unclaimed")
      .single();

    if (!internship) {
      throw new Error("Setup failure: expected the seeded 'unclaimed' open internship but found none.");
    }

    const { error } = await studentA.from("applications").insert({
      student_id: studentAId,
      internship_id: internship.id,
      cover_letter: "I am very interested in this opportunity. I believe my skills match your requirements perfectly.",
    });

    expect(error).toBeNull();
  });

  it("Student can read own enrollments", async () => {
    const { error } = await studentA
      .from("enrollments")
      .select("*")
      .eq("student_id", studentAId);

    expect(error).toBeNull();
  });

  it("Student can read own notifications", async () => {
    const { error } = await studentA
      .from("notifications")
      .select("*")
      .eq("user_id", studentAId);

    expect(error).toBeNull();
  });

  it("Student can mark own notification as read", async () => {
    // notifications has no client INSERT path at all (only
    // review_application()'s own internal INSERT creates rows) — this test
    // used to assume a notification already existed for Student A as a side
    // effect of transaction.test.ts running first, which is an unsafe
    // cross-file ordering dependency now that more integration test files
    // run in parallel. Creating a fresh fixture here matches the "own
    // fixture per test" convention every other integration test file
    // already follows.
    const { data: internship, error: internshipError } = await admin
      .from("internships")
      .insert({
        title: `RLS Positive Notification Fixture ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        description: "Integration test fixture internship.",
        requirements: "None.",
        eligibility: "Any enrolled student.",
        status: "open",
      })
      .select("id")
      .single();
    if (internshipError || !internship) {
      throw new Error(`Setup failure: could not create fixture internship: ${internshipError?.message}`);
    }

    const { data: app, error: appError } = await studentA
      .from("applications")
      .insert({ student_id: studentAId, internship_id: internship.id, cover_letter: "RLS positive test fixture application." })
      .select("id")
      .single();
    if (appError || !app) {
      throw new Error(`Setup failure: could not create fixture application: ${appError?.message}`);
    }

    const { error: reviewError } = await admin.rpc("review_application", {
      app_uuid: app.id,
      review_status: "accepted",
      feedback: null,
    });
    if (reviewError) {
      throw new Error(`Setup failure: could not accept fixture application: ${reviewError.message}`);
    }

    const { data: notifs } = await studentA
      .from("notifications")
      .select("id")
      .eq("user_id", studentAId)
      .limit(1);

    if (!notifs || notifs.length === 0) {
      throw new Error(
        "Setup failure: expected Student A to have at least one notification but found none."
      );
    }

    const { error } = await studentA
      .from("notifications")
      .update({ read: true })
      .eq("id", notifs[0].id);

    expect(error).toBeNull();
  });
});

describe("Positive Authorization Tests — Admin Permitted Operations", () => {
  it("Admin can read all applications", async () => {
    const { data, error } = await admin.from("applications").select("*");

    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it("Admin can read authorized student information", async () => {
    const { data, error } = await admin
      .from("student_profiles")
      .select("*");

    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it("Admin can create an internship", async () => {
    const { error } = await admin.from("internships").insert({
      title: "Test Internship",
      description: "A test internship listing",
      requirements: "Basic programming knowledge",
      eligibility: "Students enrolled in a technology program",
      status: "open",
    });

    expect(error).toBeNull();
  });

  it("Admin can update an internship status", async () => {
    const { data: internship } = await admin
      .from("internships")
      .select("id")
      .eq("title", "Test Internship")
      .limit(1)
      .single();

    if (!internship) {
      throw new Error("Setup failure: expected the internship created in the prior test but found none.");
    }

    const { error } = await admin
      .from("internships")
      .update({ status: "closed" })
      .eq("id", internship.id);

    expect(error).toBeNull();
  });

  it("Admin can execute review_application RPC for pending applications", async () => {
    const { data: app } = await admin
      .from("applications")
      .select("id")
      .eq("status", "pending")
      .limit(1)
      .single();

    if (!app) {
      throw new Error("Setup failure: expected a seeded pending application but found none.");
    }

    const { data, error } = await admin.rpc("review_application", {
      app_uuid: app.id,
      review_status: "accepted",
      feedback: "Strong candidate with relevant skills.",
    });

    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  // Skipped, not run: no seed data or application code path in the current
  // first-slice workflow ever transitions a row to 'under_review' (the only
  // transitions review_application() supports are pending -> accepted/rejected).
  // Marking this pending rather than inventing a fake transition just to
  // exercise it, and rather than silently passing it via an early return.
  it.skip("Admin can review under_review applications (pending: no code path currently produces 'under_review')", async () => {
    const { data: app } = await admin
      .from("applications")
      .select("id")
      .eq("status", "under_review")
      .limit(1)
      .single();

    if (!app) {
      throw new Error("Setup failure: expected an under_review application but found none.");
    }

    const { data, error } = await admin.rpc("review_application", {
      app_uuid: app.id,
      review_status: "rejected",
      feedback: "Not meeting requirements at this time.",
    });

    expect(error).toBeNull();
    expect(data).toBe(true);
  });
});
