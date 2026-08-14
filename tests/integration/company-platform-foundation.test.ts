/**
 * COMPANY PLATFORM FOUNDATION TESTS (Integration) — Phase 5B-1
 *
 * Exercises the schema/RLS foundation added for company tenancy:
 *   - companies, company_members tables
 *   - internships.company_id (nullable — NULL means platform-owned)
 *   - is_company_member() / is_company_admin() / is_company_user() helpers
 *   - create_company() RPC (atomic company + owner-membership creation)
 *   - the internship company_id-reassignment guard trigger
 *   - additive RLS branches on internships (SELECT/INSERT/UPDATE) and
 *     applications (SELECT)
 *
 * No Server Actions or UI exist yet for any of this — every test talks to
 * Supabase/PostgREST directly, the same way every other RLS-security test
 * in this project does, to prove the boundary is the database, not a
 * well-behaved client. Every fixture is created fresh per test rather than
 * reusing seed.sql's shared rows, matching the cross-file-race-avoidance
 * convention established since Phase 4B.
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

const newTestEmail = () => `company-foundation-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;

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

async function createFreshUser() {
  const email = newTestEmail();
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) {
    throw new Error(`Setup failure: could not sign up ${email}: ${error?.message}`);
  }
  return { client, userId: data.user.id };
}

/** A fresh user who creates a company via create_company() and is therefore its owner. */
async function createFreshCompanyOwner() {
  const { client, userId } = await createFreshUser();
  const { data: companyId, error } = await client.rpc("create_company", {
    company_name: `Test Company ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    company_description: "Integration test fixture company.",
  });
  if (error || !companyId) {
    throw new Error(`Setup failure: could not create company: ${error?.message}`);
  }
  return { client, userId, companyId: companyId as string };
}

async function addMember(actingClient: SupabaseClient, companyId: string, userId: string, role: "admin" | "member") {
  const { error } = await actingClient
    .from("company_members")
    .insert({ company_id: companyId, user_id: userId, company_role: role });
  if (error) {
    throw new Error(`Setup failure: could not add ${role} to company: ${error.message}`);
  }
}

async function createCompanyInternship(actingClient: SupabaseClient, companyId: string, overrides: Record<string, unknown> = {}) {
  const { data, error } = await actingClient
    .from("internships")
    .insert({
      title: `Company Internship ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      description: "Integration test fixture internship.",
      requirements: "None.",
      eligibility: "Any enrolled student.",
      company_id: companyId,
      ...overrides,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`Setup failure: could not create company internship: ${error?.message}`);
  }
  return data.id as string;
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

async function createApplication(studentClient: SupabaseClient, studentId: string, internshipId: string) {
  // Applications RLS does not itself verify internship status (a documented
  // pre-existing gap, not something this phase touches), so this insert
  // works regardless of the target internship's status — useful here since
  // several fixtures need an application against a closed internship.
  const { data, error } = await studentClient
    .from("applications")
    .insert({ student_id: studentId, internship_id: internshipId, cover_letter: "Company platform foundation test fixture." })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`Setup failure: could not create application: ${error?.message}`);
  }
  return data.id as string;
}

describe("Company creation and access (positive)", () => {
  it("1. a platform admin can create a company via create_company() and read it", async () => {
    const { data: companyId, error } = await admin.rpc("create_company", {
      company_name: `Admin-created Company ${Date.now()}`,
      company_description: "Created by a platform admin.",
    });
    expect(error).toBeNull();
    expect(companyId).toBeTruthy();

    const { data, error: readError } = await admin.from("companies").select("id, name").eq("id", companyId).maybeSingle();
    expect(readError).toBeNull();
    expect(data?.id).toBe(companyId);
  });

  it("create_company() atomically makes the creator the owner", async () => {
    const { client, userId } = await createFreshUser();
    const { data: companyId, error } = await client.rpc("create_company", {
      company_name: `Owner Atomicity Test ${Date.now()}`,
      company_description: null,
    });
    expect(error).toBeNull();

    const { data: membership } = await client
      .from("company_members")
      .select("company_role")
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .single();
    expect(membership?.company_role).toBe("owner");
  });

  it("2. a company owner can read their own company", async () => {
    const { client, companyId } = await createFreshCompanyOwner();
    const { data, error } = await client.from("companies").select("id").eq("id", companyId).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(companyId);
  });

  it("3. a company admin can read their own company", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: adminClient, userId: adminUserId } = await createFreshUser();
    await addMember(owner, companyId, adminUserId, "admin");

    const { data, error } = await adminClient.from("companies").select("id").eq("id", companyId).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(companyId);
  });

  it("4. a company member can read their own company", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: memberClient, userId: memberUserId } = await createFreshUser();
    await addMember(owner, companyId, memberUserId, "member");

    const { data, error } = await memberClient.from("companies").select("id").eq("id", companyId).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(companyId);
  });
});

describe("Company isolation (negative / IDOR)", () => {
  it("1. Company A cannot SELECT Company B", async () => {
    const { companyId: companyB } = await createFreshCompanyOwner();
    const { client: companyAOwner } = await createFreshCompanyOwner();

    const { data, error } = await companyAOwner.from("companies").select("id").eq("id", companyB).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("2. Company A cannot SELECT Company B's membership rows", async () => {
    const { companyId: companyB } = await createFreshCompanyOwner();
    const { client: companyAOwner } = await createFreshCompanyOwner();

    const { data, error } = await companyAOwner.from("company_members").select("user_id").eq("company_id", companyB);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("3. Company A cannot SELECT Company B's internship", async () => {
    const { client: ownerB, companyId: companyB } = await createFreshCompanyOwner();
    const internshipB = await createCompanyInternship(ownerB, companyB);
    const { client: companyAOwner } = await createFreshCompanyOwner();

    const { data, error } = await companyAOwner.from("internships").select("id").eq("id", internshipB).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("4. Company A cannot SELECT Company B's application (real application id)", async () => {
    const { client: ownerB, companyId: companyB } = await createFreshCompanyOwner();
    const internshipB = await createCompanyInternship(ownerB, companyB, { status: "open" });
    const { client: student, userId: studentId } = await createFreshStudent();
    const applicationId = await createApplication(student, studentId, internshipB);

    const { client: companyAOwner } = await createFreshCompanyOwner();
    const { data, error } = await companyAOwner.from("applications").select("id").eq("id", applicationId).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("5. Company A cannot SELECT an application by a guessed/nonexistent UUID", async () => {
    const { client: companyAOwner } = await createFreshCompanyOwner();
    const { data, error } = await companyAOwner
      .from("applications")
      .select("id")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("6. Company A cannot infer Company B's application data through embedded relations", async () => {
    const { client: ownerB, companyId: companyB } = await createFreshCompanyOwner();
    const internshipB = await createCompanyInternship(ownerB, companyB, { status: "open" });
    const { client: student, userId: studentId } = await createFreshStudent();
    await createApplication(student, studentId, internshipB);

    const { client: companyAOwner } = await createFreshCompanyOwner();
    // An unfiltered select across all applications a Company A user could
    // ever see must never include Company B's row, embed or no embed.
    const { data, error } = await companyAOwner
      .from("applications")
      .select("id, internship:internships(id, company_id)");
    expect(error).toBeNull();
    expect(data?.some((row: any) => row.internship?.company_id === companyB)).toBe(false);
  });
});

describe("Internship ownership (negative)", () => {
  it("7. Company A cannot create an internship with company_id = Company B", async () => {
    const { companyId: companyB } = await createFreshCompanyOwner();
    const { client: companyAOwner } = await createFreshCompanyOwner();

    const { error } = await companyAOwner.from("internships").insert({
      title: "Cross-company creation attempt",
      description: "x",
      requirements: "x",
      eligibility: "x",
      company_id: companyB,
    });
    expect(error).not.toBeNull();
  });

  it("8. Company A cannot update Company B's internship", async () => {
    const { client: ownerB, companyId: companyB } = await createFreshCompanyOwner();
    const internshipB = await createCompanyInternship(ownerB, companyB);
    const { client: companyAOwner } = await createFreshCompanyOwner();

    const { data, error } = await companyAOwner
      .from("internships")
      .update({ title: "Hijacked title" })
      .eq("id", internshipB)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: unchanged } = await ownerB.from("internships").select("title").eq("id", internshipB).single();
    expect(unchanged?.title).not.toBe("Hijacked title");
  });

  it("9. a company cannot reassign their own internship's company_id to another company", async () => {
    const { client: ownerA, companyId: companyA } = await createFreshCompanyOwner();
    const internshipA = await createCompanyInternship(ownerA, companyA);
    const { companyId: companyB } = await createFreshCompanyOwner();

    const { error } = await ownerA.from("internships").update({ company_id: companyB }).eq("id", internshipA);
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/company_id cannot be changed/i);

    const { data: unchanged } = await ownerA.from("internships").select("company_id").eq("id", internshipA).single();
    expect(unchanged?.company_id).toBe(companyA);
  });

  it("9b. an owner administering both companies still cannot move an internship between them", async () => {
    const { client: dualOwner, userId: dualOwnerId, companyId: companyA } = await createFreshCompanyOwner();
    const { client: ownerB, companyId: companyB } = await createFreshCompanyOwner();
    await addMember(ownerB, companyB, dualOwnerId, "admin"); // dualOwner now administers both A and B
    const internshipA = await createCompanyInternship(dualOwner, companyA);

    const { error } = await dualOwner.from("internships").update({ company_id: companyB }).eq("id", internshipA);
    expect(error).not.toBeNull();

    const { data: unchanged } = await dualOwner.from("internships").select("company_id").eq("id", internshipA).single();
    expect(unchanged?.company_id).toBe(companyA);
  });

  it("9c. a platform admin is exempt from the company_id reassignment guard (existing admin capability preserved)", async () => {
    const { client: ownerA, companyId: companyA } = await createFreshCompanyOwner();
    const internshipA = await createCompanyInternship(ownerA, companyA);
    const { companyId: companyB } = await createFreshCompanyOwner();

    const { error } = await admin.from("internships").update({ company_id: companyB }).eq("id", internshipA);
    expect(error).toBeNull();

    const { data: moved } = await admin.from("internships").select("company_id").eq("id", internshipA).single();
    expect(moved?.company_id).toBe(companyB);
  });

  it("10. a company member (not admin/owner) cannot create an internship", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: memberClient, userId: memberUserId } = await createFreshUser();
    await addMember(owner, companyId, memberUserId, "member");

    const { error } = await memberClient.from("internships").insert({
      title: "Member creation attempt",
      description: "x",
      requirements: "x",
      eligibility: "x",
      company_id: companyId,
    });
    expect(error).not.toBeNull();
  });

  it("11. a student cannot create a company internship", async () => {
    const { companyId } = await createFreshCompanyOwner();
    const { client: student } = await createFreshStudent();

    const { error } = await student.from("internships").insert({
      title: "Student creation attempt",
      description: "x",
      requirements: "x",
      eligibility: "x",
      company_id: companyId,
    });
    expect(error).not.toBeNull();
  });

  it("12. a student cannot modify a company internship", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId, { status: "open" });
    const { client: student } = await createFreshStudent();

    const { data, error } = await student.from("internships").update({ title: "Student edit attempt" }).eq("id", internshipId).select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("13. Company A cannot modify Company B's internship status", async () => {
    const { client: ownerB, companyId: companyB } = await createFreshCompanyOwner();
    const internshipB = await createCompanyInternship(ownerB, companyB);
    const { client: companyAOwner } = await createFreshCompanyOwner();

    const { data, error } = await companyAOwner.from("internships").update({ status: "open" }).eq("id", internshipB).select();
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: unchanged } = await ownerB.from("internships").select("status").eq("id", internshipB).single();
    expect(unchanged?.status).toBe("draft");
  });
});

describe("Internship ownership (positive)", () => {
  it("9. a company owner/admin can create an internship for their own company", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { data, error } = await owner
      .from("internships")
      .insert({
        title: "Own-company creation",
        description: "x",
        requirements: "x",
        eligibility: "x",
        company_id: companyId,
      })
      .select("id, status")
      .single();
    expect(error).toBeNull();
    expect(data?.status).toBe("draft");
  });

  it("11. a company admin can edit their own company's internship", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId);

    const { error } = await owner.from("internships").update({ title: "Edited by owner" }).eq("id", internshipId);
    expect(error).toBeNull();

    const { data } = await owner.from("internships").select("title").eq("id", internshipId).single();
    expect(data?.title).toBe("Edited by owner");
  });

  it("12. a company admin can update normal internship fields including status", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId);

    const { error } = await owner.from("internships").update({ status: "open", description: "Updated." }).eq("id", internshipId);
    expect(error).toBeNull();

    const { data } = await owner.from("internships").select("status, description").eq("id", internshipId).single();
    expect(data?.status).toBe("open");
    expect(data?.description).toBe("Updated.");
  });

  it("13. a company user can read their own company's closed internship", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId);
    await owner.from("internships").update({ status: "closed" }).eq("id", internshipId);

    const { client: memberClient, userId: memberUserId } = await createFreshUser();
    await addMember(owner, companyId, memberUserId, "member");

    const { data, error } = await memberClient.from("internships").select("id, status").eq("id", internshipId).maybeSingle();
    expect(error).toBeNull();
    expect(data?.status).toBe("closed");
  });

  it("14. a platform admin retains unrestricted access to company internships", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId);

    const { data, error } = await admin.from("internships").select("id").eq("id", internshipId).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(internshipId);

    const { error: updateError } = await admin.from("internships").update({ status: "archived" }).eq("id", internshipId);
    expect(updateError).toBeNull();
  });
});

describe("Existing student/platform behavior regression (positive)", () => {
  it("15. a student's internship discovery still shows only open, platform-visible internships", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const draftCompanyInternship = await createCompanyInternship(owner, companyId); // stays 'draft'
    const { client: student } = await createFreshStudent();

    const { data, error } = await student.from("internships").select("id").eq("id", draftCompanyInternship).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull(); // a student has no company membership, so the new company branch doesn't apply, and it's not 'open'
  });

  it("16. a student's application access remains scoped to their own applications only", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId, { status: "open" });
    const { client: studentA, userId: studentAId } = await createFreshStudent();
    const applicationId = await createApplication(studentA, studentAId, internshipId);
    const { client: studentB } = await createFreshStudent();

    const { data: ownData } = await studentA.from("applications").select("id").eq("id", applicationId).maybeSingle();
    expect(ownData?.id).toBe(applicationId);

    const { data: otherData } = await studentB.from("applications").select("id").eq("id", applicationId).maybeSingle();
    expect(otherData).toBeNull();
  });
});

describe("Company application access (positive)", () => {
  it("17. a company user can read applications for their own company's internships", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId, { status: "open" });
    const { client: student, userId: studentId } = await createFreshStudent();
    const applicationId = await createApplication(student, studentId, internshipId);

    const { client: memberClient, userId: memberUserId } = await createFreshUser();
    await addMember(owner, companyId, memberUserId, "member");

    const { data, error } = await memberClient.from("applications").select("id").eq("id", applicationId).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(applicationId);
  });

  it("18. a company user can read embedded internship information for their own closed internship", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const internshipId = await createCompanyInternship(owner, companyId, { status: "open" });
    const { client: student, userId: studentId } = await createFreshStudent();
    const applicationId = await createApplication(student, studentId, internshipId);

    // Close the internship after the application was submitted.
    await owner.from("internships").update({ status: "closed" }).eq("id", internshipId);

    const { data, error } = await owner
      .from("applications")
      .select("id, internship:internships(id, title, status)")
      .eq("id", applicationId)
      .single();
    expect(error).toBeNull();
    expect((data as any)?.internship?.id).toBe(internshipId);
    expect((data as any)?.internship?.status).toBe("closed");
  });
});

describe("Membership management (positive)", () => {
  it("6. an owner can manage membership", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { userId: newUserId } = await createFreshUser();

    const { error: insertError } = await owner.from("company_members").insert({ company_id: companyId, user_id: newUserId, company_role: "member" });
    expect(insertError).toBeNull();

    const { error: updateError } = await owner.from("company_members").update({ company_role: "admin" }).eq("company_id", companyId).eq("user_id", newUserId);
    expect(updateError).toBeNull();

    const { error: deleteError } = await owner.from("company_members").delete().eq("company_id", companyId).eq("user_id", newUserId);
    expect(deleteError).toBeNull();
  });

  it("7. a company admin (not just owner) can manage membership", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: adminClient, userId: adminUserId } = await createFreshUser();
    await addMember(owner, companyId, adminUserId, "admin");

    const { userId: newUserId } = await createFreshUser();
    const { error } = await adminClient.from("company_members").insert({ company_id: companyId, user_id: newUserId, company_role: "member" });
    expect(error).toBeNull();
  });
});

describe("Membership management (negative / escalation)", () => {
  it("8. a company member cannot manage membership", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: memberClient, userId: memberUserId } = await createFreshUser();
    await addMember(owner, companyId, memberUserId, "member");

    const { userId: targetUserId } = await createFreshUser();
    const { error } = await memberClient.from("company_members").insert({ company_id: companyId, user_id: targetUserId, company_role: "member" });
    expect(error).not.toBeNull();
  });

  it("14. a company member cannot promote themselves to admin", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: memberClient, userId: memberUserId } = await createFreshUser();
    await addMember(owner, companyId, memberUserId, "member");

    const { data, error } = await memberClient
      .from("company_members")
      .update({ company_role: "admin" })
      .eq("company_id", companyId)
      .eq("user_id", memberUserId)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: unchanged } = await owner.from("company_members").select("company_role").eq("company_id", companyId).eq("user_id", memberUserId).single();
    expect(unchanged?.company_role).toBe("member");
  });

  it("15. a company member cannot promote themselves to owner", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: memberClient, userId: memberUserId } = await createFreshUser();
    await addMember(owner, companyId, memberUserId, "member");

    // RLS's USING clause excludes this row for a non-admin actor entirely,
    // so — the same silent-filter behavior established throughout this
    // project's RLS test suite — this returns 200 OK with zero affected
    // rows, not an error.
    const { data, error } = await memberClient
      .from("company_members")
      .update({ company_role: "owner" })
      .eq("company_id", companyId)
      .eq("user_id", memberUserId)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: unchanged } = await owner.from("company_members").select("company_role").eq("company_id", companyId).eq("user_id", memberUserId).single();
    expect(unchanged?.company_role).toBe("member");
  });

  it("15b. even a company admin cannot create or promote anyone to owner", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: adminClient, userId: adminUserId } = await createFreshUser();
    await addMember(owner, companyId, adminUserId, "admin");

    const { userId: targetUserId } = await createFreshUser();
    const { error: insertOwnerError } = await adminClient
      .from("company_members")
      .insert({ company_id: companyId, user_id: targetUserId, company_role: "owner" });
    expect(insertOwnerError).not.toBeNull();

    const { error: updateOwnerError } = await adminClient
      .from("company_members")
      .update({ company_role: "owner" })
      .eq("company_id", companyId)
      .eq("user_id", adminUserId);
    expect(updateOwnerError).not.toBeNull();
  });

  it("15c. the owner row itself can never be touched by an admin (protects against demoting/removing the owner)", async () => {
    const { client: owner, userId: ownerId, companyId } = await createFreshCompanyOwner();
    const { client: adminClient, userId: adminUserId } = await createFreshUser();
    await addMember(owner, companyId, adminUserId, "admin");

    const { data: updateData, error: updateError } = await adminClient
      .from("company_members")
      .update({ company_role: "member" })
      .eq("company_id", companyId)
      .eq("user_id", ownerId)
      .select();
    expect(updateError).toBeNull();
    expect(updateData).toEqual([]);

    const { data: deleteData, error: deleteError } = await adminClient
      .from("company_members")
      .delete()
      .eq("company_id", companyId)
      .eq("user_id", ownerId)
      .select();
    expect(deleteError).toBeNull();
    expect(deleteData).toEqual([]);

    const { data: stillOwner } = await owner.from("company_members").select("company_role").eq("company_id", companyId).eq("user_id", ownerId).single();
    expect(stillOwner?.company_role).toBe("owner");
  });

  it("16. Company A's admin cannot add a member to Company B", async () => {
    const { client: ownerA, companyId: companyA } = await createFreshCompanyOwner();
    const { client: adminAClient, userId: adminAUserId } = await createFreshUser();
    await addMember(ownerA, companyA, adminAUserId, "admin");

    const { companyId: companyB } = await createFreshCompanyOwner();
    const { userId: targetUserId } = await createFreshUser();

    const { error } = await adminAClient.from("company_members").insert({ company_id: companyB, user_id: targetUserId, company_role: "member" });
    expect(error).not.toBeNull();
  });

  it("17. Company A's admin cannot modify Company B's membership", async () => {
    const { client: ownerA, companyId: companyA } = await createFreshCompanyOwner();
    const { client: adminAClient, userId: adminAUserId } = await createFreshUser();
    await addMember(ownerA, companyA, adminAUserId, "admin");

    const { client: ownerB, companyId: companyB } = await createFreshCompanyOwner();
    const { userId: memberBUserId } = await createFreshUser();
    await addMember(ownerB, companyB, memberBUserId, "member");

    const { data, error } = await adminAClient
      .from("company_members")
      .update({ company_role: "admin" })
      .eq("company_id", companyB)
      .eq("user_id", memberBUserId)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("18. a user with no company membership cannot access any company data", async () => {
    const { companyId } = await createFreshCompanyOwner();
    const { client: outsider } = await createFreshUser();

    const { data: companiesData } = await outsider.from("companies").select("id").eq("id", companyId);
    expect(companiesData).toEqual([]);

    const { data: membersData } = await outsider.from("company_members").select("user_id").eq("company_id", companyId);
    expect(membersData).toEqual([]);
  });
});

describe("Platform boundary (negative)", () => {
  it("19. a company admin cannot manage a platform-owned internship as if it were their own", async () => {
    const { data: platformInternship } = await admin
      .from("internships")
      .insert({ title: "Platform-owned fixture", description: "x", requirements: "x", eligibility: "x" })
      .select("id")
      .single();
    const { client: companyAdmin } = await createFreshCompanyOwner();

    const { data, error } = await companyAdmin
      .from("internships")
      .update({ status: "open" })
      .eq("id", platformInternship!.id)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("20. company ownership does not make a user a platform admin", async () => {
    const { client: owner } = await createFreshCompanyOwner();
    const { data } = await owner.from("audit_logs").select("id");
    expect(data).toEqual([]); // is_current_user_admin() is unaffected by company_members
  });

  it("21. a company role does not grant access to audit_logs", async () => {
    const { client: owner, companyId } = await createFreshCompanyOwner();
    const { client: adminClient, userId: adminUserId } = await createFreshUser();
    await addMember(owner, companyId, adminUserId, "admin");

    const { data, error } = await adminClient.from("audit_logs").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("22. a company role does not grant platform-admin RPC operations for a platform-owned application (review_application)", async () => {
    // Phase 5B-3 intentionally extends review_application() to accept a
    // company owner/admin reviewing THEIR OWN company's application (see
    // company-platform-review.test.ts, tests #1-#11) — that is no longer
    // "platform-admin only". What must still hold is narrower: a company
    // role grants no authority over a platform-owned internship
    // (company_id IS NULL), which can only ever be reviewed by a real
    // platform admin.
    const { client: owner } = await createFreshCompanyOwner();
    const { data: internship, error: internshipError } = await admin
      .from("internships")
      .insert({
        title: `Platform Internship ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        description: "x",
        requirements: "x",
        eligibility: "x",
        status: "open",
      })
      .select("id")
      .single();
    if (internshipError || !internship) throw new Error(`Setup failure: ${internshipError?.message}`);
    const { client: student, userId: studentId } = await createFreshStudent();
    const applicationId = await createApplication(student, studentId, internship.id as string);

    const { error } = await owner.rpc("review_application", {
      app_uuid: applicationId,
      review_status: "accepted",
      feedback: null,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });
});

describe("Anonymous access (negative)", () => {
  it("23. anon cannot SELECT companies", async () => {
    const anon = trackedClient(); // never signed in
    const { data, error } = await anon.from("companies").select("id");
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("24. anon cannot SELECT company_members", async () => {
    const anon = trackedClient();
    const { data, error } = await anon.from("company_members").select("user_id");
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("25. anon cannot INSERT companies", async () => {
    const anon = trackedClient();
    const { data, error } = await anon.from("companies").insert({ name: "Anon company attempt" });
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("26. anon cannot INSERT company_members", async () => {
    const anon = trackedClient();
    const { data, error } = await anon
      .from("company_members")
      .insert({ company_id: "00000000-0000-0000-0000-000000000000", user_id: "00000000-0000-0000-0000-000000000000", company_role: "member" });
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("anon cannot call create_company()", async () => {
    const anon = trackedClient();
    const { error } = await anon.rpc("create_company", { company_name: "Anon RPC attempt", company_description: null });
    expect(error).not.toBeNull();
  });
});
