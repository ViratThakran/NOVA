/**
 * CATALOG MANAGEMENT TESTS (Integration) — Phase 10D.1
 *
 * content-catalog.test.ts (Phase 7) already proves the basic RLS shape for
 * programs/courses/skills: published-only public visibility, draft
 * invisibility, and that a student cannot write. That file's one write test
 * exercises a status-only UPDATE. This file exercises the write surface the
 * new /admin/programs and /admin/courses pages actually depend on, which
 * nothing had exercised with a real write before now:
 *
 *   - creating a program/course with the full field set the admin forms
 *     submit (not just a status flip)
 *   - the two real uniqueness constraints (programs.slug globally,
 *     courses (program_id, slug) per-program — same course slug under two
 *     different programs must be allowed)
 *   - program_skills/course_skills as a genuine admin-only write surface
 *     (rather than only ever being read)
 *   - the CHECK-constraint enums (category/difficulty/level/status) at the
 *     database level, the same defense-in-depth the Zod schemas sit in
 *     front of
 *   - company/student rejection on all of the above
 *
 * Company/student rejection on the underlying programs/courses INSERT/
 * UPDATE policies themselves (not the new skill junction tables) is already
 * covered by content-catalog.test.ts and is not repeated here except where
 * a new write path (skills) needs its own coverage.
 *
 * create_company() authorization/ownership/isolation is already thoroughly
 * covered by company-platform-foundation.test.ts; createCompanyAction is a
 * thin wrapper around that same, already-tested RPC and is not re-tested
 * here — see the Phase 10D.1 report for what was verified in the browser
 * instead (the login-redirect and account-creation UI flow itself, which
 * isn't something a Supabase-client-only integration test can exercise).
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

async function createFreshCompanyOwner() {
  const { client, userId } = await createFreshUser("cat-mgmt-owner");
  const { error } = await client.rpc("create_company", { company_name: unique("Catalog Mgmt Co"), company_description: "fixture" });
  if (error) throw new Error(`Setup failure: ${error.message}`);
  return { client, userId };
}

const baseProgramFields = {
  short_description: "x",
  long_description: "x",
  category: "ai_ml",
  difficulty: "beginner",
  duration_weeks: 4,
  status: "draft",
};

async function createProgram(overrides: Record<string, unknown> = {}) {
  const { data, error } = await admin
    .from("programs")
    .insert({ slug: unique("mgmt-program"), name: "Catalog Mgmt Program Fixture", ...baseProgramFields, ...overrides })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

async function createSkill() {
  const { data, error } = await admin
    .from("skills")
    .insert({ slug: unique("mgmt-skill"), name: "Catalog Mgmt Skill Fixture", category: "language" })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

describe("Programs — full-field admin create (not just status)", () => {
  it("admin can create a program with the complete field set the admin form submits, including the new overview/prerequisites columns", async () => {
    const slug = unique("full-program");
    const { data, error } = await admin
      .from("programs")
      .insert({
        slug,
        name: "Full Field Program",
        short_description: "short",
        long_description: "long",
        overview: "How this program is structured.",
        prerequisites: "None.",
        category: "cybersecurity",
        difficulty: "intermediate",
        duration_weeks: 10,
        career_outcomes: ["Security Analyst", "SOC Analyst"],
        status: "draft",
        display_order: 5,
      })
      .select("id, overview, prerequisites, career_outcomes")
      .single();

    expect(error).toBeNull();
    expect(data?.overview).toBe("How this program is structured.");
    expect(data?.prerequisites).toBe("None.");
    expect(data?.career_outcomes).toEqual(["Security Analyst", "SOC Analyst"]);
  });

  it("a duplicate program slug is rejected (programs.slug is globally unique)", async () => {
    const slug = unique("dup-program");
    await createProgram({ slug });
    const { error } = await admin.from("programs").insert({ slug, name: "Duplicate", ...baseProgramFields });
    expect(error).not.toBeNull();
    expect(error!.code).toBe("23505");
  });

  it("an invalid category is rejected by the CHECK constraint, not just the client-side schema", async () => {
    const { error } = await admin
      .from("programs")
      .insert({ slug: unique("bad-category"), name: "Bad Category", ...baseProgramFields, category: "not_a_real_category" });
    expect(error).not.toBeNull();
  });

  it("a company owner cannot create a program", async () => {
    const { client } = await createFreshCompanyOwner();
    const { error } = await client.from("programs").insert({ slug: unique("company-program"), name: "Company Attempt", ...baseProgramFields });
    expect(error).not.toBeNull();
  });
});

describe("Courses — full-field admin create + per-program slug uniqueness", () => {
  it("admin can create a course with the complete field set, including learning_outcomes", async () => {
    const programId = await createProgram();
    const { data, error } = await admin
      .from("courses")
      .insert({
        program_id: programId,
        slug: unique("full-course"),
        title: "Full Field Course",
        description: "desc",
        overview: "What this course covers.",
        prerequisites: "None.",
        learning_outcomes: ["Do X", "Do Y"],
        level: "beginner",
        duration_hours: 12,
        status: "draft",
        display_order: 2,
      })
      .select("id, overview, learning_outcomes")
      .single();

    expect(error).toBeNull();
    expect(data?.overview).toBe("What this course covers.");
    expect(data?.learning_outcomes).toEqual(["Do X", "Do Y"]);
  });

  it("the same course slug is rejected within one program but allowed across two different programs", async () => {
    const programA = await createProgram();
    const programB = await createProgram();
    const slug = unique("shared-slug");

    const { error: firstError } = await admin
      .from("courses")
      .insert({ program_id: programA, slug, title: "Course A", description: "x", level: "beginner", duration_hours: 5, status: "draft" });
    expect(firstError).toBeNull();

    const { error: duplicateError } = await admin
      .from("courses")
      .insert({ program_id: programA, slug, title: "Course A Duplicate", description: "x", level: "beginner", duration_hours: 5, status: "draft" });
    expect(duplicateError).not.toBeNull();
    expect(duplicateError!.code).toBe("23505");

    const { error: otherProgramError } = await admin
      .from("courses")
      .insert({ program_id: programB, slug, title: "Course B", description: "x", level: "beginner", duration_hours: 5, status: "draft" });
    expect(otherProgramError).toBeNull();
  });

  it("an invalid level is rejected by the CHECK constraint", async () => {
    const programId = await createProgram();
    const { error } = await admin
      .from("courses")
      .insert({ program_id: programId, slug: unique("bad-level"), title: "Bad Level", description: "x", level: "expert", duration_hours: 5, status: "draft" });
    expect(error).not.toBeNull();
  });

  it("a student cannot create a course", async () => {
    const { client } = await createFreshUser("cat-mgmt-student");
    const programId = await createProgram();
    const { error } = await client
      .from("courses")
      .insert({ program_id: programId, slug: unique("student-course"), title: "Student Attempt", description: "x", level: "beginner", duration_hours: 5, status: "draft" });
    expect(error).not.toBeNull();
  });
});

describe("program_skills / course_skills — admin-only write surface", () => {
  it("admin can attach and detach skills from a program", async () => {
    const programId = await createProgram();
    const skillId = await createSkill();

    const { error: insertError } = await admin.from("program_skills").insert({ program_id: programId, skill_id: skillId });
    expect(insertError).toBeNull();

    const { data: afterInsert } = await admin.from("program_skills").select("skill_id").eq("program_id", programId);
    expect(afterInsert).toEqual([{ skill_id: skillId }]);

    const { error: deleteError } = await admin.from("program_skills").delete().eq("program_id", programId).eq("skill_id", skillId);
    expect(deleteError).toBeNull();

    const { data: afterDelete } = await admin.from("program_skills").select("skill_id").eq("program_id", programId);
    expect(afterDelete).toEqual([]);
  });

  it("admin can attach skills to a course", async () => {
    const programId = await createProgram();
    const skillId = await createSkill();
    const { data: course, error: courseError } = await admin
      .from("courses")
      .insert({ program_id: programId, slug: unique("skill-course"), title: "Skill Course", description: "x", level: "beginner", duration_hours: 5, status: "draft" })
      .select("id")
      .single();
    if (courseError || !course) throw new Error(`Setup failure: ${courseError?.message}`);

    const { error: insertError } = await admin.from("course_skills").insert({ course_id: course.id, skill_id: skillId });
    expect(insertError).toBeNull();

    const { data } = await admin.from("course_skills").select("skill_id").eq("course_id", course.id);
    expect(data).toEqual([{ skill_id: skillId }]);
  });

  it("a company owner cannot attach a skill to a program", async () => {
    const programId = await createProgram();
    const skillId = await createSkill();
    const { client } = await createFreshCompanyOwner();
    const { error } = await client.from("program_skills").insert({ program_id: programId, skill_id: skillId });
    expect(error).not.toBeNull();
  });

  it("a student cannot detach a skill from a program", async () => {
    const programId = await createProgram();
    const skillId = await createSkill();
    await admin.from("program_skills").insert({ program_id: programId, skill_id: skillId });

    const { client } = await createFreshUser("cat-mgmt-student2");
    const { error } = await client.from("program_skills").delete().eq("program_id", programId).eq("skill_id", skillId);
    expect(error).toBeNull(); // RLS filters silently rather than erroring on DELETE with no matching rows visible to the caller...

    // ...so the real assertion is that the row is still there afterward.
    const { data: stillThere } = await admin.from("program_skills").select("skill_id").eq("program_id", programId).eq("skill_id", skillId);
    expect(stillThere).toEqual([{ skill_id: skillId }]);
  });
});
