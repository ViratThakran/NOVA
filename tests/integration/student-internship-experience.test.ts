/**
 * STUDENT INTERNSHIP EXPERIENCE TESTS (Integration) — Phase 4C
 *
 * Exercises the RLS/query behavior the Phase 4C pages depend on:
 *   - /student/internships   : discovery only ever surfaces open internships
 *   - /student/internships/[id] : an internship a student can/can't see
 *   - /student/applications  : a student's own applications, never another's
 *   - /student/applications/[id] : ownership isolation by id
 *
 * These talk to Supabase directly, the same way the Server Components do —
 * matching the pattern established in application-flow.test.ts (Phase 4B).
 * Every fixture is created fresh per test rather than reusing seed.sql's
 * shared rows, to stay immune to the cross-file race documented in the
 * Phase 4B report.
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

const newTestEmail = () => `student-experience-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;

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

async function createFreshInternship(status: "draft" | "open" | "closed" | "archived", titleSuffix = "") {
  const title = `Student Experience Internship ${Date.now()}-${Math.floor(Math.random() * 1e6)}${titleSuffix}`;
  const { data, error } = await admin
    .from("internships")
    .insert({
      title,
      description: "Integration test fixture internship.",
      requirements: "None.",
      eligibility: "Any enrolled student.",
      status,
    })
    .select("id, title")
    .single();

  if (error || !data) {
    throw new Error(`Setup failure: could not create internship: ${error?.message}`);
  }
  return data as { id: string; title: string };
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

describe("Internship discovery", () => {
  it("1. a student can retrieve open internships", async () => {
    const { client } = await createFreshStudent();
    const internship = await createFreshInternship("open");

    const { data, error } = await client.from("internships").select("id, title").eq("status", "open");

    expect(error).toBeNull();
    expect(data?.some((row) => row.id === internship.id)).toBe(true);
  });

  it("2. closed internships are not exposed through discovery", async () => {
    const { client } = await createFreshStudent();
    const closed = await createFreshInternship("closed");

    const { data } = await client.from("internships").select("id").eq("status", "open");
    expect(data?.some((row) => row.id === closed.id)).toBe(false);

    // Querying it directly by id (as the detail page does) finds nothing either.
    const { data: direct } = await client.from("internships").select("id").eq("id", closed.id).maybeSingle();
    expect(direct).toBeNull();
  });

  it("2b. draft and archived internships are also not exposed", async () => {
    const { client } = await createFreshStudent();
    const draft = await createFreshInternship("draft");
    const archived = await createFreshInternship("archived");

    const { data } = await client.from("internships").select("id").in("id", [draft.id, archived.id]);
    expect(data).toEqual([]);
  });

  it("5. an internship lookup by a well-formed but nonexistent id returns no row, not an error", async () => {
    const { client } = await createFreshStudent();
    const { data, error } = await client
      .from("internships")
      .select("id")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .eq("status", "open")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("5b. a malformed id is rejected at the database level (this is exactly why the detail page validates UUID format first)", async () => {
    const { client } = await createFreshStudent();
    const { error } = await client.from("internships").select("id").eq("id", "not-a-uuid").maybeSingle();

    expect(error).not.toBeNull();
  });
});

describe("Application ownership isolation", () => {
  it("3. a student can retrieve their own application", async () => {
    const { client, userId } = await createFreshStudent();
    const internship = await createFreshInternship("open");
    const { data: app } = await client
      .from("applications")
      .insert({ student_id: userId, internship_id: internship.id, cover_letter: "I would love to contribute here." })
      .select("id")
      .single();

    const { data, error } = await client.from("applications").select("id, status").eq("id", app!.id).maybeSingle();

    expect(error).toBeNull();
    expect(data?.id).toBe(app!.id);
  });

  it("4. a student cannot retrieve another student's application by id", async () => {
    const { client: studentOne, userId: studentOneId } = await createFreshStudent();
    const { client: studentTwo } = await createFreshStudent();
    const internship = await createFreshInternship("open");
    const { data: app } = await studentOne
      .from("applications")
      .insert({ student_id: studentOneId, internship_id: internship.id, cover_letter: "Application belonging to student one." })
      .select("id")
      .single();

    const { data, error } = await studentTwo
      .from("applications")
      .select("id, status")
      .eq("id", app!.id)
      .maybeSingle();

    // RLS filters the row out entirely — no error, just nothing returned,
    // so the detail page can render its generic "not found" state rather
    // than leaking that the id belongs to someone else.
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("6. a well-formed but nonexistent application id returns no row, not an error", async () => {
    const { client } = await createFreshStudent();
    const { data, error } = await client
      .from("applications")
      .select("id")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});

describe("Application submission (regression guard for what submitApplicationAction relies on)", () => {
  it("7. the insert path submitApplicationAction wraps still succeeds for a fresh, valid application", async () => {
    const { client, userId } = await createFreshStudent();
    const internship = await createFreshInternship("open");

    const { error } = await client.from("applications").insert({
      student_id: userId,
      internship_id: internship.id,
      cover_letter: "I would love to contribute to this internship program.",
    });

    expect(error).toBeNull();
  });

  it("8. a duplicate application is rejected with 23505, the code submitApplicationAction maps to a friendly message", async () => {
    const { client, userId } = await createFreshStudent();
    const internship = await createFreshInternship("open");

    await client.from("applications").insert({
      student_id: userId,
      internship_id: internship.id,
      cover_letter: "First application attempt.",
    });

    const { error } = await client.from("applications").insert({
      student_id: userId,
      internship_id: internship.id,
      cover_letter: "Second application attempt to the same internship.",
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505");
  });
});

describe("Applications list embedding (what /student/applications reads)", () => {
  it("the applications-list query embeds internship title for a normal open internship", async () => {
    const { client, userId } = await createFreshStudent();
    const internship = await createFreshInternship("open");
    await client.from("applications").insert({
      student_id: userId,
      internship_id: internship.id,
      cover_letter: "Application for the embedding test.",
    });

    const { data, error } = await client
      .from("applications")
      .select("id, status, created_at, internship:internships(id, title)")
      .eq("student_id", userId);

    expect(error).toBeNull();
    const row = data?.find((r) => (r as any).internship?.id === internship.id);
    expect((row as any)?.internship?.title).toBe(internship.title);
  });

  it("the applications-list query returns a null embedded internship once it's closed (student's application still visible)", async () => {
    const { client, userId } = await createFreshStudent();
    const internship = await createFreshInternship("open");
    const { data: app } = await client
      .from("applications")
      .insert({ student_id: userId, internship_id: internship.id, cover_letter: "Application before closing." })
      .select("id")
      .single();

    // Admin closes the internship after the student already applied.
    await admin.from("internships").update({ status: "closed" }).eq("id", internship.id);

    const { data, error } = await client
      .from("applications")
      .select("id, status, internship:internships(id, title)")
      .eq("id", app!.id)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    // The application itself is still visible — only the embedded internship
    // row is hidden by RLS now that it's no longer 'open'. The UI must treat
    // internship as possibly null rather than assuming it's always present.
    expect((data as any)?.internship).toBeNull();
  });
});
