/**
 * COMPANY PLATFORM BACKEND TESTS (Integration) — Phase 5B-2
 *
 * Phase 5B-1 already exhaustively tests the RLS layer (companies,
 * company_members, internships, applications isolation). This file targets
 * only what's NEW in 5B-2: the exact query shapes the new pages/actions use
 * (member management via user_id, the `!inner` embedded-filter pattern for
 * scoping applications by company), verified directly against
 * Supabase/PostgREST — Server Actions can't be invoked outside a Next.js
 * request context, so these mirror exactly what each action does.
 *
 * REQUIRES: Local Supabase running (`npx supabase start`)
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
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

async function createFreshUser() {
  const email = `company-backend-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) throw new Error(`Setup failure: ${error?.message}`);
  return { client, userId: data.user.id };
}

async function createFreshCompanyOwner() {
  const { client, userId } = await createFreshUser();
  const { data: companyId, error } = await client.rpc("create_company", {
    company_name: `Backend Test Co ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    company_description: "fixture",
  });
  if (error || !companyId) throw new Error(`Setup failure: ${error?.message}`);
  return { client, userId, companyId: companyId as string };
}

async function createCompanyInternship(client: SupabaseClient, companyId: string, status = "open") {
  const { data, error } = await client
    .from("internships")
    .insert({
      title: `Backend Internship ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
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
  const email = `company-backend-student-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) throw new Error(`Setup failure: ${error?.message}`);
  const userId = data.user.id;
  await client.from("student_profiles").upsert({ id: userId, education_info: {}, skills: [] });
  return { client, userId };
}

describe("Member management via user_id (what addCompanyMemberAction wraps)", () => {
  it("owner can add, promote, and remove a member by user_id", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { userId: targetId } = await createFreshUser();

    const { error: insertError } = await owner.from("company_members").insert({ company_id: companyId, user_id: targetId, company_role: "member" });
    expect(insertError).toBeNull();

    const { error: updateError } = await owner.from("company_members").update({ company_role: "admin" }).eq("company_id", companyId).eq("user_id", targetId);
    expect(updateError).toBeNull();

    const { error: deleteError } = await owner.from("company_members").delete().eq("company_id", companyId).eq("user_id", targetId);
    expect(deleteError).toBeNull();

    const { data: gone } = await owner.from("company_members").select("user_id").eq("company_id", companyId).eq("user_id", targetId).maybeSingle();
    expect(gone).toBeNull();
  });

  it("member profile embed is null for a fellow company member (documented gap, handled gracefully in UI)", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { userId: memberId } = await createFreshUser();
    await owner.from("company_members").insert({ company_id: companyId, user_id: memberId, company_role: "member" });

    const { data, error } = await owner
      .from("company_members")
      .select("user_id, profiles:profiles(email)")
      .eq("company_id", companyId)
      .eq("user_id", memberId)
      .single();
    expect(error).toBeNull();
    expect((data as any)?.profiles).toBeNull();
  });
});

describe("Applications list/detail via !inner embedded-filter (what the company pages use)", () => {
  it("scopes applications to the company's own internships via internships!inner", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId);
    const { client: student, userId: studentId } = await createFreshStudent();
    const { data: app } = await student
      .from("applications")
      .insert({ student_id: studentId, internship_id: internshipId, cover_letter: "Backend test application." })
      .select("id")
      .single();

    const { data, error } = await owner
      .from("applications")
      .select("id, status, internship:internships!inner(id, company_id)")
      .eq("internship.company_id", companyId);
    expect(error).toBeNull();
    expect(data?.some((row: any) => row.id === app!.id)).toBe(true);

    const { companyId: otherCompanyId } = await createFreshCompanyOwner();
    const { data: crossCompany } = await owner
      .from("applications")
      .select("id, internship:internships!inner(id, company_id)")
      .eq("internship.company_id", otherCompanyId);
    expect(crossCompany).toEqual([]);
  });

  it("single-application detail query with !inner returns null for another company's application", async () => {
    const { client: ownerB, companyId: companyB } = await createFreshCompanyOwner();
    const internshipB = await createCompanyInternship(ownerB, companyB);
    const { client: student, userId: studentId } = await createFreshStudent();
    const { data: app } = await student
      .from("applications")
      .insert({ student_id: studentId, internship_id: internshipB, cover_letter: "x" })
      .select("id")
      .single();

    const { client: ownerA, companyId: companyA } = await createFreshCompanyOwner();
    const { data, error } = await ownerA
      .from("applications")
      .select("id, internship:internships!inner(id, company_id)")
      .eq("id", app!.id)
      .eq("internship.company_id", companyA)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});

describe("Company internship creation/edit derives company_id server-side (regression, mirrors 5B-1)", () => {
  it("an internship's company_id is fixed at creation and used unmodified by an edit", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId, "draft");

    const { error } = await owner.from("internships").update({ title: "Edited via company action pattern" }).eq("id", internshipId);
    expect(error).toBeNull();

    const { data } = await owner.from("internships").select("title, company_id").eq("id", internshipId).single();
    expect(data?.title).toBe("Edited via company action pattern");
    expect(data?.company_id).toBe(companyId);
  });
});
