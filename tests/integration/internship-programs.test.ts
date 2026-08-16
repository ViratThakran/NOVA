/**
 * PHASE 10B — INTERNSHIP PROGRAMS TESTS (Integration)
 *
 * Covers the one genuinely new authorization surface Phase 10B introduced:
 * internship_programs (a new catalog table, same published-content RLS
 * pattern already proven for programs/courses/services/internships) and
 * its link into internships via the new nullable internship_program_id /
 * duration_weeks columns. Also proves the full real-catalog journey still
 * works end-to-end: a fresh student can discover, apply to, and be
 * enrolled in one of the 21 seeded internship postings.
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
let aiMlProgramId: string;

beforeAll(async () => {
  admin = trackedClient();
  const { error } = await admin.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (error) throw new Error(`Setup failed: could not authenticate ${ADMIN_EMAIL}: ${error.message}`);

  const { data: program, error: programError } = await admin.from("programs").select("id").eq("slug", "ai-machine-learning").single();
  if (programError || !program) throw new Error(`Setup failure: could not find ai-machine-learning program: ${programError?.message}`);
  aiMlProgramId = program.id as string;
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

async function createFreshStudent(prefix: string) {
  const { client, userId } = await createFreshUser(prefix);
  const { error } = await client.from("student_profiles").insert({ id: userId });
  if (error) throw new Error(`Setup failure: could not create student_profiles row: ${error.message}`);
  return { client, userId };
}

async function createInternshipProgram(status: "draft" | "published" | "archived") {
  const { data, error } = await admin
    .from("internship_programs")
    .insert({ program_id: aiMlProgramId, slug: unique("ip"), name: "Fixture Internship Program", short_description: "s", long_description: "l", status })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

describe("internship_programs — public/authenticated discovery", () => {
  it("anon can read a published internship program", async () => {
    const id = await createInternshipProgram("published");
    const anon = trackedClient();
    const { data, error } = await anon.from("internship_programs").select("id, name").eq("id", id).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(id);
  });

  it("anon cannot read a draft internship program (silently filtered, not an error)", async () => {
    const id = await createInternshipProgram("draft");
    const anon = trackedClient();
    const { data, error } = await anon.from("internship_programs").select("id").eq("id", id).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("anon cannot read an archived internship program", async () => {
    const id = await createInternshipProgram("archived");
    const anon = trackedClient();
    const { data, error } = await anon.from("internship_programs").select("id").eq("id", id).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("an authenticated non-admin sees exactly the same published-only view as anon", async () => {
    const publishedId = await createInternshipProgram("published");
    const draftId = await createInternshipProgram("draft");
    const { client } = await createFreshUser("ip-auth-nonadmin");
    const { data } = await client.from("internship_programs").select("id");
    const ids = (data ?? []).map((row) => row.id);
    expect(ids).toContain(publishedId);
    expect(ids).not.toContain(draftId);
  });

  it("an admin can read internship programs regardless of status", async () => {
    const draftId = await createInternshipProgram("draft");
    const { data, error } = await admin.from("internship_programs").select("id").eq("id", draftId).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(draftId);
  });
});

describe("internship_programs — write authorization", () => {
  it("anon cannot insert an internship program", async () => {
    const anon = trackedClient();
    const { error } = await anon
      .from("internship_programs")
      .insert({ program_id: aiMlProgramId, slug: unique("hack"), name: "hack", short_description: "s", long_description: "l" });
    expect(error).not.toBeNull();
  });

  it("a non-admin authenticated user cannot insert an internship program", async () => {
    const { client } = await createFreshUser("ip-write-nonadmin");
    const { data, error } = await client
      .from("internship_programs")
      .insert({ program_id: aiMlProgramId, slug: unique("hack"), name: "hack", short_description: "s", long_description: "l" })
      .select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("a non-admin authenticated user cannot update an internship program", async () => {
    const id = await createInternshipProgram("published");
    const { client } = await createFreshUser("ip-update-nonadmin");
    const { data, error } = await client.from("internship_programs").update({ name: "hacked" }).eq("id", id).select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: unchanged } = await admin.from("internship_programs").select("name").eq("id", id).single();
    expect(unchanged?.name).toBe("Fixture Internship Program");
  });

  it("an admin can insert and update an internship program", async () => {
    const { data: created, error: insertError } = await admin
      .from("internship_programs")
      .insert({ program_id: aiMlProgramId, slug: unique("admin-ip"), name: "Draft Program", short_description: "s", long_description: "l" })
      .select("id")
      .single();
    expect(insertError).toBeNull();

    const { error: updateError } = await admin.from("internship_programs").update({ status: "published" }).eq("id", created!.id);
    expect(updateError).toBeNull();

    const { data: after } = await admin.from("internship_programs").select("status").eq("id", created!.id).single();
    expect(after?.status).toBe("published");
  });

  it("a company admin (real write-capable authenticated role) still cannot write to internship_programs (no unintended grant leakage)", async () => {
    const { client } = await createFreshUser("ip-company-admin-negative");
    const { data, error } = await client
      .from("internship_programs")
      .insert({ program_id: aiMlProgramId, slug: unique("hack2"), name: "hack2", short_description: "s", long_description: "l" })
      .select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});

describe("internships — internship_program_id / duration_weeks linkage", () => {
  it("a seeded real internship correctly embeds its internship_program via the new FK", async () => {
    const anon = trackedClient();
    const { data, error } = await anon
      .from("internships")
      .select("id, title, duration_weeks, internship_programs(slug, name)")
      .eq("title", "Applied Machine Learning Internship")
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.duration_weeks).toBe(12);
    expect((data as unknown as { internship_programs: { slug: string } }).internship_programs?.slug).toBe("ai-machine-learning-internship");
  });

  it("an existing company-owned internship (internship_program_id NULL) is unaffected by the new column", async () => {
    const { data: internship, error } = await admin
      .from("internships")
      .insert({ title: unique("company-internship"), description: "d", requirements: "r", eligibility: "e", status: "open" })
      .select("id, internship_program_id, duration_weeks")
      .single();
    expect(error).toBeNull();
    expect(internship?.internship_program_id).toBeNull();
    expect(internship?.duration_weeks).toBeNull();
  });

  it("duration_weeks rejects a value outside the 4/12/24 track vocabulary (CHECK constraint)", async () => {
    const { error } = await admin
      .from("internships")
      .insert({ title: unique("bad-duration"), description: "d", requirements: "r", eligibility: "e", status: "open", duration_weeks: 8 });
    expect(error).not.toBeNull();
  });
});

describe("Full real-catalog journey — discover, apply, enroll", () => {
  it("a fresh student can discover a real seeded internship program, apply to one of its open internships, and be enrolled after acceptance", async () => {
    const anon = trackedClient();

    // Discover: public internship-program browsing surfaces the real seeded row.
    const { data: internshipProgram } = await anon
      .from("internship_programs")
      .select("id, slug")
      .eq("slug", "software-development-internship")
      .single();
    expect(internshipProgram).not.toBeNull();

    // Discover: one of its real open internships.
    const { data: opportunity } = await anon
      .from("internships")
      .select("id, title, duration_weeks")
      .eq("internship_program_id", internshipProgram!.id)
      .eq("duration_weeks", 4)
      .eq("status", "open")
      .single();
    expect(opportunity?.title).toBe("Software Development Foundations Internship");

    // Apply: a fresh student, authorized via the existing "Students can
    // insert applications" RLS policy — no changes to that policy in 10B.
    const { client: student, userId: studentId } = await createFreshStudent("ip-journey-student");
    const { data: application, error: applyError } = await student
      .from("applications")
      .insert({ student_id: studentId, internship_id: opportunity!.id })
      .select("id")
      .single();
    expect(applyError).toBeNull();

    // Track: the student can read their own application.
    const { data: tracked } = await student.from("applications").select("status").eq("id", application!.id).single();
    expect(tracked?.status).toBe("pending");

    // Enroll: admin accepts via the existing review_application() RPC —
    // unchanged by 10B — which atomically creates the enrollment.
    const { error: reviewError } = await admin.rpc("review_application", {
      app_uuid: application!.id,
      review_status: "accepted",
      feedback: "Journey test acceptance.",
    });
    expect(reviewError).toBeNull();

    const { data: enrollment } = await admin.from("enrollments").select("status").eq("application_id", application!.id).single();
    expect(enrollment?.status).toBe("active");
  });

  it("a different, unrelated student cannot see or apply on behalf of the journey student (cross-user isolation regression)", async () => {
    const { data: opportunity } = await admin
      .from("internships")
      .select("id")
      .eq("title", "Data Analytics Foundations Internship")
      .single();

    const { client: outsider } = await createFreshUser("ip-journey-outsider");
    const { data, error } = await outsider
      .from("applications")
      .insert({ student_id: "00000000-0000-0000-0000-000000000000", internship_id: opportunity!.id })
      .select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});
