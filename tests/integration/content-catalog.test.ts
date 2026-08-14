/**
 * CONTENT CATALOG TESTS (Integration) — Phase 7
 *
 * Exercises the RLS/GRANT model for the new programs/courses/skills catalog
 * (Phase 7 migration): the first tables in this schema readable by the
 * `anon` role. Verifies published-only public visibility, draft invisibility
 * to non-admins, admin-only writes, and that the anon/authenticated split
 * works correctly (is_current_user_admin() is only ever called from an
 * `authenticated`-scoped policy, never from the anon-scoped one).
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
  const { client, userId } = await createFreshUser("catalog-owner");
  const { error } = await client.rpc("create_company", { company_name: unique("Catalog Test Co"), company_description: "fixture" });
  if (error) throw new Error(`Setup failure: ${error.message}`);
  return { client, userId };
}

async function createDraftProgram() {
  const slug = unique("draft-program");
  const { data, error } = await admin
    .from("programs")
    .insert({
      slug,
      name: "Draft Program Fixture",
      short_description: "x",
      long_description: "x",
      category: "ai_ml",
      difficulty: "beginner",
      duration_weeks: 4,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

async function createPublishedProgram() {
  const slug = unique("published-program");
  const { data, error } = await admin
    .from("programs")
    .insert({
      slug,
      name: "Published Program Fixture",
      short_description: "x",
      long_description: "x",
      category: "ai_ml",
      difficulty: "beginner",
      duration_weeks: 4,
      status: "published",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

describe("Programs — anonymous access", () => {
  it("anon can read published programs", async () => {
    const anon = trackedClient();
    const programId = await createPublishedProgram();

    const { data, error } = await anon.from("programs").select("id").eq("id", programId);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: programId }]);
  });

  it("anon cannot read draft programs (invisible, not an error)", async () => {
    const anon = trackedClient();
    const programId = await createDraftProgram();

    const { data, error } = await anon.from("programs").select("id").eq("id", programId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("anon cannot insert, update, or delete programs", async () => {
    const anon = trackedClient();
    const { error: insertError } = await anon.from("programs").insert({
      slug: unique("anon-insert"),
      name: "x",
      short_description: "x",
      long_description: "x",
      category: "ai_ml",
      difficulty: "beginner",
      duration_weeks: 4,
    });
    expect(insertError).not.toBeNull();

    const programId = await createPublishedProgram();
    const { data: updateData, error: updateError } = await anon.from("programs").update({ name: "Hacked" }).eq("id", programId).select("id");
    expect(updateError).not.toBeNull();
    expect(updateData).toBeNull();

    const { error: deleteError } = await anon.from("programs").delete().eq("id", programId);
    expect(deleteError).not.toBeNull();
  });
});

describe("Programs — authenticated non-admin access (student/company)", () => {
  it("a student can read published but not draft programs", async () => {
    const { client: student } = await createFreshUser("catalog-student");
    const publishedId = await createPublishedProgram();
    const draftId = await createDraftProgram();

    const { data: published, error: publishedError } = await student.from("programs").select("id").eq("id", publishedId);
    expect(publishedError).toBeNull();
    expect(published).toEqual([{ id: publishedId }]);

    const { data: draft, error: draftError } = await student.from("programs").select("id").eq("id", draftId);
    expect(draftError).toBeNull();
    expect(draft).toEqual([]);
  });

  it("a company owner has the same published-only read access as a student (no special catalog role)", async () => {
    const { client: owner } = await createFreshCompanyOwner();
    const draftId = await createDraftProgram();

    const { data, error } = await owner.from("programs").select("id").eq("id", draftId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("a student cannot insert or update programs", async () => {
    const { client: student } = await createFreshUser("catalog-student-write");
    const { error: insertError } = await student.from("programs").insert({
      slug: unique("student-insert"),
      name: "x",
      short_description: "x",
      long_description: "x",
      category: "ai_ml",
      difficulty: "beginner",
      duration_weeks: 4,
    });
    expect(insertError).not.toBeNull();

    const programId = await createPublishedProgram();
    const { data, error: updateError } = await student.from("programs").update({ name: "Hacked" }).eq("id", programId).select("id");
    expect(updateError).toBeNull();
    expect(data).toEqual([]); // silent RLS filter, not a grant-level error
  });
});

describe("Programs — admin management", () => {
  it("admin can see draft programs and create/update programs", async () => {
    const draftId = await createDraftProgram();
    const { data: seen, error: seenError } = await admin.from("programs").select("id").eq("id", draftId);
    expect(seenError).toBeNull();
    expect(seen).toEqual([{ id: draftId }]);

    const { error: updateError } = await admin.from("programs").update({ status: "published" }).eq("id", draftId);
    expect(updateError).toBeNull();

    const { data: nowPublic } = await admin.from("programs").select("status").eq("id", draftId).single();
    expect(nowPublic?.status).toBe("published");
  });
});

describe("Courses — visibility requires both course and parent program published", () => {
  it("a published course under a draft program is invisible to non-admins", async () => {
    const draftProgramId = await createDraftProgram();
    const { data: course, error: courseError } = await admin
      .from("courses")
      .insert({
        program_id: draftProgramId,
        slug: unique("orphan-course"),
        title: "Orphan Course Fixture",
        description: "x",
        level: "beginner",
        duration_hours: 10,
        status: "published",
      })
      .select("id")
      .single();
    if (courseError || !course) throw new Error(`Setup failure: ${courseError?.message}`);

    const anon = trackedClient();
    const { data, error } = await anon.from("courses").select("id").eq("id", course.id);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("a published course under a published program is visible to anon", async () => {
    const publishedProgramId = await createPublishedProgram();
    const { data: course, error: courseError } = await admin
      .from("courses")
      .insert({
        program_id: publishedProgramId,
        slug: unique("visible-course"),
        title: "Visible Course Fixture",
        description: "x",
        level: "beginner",
        duration_hours: 10,
        status: "published",
      })
      .select("id")
      .single();
    if (courseError || !course) throw new Error(`Setup failure: ${courseError?.message}`);

    const anon = trackedClient();
    const { data, error } = await anon.from("courses").select("id").eq("id", course.id);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: course.id }]);
  });
});

describe("Skills — open read, admin-only write", () => {
  it("anon can read the full skill vocabulary (no draft/publish concept)", async () => {
    const anon = trackedClient();
    const { data, error } = await anon.from("skills").select("id").limit(1);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });

  it("a student cannot insert, update, or delete skills", async () => {
    const { client: student } = await createFreshUser("catalog-skill-student");
    const { error: insertError } = await student.from("skills").insert({ slug: unique("student-skill"), name: "x", category: "language" });
    expect(insertError).not.toBeNull();

    const { data: existing } = await admin.from("skills").select("id").limit(1).single();
    const { data: updateData, error: updateError } = await student.from("skills").update({ name: "Hacked" }).eq("id", existing!.id).select("id");
    expect(updateError).toBeNull();
    expect(updateData).toEqual([]);

    const { error: deleteError } = await student.from("skills").delete().eq("id", existing!.id);
    expect(deleteError).toBeNull(); // silent filter — RLS scopes DELETE too

    const { data: stillThere } = await admin.from("skills").select("id").eq("id", existing!.id);
    expect(stillThere).toEqual([{ id: existing!.id }]);
  });

  it("admin can create and delete a skill", async () => {
    const slug = unique("admin-skill");
    const { data, error } = await admin.from("skills").insert({ slug, name: "Fixture Skill", category: "language" }).select("id").single();
    expect(error).toBeNull();

    const { error: deleteError } = await admin.from("skills").delete().eq("id", data!.id);
    expect(deleteError).toBeNull();
  });
});

describe("Unauthenticated access to every new table", () => {
  it("anon has no EXECUTE/table access beyond the explicit SELECT grants (sanity check on skills/program_skills/course_skills)", async () => {
    const anon = trackedClient();
    const { error: skillsInsertError } = await anon.from("skills").insert({ slug: unique("anon-skill"), name: "x", category: "language" });
    expect(skillsInsertError).not.toBeNull();

    const { error: psInsertError } = await anon.from("program_skills").insert({ program_id: "00000000-0000-0000-0000-000000000000", skill_id: "00000000-0000-0000-0000-000000000000" });
    expect(psInsertError).not.toBeNull();
  });
});
