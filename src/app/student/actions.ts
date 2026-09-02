"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSideClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  onboardingSchema,
  studentProfileSchema,
  applicationSchema,
  markNotificationReadSchema,
  serviceRequestSchema,
  cancelServiceRequestSchema,
} from "@/lib/validation";
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
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }
  const { supabase, user } = auth;


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
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase, user } = auth;


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

export async function requestServiceAction(
  _prevState: ApplicationActionState,
  formData: FormData
): Promise<ApplicationActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase, user, roles } = auth;

  if (!roles.includes("student")) {
    return { status: "error", message: "Only students can request services here." };
  }

  const parsed = serviceRequestSchema.safeParse({
    service_id: formData.get("service_id"),
    details: formData.get("details"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  // requester_id is the authenticated user's own id, never read from
  // formData — service_requests' INSERT RLS (WITH CHECK requester_id =
  // auth.uid()) would reject anything else regardless. company_id is
  // omitted entirely for a personal request.
  const { error } = await supabase.from("service_requests").insert({
    service_id: parsed.data.service_id,
    requester_id: user.id,
    details: parsed.data.details,
  });
  if (error) {
    console.error("requestServiceAction:", error);
    return { status: "error", message: "We couldn't submit your request. Please try again." };
  }

  revalidatePath("/student/services");
  return { status: "success", message: "Request submitted." };
}

export async function cancelServiceRequestAction(
  _prevState: ApplicationActionState,
  formData: FormData
): Promise<ApplicationActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase } = auth;

  const parsed = cancelServiceRequestSchema.safeParse({ request_id: formData.get("request_id") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  // cancel_service_request() re-verifies the caller is the original
  // requester (or a company admin / platform admin) internally — this
  // action does not attempt that check itself.
  const { error } = await supabase.rpc("cancel_service_request", { request_id: parsed.data.request_id });
  if (error) {
    console.error("cancelServiceRequestAction:", error);
    return { status: "error", message: "We couldn't cancel this request. Please try again." };
  }

  revalidatePath("/student/services");
  return { status: "success", message: "Request cancelled." };
}

import { after } from "next/server";
import {
  getOrInitializeStudentJourney,
  processSubmissionJobAsync,
  getInternshipTaskById,
  updateInternshipTaskStatus,
  getNextAttemptNumber,
  findExistingSubmissionForCommit,
  insertInternshipSubmission,
  insertExecutionJob,
  getSubmissionWithJobAndReview,
  getEnrollmentWithInternship,
  getTasksForEnrollment,
  getSubmissionsForTask,
} from "@/lib/ai-engine/internship-mentor";

export async function initStudentJourneyAction(enrollmentId: string): Promise<any> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { user, roles } = auth;

  if (!roles.includes("student")) {
    return { status: "error", message: "Only students can initialize an internship journey." };
  }

  try {
    const journey = await getOrInitializeStudentJourney({
      enrollmentId,
      studentId: user.id,
      disableAiFallback: true,
    });

    revalidatePath("/student/learning");
    revalidatePath("/student/dashboard");
    return { status: "success", journey };
  } catch (err: any) {
    console.error("initStudentJourneyAction error:", err);
    return { status: "error", message: err?.message || "Failed to initialize internship journey." };
  }
}

export async function submitInternshipTaskAction(
  _prevState: any,
  formData: FormData
): Promise<any> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase, user, roles } = auth;

  if (!roles.includes("student")) {
    return { status: "error", message: "Only students can submit task reviews." };
  }

  const taskId = formData.get("task_id")?.toString() || "";
  const githubUrl = formData.get("github_url")?.toString() || "";
  const branch = formData.get("branch")?.toString() || "main";
  const commitSha = formData.get("commit_sha")?.toString() || "";
  const studentExplanation = formData.get("student_explanation")?.toString() || "";

  if (!taskId) {
    return { status: "error", message: "Task identifier is required." };
  }
  if (!githubUrl.startsWith("https://github.com/")) {
    return { status: "error", message: "Please provide a valid public GitHub repository URL (e.g. https://github.com/owner/repo)." };
  }
  if (!commitSha || commitSha.trim().length < 7) {
    return { status: "error", message: "Please provide a valid pinned Git commit SHA (at least 7 characters)." };
  }
  if (studentExplanation.trim().length < 10) {
    return { status: "error", message: "Please provide an explanation of your implementation (at least 10 characters)." };
  }

  try {
    // 1. Authorize: Verify task exists and belongs to student's active enrollment
    const task = await getInternshipTaskById(supabase, taskId);
    if (!task) {
      return { status: "error", message: "Task not found." };
    }
    if (task.student_id && task.student_id !== user.id) {
      return { status: "error", message: "Unauthorized: You do not own this internship task." };
    }

    const enrollment = await getEnrollmentWithInternship(supabase, task.enrollment_id, user.id);
    if (!enrollment || enrollment.student_id !== user.id) {
      return { status: "error", message: "Unauthorized: You do not own this internship task." };
    }
    if (enrollment.status !== "active") {
      return { status: "error", message: "Your internship enrollment is not currently active." };
    }

    // 2. Derive attempt number server-side (never trusted from browser)
    const attemptNumber = await getNextAttemptNumber(supabase, taskId);

    // 3. Idempotency Check: Don't recreate if exact commit submission is already in progress
    const existingSubmission = await findExistingSubmissionForCommit(supabase, taskId, commitSha);
    if (existingSubmission && ["submitted", "collecting_evidence", "running_verification", "in_review"].includes(existingSubmission.status)) {
      return {
        status: "success",
        message: "Submission is already processing.",
        submissionId: existingSubmission.id,
        attemptNumber: existingSubmission.attempt_number,
        jobStatus: existingSubmission.status,
      };
    }

    // 4. Create immutable submission attempt with concurrency protection
    let submission: any;
    let job: any;

    try {
      submission = await insertInternshipSubmission(supabase, {
        task_id: taskId,
        student_id: user.id,
        enrollment_id: task.enrollment_id,
        submission_type: "github",
        github_url: githubUrl,
        branch,
        commit_sha: commitSha,
        student_explanation: studentExplanation,
        attempt_number: attemptNumber,
        status: "submitted",
      });

      // 5. Detect execution profile & create execution job
      const isPython = task.skills_practiced?.some((s: string) => s.toLowerCase().includes("python") || s.toLowerCase().includes("pandas"));
      const profile = isPython ? "python" : "node_typescript";

      job = await insertExecutionJob(supabase, {
        submission_id: submission.id,
        repository: githubUrl.replace("https://github.com/", ""),
        commit_sha: commitSha,
        execution_profile: profile,
        timeout_seconds: 60,
      });

      // Update task status to submitted
      await updateInternshipTaskStatus(supabase, taskId, "submitted");

      // 6. Asynchronously dispatch background worker (Non-blocking HTTP response)
      after(async () => {
        try {
          await processSubmissionJobAsync(submission.id, job.id, { disableAiFallback: true });
        } catch (workerErr) {
          console.error("Background submission worker failed:", workerErr);
        }
      });
    } catch (insertErr: any) {
      // If concurrent request already inserted this attempt or commit, return the existing in-flight submission
      const inFlight = await findExistingSubmissionForCommit(supabase, taskId, commitSha);
      if (inFlight) {
        return {
          status: "success",
          message: "Submission is already processing.",
          submissionId: inFlight.id,
          attemptNumber: inFlight.attempt_number,
          jobStatus: inFlight.status,
        };
      }
      throw insertErr;
    }

    revalidatePath("/student/learning");
    revalidatePath("/student/dashboard");

    return {
      status: "success",
      message: "Your submission has been queued for verification and AI review.",
      submissionId: submission.id,
      jobId: job.id,
      attemptNumber,
      jobStatus: "queued",
    };
  } catch (err: any) {
    console.error("submitInternshipTaskAction error:", err);
    return { status: "error", message: err?.message || "Failed to queue task submission." };
  }
}

export async function getSubmissionStatusAction(submissionId: string): Promise<any> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase, user } = auth;

  try {
    const data = await getSubmissionWithJobAndReview(supabase, submissionId);
    if (!data.submission) {
      return { status: "error", message: "Submission not found." };
    }

    // Authorization check: Student can only view their own submission
    if (data.submission.student_id !== user.id) {
      return { status: "error", message: "Unauthorized." };
    }

    let nextTaskId: string | null = null;
    let nextTaskTitle: string | null = null;

    if (data.review?.verdict === "passed") {
      const task = await getInternshipTaskById(supabase, data.submission.task_id);
      if (task) {
        const nextTasks = await getTasksForEnrollment(supabase, task.enrollment_id, task.milestone_index + 1);
        if (nextTasks.length > 0) {
          nextTaskId = nextTasks[0].id;
          nextTaskTitle = nextTasks[0].title;
        }
      }
    }

    return {
      status: "success",
      submission: {
        id: data.submission.id,
        taskId: data.submission.task_id,
        status: data.submission.status,
        attemptNumber: data.submission.attempt_number,
        commitSha: data.submission.commit_sha,
        githubUrl: data.submission.github_url,
        branch: data.submission.branch,
        studentExplanation: data.submission.student_explanation,
        submittedAt: data.submission.submitted_at,
      },
      job: data.job
        ? {
            id: data.job.id,
            status: data.job.status,
            exitCode: data.job.exit_code,
            durationMs: data.job.duration_ms,
            startedAt: data.job.started_at,
            completedAt: data.job.completed_at,
            errorMessage: (data.job as any).error_message || null,
          }
        : null,
      review: data.review
        ? {
            id: data.review.id,
            verdict: data.review.verdict,
            score: data.review.score,
            summary: data.review.summary,
            strengths: data.review.strengths,
            improvements: data.review.improvements,
            criteriaResults: data.review.criteria_results,
            technicalQuality: data.review.technical_quality,
            deliverablesEvaluated: data.review.deliverables_evaluated,
            nextStep: data.review.next_step,
            createdAt: data.review.created_at,
          }
        : null,
      evidence: data.evidence
        ? {
            exitCode: data.evidence.exit_code,
            durationMs: data.evidence.duration_ms,
            testsSummary: data.evidence.tests_summary,
            buildSummary: data.evidence.build_summary,
            lintSummary: data.evidence.lint_summary,
          }
        : null,
      nextTaskId,
      nextTaskTitle,
    };
  } catch (err: any) {
    console.error("getSubmissionStatusAction error:", err);
    return { status: "error", message: err?.message || "Failed to fetch submission status." };
  }
}

export async function getLatestTaskSubmissionAction(taskId: string): Promise<any> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase, user } = auth;

  try {
    const task = await getInternshipTaskById(supabase, taskId);
    if (!task) {
      return { status: "error", message: "Task not found." };
    }
    if (task.student_id !== user.id) {
      return { status: "error", message: "Unauthorized." };
    }

    const submissions = await getSubmissionsForTask(supabase, taskId);
    if (submissions.length === 0) {
      return { status: "success", submission: null };
    }

    const latest = submissions[submissions.length - 1];
    return getSubmissionStatusAction(latest.id);
  } catch (err: any) {
    console.error("getLatestTaskSubmissionAction error:", err);
    return { status: "error", message: err?.message || "Failed to fetch latest submission." };
  }
}

// Backwards-compatible alias for existing client forms
export const submitInternshipTaskReviewAction = submitInternshipTaskAction;



