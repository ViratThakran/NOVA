import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase";
import { GitHubEvidenceCollector } from "./evidence/collector";
import { SandboxExecutionQueue } from "./sandbox/queue";
import { generateInternshipReview } from "./review/agent";
import { validateReview } from "./review/validator";
import { decideNextMentorAction } from "./decision";
import { generateNextInternshipTask } from "./service";
import { generateCurriculumPlan, getMilestoneByIndex } from "./curriculum";
import { buildStudentContext } from "./context";
import { resolveInternshipDefinition } from "./journey";
import {
  getSubmissionWithJobAndReview,
  claimExecutionJob,
  updateExecutionJobStatus,
  updateSubmissionStatus,
  insertRuntimeEvidence,
  insertInternshipReview,
  getInternshipTaskById,
  updateInternshipTaskStatus,
  getStudentLearningState,
  upsertStudentLearningState,
  getEnrollmentMilestones,
  upsertEnrollmentMilestone,
  insertInternshipTask,
  getEnrollmentWithInternship,
  getSubmissionsForTask,
  getReviewsForSubmissions,
  getTasksForEnrollment,
  fetchNextQueuedExecutionJob,
} from "./db";
import type { ReviewContext } from "./types";
import type { StudentPerformanceRecord } from "../schemas";

export interface ProcessSubmissionJobOptions {
  supabaseClient?: SupabaseClient;
  evidenceCollector?: GitHubEvidenceCollector;
  sandboxQueue?: SandboxExecutionQueue;
  disableAiFallback?: boolean; // Must be true in production
}

export interface ProcessSubmissionJobResult {
  success: boolean;
  submissionId: string;
  jobId: string;
  verdict?: "passed" | "needs_revision" | "failed" | "manual_review";
  score?: number;
  nextTaskId?: string;
  error?: string;
  logs: string[];
}

/**
 * Asynchronous Background Worker for Student Submissions.
 * 
 * Pipeline Stages:
 * 1. Atomic Claim (QUEUED -> RUNNING)
 * 2. GITHUB_ANALYSIS (Static Evidence Collection & Commit Verification)
 * 3. SANDBOX_EXECUTION (Modal Cloud MicroVM Sandbox Execution & Test Logs)
 * 4. AI_REVIEW (OpenRouter LLM Evaluation - No Mocks Allowed)
 * 5. VALIDATION (Deterministic Review & Anti-Hallucination Guardrails)
 * 6. COMPLETED & State Transition (Persists scores, updates learning state)
 * 7. Automatic Task 2 Generation (If passed, Decision Engine -> Task 2 -> Persisted)
 */
export async function processSubmissionJobAsync(
  submissionId: string,
  jobId: string,
  options: ProcessSubmissionJobOptions = {}
): Promise<ProcessSubmissionJobResult> {
  const logs: string[] = [];
  const supabase = options.supabaseClient ?? createAdminClient();
  const disableAiFallback = options.disableAiFallback ?? true;

  logs.push(`[Worker] Starting asynchronous processing for Submission ${submissionId}, Job ${jobId}`);

  // STAGE 1: Atomic Job Claim
  const claimed = await claimExecutionJob(supabase, jobId);
  if (!claimed) {
    logs.push(`[Worker] Job ${jobId} was already claimed by another worker or is not in 'queued' state.`);
    return {
      success: false,
      submissionId,
      jobId,
      error: "Job already claimed or not in queued state",
      logs,
    };
  }

  try {
    // Update submission status to collecting_evidence
    await updateSubmissionStatus(supabase, submissionId, "collecting_evidence");

    // Load submission and task records
    const { submission } = await getSubmissionWithJobAndReview(supabase, submissionId);
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found in database.`);
    }

    const task = await getInternshipTaskById(supabase, submission.task_id);
    if (!task) {
      throw new Error(`Task ${submission.task_id} not found in database.`);
    }

    const enrollment = await getEnrollmentWithInternship(supabase, submission.enrollment_id, submission.student_id);
    if (!enrollment) {
      throw new Error(`Enrollment ${submission.enrollment_id} not found.`);
    }

    const internshipTitle = enrollment.internship?.title || "Full-Stack Web Development Intern";
    const internshipDef = resolveInternshipDefinition(internshipTitle, enrollment.internship?.description);
    const curriculum = generateCurriculumPlan(internshipDef);
    const currentMilestone = getMilestoneByIndex(curriculum, task.milestone_index) || curriculum.milestones[0];

    // Load historical attempts for context
    const previousSubmissions = await getSubmissionsForTask(supabase, task.id);
    const previousSubmissionIds = previousSubmissions.map((s) => s.id);
    const previousReviews = await getReviewsForSubmissions(supabase, previousSubmissionIds);

    const performanceRecords: StudentPerformanceRecord[] = previousReviews.map((r) => ({
      task_id: r.task_id,
      task_title: task.title,
      milestone_index: task.milestone_index,
      score: r.score,
      verdict: r.verdict === "passed" ? "passed" : "needs_revision",
      strengths: r.strengths || [],
      weaknesses: r.improvements || [],
      skills_tested: task.skills_practiced || [],
      completed_at: r.created_at,
    }));

    const studentContext = buildStudentContext({
      student: {
        id: submission.student_id,
        name: "Intern",
        declared_skills: enrollment.student_profile?.skills || internshipDef.required_skills.slice(0, 3),
      },
      internship: internshipDef,
      performanceRecords,
      progress: {
        current_milestone_index: task.milestone_index,
        completed_task_count: performanceRecords.filter((p) => p.verdict === "passed").length,
        active_task_id: task.id,
      },
    });

    // STAGE 2: GITHUB_ANALYSIS
    logs.push(`[Worker] Stage 2: Collecting GitHub evidence from ${submission.github_url} @ ${submission.commit_sha}...`);
    const collector = options.evidenceCollector ?? new GitHubEvidenceCollector();
    const staticEvidence = await collector.collect({
      id: submission.id,
      task_id: submission.task_id,
      student_id: submission.student_id,
      enrollment_id: submission.enrollment_id,
      submission_type: submission.submission_type,
      github_url: submission.github_url,
      branch: submission.branch,
      commit_sha: submission.commit_sha,
      student_explanation: submission.student_explanation,
      submitted_at: submission.submitted_at,
      attempt_number: submission.attempt_number,
      status: "submitted",
    });

    if (staticEvidence.collection_status === "private_restricted" || staticEvidence.collection_status === "error") {
      logs.push(`[Worker] GitHub collection failed with status: ${staticEvidence.collection_status}`);
      await updateExecutionJobStatus(supabase, jobId, { status: "failed", exit_code: 1, completed_at: new Date().toISOString() });
      await updateSubmissionStatus(supabase, submissionId, "failed");
      await updateInternshipTaskStatus(supabase, task.id, "needs_revision");

      await supabase.from("notifications").insert({
        user_id: submission.student_id,
        title: "Submission Verification Failed",
        message: `Your GitHub repository at ${submission.github_url} was inaccessible. Please verify repository visibility and commit SHA.`,
      });

      return {
        success: false,
        submissionId,
        jobId,
        verdict: "failed",
        error: "GitHub repository inaccessible or private",
        logs,
      };
    }

    // STAGE 2.5: TASK_RELEVANCE_GATE (Deterministic Pre-Review Check)
    logs.push(`[Worker] Stage 2.5: Evaluating deterministic task relevance gate for commit ${submission.commit_sha}...`);
    const { runTaskRelevanceGate } = await import("./evidence/gate");
    const gateResult = runTaskRelevanceGate(task, staticEvidence, submission);

    if (gateResult.status === "rejected") {
      logs.push(`[Worker] Relevance Gate REJECTED submission: ${gateResult.reason}`);
      const rejectionReview = gateResult.rejectionReview!;

      // Persist review to public.internship_reviews
      await insertInternshipReview(supabase, {
        submission_id: submissionId,
        task_id: task.id,
        attempt_number: submission.attempt_number,
        verdict: "needs_revision",
        score: rejectionReview.score,
        summary: rejectionReview.summary,
        criteria_results: rejectionReview.criteria_results,
        technical_quality: rejectionReview.technical_quality,
        deliverables_evaluated: rejectionReview.deliverables_evaluated,
        strengths: rejectionReview.strengths,
        improvements: rejectionReview.improvements,
        next_step: rejectionReview.next_step,
      });

      // Complete execution job with exit code 1
      await updateExecutionJobStatus(supabase, jobId, {
        status: "completed",
        exit_code: 1,
        completed_at: new Date().toISOString(),
      });

      await updateSubmissionStatus(supabase, submissionId, "needs_revision");
      await updateInternshipTaskStatus(supabase, task.id, "needs_revision");

      // Update student learning state
      const currentLearningState = await getStudentLearningState(supabase, submission.enrollment_id);
      const prevTotal = currentLearningState?.total_submissions || 0;
      const prevPassed = currentLearningState?.passed_submissions || 0;
      const prevAvg = currentLearningState?.average_score || 0;

      const newTotal = prevTotal + 1;
      const newAvg = Math.round(((prevAvg * prevTotal) + rejectionReview.score) / newTotal);

      await upsertStudentLearningState(supabase, {
        enrollment_id: submission.enrollment_id,
        student_id: submission.student_id,
        internship_id: enrollment.internship_id,
        total_submissions: newTotal,
        passed_submissions: prevPassed,
        average_score: newAvg,
        learning_velocity: 0.9,
        difficulty_recommendation: "SCAFFOLD",
        completed_milestones: currentLearningState?.completed_milestones || [],
        capstone_progress_percentage: currentLearningState?.capstone_progress_percentage || 0,
        observed_strengths: rejectionReview.strengths,
        observed_weaknesses: rejectionReview.improvements,
        active_task_id: task.id,
        last_evaluated_at: new Date().toISOString(),
      });

      await supabase.from("notifications").insert({
        user_id: submission.student_id,
        title: "Task Revision Required",
        message: rejectionReview.summary,
      });

      return {
        success: true,
        submissionId,
        jobId,
        verdict: "needs_revision",
        score: rejectionReview.score,
        logs,
      };
    }

    // STAGE 3: SANDBOX_EXECUTION
    logs.push(`[Worker] Stage 3: Executing Modal microVM runtime tests for commit ${submission.commit_sha}...`);
    await updateSubmissionStatus(supabase, submissionId, "running_verification");

    const queue = options.sandboxQueue ?? new SandboxExecutionQueue();
    const sandboxResult = await queue.enqueueAndExecute(
      {
        id: submission.id,
        task_id: submission.task_id,
        student_id: submission.student_id,
        enrollment_id: submission.enrollment_id,
        submission_type: submission.submission_type,
        github_url: submission.github_url,
        branch: submission.branch,
        commit_sha: submission.commit_sha,
        student_explanation: submission.student_explanation,
        submitted_at: submission.submitted_at,
        attempt_number: submission.attempt_number,
        status: "running_verification",
      },
      staticEvidence
    );

    const runtimeEvidence = sandboxResult.evidence;
    logs.push(...sandboxResult.logs);

    // Persist runtime evidence to public.runtime_evidences
    await insertRuntimeEvidence(supabase, {
      execution_job_id: jobId,
      submission_id: submissionId,
      commit_sha: submission.commit_sha,
      status: runtimeEvidence.status === "completed" ? "completed" : runtimeEvidence.status === "timed_out" ? "timed_out" : "failed",
      exit_code: runtimeEvidence.exit_code,
      duration_ms: runtimeEvidence.duration_ms,
      tests_summary: runtimeEvidence.tests_summary,
      build_summary: runtimeEvidence.build_summary,
      lint_summary: runtimeEvidence.lint_summary,
      bounded_stdout: runtimeEvidence.bounded_stdout,
      bounded_stderr: runtimeEvidence.bounded_stderr,
      resource_usage: runtimeEvidence.resource_usage,
    });

    await updateExecutionJobStatus(supabase, jobId, {
      exit_code: runtimeEvidence.exit_code,
      duration_ms: runtimeEvidence.duration_ms,
    });

    // STAGE 4: AI_REVIEW (OpenRouter LLM)
    logs.push(`[Worker] Stage 4: Dispatching AI code evaluation to OpenRouter...`);
    await updateSubmissionStatus(supabase, submissionId, "in_review");

    const reviewContext: ReviewContext = {
      task,
      internship: internshipDef,
      currentMilestone,
      studentContext,
      currentSubmission: {
        id: submission.id,
        task_id: submission.task_id,
        student_id: submission.student_id,
        enrollment_id: submission.enrollment_id,
        submission_type: submission.submission_type,
        github_url: submission.github_url,
        branch: submission.branch,
        commit_sha: submission.commit_sha,
        student_explanation: submission.student_explanation,
        submitted_at: submission.submitted_at,
        attempt_number: submission.attempt_number,
        status: "in_review",
      },
      evidence: staticEvidence,
      runtimeEvidence,
      previousSubmissions: [],
      previousReviews: [],
    };

    let rawReview: any;
    try {
      rawReview = await generateInternshipReview(reviewContext);
    } catch (aiErr: any) {
      if (disableAiFallback) {
        throw new Error(`OpenRouter review generation failed: ${aiErr?.message || aiErr}`);
      }
      throw aiErr;
    }

    // STAGE 5: VALIDATION (Deterministic Review & Anti-Hallucination Guard)
    logs.push(`[Worker] Stage 5: Running deterministic review validation and ground-truth alignment...`);
    const validationResult = validateReview(rawReview, reviewContext);

    const finalScore = validationResult.adjusted_score;
    const finalVerdict = validationResult.adjusted_verdict;

    // Persist review to public.internship_reviews
    const persistedReview = await insertInternshipReview(supabase, {
      submission_id: submissionId,
      task_id: task.id,
      attempt_number: submission.attempt_number,
      verdict: finalVerdict,
      score: finalScore,
      summary: rawReview.summary,
      criteria_results: rawReview.criteria_results,
      technical_quality: rawReview.technical_quality,
      deliverables_evaluated: rawReview.deliverables_evaluated,
      strengths: rawReview.strengths,
      improvements: rawReview.improvements,
      next_step: rawReview.next_step,
    });

    // STAGE 6: COMPLETED & State Transition
    logs.push(`[Worker] Stage 6: Finalizing submission status to '${finalVerdict.toUpperCase()}' (Score: ${finalScore}/100)...`);
    await updateExecutionJobStatus(supabase, jobId, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    await updateSubmissionStatus(supabase, submissionId, finalVerdict);
    await updateInternshipTaskStatus(supabase, task.id, finalVerdict === "passed" ? "completed" : "needs_revision");

    // Update student learning state
    const currentLearningState = await getStudentLearningState(supabase, submission.enrollment_id);
    const prevTotal = currentLearningState?.total_submissions || 0;
    const prevPassed = currentLearningState?.passed_submissions || 0;
    const prevAvg = currentLearningState?.average_score || 0;

    const newTotal = prevTotal + 1;
    const newPassed = finalVerdict === "passed" ? prevPassed + 1 : prevPassed;
    const newAvg = Math.round(((prevAvg * prevTotal) + finalScore) / newTotal);
    const newVelocity = finalVerdict === "passed" ? 1.2 : 0.9;
    const difficultyRec = finalVerdict === "passed" ? "SCALE_UP" : "SCAFFOLD";

    let completedMilestones = currentLearningState?.completed_milestones || [];
    if (finalVerdict === "passed" && !completedMilestones.includes(task.milestone_index)) {
      completedMilestones = [...completedMilestones, task.milestone_index];
    }

    const capstonePct = Math.min(100, Math.round((completedMilestones.length / curriculum.milestones.length) * 100));

    await upsertStudentLearningState(supabase, {
      enrollment_id: submission.enrollment_id,
      student_id: submission.student_id,
      internship_id: enrollment.internship_id,
      total_submissions: newTotal,
      passed_submissions: newPassed,
      average_score: newAvg,
      learning_velocity: newVelocity,
      difficulty_recommendation: difficultyRec,
      completed_milestones: completedMilestones,
      capstone_progress_percentage: capstonePct,
      observed_strengths: rawReview.strengths || [],
      observed_weaknesses: rawReview.improvements || [],
      active_task_id: finalVerdict === "passed" ? null : task.id,
      last_evaluated_at: new Date().toISOString(),
    });

    // Send student notification
    await supabase.from("notifications").insert({
      user_id: submission.student_id,
      title: finalVerdict === "passed" ? "Task Passed! 🎉" : "Task Revision Required",
      message: rawReview.summary,
    });

    // STAGE 7: Automatic Task 2 Generation on PASS
    let nextTaskId: string | undefined;
    if (finalVerdict === "passed") {
      logs.push(`[Worker] Stage 7: Task passed! Updating milestone progress and generating next adaptive task...`);

      // Mark current milestone completed
      await upsertEnrollmentMilestone(supabase, {
        enrollment_id: submission.enrollment_id,
        milestone_index: task.milestone_index,
        title: currentMilestone.title,
        status: "completed",
        completed_task_count: 1,
        average_score: finalScore,
        completed_at: new Date().toISOString(),
      });

      // Advance to next milestone if available
      const nextMilestoneIndex = task.milestone_index + 1;
      const nextMilestone = getMilestoneByIndex(curriculum, nextMilestoneIndex);

      if (nextMilestone) {
        // Unlock next milestone
        await upsertEnrollmentMilestone(supabase, {
          enrollment_id: submission.enrollment_id,
          milestone_index: nextMilestoneIndex,
          title: nextMilestone.title,
          status: "in_progress",
          completed_task_count: 0,
        });

        // Run Decision Engine
        const updatedStudentContext = buildStudentContext({
          student: {
            id: submission.student_id,
            name: "Intern",
            declared_skills: enrollment.student_profile?.skills || internshipDef.required_skills.slice(0, 3),
          },
          internship: internshipDef,
          performanceRecords: [
            ...performanceRecords,
            {
              task_id: task.id,
              task_title: task.title,
              milestone_index: task.milestone_index,
              score: finalScore,
              verdict: "passed",
              strengths: rawReview.strengths,
              weaknesses: rawReview.improvements,
              skills_tested: task.skills_practiced,
              completed_at: new Date().toISOString(),
            },
          ],
        });

        const decision = decideNextMentorAction({ studentContext: updatedStudentContext, curriculum });
        logs.push(`[Worker] Decision Engine: ${decision.action} -> Target Difficulty: ${decision.targetDifficulty}`);

        // Idempotency check: Check if a task already exists for this milestone before calling LLM
        const existingNextTasks = await getTasksForEnrollment(supabase, submission.enrollment_id, nextMilestoneIndex);
        let nextTask: any;

        if (existingNextTasks && existingNextTasks.length > 0) {
          nextTask = existingNextTasks[0];
          logs.push(`[Worker] Reusing existing next task for milestone ${nextMilestoneIndex}: "${nextTask.title}" (${nextTask.id})`);
        } else {
          // Generate Task 2 via OpenRouter with deterministic validation
          const nextTaskResult = await generateNextInternshipTask({
            internship: internshipDef,
            curriculum,
            currentMilestone: nextMilestone,
            studentContext: updatedStudentContext,
            decision,
            disableFallback: disableAiFallback,
          });

          // Persist Task 2 to public.internship_tasks
          nextTask = await insertInternshipTask(supabase, {
            enrollment_id: submission.enrollment_id,
            student_id: submission.student_id,
            internship_id: enrollment.internship_id,
            milestone_index: nextMilestoneIndex,
            title: nextTaskResult.task.title,
            objective: nextTaskResult.task.objective,
            business_context: nextTaskResult.task.business_context,
            instructions: nextTaskResult.task.instructions,
            deliverables: nextTaskResult.task.deliverables,
            acceptance_criteria: nextTaskResult.task.acceptance_criteria,
            skills_practiced: nextTaskResult.task.skills_practiced,
            difficulty: nextTaskResult.task.difficulty,
            estimated_hours: nextTaskResult.task.estimated_hours,
            status: "assigned",
          });

          logs.push(`[Worker] Task 2 generated and persisted: "${nextTask.title}" (ID: ${nextTask.id})`);
        }

        nextTaskId = nextTask.id;

        // Set active_task_id in learning state
        await upsertStudentLearningState(supabase, {
          enrollment_id: submission.enrollment_id,
          student_id: submission.student_id,
          internship_id: enrollment.internship_id,
          current_milestone_index: nextMilestoneIndex,
          active_task_id: nextTask.id,
        });

        // Notify student of new task
        await supabase.from("notifications").insert({
          user_id: submission.student_id,
          title: `Milestone ${nextMilestoneIndex + 1} Task Assigned`,
          message: `Your next engineering task is ready: "${nextTask.title}".`,
        });
      }
    }

    return {
      success: true,
      submissionId,
      jobId,
      verdict: finalVerdict,
      score: finalScore,
      nextTaskId,
      logs,
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    logs.push(`[Worker] Execution failed with error: ${errorMsg}`);

    // Update job to failed
    await updateExecutionJobStatus(supabase, jobId, {
      status: "failed",
      completed_at: new Date().toISOString(),
    });

    await updateSubmissionStatus(supabase, submissionId, "failed");

    return {
      success: false,
      submissionId,
      jobId,
      error: errorMsg,
      logs,
    };
  }
}

/**
 * Discovers and processes the oldest queued execution job independently.
 * Useful for cron triggers, background loops, or recovery jobs.
 */
export async function processNextQueuedJob(
  options: ProcessSubmissionJobOptions = {}
): Promise<{
  processed: boolean;
  jobId?: string;
  submissionId?: string;
  result?: ProcessSubmissionJobResult;
}> {
  const supabase = options.supabaseClient || (await createAdminClient());
  const nextJob = await fetchNextQueuedExecutionJob(supabase);

  if (!nextJob) {
    return { processed: false };
  }

  const result = await processSubmissionJobAsync(nextJob.submission_id, nextJob.id, options);
  return {
    processed: true,
    jobId: nextJob.id,
    submissionId: nextJob.submission_id,
    result,
  };
}
