"use server";

import { redirect } from "next/navigation";
import { createServerSideClient } from "@/lib/supabase";
import { onboardingSchema } from "@/lib/validation";
import type { OnboardingActionState } from "./action-state";

// Mirrors the "resumes" bucket's own file_size_limit (see
// supabase/migrations: STORAGE: RESUME BUCKET) so an oversized file is
// rejected with a clear message before even attempting the upload, rather
// than relying solely on the bucket rejecting it after the fact.
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export async function completeOnboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const school = formData.get("school");
  const degree = formData.get("degree");
  const gradYearRaw = formData.get("grad_year");
  const skillsRaw = formData.get("skills");
  const resumeFile = formData.get("resume");

  const gradYear = typeof gradYearRaw === "string" ? Number(gradYearRaw) : NaN;
  const skills =
    typeof skillsRaw === "string"
      ? skillsRaw
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [];

  if (!(resumeFile instanceof File) || resumeFile.size === 0) {
    return { status: "error", message: "Please attach your resume as a PDF." };
  }
  if (resumeFile.type !== "application/pdf") {
    return { status: "error", message: "Resume must be a PDF file." };
  }
  if (resumeFile.size > MAX_RESUME_BYTES) {
    return { status: "error", message: "Resume must be 5MB or smaller." };
  }

  // The path's first segment MUST be the caller's own auth.uid() — the
  // storage RLS policies require it (see "Students can upload own resume
  // as PDF" in the migration). user.id comes from the authenticated server
  // session above, never from the browser, so there's no way for a client
  // to write into another student's folder.
  const resumePath = `${user.id}/resume.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(resumePath, resumeFile, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    console.error("completeOnboardingAction upload:", uploadError);
    return { status: "error", message: "We couldn't upload your resume. Please try again." };
  }

  const parsed = onboardingSchema.safeParse({
    education_info: { school, degree, grad_year: gradYear },
    skills,
    resume_path: resumePath,
    resume_size: resumeFile.size,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // id is set to the authenticated user's own id — student_profiles' RLS
  // (INSERT/UPDATE WITH CHECK auth.uid() = id) would reject anything else
  // regardless, but this never even gives a client the chance to try.
  const { error: profileError } = await supabase
    .from("student_profiles")
    .upsert({ id: user.id, ...parsed.data });

  if (profileError) {
    console.error("completeOnboardingAction student_profiles:", profileError);
    return { status: "error", message: "We couldn't save your profile. Please try again." };
  }

  const { error: onboardedError } = await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);

  if (onboardedError) {
    console.error("completeOnboardingAction profiles:", onboardedError);
    return { status: "error", message: "We couldn't finish onboarding. Please try again." };
  }

  redirect("/student/dashboard");
}
