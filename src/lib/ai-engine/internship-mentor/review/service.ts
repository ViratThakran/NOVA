import {
  internshipSubmissionSchema,
  type InternshipSubmission,
  type InternshipReview,
  type InternshipTask,
  type StudentContext,
  type StudentPerformanceRecord,
  type RuntimeEvidence,
  type ExecutionJob,
} from "../../schemas";
import type {
  ReviewContext,
  SubmitTaskWorkInput,
  SubmissionEvaluationResult,
  InternshipDefinition,
  CurriculumMilestone,
} from "../types";
import { GitHubEvidenceCollector } from "../evidence/collector";
import { SandboxExecutionQueue } from "../sandbox/queue";
import { generateInternshipReview, generateFallbackReview } from "./agent";
import { validateReview } from "./validator";
import { buildStudentContext } from "../context";

/**
 * Creates and validates a student task submission record with pinned commit SHA.
 */
export function createSubmissionRecord(
  input: SubmitTaskWorkInput,
  attemptNumber = 1
): InternshipSubmission {
  const commitSha = input.commitSha || (input.githubUrl.includes("@") ? input.githubUrl.split("@")[1] : "c0ffee" + attemptNumber);
  return internshipSubmissionSchema.parse({
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    task_id: input.taskId,
    student_id: input.studentId,
    enrollment_id: input.enrollmentId,
    submission_type: input.submissionType ?? "github",
    github_url: input.githubUrl,
    branch: input.branch ?? "main",
    commit_sha: commitSha,
    student_explanation: input.studentExplanation,
    submitted_at: new Date().toISOString(),
    attempt_number: attemptNumber,
    status: "submitted",
  });
}

export interface EvaluateSubmissionOptions {
  submission: InternshipSubmission;
  task: InternshipTask;
  internship: InternshipDefinition;
  currentMilestone: CurriculumMilestone;
  studentContext: StudentContext;
  previousSubmissions?: InternshipSubmission[];
  previousReviews?: InternshipReview[];
  evidenceCollector?: GitHubEvidenceCollector;
  sandboxQueue?: SandboxExecutionQueue;
}

/**
 * Evaluates a student task submission through the full Phase 2 pipeline:
 * 1. Safe Static Evidence Collection (Zero code execution)
 * 2. Evidence Selection & Criteria Mapping
 * 3. AI Review Agent Evaluation
 * 4. Deterministic Review Validation & Anti-Hallucination Guardrails
 * 5. State Machine & Student Context Progression
 */
export async function evaluateSubmission(
  options: EvaluateSubmissionOptions
): Promise<SubmissionEvaluationResult> {
  const logs: string[] = [];
  const {
    submission,
    task,
    internship,
    currentMilestone,
    studentContext,
    previousSubmissions = [],
    previousReviews = [],
  } = options;

  logs.push(
    `Starting evaluation for submission ${submission.id} (Task: '${task.title}', Attempt #${submission.attempt_number}).`
  );

  // 1. Collect Repository Evidence Safely (Static analysis only)
  const collector = options.evidenceCollector ?? new GitHubEvidenceCollector();
  logs.push(`Collecting static repository evidence from ${submission.github_url}...`);
  const evidence = await collector.collect(submission);

  // If repository is private without access or failed with error, route to manual review
  if (evidence.collection_status === "private_restricted" || evidence.collection_status === "error") {
    logs.push(`Evidence collection status '${evidence.collection_status}'. Routing to manual review.`);
    const updatedSubmission: InternshipSubmission = {
      ...submission,
      status: "manual_review",
    };

    const manualReview: InternshipReview = {
      review_id: `rev_manual_${Date.now()}`,
      submission_id: submission.id,
      task_id: task.title.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      attempt_number: submission.attempt_number,
      verdict: "manual_review",
      score: 50,
      summary:
        evidence.collection_status === "private_restricted"
          ? "The submitted GitHub repository is private and cannot be inspected statically without authorized access. A mentor will review your access permissions."
          : `Static evidence collection encountered an issue: ${evidence.error_message || "Unknown error"}. Routed for mentor assistance.`,
      criteria_results: task.acceptance_criteria.map((c) => ({
        criterion: c,
        status: "unable_to_verify" as const,
        evidence: [],
        reason: "Evidence collection could not inspect private/inaccessible repository.",
        critical: false,
      })),
      technical_quality: {
        architecture_score: 50,
        code_quality_score: 50,
        testing_score: 50,
        documentation_score: 50,
        notes: "Repository metadata was inaccessible during static collection.",
      },
      deliverables_evaluated: task.deliverables.map((d) => ({
        deliverable: d,
        status: "incomplete" as const,
        evidence_path: null,
      })),
      strengths: ["Submission was recorded and routed to review team."],
      improvements: ["Ensure the repository is public or granted read permissions to NOVA."],
      next_step: "Please verify your GitHub repository visibility settings or wait for mentor assistance.",
      review_engine_version: "1.0",
      created_at: new Date().toISOString(),
    };

    const valResult = validateReview(manualReview, {
      task,
      internship,
      currentMilestone,
      studentContext,
      currentSubmission: updatedSubmission,
      evidence,
      previousSubmissions,
      previousReviews,
    });

    return {
      submission: updatedSubmission,
      evidence,
      runtimeEvidence: null,
      review: manualReview,
      validation: valResult,
      updatedStudentContext: studentContext,
      notificationEvent: "MANUAL_REVIEW_REQUIRED",
      logs,
    };
  }

  // 2. Execute Sandbox Runtime Verification
  const queue = options.sandboxQueue ?? new SandboxExecutionQueue();
  logs.push(`Executing runtime verification in isolated sandbox for commit ${submission.commit_sha}...`);
  const sandboxResult = await queue.enqueueAndExecute(submission, evidence);
  const runtimeEvidence = sandboxResult.evidence;
  logs.push(...sandboxResult.logs);
  logs.push(
    `Runtime verification finished with status: ${runtimeEvidence.status.toUpperCase()} (Exit code: ${runtimeEvidence.exit_code}, Tests: ${runtimeEvidence.tests_summary.passed}/${runtimeEvidence.tests_summary.total} passed).`
  );

  // 3. Build Review Context (Combining Static Evidence + Factual Runtime Evidence)
  const reviewContext: ReviewContext = {
    task,
    internship,
    currentMilestone,
    studentContext,
    currentSubmission: submission,
    evidence,
    runtimeEvidence,
    previousSubmissions,
    previousReviews,
  };

  let review: InternshipReview | null = null;
  let validationResult = { valid: false, errors: [] as string[], warnings: [] as string[], adjusted_score: 0, adjusted_verdict: "needs_revision" as "passed" | "needs_revision" | "manual_review" };

  // 4. Attempt 1: AI Review
  try {
    logs.push("Attempt 1: Generating AI review with multi-signal evidence...");
    const rawReview = await generateInternshipReview(reviewContext);
    validationResult = validateReview(rawReview, reviewContext);

    if (validationResult.valid) {
      review = {
        ...rawReview,
        score: validationResult.adjusted_score,
        verdict: validationResult.adjusted_verdict,
      };
      logs.push(`Attempt 1 review valid. Adjusted score: ${review.score}, Verdict: ${review.verdict}.`);
    } else {
      logs.push(`Attempt 1 review failed validation with ${validationResult.errors.length} errors: ${validationResult.errors.join("; ")}`);
    }
  } catch (err: any) {
    logs.push(`Attempt 1 review threw error: ${err?.message || err}`);
  }

  // 5. Attempt 2: AI Review with Validation Feedback
  if (!review) {
    try {
      logs.push("Attempt 2: Re-generating AI review with corrective validation feedback...");
      const rawReview2 = await generateInternshipReview(reviewContext, validationResult.errors);
      validationResult = validateReview(rawReview2, reviewContext);

      if (validationResult.valid) {
        review = {
          ...rawReview2,
          score: validationResult.adjusted_score,
          verdict: validationResult.adjusted_verdict,
        };
        logs.push(`Attempt 2 review valid. Adjusted score: ${review.score}, Verdict: ${review.verdict}.`);
      } else {
        logs.push(`Attempt 2 review failed validation: ${validationResult.errors.join("; ")}`);
      }
    } catch (err: any) {
      logs.push(`Attempt 2 review threw error: ${err?.message || err}`);
    }
  }

  // 6. Deterministic Fallback if AI Review Failed
  if (!review) {
    logs.push("AI review unavailable or invalid. Generating deterministic fallback review...");
    const fallback = generateFallbackReview(reviewContext);
    validationResult = validateReview(fallback, reviewContext);
    review = {
      ...fallback,
      score: validationResult.adjusted_score,
      verdict: validationResult.adjusted_verdict,
    };
    logs.push(`Fallback review generated. Score: ${review.score}, Verdict: ${review.verdict}.`);
  }

  // 7. Update Submission Status
  const finalVerdict = review.verdict;
  const updatedSubmission: InternshipSubmission = {
    ...submission,
    status: finalVerdict,
  };

  // 8. Update Student Context on Pass or Needs Revision
  let updatedStudentContext: StudentContext = studentContext;

  const newPerformanceRecord: StudentPerformanceRecord = {
    task_id: submission.task_id,
    task_title: task.title,
    milestone_index: currentMilestone.milestone_index,
    score: review.score,
    verdict: review.verdict === "passed" ? "passed" : "needs_revision",
    strengths: review.strengths,
    weaknesses: review.improvements,
    skills_tested: task.skills_practiced,
    completed_at: new Date().toISOString(),
  };

  const existingRecords = studentContext.performance.recent_records || [];
  const updatedRecords = [...existingRecords, newPerformanceRecord];

  const newCompletedCount =
    finalVerdict === "passed"
      ? studentContext.progress.completed_task_count + 1
      : studentContext.progress.completed_task_count;

  updatedStudentContext = buildStudentContext({
    student: studentContext.student,
    internship,
    performanceRecords: updatedRecords,
    progress: {
      current_milestone_index: currentMilestone.milestone_index,
      completed_task_count: newCompletedCount,
      active_task_id: finalVerdict === "passed" ? null : submission.task_id,
    },
  });

  const notificationEvent =
    finalVerdict === "passed"
      ? ("TASK_PASSED" as const)
      : finalVerdict === "needs_revision"
      ? ("REVISION_REQUIRED" as const)
      : ("MANUAL_REVIEW_REQUIRED" as const);

  logs.push(
    `Evaluation completed. Final Verdict: ${finalVerdict.toUpperCase()}, Score: ${review.score}/100, Notification: ${notificationEvent}.`
  );

  return {
    submission: updatedSubmission,
    evidence,
    runtimeEvidence,
    review,
    validation: validationResult,
    updatedStudentContext,
    notificationEvent,
    logs,
  };
}
