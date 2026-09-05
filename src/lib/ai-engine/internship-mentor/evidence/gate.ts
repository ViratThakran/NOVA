import type {
  InternshipTask,
  RepositoryEvidence,
  InternshipSubmission,
  InternshipReview,
} from "../../schemas";
import {
  deriveTaskEvidenceContract,
  evaluateEvidenceContract,
  type TaskEvidenceContract,
  type ContractEvaluationResult,
} from "./contract";

export interface TaskRelevanceGateResult {
  status: "accepted" | "rejected";
  contract: TaskEvidenceContract;
  evaluation: ContractEvaluationResult;
  rejectionReview?: InternshipReview;
  reason?: string;
}

/**
 * Deterministic Task / Repository Relevance Gate
 * Executed at Stage 2 prior to expensive sandbox microVM execution and AI review calls.
 * Blocks unrelated repositories, empty repositories, or commits with no task changes.
 */
export function runTaskRelevanceGate(
  task: InternshipTask,
  evidence: RepositoryEvidence,
  submission: InternshipSubmission
): TaskRelevanceGateResult {
  const contract = deriveTaskEvidenceContract(task);
  const evaluation = evaluateEvidenceContract(contract, evidence, undefined, task);

  const isUnrelated = !evaluation.is_domain_relevant;
  const criticalArtifactsMissing = evaluation.missing_artifacts.filter((a) => a.critical);
  const criticalConceptsMissing = evaluation.missing_concepts.filter((c) => c.critical);
  const noRelevantChanges = !evaluation.commit_provenance.has_relevant_changes;

  // Rejection conditions:
  // 1. Mismatched domain (e.g. React/Next.js repo for Data Cleaning pipeline task)
  // 2. All core source artifacts missing
  // 3. Score below 40
  // 4. Submitted commit touched 0 relevant files
  const shouldReject =
    isUnrelated ||
    (criticalArtifactsMissing.length >= 2 && criticalConceptsMissing.length >= 2) ||
    evaluation.relevance_score < 40 ||
    noRelevantChanges;

  if (!shouldReject) {
    return {
      status: "accepted",
      contract,
      evaluation,
    };
  }

  // Synthesize deterministic rejection review
  const missingItemsSummary = [
    ...evaluation.missing_artifacts.map((a) => a.name),
    ...evaluation.missing_concepts.map((c) => c.concept),
  ].slice(0, 4).join(", ");

  const reason = isUnrelated
    ? `The submitted repository does not provide sufficient evidence for the assigned '${task.title}' task. Detected domain mismatch: ${evaluation.domain_mismatch_reasons.join(" ")}`
    : noRelevantChanges
    ? `The submitted Git commit SHA (${submission.commit_sha.slice(0, 7)}) contains no task-relevant changes.`
    : `The submitted repository is missing critical artifacts and implementations required for '${task.title}': ${missingItemsSummary}.`;

  const summary = [
    `Task Relevance Gate: The submitted GitHub repository does not contain verifiable evidence for the assigned task "${task.title}".`,
    reason,
    "To complete this task, implement the requested deliverables in your GitHub repository, ensure your changes are committed, and submit the new commit SHA.",
  ].join("\n\n");

  const nextStep = evaluation.actionable_feedback.length > 0
    ? evaluation.actionable_feedback.join(" ")
    : `Implement the required deliverables for "${task.title}", commit the code to your repository, and submit the commit SHA for evaluation.`;

  const cappedScore = Math.min(evaluation.relevance_score, 55);

  const rejectionReview: InternshipReview = {
    review_id: `rev_gate_${Date.now()}`,
    submission_id: submission.id,
    task_id: task.title.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    attempt_number: submission.attempt_number,
    verdict: "needs_revision",
    score: cappedScore,
    summary,
    criteria_results: evaluation.criterion_evaluations,
    technical_quality: {
      architecture_score: isUnrelated ? 20 : 40,
      code_quality_score: isUnrelated ? 20 : 40,
      testing_score: evaluation.test_verification.has_test_files && evaluation.test_verification.tests_match_task ? 50 : 20,
      documentation_score: evidence.readme ? 50 : 20,
      notes: reason,
    },
    deliverables_evaluated: evaluation.deliverables_evaluated,
    strengths: isUnrelated
      ? ["Repository structure exists and is publicly accessible."]
      : ["Repository is accessible and connected to version control."],
    improvements: [
      reason,
      ...evaluation.actionable_feedback,
    ],
    next_step: nextStep,
    review_engine_version: "1.0",
    created_at: new Date().toISOString(),
  };

  return {
    status: "rejected",
    contract,
    evaluation,
    rejectionReview,
    reason,
  };
}
