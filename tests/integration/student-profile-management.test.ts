/**
 * STUDENT PROFILE MANAGEMENT TESTS (Integration) — Phase 6C
 *
 * Exercises the query/RLS shapes updateStudentProfileAction and
 * replaceResumeAction wrap (src/app/student/actions.ts), plus the new
 * createSignedUrl() usage on /student/profile (previously only
 * .upload()/.download()/.remove() were exercised for the resumes bucket —
 * see storage-security.test.ts). Fresh fixtures per test, not the shared
 * seeded students.
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

const makePdfBlob = (size: number = 1024) => {
  const header = "%PDF-1.4\n";
  const padding = "a".repeat(Math.max(0, size - header.length));
  return new Blob([header + padding], { type: "application/pdf" });
};

async function createOnboardedStudent(prefix = "profile-mgmt") {
  const email = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) throw new Error(`Setup failure: ${error?.message}`);
  const userId = data.user.id;

  const resumePath = `${userId}/resume.pdf`;
  const { error: uploadError } = await client.storage
    .from("resumes")
    .upload(resumePath, makePdfBlob(), { contentType: "application/pdf", upsert: true });
  if (uploadError) throw new Error(`Setup failure: ${uploadError.message}`);

  const { error: profileError } = await client.from("student_profiles").upsert({
    id: userId,
    education_info: { school: "Original University", degree: "CS", grad_year: 2027 },
    skills: ["TypeScript"],
    resume_path: resumePath,
    resume_size: 1024,
  });
  if (profileError) throw new Error(`Setup failure: ${profileError.message}`);

  return { client, userId };
}

describe("Student profile edit (what updateStudentProfileAction wraps)", () => {
  it("a student can update their own name and academic info", async () => {
    const { client, userId } = await createOnboardedStudent();

    const { error: nameError } = await client
      .from("profiles")
      .update({ first_name: "Updated", last_name: "Name" })
      .eq("id", userId);
    expect(nameError).toBeNull();

    const { error: academicError } = await client
      .from("student_profiles")
      .update({ education_info: { school: "New University", degree: "SE", grad_year: 2029 }, skills: ["Go", "SQL"] })
      .eq("id", userId);
    expect(academicError).toBeNull();

    const { data: profile } = await client.from("profiles").select("first_name, last_name").eq("id", userId).single();
    expect(profile?.first_name).toBe("Updated");

    const { data: studentProfile } = await client.from("student_profiles").select("skills").eq("id", userId).single();
    expect(studentProfile?.skills).toEqual(["Go", "SQL"]);
  });

  it("a student cannot update another student's profile or academic info", async () => {
    const { userId: targetId } = await createOnboardedStudent("profile-mgmt-target");
    const { client: otherClient } = await createOnboardedStudent("profile-mgmt-other");

    const { data: nameData, error: nameError } = await otherClient
      .from("profiles")
      .update({ first_name: "Hacked" })
      .eq("id", targetId)
      .select("id");
    // Silent RLS filter (USING auth.uid() = id) — zero rows affected, no error.
    expect(nameError).toBeNull();
    expect(nameData).toEqual([]);

    const { data: academicData, error: academicError } = await otherClient
      .from("student_profiles")
      .update({ skills: ["Hacked"] })
      .eq("id", targetId)
      .select("id");
    expect(academicError).toBeNull();
    expect(academicData).toEqual([]);
  });
});

describe("Resume replace (what replaceResumeAction wraps)", () => {
  it("a student can replace their own resume in place (upsert) and update resume_size", async () => {
    const { client, userId } = await createOnboardedStudent();
    const resumePath = `${userId}/resume.pdf`;

    const { error: uploadError } = await client.storage
      .from("resumes")
      .upload(resumePath, makePdfBlob(2048), { contentType: "application/pdf", upsert: true });
    expect(uploadError).toBeNull();

    const { error: updateError } = await client.from("student_profiles").update({ resume_path: resumePath, resume_size: 2048 }).eq("id", userId);
    expect(updateError).toBeNull();

    const { data } = await client.from("student_profiles").select("resume_size").eq("id", userId).single();
    expect(data?.resume_size).toBe(2048);
  });

  it("a student cannot replace another student's resume", async () => {
    const { userId: targetId } = await createOnboardedStudent("profile-mgmt-resume-target");
    const { client: otherClient } = await createOnboardedStudent("profile-mgmt-resume-other");

    const { error } = await otherClient.storage
      .from("resumes")
      .upload(`${targetId}/resume.pdf`, makePdfBlob(), { contentType: "application/pdf", upsert: true });
    expect(error).not.toBeNull();
  });
});

describe("Resume signed URL (what the profile page's download link wraps)", () => {
  it("a student can generate a signed URL for their own resume", async () => {
    const { client, userId } = await createOnboardedStudent();
    const { data, error } = await client.storage.from("resumes").createSignedUrl(`${userId}/resume.pdf`, 60);
    expect(error).toBeNull();
    expect(data?.signedUrl).toBeTruthy();
  });

  it("a student cannot generate a signed URL for another student's resume", async () => {
    const { userId: targetId } = await createOnboardedStudent("profile-mgmt-signed-target");
    const { client: otherClient } = await createOnboardedStudent("profile-mgmt-signed-other");

    const { data, error } = await otherClient.storage.from("resumes").createSignedUrl(`${targetId}/resume.pdf`, 60);
    expect(data?.signedUrl).toBeFalsy();
    expect(error).not.toBeNull();
  });

  it("an admin can generate a signed URL for any student's resume", async () => {
    const { userId: targetId } = await createOnboardedStudent("profile-mgmt-signed-admin-target");
    const admin = trackedClient();
    const { error: signInError } = await admin.auth.signInWithPassword({ email: "admin@test.nova", password: "TestPassword123!" });
    if (signInError) throw new Error(`Setup failure: ${signInError.message}`);

    const { data, error } = await admin.storage.from("resumes").createSignedUrl(`${targetId}/resume.pdf`, 60);
    expect(error).toBeNull();
    expect(data?.signedUrl).toBeTruthy();
  });
});
