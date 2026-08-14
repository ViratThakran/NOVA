/**
 * SERVICE CATALOG TESTS (Integration) — Phase 8A
 *
 * Exercises the RLS/GRANT model for service_categories/services: the same
 * published-content pattern Phase 7 established for programs/courses, now
 * applied to the AI-first service catalog. Verifies published-only public
 * visibility (anon AND authenticated non-admins), draft invisibility,
 * admin-only writes, and the DB-level constraints (automation_level CHECK,
 * category_id FK, unique slug) that protect data integrity even for a
 * legitimate admin caller.
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
  const { client, userId } = await createFreshUser("svc-owner");
  const { error } = await client.rpc("create_company", { company_name: unique("Service Test Co"), company_description: "fixture" });
  if (error) throw new Error(`Setup failure: ${error.message}`);
  return { client, userId };
}

async function createCategory(published: boolean) {
  const { data, error } = await admin
    .from("service_categories")
    .insert({ slug: unique("cat"), name: "Fixture Category", description: "x", published })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

async function createService(categoryId: string, published: boolean, overrides: Record<string, unknown> = {}) {
  const { data, error } = await admin
    .from("services")
    .insert({
      category_id: categoryId,
      slug: unique("svc"),
      name: "Fixture Service",
      short_description: "x",
      description: "x",
      automation_level: "autonomous",
      published,
      ...overrides,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Setup failure: ${error?.message}`);
  return data.id as string;
}

describe("Public — service categories", () => {
  it("1. anon can read published categories", async () => {
    const anon = trackedClient();
    const categoryId = await createCategory(true);
    const { data, error } = await anon.from("service_categories").select("id").eq("id", categoryId);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: categoryId }]);
  });

  it("3. anon cannot see unpublished categories", async () => {
    const anon = trackedClient();
    const categoryId = await createCategory(false);
    const { data, error } = await anon.from("service_categories").select("id").eq("id", categoryId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe("Public — services", () => {
  it("2. anon can read published services in a published category", async () => {
    const anon = trackedClient();
    const categoryId = await createCategory(true);
    const serviceId = await createService(categoryId, true);
    const { data, error } = await anon.from("services").select("id").eq("id", serviceId);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: serviceId }]);
  });

  it("4. anon cannot see unpublished services", async () => {
    const anon = trackedClient();
    const categoryId = await createCategory(true);
    const serviceId = await createService(categoryId, false);
    const { data, error } = await anon.from("services").select("id").eq("id", serviceId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("17. a published service never leaks through the public query when its category is unpublished", async () => {
    const anon = trackedClient();
    const categoryId = await createCategory(false);
    const serviceId = await createService(categoryId, true);
    const { data, error } = await anon.from("services").select("id").eq("id", serviceId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe("Public — anonymous cannot write", () => {
  it("5. anon cannot insert a category or a service", async () => {
    const anon = trackedClient();
    const { error: catError } = await anon.from("service_categories").insert({ slug: unique("anon-cat"), name: "x", published: true });
    expect(catError).not.toBeNull();

    const categoryId = await createCategory(true);
    const { error: svcError } = await anon
      .from("services")
      .insert({ category_id: categoryId, slug: unique("anon-svc"), name: "x", short_description: "x", description: "x", automation_level: "autonomous" });
    expect(svcError).not.toBeNull();
  });

  it("6. anon cannot update a category or a service", async () => {
    const anon = trackedClient();
    const categoryId = await createCategory(true);
    const serviceId = await createService(categoryId, true);

    const { data: catData, error: catError } = await anon.from("service_categories").update({ name: "Hacked" }).eq("id", categoryId).select("id");
    expect(catError).not.toBeNull();
    expect(catData).toBeNull();

    const { data: svcData, error: svcError } = await anon.from("services").update({ name: "Hacked" }).eq("id", serviceId).select("id");
    expect(svcError).not.toBeNull();
    expect(svcData).toBeNull();
  });

  it("7. anon cannot delete a category or a service", async () => {
    const anon = trackedClient();
    const categoryId = await createCategory(true);
    const serviceId = await createService(categoryId, true);

    const { error: catError } = await anon.from("service_categories").delete().eq("id", categoryId);
    expect(catError).not.toBeNull();
    const { error: svcError } = await anon.from("services").delete().eq("id", serviceId);
    expect(svcError).not.toBeNull();

    const { data: stillThere } = await admin.from("services").select("id").eq("id", serviceId);
    expect(stillThere).toEqual([{ id: serviceId }]);
  });
});

describe("Authenticated non-admin access (student/company)", () => {
  it("8. a student can read published services", async () => {
    const { client: student } = await createFreshUser("svc-student");
    const categoryId = await createCategory(true);
    const serviceId = await createService(categoryId, true);
    const { data, error } = await student.from("services").select("id").eq("id", serviceId);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: serviceId }]);
  });

  it("9. a company user can read published services (no special catalog role)", async () => {
    const { client: owner } = await createFreshCompanyOwner();
    const categoryId = await createCategory(true);
    const serviceId = await createService(categoryId, true);
    const { data, error } = await owner.from("services").select("id").eq("id", serviceId);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: serviceId }]);
  });

  it("10 / 16. a student cannot insert, update, or delete a service", async () => {
    const { client: student } = await createFreshUser("svc-student-write");
    const categoryId = await createCategory(true);

    const { error: insertError } = await student
      .from("services")
      .insert({ category_id: categoryId, slug: unique("student-svc"), name: "x", short_description: "x", description: "x", automation_level: "autonomous" });
    expect(insertError).not.toBeNull();

    const serviceId = await createService(categoryId, true);
    const { data: updateData, error: updateError } = await student.from("services").update({ name: "Hacked" }).eq("id", serviceId).select("id");
    expect(updateError).toBeNull();
    expect(updateData).toEqual([]); // silent RLS filter, not a grant-level error

    const { error: deleteError } = await student.from("services").delete().eq("id", serviceId);
    expect(deleteError).toBeNull();
    const { data: stillThere } = await admin.from("services").select("id").eq("id", serviceId);
    expect(stillThere).toEqual([{ id: serviceId }]);
  });
});

describe("Admin management", () => {
  it("11. admin can read unpublished categories and services", async () => {
    const categoryId = await createCategory(false);
    const serviceId = await createService(categoryId, false);

    const { data: catData, error: catError } = await admin.from("service_categories").select("id").eq("id", categoryId);
    expect(catError).toBeNull();
    expect(catData).toEqual([{ id: categoryId }]);

    const { data: svcData, error: svcError } = await admin.from("services").select("id").eq("id", serviceId);
    expect(svcError).toBeNull();
    expect(svcData).toEqual([{ id: serviceId }]);
  });

  it("12. admin can create a service", async () => {
    const categoryId = await createCategory(true);
    const { data, error } = await admin
      .from("services")
      .insert({
        category_id: categoryId,
        slug: unique("admin-created"),
        name: "Admin Created Service",
        short_description: "x",
        description: "x",
        automation_level: "autonomous",
      })
      .select("id, published")
      .single();
    expect(error).toBeNull();
    expect(data?.published).toBe(false); // published defaults to false, matching the internships 'draft' precedent
  });

  it("13. admin can update a service's content", async () => {
    const categoryId = await createCategory(true);
    const serviceId = await createService(categoryId, true);
    const { error } = await admin.from("services").update({ name: "Updated Name" }).eq("id", serviceId);
    expect(error).toBeNull();
    const { data } = await admin.from("services").select("name").eq("id", serviceId).single();
    expect(data?.name).toBe("Updated Name");
  });

  it("14. admin can publish and unpublish a service", async () => {
    const categoryId = await createCategory(true);
    const serviceId = await createService(categoryId, false);

    const { error: publishError } = await admin.from("services").update({ published: true }).eq("id", serviceId);
    expect(publishError).toBeNull();
    const { data: afterPublish } = await admin.from("services").select("published").eq("id", serviceId).single();
    expect(afterPublish?.published).toBe(true);

    const { error: unpublishError } = await admin.from("services").update({ published: false }).eq("id", serviceId);
    expect(unpublishError).toBeNull();
    const { data: afterUnpublish } = await admin.from("services").select("published").eq("id", serviceId).single();
    expect(afterUnpublish?.published).toBe(false);
  });

  it("15. admin can delete a service", async () => {
    const categoryId = await createCategory(true);
    const serviceId = await createService(categoryId, true);
    const { error } = await admin.from("services").delete().eq("id", serviceId);
    expect(error).toBeNull();
    const { data } = await admin.from("services").select("id").eq("id", serviceId);
    expect(data).toEqual([]);
  });
});

describe("Data integrity (DB-level constraints, even for admin)", () => {
  it("18. an invalid automation_level is rejected by the CHECK constraint", async () => {
    const categoryId = await createCategory(true);
    const { error } = await admin
      .from("services")
      .insert({ category_id: categoryId, slug: unique("bad-automation"), name: "x", short_description: "x", description: "x", automation_level: "human_required" });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/violates check constraint|automation_level/i);
  });

  it("19. an invalid category_id is rejected by the foreign key constraint", async () => {
    const { error } = await admin.from("services").insert({
      category_id: "00000000-0000-0000-0000-000000000000",
      slug: unique("bad-category"),
      name: "x",
      short_description: "x",
      description: "x",
      automation_level: "autonomous",
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/foreign key|violates/i);
  });

  it("20. a duplicate service slug is rejected by the unique constraint", async () => {
    const categoryId = await createCategory(true);
    const slug = unique("dup-slug");
    const { error: firstError } = await admin
      .from("services")
      .insert({ category_id: categoryId, slug, name: "First", short_description: "x", description: "x", automation_level: "autonomous" });
    expect(firstError).toBeNull();

    const { error: secondError } = await admin
      .from("services")
      .insert({ category_id: categoryId, slug, name: "Second", short_description: "x", description: "x", automation_level: "autonomous" });
    expect(secondError).not.toBeNull();
    expect(secondError!.code).toBe("23505");
  });

  it("a duplicate category slug is rejected by the unique constraint", async () => {
    const slug = unique("dup-cat-slug");
    const { error: firstError } = await admin.from("service_categories").insert({ slug, name: "First", published: true });
    expect(firstError).toBeNull();

    const { error: secondError } = await admin.from("service_categories").insert({ slug, name: "Second", published: true });
    expect(secondError).not.toBeNull();
    expect(secondError!.code).toBe("23505");
  });
});
