/**
 * PHASE 9 — PUBLIC CONTENT + CONTACT TESTS (Integration)
 *
 * Covers the two genuinely new pieces of authorization surface Phase 9
 * introduced: anonymous internship discovery (internships previously had
 * NO anon grant at all, despite the existing policy's misleading name) and
 * the contact_submissions table (write-only from anon/authenticated,
 * read/triage admin-only).
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

async function createInternship(status: "draft" | "open" | "closed" | "archived") {
  const { data, error } = await admin
    .from("internships")
    .insert({ title: unique("internship"), description: "d", requirements: "r", eligibility: "e", status })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

describe("Anonymous internship discovery", () => {
  it("anon can read an open internship", async () => {
    const id = await createInternship("open");
    const anon = trackedClient();
    const { data, error } = await anon.from("internships").select("id, title").eq("id", id).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(id);
  });

  it("anon cannot read a draft internship (silently filtered, not an error)", async () => {
    const id = await createInternship("draft");
    const anon = trackedClient();
    const { data, error } = await anon.from("internships").select("id").eq("id", id).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("anon cannot read a closed internship", async () => {
    const id = await createInternship("closed");
    const anon = trackedClient();
    const { data, error } = await anon.from("internships").select("id").eq("id", id).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("anon cannot read an archived internship", async () => {
    const id = await createInternship("archived");
    const anon = trackedClient();
    const { data, error } = await anon.from("internships").select("id").eq("id", id).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("anon listing every open internship never includes a non-open row", async () => {
    const openId = await createInternship("open");
    const draftId = await createInternship("draft");
    const anon = trackedClient();
    const { data, error } = await anon.from("internships").select("id, status");
    expect(error).toBeNull();
    const ids = (data ?? []).map((row) => row.id);
    expect(ids).toContain(openId);
    expect(ids).not.toContain(draftId);
    expect((data ?? []).every((row) => row.status === "open")).toBe(true);
  });

  it("anon still cannot write to internships (regression — discovery is read-only)", async () => {
    const anon = trackedClient();
    const { error } = await anon.from("internships").insert({ title: "hack", description: "d", requirements: "r", eligibility: "e" });
    expect(error).not.toBeNull();
  });

  it("an authenticated non-admin sees exactly the same open-only view as anon", async () => {
    const openId = await createInternship("open");
    const draftId = await createInternship("draft");
    const { client } = await createFreshUser("phase9-auth-internships");
    const { data } = await client.from("internships").select("id");
    const ids = (data ?? []).map((row) => row.id);
    expect(ids).toContain(openId);
    expect(ids).not.toContain(draftId);
  });
});

describe("contact_submissions — write-only from the public form", () => {
  it("anon can submit a contact message", async () => {
    const anon = trackedClient();
    const { error } = await anon.from("contact_submissions").insert({ name: "Alice", email: "alice@test.nova", message: "Hello" });
    expect(error).toBeNull();
  });

  it("an authenticated non-admin can also submit a contact message", async () => {
    const { client } = await createFreshUser("phase9-contact-submit");
    const { error } = await client.from("contact_submissions").insert({ name: "Bob", email: "bob@test.nova", message: "Hi" });
    expect(error).toBeNull();
  });

  it("anon cannot read back any submission (no SELECT grant — a real permission error, not a silent filter)", async () => {
    const anon = trackedClient();
    const { data, error } = await anon.from("contact_submissions").select("id");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("a non-admin authenticated user cannot read submissions (RLS-filtered to empty, not an error)", async () => {
    const { client } = await createFreshUser("phase9-contact-read-nonadmin");
    const { data, error } = await client.from("contact_submissions").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("a non-admin authenticated user cannot mark a submission reviewed", async () => {
    const { data: submission } = await admin.from("contact_submissions").insert({ name: "C", email: "c@test.nova", message: "m" }).select("id").single();
    const { client } = await createFreshUser("phase9-contact-update-nonadmin");
    const { data, error } = await client.from("contact_submissions").update({ status: "reviewed" }).eq("id", submission!.id).select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: stillNew } = await admin.from("contact_submissions").select("status").eq("id", submission!.id).single();
    expect(stillNew?.status).toBe("new");
  });

  it("anon cannot update a submission's status at all (no UPDATE grant)", async () => {
    const { data: submission } = await admin.from("contact_submissions").insert({ name: "D", email: "d@test.nova", message: "m" }).select("id").single();
    const anon = trackedClient();
    const { error } = await anon.from("contact_submissions").update({ status: "reviewed" }).eq("id", submission!.id);
    expect(error).not.toBeNull();
  });

  it("an admin can read submissions and mark one reviewed", async () => {
    const { data: submission } = await admin.from("contact_submissions").insert({ name: "E", email: "e@test.nova", message: "m" }).select("id").single();

    const { data: readBack, error: readError } = await admin.from("contact_submissions").select("id, status").eq("id", submission!.id).single();
    expect(readError).toBeNull();
    expect(readBack?.status).toBe("new");

    const { error: updateError } = await admin.from("contact_submissions").update({ status: "reviewed" }).eq("id", submission!.id);
    expect(updateError).toBeNull();

    const { data: after } = await admin.from("contact_submissions").select("status").eq("id", submission!.id).single();
    expect(after?.status).toBe("reviewed");
  });

  it("a submission cannot be created with an invalid status value (CHECK constraint)", async () => {
    const { error } = await admin.from("contact_submissions").insert({ name: "F", email: "f@test.nova", message: "m", status: "archived" });
    expect(error).not.toBeNull();
  });
});
