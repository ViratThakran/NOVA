"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSideClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/auth";
import { onboardingSchema, studentProfileSchema, applicationSchema, markNotificationReadSchema } from "@/lib/validation";
import type { OnboardingActionState, ApplicationActionState, NotificationActionState, ProfileActionState } from "./action-state";

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

export async function submitApplicationAction(
  _prevState: ApplicationActionState,
  formData: FormData
): Promise<ApplicationActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, user, roles } = auth;

  if (!roles.includes("student")) {
    return { status: "error", message: "Only students can submit internship applications." };
  }

  const parsed = applicationSchema.safeParse({
    internship_id: formData.get("internship_id"),
    cover_letter: formData.get("cover_letter"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // Confirm the internship is actually open before attempting the insert.
  // The internships SELECT policy already hides non-open rows from students,
  // so a draft/closed/archived id simply won't be found here.
  const { data: internship, error: internshipError } = await supabase
    .from("internships")
    .select("id")
    .eq("id", parsed.data.internship_id)
    .eq("status", "open")
    .maybeSingle();

  if (internshipError) {
    console.error("submitApplicationAction internship lookup:", internshipError);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
  if (!internship) {
    return { status: "error", message: "This internship is not currently accepting applications." };
  }

  // student_id is the authenticated user's own id, derived from the session
  // — never read from formData, so there is no field for a client to spoof.
  // applications' RLS (INSERT WITH CHECK auth.uid() = student_id AND
  // has_current_user_role('student')) would reject anything else regardless.
  const { error: insertError } = await supabase.from("applications").insert({
    student_id: user.id,
    internship_id: parsed.data.internship_id,
    cover_letter: parsed.data.cover_letter,
  });

  if (insertError) {
    console.error("submitApplicationAction insert:", insertError);
    if (insertError.code === "23505") {
      return { status: "error", message: "You've already applied to this internship." };
    }
    return { status: "error", message: "We couldn't submit your application. Please try again." };
  }

  return { status: "success", message: "Your application has been submitted." };
}

export async function markNotificationReadAction(
  _prevState: NotificationActionState,
  formData: FormData
): Promise<NotificationActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, user } = auth;

  const parsed = markNotificationReadSchema.safeParse({
    notification_id: formData.get("notification_id"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // Only ever sets `read` — never title/message/user_id — and is scoped to
  // the caller's own id in addition to RLS (the notifications UPDATE policy
  // and GRANT don't themselves restrict which columns can change, so this
  // handler being disciplined about the update payload is what keeps this
  // safe; see the Phase 4E report's "existing issues" section).
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", parsed.data.notification_id)
    .eq("user_id", user.id);

  if (error) {
    console.error("markNotificationReadAction:", error);
    return { status: "error", message: "We couldn't update this notification. Please try again." };
  }

  revalidatePath("/student/notifications");
  revalidatePath("/student/dashboard");

  return { status: "success" };
}

export async function markAllNotificationsReadAction(
  _prevState: NotificationActionState,
  _formData: FormData
): Promise<NotificationActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, user } = auth;

  // Scoped to the caller's own unread notifications only — RLS enforces
  // ownership regardless, this filter just keeps the affected row set tight
  // and avoids re-writing rows that are already read.
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    console.error("markAllNotificationsReadAction:", error);
    return { status: "error", message: "We couldn't update your notifications. Please try again." };
  }

  revalidatePath("/student/notifications");
  revalidatePath("/student/dashboard");

  return { status: "success" };
}

export async function updateStudentProfileAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase, user } = auth;

  const gradYearRaw = formData.get("grad_year");
  const skillsRaw = formData.get("skills");
  const skills =
    typeof skillsRaw === "string"
      ? skillsRaw.split(",").map((skill) => skill.trim()).filter(Boolean)
      : [];

  const parsed = studentProfileSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    education_info: {
      school: formData.get("school"),
      degree: formData.get("degree"),
      grad_year: typeof gradYearRaw === "string" ? Number(gradYearRaw) : NaN,
    },
    skills,
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  // Both writes are scoped to the authenticated user's own id — never a
  // client-supplied id — matching profiles/student_profiles' own RLS
  // (auth.uid() = id) regardless.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ first_name: parsed.data.first_name, last_name: parsed.data.last_name })
    .eq("id", user.id);
  if (profileError) {
    console.error("updateStudentProfileAction profiles:", profileError);
    return { status: "error", message: "We couldn't save these changes. Please try again." };
  }

  const { error: studentProfileError } = await supabase
    .from("student_profiles")
    .update({ education_info: parsed.data.education_info, skills: parsed.data.skills })
    .eq("id", user.id);
  if (studentProfileError) {
    console.error("updateStudentProfileAction student_profiles:", studentProfileError);
    return { status: "error", message: "We couldn't save these changes. Please try again." };
  }

  revalidatePath("/student/profile");
  revalidatePath("/student/dashboard");
  return { status: "success", message: "Profile updated." };
}

export async function replaceResumeAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Your session has expired. Please log in again." };

  const resumeFile = formData.get("resume");
  if (!(resumeFile instanceof File) || resumeFile.size === 0) {
    return { status: "error", message: "Please attach your resume as a PDF." };
  }
  if (resumeFile.type !== "application/pdf") {
    return { status: "error", message: "Resume must be a PDF file." };
  }
  if (resumeFile.size > MAX_RESUME_BYTES) {
    return { status: "error", message: "Resume must be 5MB or smaller." };
  }

  // Same fixed path pattern as onboarding — the storage RLS policies
  // require the path's first segment to be the caller's own auth.uid(),
  // and `upsert: true` is what makes this a "replace" rather than a
  // second file.
  const resumePath = `${user.id}/resume.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(resumePath, resumeFile, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    console.error("replaceResumeAction upload:", uploadError);
    return { status: "error", message: "We couldn't upload your resume. Please try again." };
  }

  const { error: sizeError } = await supabase
    .from("student_profiles")
    .update({ resume_path: resumePath, resume_size: resumeFile.size })
    .eq("id", user.id);
  if (sizeError) {
    console.error("replaceResumeAction student_profiles:", sizeError);
    return { status: "error", message: "Your resume was uploaded, but we couldn't update your profile. Please try again." };
  }

  revalidatePath("/student/profile");
  return { status: "success", message: "Resume updated." };
}
