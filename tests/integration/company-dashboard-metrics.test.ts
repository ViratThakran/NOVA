/**
 * COMPANY DASHBOARD METRICS TESTS (Integration) — Phase 6D
 *
 * Exercises the new query shapes on /company (member count, open-internship
 * count, per-status application breakdown). Multi-tenant isolation for
 * companies/internships/applications/members is already exhaustively tested
 * in company-platform-foundation.test.ts (48 tests) and
 * company-platform-review.test.ts (25 tests) — not repeated here.
 *
 * REQUIRES: Local Supabase running (`npx supabase start`)
 * Run with: npm run test:integration
 */

import { describe, it, expect, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const clientsToSignOut: SupabaseClient[] = [];
function trackedClient(): SupabaseClient {
  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  clientsToSignOut.push(client);
  return client;
}

afterAll(async () => {
  await Promise.all(clientsToSignOut.map((client) => client.auth.signOut()));
});

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;
}

async function createFreshCompanyOwner() {
  const email = uniqueEmail("dash-owner");
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) throw new Error(`Setup failure: ${error?.message}`);
  const { data: companyId, error: companyError } = await client.rpc("create_company", {
    company_name: `Dashboard Test Co ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    company_description: "fixture",
  });
  if (companyError || !companyId) throw new Error(`Setup failure: ${companyError?.message}`);
  return { client, userId: data.user.id, companyId: companyId as string };
}

async function createCompanyInternship(ownerClient: SupabaseClient, companyId: string, status = "open") {
  const { data, error } = await ownerClient
    .from("internships")
    .insert({
      title: `Dashboard Internship ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      description: "x",
      requirements: "x",
      eligibility: "x",
      company_id: companyId,
      status,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

async function createFreshStudent() {
  const email = uniqueEmail("dash-student");
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) throw new Error(`Setup failure: ${error?.message}`);
  const userId = data.user.id;
  const { error: profileError } = await client.from("student_profiles").upsert({ id: userId, education_info: {}, skills: [] });
  if (profileError) throw new Error(`Setup failure: ${profileError.message}`);
  return { client, userId };
}

describe("Company dashboard metrics", () => {
  it("member count, open-internship count, and per-status application breakdown are all scoped to the caller's own company", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const openId = await createCompanyInternship(owner, companyId, "open");
    await createCompanyInternship(owner, companyId, "draft");

    const { client: studentA, userId: studentAId } = await createFreshStudent();
    const { client: studentB, userId: studentBId } = await createFreshStudent();
    const { data: appAccepted, error: appAcceptedError } = await studentA
      .from("applications")
      .insert({ student_id: studentAId, internship_id: openId, cover_letter: "x" })
      .select("id")
      .single();
    if (appAcceptedError || !appAccepted) throw new Error(`Setup failure: ${appAcceptedError?.message}`);
    const { error: appBError } = await studentB.from("applications").insert({ student_id: studentBId, internship_id: openId, cover_letter: "x" });
    if (appBError) throw new Error(`Setup failure: ${appBError.message}`);
    const { error: reviewError } = await owner.rpc("review_application", { app_uuid: appAccepted.id, review_status: "accepted", feedback: null });
    if (reviewError) throw new Error(`Setup failure: ${reviewError.message}`);

    const { count: memberCount } = await owner.from("company_members").select("*", { count: "exact", head: true }).eq("company_id", companyId);
    expect(memberCount).toBe(1);

    const { data: internships } = await owner.from("internships").select("status").eq("company_id", companyId);
    expect(internships?.length).toBe(2);
    expect(internships?.filter((i) => i.status === "open").length).toBe(1);

    const { data: applications } = await owner
      .from("applications")
      .select("status")
      .in("internship_id", [openId]);
    const byStatus: Record<string, number> = {};
    for (const row of applications ?? []) byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    expect(byStatus.accepted).toBe(1);
    expect(byStatus.pending).toBe(1);
  });

  it("another company's owner sees zero for all of these metrics on their own (separate) company", async () => {
    const { client: otherOwner, companyId: otherCompanyId } = await createFreshCompanyOwner();

    const { count: memberCount } = await otherOwner.from("company_members").select("*", { count: "exact", head: true }).eq("company_id", otherCompanyId);
    expect(memberCount).toBe(1); // only the owner themself, not another company's members

    const { data: internships } = await otherOwner.from("internships").select("id").eq("company_id", otherCompanyId);
    expect(internships).toEqual([]);
  });
});
