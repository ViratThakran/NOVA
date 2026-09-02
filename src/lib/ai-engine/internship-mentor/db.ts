import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  InternshipTask,
  InternshipSubmission,
  ExecutionJob,
  RuntimeEvidence,
  InternshipReview,
  SubmissionStatus,
  ExecutionJobStatus,
  ExecutionProfile,
} from "../schemas";

export interface StudentLearningStateRow {
  id: string;
  student_id: string;
  enrollment_id: string;
  internship_id: string;
  current_milestone_index: number;
  completed_milestones: number[];
  active_task_id: string | null;
  total_submissions: number;
  passed_submissions: number;
  average_score: number;
  learning_velocity: number;
  current_difficulty: "beginner" | "intermediate" | "advanced";
  difficulty_recommendation: "SCALE_UP" | "MAINTAIN" | "SCAFFOLD";
  skill_ratings: Array<{ skill: string; rating: number }>;
  observed_strengths: string[];
  observed_weaknesses: string[];
  repeated_errors: string[];
  next_recommended_focus: string | null;
  capstone_progress_percentage: number;
  last_evaluated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentMilestoneRow {
  id: string;
  enrollment_id: string;
  milestone_index: number;
  title: string;
  status: "locked" | "in_progress" | "completed";
  completed_task_count: number;
  average_score: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentWithInternshipRow {
  id: string;
  student_id: string;
  internship_id: string;
  application_id: string;
  status: string;
  created_at: string;
  internship: {
    id: string;
    title: string;
    description: string;
    requirements: string;
    eligibility: string;
    duration_weeks: number;
    companies: { name: string } | null;
  } | null;
  student_profile?: {
    id: string;
    skills: string[];
    education_info: any;
  } | null;
}

export interface ExecutionJobRow {
  id: string;
  submission_id: string;
  repository: string;
  commit_sha: string;
  execution_profile: ExecutionProfile;
  status: ExecutionJobStatus;
  runner_version: string;
  profile_version: string;
  timeout_seconds: number;
  exit_code: number | null;
  duration_ms: number | null;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface InternshipSubmissionRow {
  id: string;
  task_id: string;
  student_id: string;
  enrollment_id: string;
  submission_type: "github" | "figma" | "document" | "url";
  github_url: string;
  branch: string;
  commit_sha: string;
  student_explanation: string;
  attempt_number: number;
  status: SubmissionStatus;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface InternshipTaskRow {
  id: string;
  enrollment_id: string;
  student_id: string;
  internship_id: string;
  milestone_index: number;
  title: string;
  objective: string;
  business_context: string;
  instructions: string[];
  deliverables: string[];
  acceptance_criteria: string[];
  skills_practiced: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_hours: number;
  reason_for_assignment?: string;
  capstone_connection?: string;
  status: "assigned" | "in_progress" | "submitted" | "needs_revision" | "completed";
  created_at?: string;
  updated_at?: string;
}

/**
 * Loads an enrollment and verifies student ownership.
 */
export async function getEnrollmentWithInternship(
  supabase: SupabaseClient,
  enrollmentId: string,
  studentId: string
): Promise<EnrollmentWithInternshipRow | null> {
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `id, student_id, internship_id, application_id, status, created_at,
       internship:internships(id, title, description, requirements, eligibility, duration_weeks, companies(name))`
    )
    .eq("id", enrollmentId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // Also fetch student profile for declared skills
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("id, skills, education_info")
    .eq("id", studentId)
    .maybeSingle();

  return {
    ...(data as unknown as EnrollmentWithInternshipRow),
    student_profile: profile ?? null,
  };
}

/**
 * Loads the learning state for an enrollment.
 */
export async function getStudentLearningState(
  supabase: SupabaseClient,
  enrollmentId: string
): Promise<StudentLearningStateRow | null> {
  const { data, error } = await supabase
    .from("student_learning_states")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as StudentLearningStateRow;
}

/**
 * Upserts a student learning state record using the unique enrollment constraint.
 */
export async function upsertStudentLearningState(
  supabase: SupabaseClient,
  state: Partial<StudentLearningStateRow> & {
    enrollment_id: string;
    student_id: string;
    internship_id: string;
  }
): Promise<StudentLearningStateRow> {
  const payload = {
    ...state,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("student_learning_states")
    .upsert(payload, { onConflict: "enrollment_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert student learning state: ${error?.message || "Unknown error"}`);
  }

  return data as StudentLearningStateRow;
}

/**
 * Fetches all milestone records for an enrollment.
 */
export async function getEnrollmentMilestones(
  supabase: SupabaseClient,
  enrollmentId: string
): Promise<EnrollmentMilestoneRow[]> {
  const { data, error } = await supabase
    .from("enrollment_milestones")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .order("milestone_index", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as EnrollmentMilestoneRow[];
}

/**
 * Upserts an enrollment milestone.
 */
export async function upsertEnrollmentMilestone(
  supabase: SupabaseClient,
  milestone: Partial<EnrollmentMilestoneRow> & {
    enrollment_id: string;
    milestone_index: number;
    title: string;
  }
): Promise<EnrollmentMilestoneRow> {
  const payload = {
    ...milestone,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("enrollment_milestones")
    .upsert(payload, { onConflict: "enrollment_id,milestone_index" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert enrollment milestone: ${error?.message || "Unknown error"}`);
  }

  return data as EnrollmentMilestoneRow;
}

/**
 * Fetches a single task by ID.
 */
export async function getInternshipTaskById(
  supabase: SupabaseClient,
  taskId: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from("internship_tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Updates task status.
 */
export async function updateInternshipTaskStatus(
  supabase: SupabaseClient,
  taskId: string,
  status: "assigned" | "submitted" | "in_review" | "completed" | "needs_revision" | "cancelled"
): Promise<void> {
  const { error } = await supabase
    .from("internship_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) {
    throw new Error(`Failed to update task status: ${error.message}`);
  }
}

/**
 * Inserts a new internship task.
 */
export async function insertInternshipTask(
  supabase: SupabaseClient,
  task: {
    id?: string;
    enrollment_id: string;
    student_id: string;
    internship_id: string;
    milestone_index: number;
    title: string;
    objective: string;
    business_context: string;
    instructions: string[];
    deliverables: string[];
    acceptance_criteria: string[];
    skills_practiced: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
    estimated_hours: number;
    status: "assigned" | "submitted" | "in_review" | "completed" | "needs_revision";
  }
): Promise<any> {
  const { data, error } = await supabase
    .from("internship_tasks")
    .insert({
      ...task,
      instructions: task.instructions,
      deliverables: task.deliverables,
      acceptance_criteria: task.acceptance_criteria,
      skills_practiced: task.skills_practiced,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert internship task: ${error?.message || "Unknown error"}`);
  }

  return data;
}

/**
 * Fetches all submissions for a task ordered by attempt number.
 */
export async function getSubmissionsForTask(
  supabase: SupabaseClient,
  taskId: string
): Promise<InternshipSubmissionRow[]> {
  const { data, error } = await supabase
    .from("internship_submissions")
    .select("*")
    .eq("task_id", taskId)
    .order("attempt_number", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as InternshipSubmissionRow[];
}

/**
 * Calculates next attempt number server-side.
 */
export async function getNextAttemptNumber(
  supabase: SupabaseClient,
  taskId: string
): Promise<number> {
  const submissions = await getSubmissionsForTask(supabase, taskId);
  if (submissions.length === 0) return 1;
  const maxAttempt = Math.max(...submissions.map((s) => s.attempt_number));
  return maxAttempt + 1;
}

/**
 * Idempotency check: Finds if there is an active/processing submission for exact commit SHA.
 */
export async function findExistingSubmissionForCommit(
  supabase: SupabaseClient,
  taskId: string,
  commitSha: string
): Promise<InternshipSubmissionRow | null> {
  const { data, error } = await supabase
    .from("internship_submissions")
    .select("*")
    .eq("task_id", taskId)
    .eq("commit_sha", commitSha)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as InternshipSubmissionRow;
}

/**
 * Inserts an immutable submission attempt.
 */
export async function insertInternshipSubmission(
  supabase: SupabaseClient,
  submission: {
    id?: string;
    task_id: string;
    student_id: string;
    enrollment_id: string;
    submission_type?: "github" | "figma" | "document" | "url";
    github_url: string;
    branch?: string;
    commit_sha: string;
    student_explanation: string;
    attempt_number: number;
    status?: "submitted" | "collecting_evidence" | "running_verification" | "in_review" | "passed" | "needs_revision" | "manual_review" | "failed";
  }
): Promise<InternshipSubmissionRow> {
  const { data, error } = await supabase
    .from("internship_submissions")
    .insert({
      id: submission.id || crypto.randomUUID(),
      task_id: submission.task_id,
      student_id: submission.student_id,
      enrollment_id: submission.enrollment_id,
      submission_type: submission.submission_type || "github",
      github_url: submission.github_url,
      branch: submission.branch || "main",
      commit_sha: submission.commit_sha,
      student_explanation: submission.student_explanation,
      attempt_number: submission.attempt_number,
      status: submission.status || "submitted",
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert submission: ${error?.message || "Unknown error"}`);
  }

  return data as InternshipSubmissionRow;
}

/**
 * Updates submission status.
 */
export async function updateSubmissionStatus(
  supabase: SupabaseClient,
  submissionId: string,
  status: SubmissionStatus
): Promise<void> {
  const { error } = await supabase
    .from("internship_submissions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", submissionId);

  if (error) {
    throw new Error(`Failed to update submission status: ${error.message}`);
  }
}

/**
 * Inserts an execution job record.
 */
export async function insertExecutionJob(
  supabase: SupabaseClient,
  job: {
    id?: string;
    submission_id: string;
    repository: string;
    commit_sha: string;
    execution_profile: ExecutionProfile;
    runner_version?: string;
    timeout_seconds?: number;
  }
): Promise<ExecutionJobRow> {
  const { data, error } = await supabase
    .from("execution_jobs")
    .insert({
      id: job.id || crypto.randomUUID(),
      submission_id: job.submission_id,
      repository: job.repository,
      commit_sha: job.commit_sha,
      execution_profile: job.execution_profile,
      status: "queued",
      runner_version: job.runner_version || "1.0",
      profile_version: "1.0",
      timeout_seconds: job.timeout_seconds || 60,
      requested_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert execution job: ${error?.message || "Unknown error"}`);
  }

  return data as ExecutionJobRow;
}

/**
 * Atomically claims an execution job to prevent race conditions.
 * Only transitions if the job is currently 'queued'.
 */
export async function claimExecutionJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("execution_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("status", "queued")
    .select("id");

  if (error || !data || data.length === 0) {
    return false; // Already claimed or not queued
  }

  return true;
}

/**
 * Updates execution job state and results.
 */
export async function updateExecutionJobStatus(
  supabase: SupabaseClient,
  jobId: string,
  update: {
    status?: ExecutionJobStatus;
    exit_code?: number | null;
    duration_ms?: number | null;
    completed_at?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("execution_jobs")
    .update(update)
    .eq("id", jobId);

  if (error) {
    throw new Error(`Failed to update execution job: ${error.message}`);
  }
}

/**
 * Inserts factual runtime evidence.
 */
export async function insertRuntimeEvidence(
  supabase: SupabaseClient,
  evidence: {
    id?: string;
    execution_job_id: string;
    submission_id: string;
    commit_sha: string;
    status: "completed" | "timed_out" | "resource_exceeded" | "blocked" | "failed" | "verification_unavailable";
    exit_code: number;
    duration_ms: number;
    tests_summary: { total: number; passed: number; failed: number; skipped: number };
    build_summary?: { attempted: boolean; status: string };
    lint_summary?: { attempted: boolean; status: string };
    bounded_stdout?: string;
    bounded_stderr?: string;
    resource_usage?: any;
  }
): Promise<any> {
  const { data, error } = await supabase
    .from("runtime_evidences")
    .insert({
      id: evidence.id || crypto.randomUUID(),
      execution_job_id: evidence.execution_job_id,
      submission_id: evidence.submission_id,
      commit_sha: evidence.commit_sha,
      status: evidence.status,
      exit_code: evidence.exit_code,
      duration_ms: evidence.duration_ms,
      tests_summary: evidence.tests_summary,
      build_summary: evidence.build_summary || { attempted: false, status: "skipped" },
      lint_summary: evidence.lint_summary || { attempted: false, status: "skipped" },
      bounded_stdout: evidence.bounded_stdout || "",
      bounded_stderr: evidence.bounded_stderr || "",
      resource_usage: evidence.resource_usage || {},
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert runtime evidence: ${error?.message || "Unknown error"}`);
  }

  return data;
}

/**
 * Inserts an internship review.
 */
export async function insertInternshipReview(
  supabase: SupabaseClient,
  review: {
    id?: string;
    submission_id: string;
    task_id: string;
    attempt_number: number;
    verdict: "passed" | "needs_revision" | "manual_review";
    score: number;
    summary: string;
    criteria_results: any[];
    technical_quality: any;
    deliverables_evaluated: any[];
    strengths: string[];
    improvements: string[];
    next_step: string;
  }
): Promise<any> {
  const { data, error } = await supabase
    .from("internship_reviews")
    .upsert(
      {
        id: review.id || crypto.randomUUID(),
        submission_id: review.submission_id,
        task_id: review.task_id,
        attempt_number: review.attempt_number,
        verdict: review.verdict,
        score: review.score,
        summary: review.summary,
        criteria_results: review.criteria_results,
        technical_quality: review.technical_quality,
        deliverables_evaluated: review.deliverables_evaluated,
        strengths: review.strengths,
        improvements: review.improvements,
        next_step: review.next_step,
        created_at: new Date().toISOString(),
      },
      { onConflict: "submission_id" }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert review: ${error?.message || "Unknown error"}`);
  }

  return data;
}

/**
 * Fetches reviews for a list of submission IDs.
 */
export async function getReviewsForSubmissions(
  supabase: SupabaseClient,
  submissionIds: string[]
): Promise<any[]> {
  if (submissionIds.length === 0) return [];

  const { data, error } = await supabase
    .from("internship_reviews")
    .select("*")
    .in("submission_id", submissionIds)
    .order("attempt_number", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Fetches complete status of a submission with its execution job and review.
 */
export async function getSubmissionWithJobAndReview(
  supabase: SupabaseClient,
  submissionId: string
): Promise<{
  submission: InternshipSubmissionRow | null;
  job: ExecutionJobRow | null;
  review: any | null;
  evidence: any | null;
}> {
  const { data: submission } = await supabase
    .from("internship_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) {
    return { submission: null, job: null, review: null, evidence: null };
  }

  const [{ data: job }, { data: review }, { data: evidence }] = await Promise.all([
    supabase.from("execution_jobs").select("*").eq("submission_id", submissionId).order("created_at", { ascending: false }).maybeSingle(),
    supabase.from("internship_reviews").select("*").eq("submission_id", submissionId).maybeSingle(),
    supabase.from("runtime_evidences").select("*").eq("submission_id", submissionId).maybeSingle(),
  ]);

  return {
    submission: submission as InternshipSubmissionRow,
    job: job as ExecutionJobRow | null,
    review: review || null,
    evidence: evidence || null,
  };
}

/**
 * Gets all tasks for an enrollment, optionally filtered by milestone_index.
 */
export async function getTasksForEnrollment(
  supabase: SupabaseClient,
  enrollmentId: string,
  milestoneIndex?: number
): Promise<any[]> {
  let query = supabase
    .from("internship_tasks")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .order("created_at", { ascending: true });

  if (milestoneIndex !== undefined) {
    query = query.eq("milestone_index", milestoneIndex);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }
  return data;
}

/**
 * Fetches the oldest queued execution job from the queue.
 */
export async function fetchNextQueuedExecutionJob(
  supabase: SupabaseClient
): Promise<ExecutionJobRow | null> {
  const { data, error } = await supabase
    .from("execution_jobs")
    .select("*")
    .eq("status", "queued")
    .order("requested_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data as ExecutionJobRow;
}

/**
 * Finds and recovers stale jobs (jobs stuck in 'running' for longer than maxRunningMinutes).
 * Atomically re-queues them or marks them as timed_out.
 */
export async function recoverStaleJobs(
  supabase: SupabaseClient,
  maxRunningMinutes = 5,
  action: "requeue" | "timeout" = "requeue"
): Promise<{ recoveredCount: number; jobIds: string[] }> {
  const cutoffTime = new Date(Date.now() - maxRunningMinutes * 60 * 1000).toISOString();

  if (action === "requeue") {
    const { data, error } = await supabase
      .from("execution_jobs")
      .update({
        status: "queued",
        started_at: null,
      })
      .eq("status", "running")
      .lt("started_at", cutoffTime)
      .select("id");

    if (error || !data) {
      return { recoveredCount: 0, jobIds: [] };
    }
    return { recoveredCount: data.length, jobIds: data.map((d: any) => d.id) };
  } else {
    const { data, error } = await supabase
      .from("execution_jobs")
      .update({
        status: "timed_out",
        completed_at: new Date().toISOString(),
      })
      .eq("status", "running")
      .lt("started_at", cutoffTime)
      .select("id, submission_id");

    if (error || !data) {
      return { recoveredCount: 0, jobIds: [] };
    }

    // Also update associated submissions to failed
    for (const job of data) {
      if (job.submission_id) {
        await supabase
          .from("internship_submissions")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", job.submission_id);
      }
    }

    return { recoveredCount: data.length, jobIds: data.map((d: any) => d.id) };
  }
}
