/**
 * RLS NEGATIVE SECURITY TESTS
 *
 * These tests prove that a normal authenticated student CANNOT perform
 * unauthorized database operations. Each test asserts that the operation
 * is rejected by Row Level Security.
 *
 * REQUIRES: Local Supabase running (`npx supabase start`)
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Test credentials - created in supabase/seed.sql
const STUDENT_A_EMAIL = "student-a@test.nova";
const STUDENT_A_PASSWORD = "TestPassword123!";
const STUDENT_B_EMAIL = "student-b@test.nova";
const STUDENT_B_PASSWORD = "TestPassword123!";

let studentA: SupabaseClient;
let studentB: SupabaseClient;
let studentAId: string;
let studentBId: string;

beforeAll(async () => {
  studentA = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  studentB = createClient(SUPABASE_URL, PUBLISHABLE_KEY);

  const { data: dataA } = await studentA.auth.signInWithPassword({
    email: STUDENT_A_EMAIL,
    password: STUDENT_A_PASSWORD,
  });
  const { data: dataB } = await studentB.auth.signInWithPassword({
    email: STUDENT_B_EMAIL,
    password: STUDENT_B_PASSWORD,
  });

  studentAId = dataA.user!.id;
  studentBId = dataB.user!.id;
});

afterAll(async () => {
  await studentA.auth.signOut();
  await studentB.auth.signOut();
});

describe("RLS Negative Tests — Student Unauthorized Operations", () => {
  // ---- PROFILE ISOLATION ----

  it("1. Student A cannot UPDATE Student B's profile", async () => {
    const { error } = await studentA
      .from("profiles")
      .update({ first_name: "Hacked" })
      .eq("id", studentBId);

    expect(error).not.toBeNull();
    // Should return 0 rows updated (RLS blocks silently) or an explicit error
  });

  it("2. Student A cannot SELECT Student B's private student_profile", async () => {
    const { data, error } = await studentA
      .from("student_profiles")
      .select("*")
      .eq("id", studentBId);

    // RLS ensures only own rows returned — no data for B
    expect(data).toHaveLength(0);
  });

  // ---- ROLE ESCALATION ----

  it("3. Student A cannot INSERT a user_role", async () => {
    const { error } = await studentA
      .from("user_roles")
      .insert({ user_id: studentAId, role: "admin" });

    expect(error).not.toBeNull();
  });

  it("4. Student A cannot UPDATE their own role via user_roles table", async () => {
    const { error } = await studentA
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", studentAId);

    expect(error).not.toBeNull();
  });

  it("5. Student A cannot DELETE a role", async () => {
    const { error } = await studentA
      .from("user_roles")
      .delete()
      .eq("user_id", studentAId);

    expect(error).not.toBeNull();
  });

  // ---- APPLICATION SECURITY ----

  it("6. Student A cannot directly UPDATE an application row", async () => {
    // First get any application id via studentA's own application
    const { data: apps } = await studentA
      .from("applications")
      .select("id")
      .limit(1);

    if (!apps || apps.length === 0) return; // No app exists yet — test N/A

    const { error } = await studentA
      .from("applications")
      .update({ status: "accepted" })
      .eq("id", apps[0].id);

    expect(error).not.toBeNull();
  });

  it("7. Student A cannot change application status (no UPDATE policy)", async () => {
    const { data: apps } = await studentA
      .from("applications")
      .select("id")
      .limit(1);

    if (!apps || apps.length === 0) return;

    const { error } = await studentA
      .from("applications")
      .update({ status: "rejected" })
      .eq("id", apps[0].id);

    expect(error).not.toBeNull();
  });

  // ---- ENROLLMENT SECURITY ----

  it("8. Student A cannot INSERT an enrollment directly", async () => {
    const { error } = await studentA.from("enrollments").insert({
      student_id: studentAId,
      internship_id: "00000000-0000-0000-0000-000000000001",
      application_id: "00000000-0000-0000-0000-000000000002",
      status: "active",
    });

    expect(error).not.toBeNull();
  });

  // ---- AUDIT LOG SECURITY ----

  it("9. Student A cannot INSERT an audit_log directly", async () => {
    const { error } = await studentA.from("audit_logs").insert({
      actor_id: studentAId,
      action: "fake_action",
      resource_type: "application",
      resource_id: "00000000-0000-0000-0000-000000000001",
      changes: {},
    });

    expect(error).not.toBeNull();
  });

  it("10. Student A cannot UPDATE an audit_log", async () => {
    const { error } = await studentA
      .from("audit_logs")
      .update({ action: "tampered" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    expect(error).not.toBeNull();
  });

  it("11. Student A cannot DELETE an audit_log", async () => {
    const { error } = await studentA
      .from("audit_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    expect(error).not.toBeNull();
  });

  it("12. Student A cannot execute write_audit_log() directly via RPC", async () => {
    const { error } = await studentA.rpc("write_audit_log", {
      action_name: "fake_action",
      res_type: "application",
      res_uuid: "00000000-0000-0000-0000-000000000001",
      payload: {},
    });

    // Must receive a permission denied error
    expect(error).not.toBeNull();
    expect(error!.message.toLowerCase()).toMatch(/permission denied|not found|does not exist/);
  });

  it("13. Student A cannot execute review_application() to approve/reject", async () => {
    const { error } = await studentA.rpc("review_application", {
      app_uuid: "00000000-0000-0000-0000-000000000001",
      review_status: "accepted",
      feedback: "hacked",
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Unauthorized/);
  });

  // ---- STORAGE SECURITY ----

  it("14. Student A cannot read Student B's private resume", async () => {
    const { data, error } = await studentA.storage
      .from("resumes")
      .download(`${studentBId}/resume.pdf`);

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  // ---- NOTIFICATION SECURITY ----

  it("15. Student A cannot UPDATE Student B's notification", async () => {
    const { error } = await studentA
      .from("notifications")
      .update({ read: true })
      .eq("user_id", studentBId);

    expect(error).not.toBeNull();
  });

  // ---- PRIVILEGED USER CREATION ----

  it("16. Student A cannot create privileged roles via user_roles INSERT", async () => {
    const privilegedRoles = [
      "admin",
      "super_admin",
      "mentor",
      "recruiter",
      "finance_user",
      "company_admin",
    ];

    for (const role of privilegedRoles) {
      const { error } = await studentA
        .from("user_roles")
        .insert({ user_id: studentAId, role });

      expect(error).not.toBeNull();
    }
  });
});
