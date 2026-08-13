/**
 * STORAGE SECURITY TESTS (Integration)
 *
 * Proves the private resumes bucket enforces access control:
 * - Student can upload/read/replace/delete their own resume.
 * - Student CANNOT access another student's resume.
 * - Admin CAN access authorized student resumes.
 * - Rejects non-PDFs, files > 5MB, and path traversal attempts.
 *
 * REQUIRES: Local Supabase running (`npx supabase start`)
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const STUDENT_A_EMAIL = "student-a@test.nova";
const STUDENT_A_PASSWORD = "TestPassword123!";
const STUDENT_B_EMAIL = "student-b@test.nova";
const STUDENT_B_PASSWORD = "TestPassword123!";
const ADMIN_EMAIL = "admin@test.nova";
const ADMIN_PASSWORD = "TestPassword123!";

let studentA: SupabaseClient;
let studentB: SupabaseClient;
let admin: SupabaseClient;
let studentAId: string;
let studentBId: string;

// Minimal valid PDF header (fake but structurally valid enough for extension checks)
const makePdfBlob = (size: number = 1024) => {
  const header = "%PDF-1.4\n";
  const padding = "a".repeat(Math.max(0, size - header.length));
  return new Blob([header + padding], { type: "application/pdf" });
};

const makeNonPdfBlob = () =>
  new Blob(["<html><body>Not a PDF</body></html>"], { type: "text/html" });

const makeLargePdfBlob = () => makePdfBlob(6 * 1024 * 1024); // 6MB

beforeAll(async () => {
  studentA = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  studentB = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  admin = createClient(SUPABASE_URL, PUBLISHABLE_KEY);

  const { data: dataA, error: errorA } = await studentA.auth.signInWithPassword({
    email: STUDENT_A_EMAIL,
    password: STUDENT_A_PASSWORD,
  });
  if (errorA || !dataA.user) {
    throw new Error(
      `Setup failed: could not authenticate ${STUDENT_A_EMAIL}: ${errorA?.message ?? "no user returned"}`
    );
  }

  const { data: dataB, error: errorB } = await studentB.auth.signInWithPassword({
    email: STUDENT_B_EMAIL,
    password: STUDENT_B_PASSWORD,
  });
  if (errorB || !dataB.user) {
    throw new Error(
      `Setup failed: could not authenticate ${STUDENT_B_EMAIL}: ${errorB?.message ?? "no user returned"}`
    );
  }

  const { error: errorAdmin } = await admin.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (errorAdmin) {
    throw new Error(`Setup failed: could not authenticate ${ADMIN_EMAIL}: ${errorAdmin.message}`);
  }

  studentAId = dataA.user.id;
  studentBId = dataB.user.id;
});

afterAll(async () => {
  // Clean up uploaded test files
  await studentA.storage.from("resumes").remove([`${studentAId}/resume.pdf`]);
  await studentA.auth.signOut();
  await studentB.auth.signOut();
  await admin.auth.signOut();
});

describe("Storage Security — Resume Bucket", () => {
  it("Student A can upload their own resume (valid PDF, under 5MB)", async () => {
    const { error } = await studentA.storage
      .from("resumes")
      .upload(`${studentAId}/resume.pdf`, makePdfBlob(), {
        contentType: "application/pdf",
        upsert: true,
      });

    expect(error).toBeNull();
  });

  it("Student A can read their own resume", async () => {
    const { data, error } = await studentA.storage
      .from("resumes")
      .download(`${studentAId}/resume.pdf`);

    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it("Student A can replace their own resume", async () => {
    const { error } = await studentA.storage
      .from("resumes")
      .update(`${studentAId}/resume.pdf`, makePdfBlob(2048), {
        contentType: "application/pdf",
      });

    expect(error).toBeNull();
  });

  it("Student A can delete their own resume", async () => {
    // Upload first, then delete
    await studentA.storage
      .from("resumes")
      .upload(`${studentAId}/delete-me.pdf`, makePdfBlob(), {
        contentType: "application/pdf",
        upsert: true,
      });

    const { error } = await studentA.storage
      .from("resumes")
      .remove([`${studentAId}/delete-me.pdf`]);

    expect(error).toBeNull();
  });

  it("Student A CANNOT read Student B's resume", async () => {
    // Ensure B has a resume uploaded first
    await studentB.storage
      .from("resumes")
      .upload(`${studentBId}/resume.pdf`, makePdfBlob(), {
        contentType: "application/pdf",
        upsert: true,
      });

    const { data, error } = await studentA.storage
      .from("resumes")
      .download(`${studentBId}/resume.pdf`);

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("Student A CANNOT replace Student B's resume", async () => {
    const { error } = await studentA.storage
      .from("resumes")
      .update(`${studentBId}/resume.pdf`, makePdfBlob(), {
        contentType: "application/pdf",
      });

    expect(error).not.toBeNull();
  });

  it("Student A CANNOT delete Student B's resume", async () => {
    const { error } = await studentA.storage
      .from("resumes")
      .remove([`${studentBId}/resume.pdf`]);

    // Should succeed silently (no rows deleted) or return error
    // Verify B's resume still exists
    const { data } = await studentB.storage
      .from("resumes")
      .download(`${studentBId}/resume.pdf`);

    expect(data).not.toBeNull();
  });

  it("Admin can read an authorized student's resume", async () => {
    const { data, error } = await admin.storage
      .from("resumes")
      .download(`${studentAId}/resume.pdf`);

    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it("Upload rejects a non-PDF file (application/html)", async () => {
    const { error } = await studentA.storage
      .from("resumes")
      .upload(`${studentAId}/hack.html`, makeNonPdfBlob(), {
        contentType: "text/html",
        upsert: true,
      });

    // RLS INSERT policy checks extension = 'pdf'
    expect(error).not.toBeNull();
  });

  it("Upload rejects a file > 5MB", async () => {
    const { error } = await studentA.storage
      .from("resumes")
      .upload(`${studentAId}/large.pdf`, makeLargePdfBlob(), {
        contentType: "application/pdf",
        upsert: true,
      });

    expect(error).not.toBeNull();
  });

  it("Path traversal attempt is blocked", async () => {
    const { error } = await studentA.storage
      .from("resumes")
      .download(`../../../etc/passwd`);

    expect(error).not.toBeNull();
  });

  it("Path injection with another user's ID in path is blocked", async () => {
    const { data, error } = await studentA.storage
      .from("resumes")
      .download(`${studentBId}/resume.pdf`);

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});
