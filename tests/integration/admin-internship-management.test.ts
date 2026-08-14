/**
 * ADMIN INTERNSHIP MANAGEMENT TESTS (Integration) — Phase 5A
 *
 * Exercises the query/RLS behavior the admin internship pages depend on:
 *   - /admin/internships             : full list, any status, admin-only
 *   - /admin/internships/new         : create (defaults to 'draft')
 *   - /admin/internships/[id]        : detail + edit content + status change
 *
 * These talk to Supabase directly, the same way the Server Components/
 * Actions do — matching the pattern established in application-flow.test.ts
 * (Phase 4B), student-internship-experience.test.ts (Phase 4C), and
 * admin-application-review.test.ts (Phase 4D). Every fixture is created
 * fresh per test rather than reusing seed.sql's shared rows, to stay immune
 * to the cross-file race documented in the Phase 4B report.
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

const newTestEmail = () => `internship-mgmt-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;

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

async function createFreshStudent() {
  const email = newTestEmail();
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) {
    throw new Error(`Setup failure: could not sign up ${email}: ${error?.message}`);
  }
  return { client, userId: data.user.id };
}

function internshipFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: `Internship Mgmt Test ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    description: "Integration test fixture internship.",
    requirements: "None.",
    eligibility: "Any enrolled student.",
    ...overrides,
  };
}

describe("Create internship (what createInternshipAction wraps)", () => {
  it("1. an admin can create an internship, defaulting to 'draft'", async () => {
    const { data, error } = await admin.from("internships").insert(internshipFixture()).select("id, status").single();

    expect(error).toBeNull();
    expect(data?.status).toBe("draft");
  });

  it("2. a student cannot create an internship directly", async () => {
    const { client } = await createFreshStudent();

    const { error } = await client.from("internships").insert(internshipFixture());
    expect(error).not.toBeNull();
  });

  it("3. an unauthenticated client cannot create an internship", async () => {
    const anon = trackedClient(); // never signed in
    const { data, error } = await anon.from("internships").insert(internshipFixture());

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});

describe("Admin internship list/detail visibility", () => {
  it("4. an admin can retrieve a draft internship (students cannot)", async () => {
    const { data: created } = await admin.from("internships").insert(internshipFixture()).select("id").single();
    const { client: student } = await createFreshStudent();

    const { data: asAdmin, error: adminError } = await admin
      .from("internships")
      .select("id, status")
      .eq("id", created!.id)
      .maybeSingle();
    expect(adminError).toBeNull();
    expect(asAdmin?.status).toBe("draft");

    const { data: asStudent } = await student.from("internships").select("id").eq("id", created!.id).maybeSingle();
    expect(asStudent).toBeNull();
  });

  it("5. an admin's unfiltered internship list includes every status", async () => {
    const draft = await admin.from("internships").insert(internshipFixture()).select("id").single();
    const { data: opened } = await admin
      .from("internships")
      .update({ status: "open" })
      .eq("id", draft.data!.id)
      .select("id")
      .single();

    const closedFixture = await admin.from("internships").insert(internshipFixture()).select("id").single();
    await admin.from("internships").update({ status: "closed" }).eq("id", closedFixture.data!.id);

    const { data: list, error } = await admin
      .from("internships")
      .select("id, status")
      .in("id", [opened!.id, closedFixture.data!.id]);

    expect(error).toBeNull();
    const statuses = list?.map((row) => row.status).sort();
    expect(statuses).toEqual(["closed", "open"]);
  });

  it("6. a well-formed but nonexistent internship id returns no row, not an error", async () => {
    const { data, error } = await admin
      .from("internships")
      .select("id")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("6b. a malformed internship id is rejected at the database level (why the detail page validates UUID format first)", async () => {
    const { error } = await admin.from("internships").select("id").eq("id", "not-a-uuid").maybeSingle();
    expect(error).not.toBeNull();
  });
});

describe("Edit internship content (what updateInternshipAction wraps)", () => {
  it("7. an admin can update an internship's content fields", async () => {
    const { data: created } = await admin.from("internships").insert(internshipFixture()).select("id").single();

    const { error } = await admin
      .from("internships")
      .update({
        title: "Updated Title",
        description: "Updated description.",
        requirements: "Updated requirements.",
        eligibility: "Updated eligibility.",
      })
      .eq("id", created!.id);
    expect(error).toBeNull();

    const { data: after } = await admin
      .from("internships")
      .select("title, description, requirements, eligibility")
      .eq("id", created!.id)
      .single();
    expect(after?.title).toBe("Updated Title");
    expect(after?.description).toBe("Updated description.");
  });

  it("8. a student cannot update internship content directly", async () => {
    const { data: created } = await admin.from("internships").insert(internshipFixture()).select("id").single();
    await admin.from("internships").update({ status: "open" }).eq("id", created!.id);
    const { client } = await createFreshStudent();

    const { data, error } = await client
      .from("internships")
      .update({ title: "Hacked title" })
      .eq("id", created!.id)
      .select();

    // RLS filters the row out of the UPDATE target entirely — zero rows
    // affected, no error (the same silent-filter behavior established
    // throughout this project's RLS test suite).
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: unchanged } = await admin.from("internships").select("title").eq("id", created!.id).single();
    expect(unchanged?.title).not.toBe("Hacked title");
  });
});

describe("Internship status changes (what updateInternshipStatusAction wraps)", () => {
  it("9. an admin can move an internship through every real status value", async () => {
    const { data: created } = await admin.from("internships").insert(internshipFixture()).select("id").single();

    for (const status of ["open", "closed", "archived", "draft"]) {
      const { error } = await admin.from("internships").update({ status }).eq("id", created!.id);
      expect(error).toBeNull();

      const { data } = await admin.from("internships").select("status").eq("id", created!.id).single();
      expect(data?.status).toBe(status);
    }
  });

  it("10. the database rejects an invented status value regardless of what any client sends", async () => {
    const { data: created } = await admin.from("internships").insert(internshipFixture()).select("id").single();

    const { error } = await admin.from("internships").update({ status: "published" }).eq("id", created!.id);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23514"); // check_violation
  });

  it("11. a student cannot change an internship's status directly", async () => {
    const { data: created } = await admin.from("internships").insert(internshipFixture()).select("id").single();
    await admin.from("internships").update({ status: "open" }).eq("id", created!.id);
    const { client } = await createFreshStudent();

    const { data, error } = await client
      .from("internships")
      .update({ status: "archived" })
      .eq("id", created!.id)
      .select();

    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: unchanged } = await admin.from("internships").select("status").eq("id", created!.id).single();
    expect(unchanged?.status).toBe("open");
  });

  it("12. closing an internship removes it from student discovery immediately", async () => {
    const { data: created } = await admin.from("internships").insert(internshipFixture()).select("id").single();
    await admin.from("internships").update({ status: "open" }).eq("id", created!.id);
    const { client: student } = await createFreshStudent();

    const { data: visibleWhileOpen } = await student.from("internships").select("id").eq("id", created!.id).maybeSingle();
    expect(visibleWhileOpen).not.toBeNull();

    await admin.from("internships").update({ status: "closed" }).eq("id", created!.id);

    const { data: visibleAfterClose } = await student.from("internships").select("id").eq("id", created!.id).maybeSingle();
    expect(visibleAfterClose).toBeNull();
  });
});
