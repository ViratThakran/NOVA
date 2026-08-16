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
const clientsToSignOut: SupabaseClient[] = [];

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
  await Promise.all(clientsToSignOut.map((client) => client.auth.signOut()));
});

// student-a@test.nova is a shared seeded account that several other
// integration test files also sign in as concurrently (Vitest runs test
// files in parallel). Mutating tests below used to authenticate as that
// literal account and act against whatever shared/seeded internship they
// queried for — which intermittently collided with other files doing the
// same thing (e.g. two files both inserting an application for student-a
// against the same internship id, tripping unique_student_internship).
// A freshly signed-up, uniquely-emailed student has no such collision risk.
// Same pattern as transaction.test.ts.
function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

async function signUpFreshStudent() {
  const email = `${unique("rls-student")}@test.nova`;
  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  clientsToSignOut.push(client);
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) {
    throw new Error(`Setup failure: could not sign up a fresh student: ${error?.message}`);
  }
  return { client, userId: data.user.id };
}

// Same as signUpFreshStudent(), but also creates the student_profiles row
// needed to satisfy applications.student_id's foreign key — for tests that
// need to insert applications rather than test student_profiles creation
// itself.
async function createFreshStudent() {
  const { client, userId } = await signUpFreshStudent();
  const { error: profileError } = await client.from("student_profiles").insert({ id: userId });
  if (profileError) {
    throw new Error(`Setup failure: could not create student_profiles row: ${profileError.message}`);
  }
  return { client, userId };
}

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
    // A freshly signed-up student with no student_profiles row yet, so the
    // upsert below genuinely exercises the "if not exists" insert path
    // rather than updating a row some other test already created.
    const { client: student, userId: studentId } = await signUpFreshStudent();

    const { error } = await student.from("student_profiles").upsert({
      id: studentId,
      education_info: { school: "Test University", degree: "CS", grad_year: 2027 },
      skills: ["TypeScript", "SQL"],
    });

    expect(error).toBeNull();
  });

  it("Student can update own student_profile", async () => {
    const { client: student, userId: studentId } = await createFreshStudent();

    const { error } = await student
      .from("student_profiles")
      .update({ skills: ["TypeScript", "SQL", "React"] })
      .eq("id", studentId);

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
    // A dedicated internship + a freshly created student, isolated from
    // every other integration test file. This used to authenticate as the
    // shared seeded student-a@test.nova account and apply to a shared
    // seeded internship queried by title — which intermittently collided
    // with unique_student_internship when another file concurrently created
    // an application for student-a against the same internship.
    const { data: internship, error: internshipError } = await admin
      .from("internships")
      .insert({
        title: `RLS Positive Application Fixture ${unique("internship")}`,
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

    const { client: student, userId: studentId } = await createFreshStudent();

    const { error } = await student.from("applications").insert({
      student_id: studentId,
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
    // review_application()'s own internal INSERT creates rows), so this
    // test creates its own fixture application to accept. It uses a
    // freshly created student rather than the shared seeded student-a
    // account — that account's session and applications are shared with
    // other integration test files running concurrently, and mutating
    // through it here risks the same class of cross-file collision fixed
    // in "Student can create an application for themselves" above.
    const { data: internship, error: internshipError } = await admin
      .from("internships")
      .insert({
        title: `RLS Positive Notification Fixture ${unique("internship")}`,
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

    const { client: student, userId: studentId } = await createFreshStudent();

    const { data: app, error: appError } = await student
      .from("applications")
      .insert({ student_id: studentId, internship_id: internship.id, cover_letter: "RLS positive test fixture application." })
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

    const { data: notifs } = await student
      .from("notifications")
      .select("id")
      .eq("user_id", studentId)
      .limit(1);

    if (!notifs || notifs.length === 0) {
      throw new Error(
        "Setup failure: expected the fresh student to have at least one notification but found none."
      );
    }

    const { error } = await student
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
