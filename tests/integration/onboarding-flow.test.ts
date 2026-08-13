/**
 * STUDENT ONBOARDING FLOW TESTS (Integration)
 *
 * Exercises the real Phase 3D workflow against local Supabase — not a
 * mocked database. Primary test: register a brand-new user → read their
 * (onboarded=false) profile → save student_profiles → upload a resume →
 * mark profiles.onboarded = true → confirm the state completeOnboardingAction
 * (see src/app/student/actions.ts) leaves behind is exactly what
 * /student/dashboard reads.
 *
 * Cross-user ownership tests reuse the seeded student-a@test.nova /
 * student-b@test.nova pair, which already have a student_profiles row from
 * supabase/seed.sql (onboarded stays false there — seed.sql never flips
 * it), to prove one student's onboarding action can never affect the other.
 *
 * REQUIRES: Local Supabase running (`npx supabase start`)
 * Run with: npm run test:integration
 */

import { describe, it, expect, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const STUDENT_A_EMAIL = "student-a@test.nova";
const STUDENT_A_PASSWORD = "TestPassword123!";
const STUDENT_B_EMAIL = "student-b@test.nova";
const STUDENT_B_PASSWORD = "TestPassword123!";
const ADMIN_EMAIL = "admin@test.nova";
const ADMIN_PASSWORD = "TestPassword123!";

const newTestEmail = () => `onboarding-flow-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;

const makePdfBlob = (size: number = 1024) => {
  const header = "%PDF-1.4\n";
  const padding = "a".repeat(Math.max(0, size - header.length));
  return new Blob([header + padding], { type: "application/pdf" });
};

const clientsToSignOut: SupabaseClient[] = [];
function trackedClient(): SupabaseClient {
  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  clientsToSignOut.push(client);
  return client;
}

afterAll(async () => {
  await Promise.all(clientsToSignOut.map((client) => client.auth.signOut()));
});

describe("Primary flow — a brand-new student completes onboarding end to end", () => {
  it("authenticate → read profile → save student profile → upload resume → mark onboarded → verify dashboard reads", async () => {
    const email = newTestEmail();
    const client = trackedClient();

    // --- authenticate (registration auto-confirms locally, same as Phase 3C) ---
    const { data: signUpData, error: signUpError } = await client.auth.signUp({
      email,
      password: "correcthorse1",
      options: { data: { first_name: "New", last_name: "Student" } },
    });
    expect(signUpError).toBeNull();
    const userId = signUpData.user!.id;

    // --- read profile: handle_new_user() must have created it, onboarded=false ---
    const { data: freshProfile, error: freshProfileError } = await client
      .from("profiles")
      .select("onboarded")
      .eq("id", userId)
      .single();
    expect(freshProfileError).toBeNull();
    expect(freshProfile?.onboarded).toBe(false);

    // --- upload resume, using the exact path convention storage RLS requires ---
    const resumePath = `${userId}/resume.pdf`;
    const { error: uploadError } = await client.storage
      .from("resumes")
      .upload(resumePath, makePdfBlob(), { contentType: "application/pdf", upsert: true });
    expect(uploadError).toBeNull();

    // --- save student profile (own id, derived from the session — never client-supplied) ---
    const { error: upsertError } = await client.from("student_profiles").upsert({
      id: userId,
      education_info: { school: "Test University", degree: "Computer Science", grad_year: 2028 },
      skills: ["TypeScript", "SQL"],
      resume_path: resumePath,
      resume_size: 1024,
    });
    expect(upsertError).toBeNull();

    // --- mark onboarded ---
    const { error: onboardedError } = await client.from("profiles").update({ onboarded: true }).eq("id", userId);
    expect(onboardedError).toBeNull();

    // --- verify dashboard access: exactly what src/app/student/dashboard/page.tsx reads ---
    const [{ data: dashboardProfile }, { data: dashboardStudentProfile }] = await Promise.all([
      client.from("profiles").select("first_name, email, onboarded").eq("id", userId).single(),
      client.from("student_profiles").select("education_info, skills, resume_path").eq("id", userId).single(),
    ]);

    expect(dashboardProfile?.onboarded).toBe(true);
    expect(dashboardProfile?.email).toBe(email);
    expect(dashboardStudentProfile?.skills).toEqual(["TypeScript", "SQL"]);
    expect(dashboardStudentProfile?.resume_path).toBe(resumePath);
  });

  it("a second onboarding save for the same user updates (not duplicates) the row", async () => {
    const email = newTestEmail();
    const client = trackedClient();
    const { data: signUpData } = await client.auth.signUp({ email, password: "correcthorse1" });
    const userId = signUpData.user!.id;

    const resumePath = `${userId}/resume.pdf`;
    await client.storage.from("resumes").upload(resumePath, makePdfBlob(), { contentType: "application/pdf", upsert: true });

    await client.from("student_profiles").upsert({
      id: userId,
      education_info: { school: "First University", degree: "CS", grad_year: 2028 },
      skills: ["Python"],
      resume_path: resumePath,
      resume_size: 1024,
    });

    // Re-save with different data, as if the student edited before finishing.
    const { error: secondError } = await client.from("student_profiles").upsert({
      id: userId,
      education_info: { school: "Second University", degree: "CS", grad_year: 2029 },
      skills: ["TypeScript", "Go"],
      resume_path: resumePath,
      resume_size: 2048,
    });
    expect(secondError).toBeNull();

    const { data: rows } = await client.from("student_profiles").select("id, skills").eq("id", userId);
    expect(rows).toHaveLength(1);
    expect(rows?.[0]?.skills).toEqual(["TypeScript", "Go"]);
  });
});

describe("Profile ownership", () => {
  it("student cannot modify another student's student_profiles row", async () => {
    const studentA = trackedClient();
    const { data: dataA } = await studentA.auth.signInWithPassword({
      email: STUDENT_A_EMAIL,
      password: STUDENT_A_PASSWORD,
    });
    const studentB = trackedClient();
    const { data: dataB } = await studentB.auth.signInWithPassword({
      email: STUDENT_B_EMAIL,
      password: STUDENT_B_PASSWORD,
    });

    // Student A attempts to overwrite Student B's row by id.
    const { data, error } = await studentA
      .from("student_profiles")
      .update({ skills: ["Hacked"] })
      .eq("id", dataB.user!.id)
      .select();

    // RLS filters the target row out of the UPDATE entirely (same
    // no-error-zero-rows behavior established in Phase 1's RLS suite) —
    // the real invariant is that nothing was returned/changed.
    expect(error).toBeNull();
    expect(data).toEqual([]);

    // Confirm Student B's row is untouched, read as Student B themselves.
    const { data: stillB } = await studentB.from("student_profiles").select("skills").eq("id", dataB.user!.id).single();
    expect(stillB?.skills).not.toEqual(["Hacked"]);
    expect(dataA.user).not.toBeNull(); // sanity: Student A's own session was valid
  });

  it("onboarding completion only affects the current user, never another student", async () => {
    const studentB = trackedClient();
    const { data: dataB } = await studentB.auth.signInWithPassword({
      email: STUDENT_B_EMAIL,
      password: STUDENT_B_PASSWORD,
    });

    // Student B marks themselves onboarded...
    await studentB.from("profiles").update({ onboarded: true }).eq("id", dataB.user!.id);

    // ...Student A must be completely unaffected. Read via admin, since a
    // student can only read their own profiles row, not another student's.
    const admin = trackedClient();
    await admin.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    const studentA = trackedClient();
    const { data: dataA } = await studentA.auth.signInWithPassword({
      email: STUDENT_A_EMAIL,
      password: STUDENT_A_PASSWORD,
    });

    const { data: profileA } = await admin.from("profiles").select("onboarded").eq("id", dataA.user!.id).single();

    // Student A's own seed-time state (never touched by this test) — proves
    // Student B's update above had zero effect on it.
    expect(profileA?.onboarded).toBe(false);
  });
});

describe("Unauthenticated access", () => {
  it("an anonymous client cannot insert a student_profiles row", async () => {
    const client = trackedClient(); // never signed in
    const { data, error } = await client.from("student_profiles").insert({
      id: "00000000-0000-0000-0000-000000000000",
      education_info: { school: "x", degree: "y", grad_year: 2028 },
      skills: ["x"],
    });

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("an anonymous client cannot flip profiles.onboarded for any user", async () => {
    const client = trackedClient(); // never signed in
    const { data, error } = await client
      .from("profiles")
      .update({ onboarded: true })
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .select();

    expect(error).not.toBeNull();
    expect(data === null || data.length === 0).toBe(true);
  });

  it("an anonymous client cannot upload into any resume folder", async () => {
    const client = trackedClient(); // never signed in
    const { error } = await client.storage
      .from("resumes")
      .upload("00000000-0000-0000-0000-000000000000/resume.pdf", makePdfBlob(), {
        contentType: "application/pdf",
        upsert: true,
      });

    expect(error).not.toBeNull();
  });
});
