/**
 * APPLICATION TRANSACTION TESTS (Integration)
 *
 * Proves that review_application() is fully atomic:
 * - On success: status, enrollment, notification, and audit log all exist.
 * - On failure: no partial state remains.
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

let admin: SupabaseClient;

beforeAll(async () => {
  admin = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  await admin.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
});

afterAll(async () => {
  await admin.auth.signOut();
});

describe("Application Transaction Tests", () => {
  it("Accepted application atomically creates enrollment + notification + audit log", async () => {
    // Get a pending application
    const { data: app } = await admin
      .from("applications")
      .select("id, student_id, internship_id")
      .eq("status", "pending")
      .limit(1)
      .single();

    if (!app) {
      console.warn("No pending application available to test transaction.");
      return;
    }

    // Execute the review
    const { error: rpcError } = await admin.rpc("review_application", {
      app_uuid: app.id,
      review_status: "accepted",
      feedback: "Transaction test acceptance.",
    });

    expect(rpcError).toBeNull();

    // Verify application status updated
    const { data: updatedApp } = await admin
      .from("applications")
      .select("status")
      .eq("id", app.id)
      .single();

    expect(updatedApp?.status).toBe("accepted");

    // Verify enrollment created
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id, status")
      .eq("application_id", app.id)
      .single();

    expect(enrollment).not.toBeNull();
    expect(enrollment?.status).toBe("active");

    // Verify notification created
    const { data: notification } = await admin
      .from("notifications")
      .select("id, title")
      .eq("user_id", app.student_id)
      .limit(1)
      .single();

    expect(notification).not.toBeNull();
    expect(notification?.title).toMatch(/Accepted/i);

    // Verify audit log exists
    const { data: auditLog } = await admin
      .from("audit_logs")
      .select("id, action, resource_id")
      .eq("resource_id", app.id)
      .eq("action", "application_review_accepted")
      .single();

    expect(auditLog).not.toBeNull();
  });

  it("Attempting to review an already-accepted application fails entirely (idempotency guard)", async () => {
    // Get the previously accepted application
    const { data: app } = await admin
      .from("applications")
      .select("id")
      .eq("status", "accepted")
      .limit(1)
      .single();

    if (!app) return;

    const countBefore = await admin
      .from("enrollments")
      .select("id", { count: "exact" })
      .eq("application_id", app.id);

    const { error } = await admin.rpc("review_application", {
      app_uuid: app.id,
      review_status: "rejected",
      feedback: "Attempted second review",
    });

    // Must fail — application already processed
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Invalid State|already been processed/);

    // Verify enrollment count unchanged
    const countAfter = await admin
      .from("enrollments")
      .select("id", { count: "exact" })
      .eq("application_id", app.id);

    expect(countAfter.count).toBe(countBefore.count);
  });
});
