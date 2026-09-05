import type { InternshipReview, ReviewValidationResult } from "../../schemas";
import type { ReviewContext } from "../types";
import {
  deriveTaskEvidenceContract,
  evaluateEvidenceContract,
} from "../evidence/contract";

const FORBIDDEN_RUNTIME_CLAIMS_WHEN_UNVERIFIED = [
  /tests\s+passed\s+successfully/i,
  /all\s+tests\s+pass/i,
  /all\s+tests\s+passed/i,
  /executed\s+the\s+test\s+suite/i,
  /executed\s+test/i,
  /ran\s+the\s+tests\s+and\s+they\s+passed/i,
  /ran\s+all\s+tests/i,
  /passed\s+with\s+100%/i,
  /deployment\s+succeeded\s+at\s+runtime/i,
  /live\s+execution/i,
  /runtime\s+execution/i,
  /passed\s+at\s+runtime/i,
];

/**
 * Deterministic Review Validator
 * Enforces strict anti-hallucination checks, file citation verification,
 * runtime evidence cross-validation, task-specific contract enforcement,
 * and deterministic scoring policies.
 *
 * CRITICAL RULE: AI CAN NEVER OVERRIDE MISSING DETERMINISTIC EVIDENCE.
 */
export function validateReview(
  review: InternshipReview,
  context: ReviewContext
): ReviewValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { task, evidence, runtimeEvidence } = context;

  // 1. Evaluate Deterministic Task Evidence Contract
  const contract = deriveTaskEvidenceContract(task);
  const contractEvaluation = evaluateEvidenceContract(contract, evidence, runtimeEvidence, task);

  // 2. Build set of real collected file paths (normalized)
  const realFilesSet = new Set<string>();
  const normalize = (p: string) => p.toLowerCase().replace(/^[./\\]+/, "").trim();

  for (const f of evidence.file_tree || []) {
    realFilesSet.add(normalize(f.path));
  }
  for (const f of evidence.source_files || []) {
    realFilesSet.add(normalize(f.path));
  }
  for (const f of evidence.test_files || []) {
    realFilesSet.add(normalize(f.path));
  }
  for (const f of evidence.config_files || []) {
    realFilesSet.add(normalize(f.path));
  }
  for (const f of evidence.data_files || []) {
    realFilesSet.add(normalize(f.path));
  }
  for (const f of evidence.doc_files || []) {
    realFilesSet.add(normalize(f.path));
  }
  if (evidence.readme) {
    realFilesSet.add("readme.md");
  }

  // 3. Anti-Hallucination File Citation Check
  for (const result of review.criteria_results) {
    for (const citedPath of result.evidence || []) {
      const normCited = normalize(citedPath);
      // Skip generic notices or empty strings
      if (!normCited || normCited === "none" || normCited.includes("not found")) continue;

      const exists =
        realFilesSet.has(normCited) ||
        Array.from(realFilesSet).some((rf) => rf.endsWith(normCited) || normCited.endsWith(rf));

      if (!exists) {
        errors.push(
          `Anti-Hallucination Violation: Criterion '${result.criterion}' cites non-existent file '${citedPath}' not present in repository evidence.`
        );
      }
    }
  }

  for (const deliv of review.deliverables_evaluated || []) {
    if (deliv.evidence_path) {
      const normCited = normalize(deliv.evidence_path);
      const exists =
        realFilesSet.has(normCited) ||
        Array.from(realFilesSet).some((rf) => rf.endsWith(normCited) || normCited.endsWith(rf));

      if (!exists) {
        errors.push(
          `Anti-Hallucination Violation: Deliverable '${deliv.deliverable}' cites non-existent file '${deliv.evidence_path}'.`
        );
      }
    }
  }

  // 4. Multi-Signal Runtime Evidence Cross-Validation
  const hasRuntimeEvidence =
    runtimeEvidence != null && (runtimeEvidence.status === "completed" || runtimeEvidence.status === "failed");
  const runtimeTestsPassed =
    hasRuntimeEvidence &&
    runtimeEvidence!.exit_code === 0 &&
    runtimeEvidence!.tests_summary.failed === 0 &&
    runtimeEvidence!.tests_summary.passed > 0;
  const runtimeTestsFailed =
    hasRuntimeEvidence &&
    (runtimeEvidence!.exit_code !== 0 ||
      runtimeEvidence!.tests_summary.failed > 0 ||
      runtimeEvidence!.status === "failed");

  const combinedReviewText = [
    review.summary,
    review.next_step,
    review.technical_quality.notes,
    ...review.criteria_results.map((c) => c.reason),
    ...review.strengths,
    ...review.improvements,
  ].join(" ");

  if (!runtimeTestsPassed) {
    // If runtime verification did NOT confirm all tests passing, AI must not claim tests ran and passed cleanly
    for (const forbiddenPattern of FORBIDDEN_RUNTIME_CLAIMS_WHEN_UNVERIFIED) {
      if (forbiddenPattern.test(combinedReviewText)) {
        errors.push(
          `Anti-Hallucination Violation: Review claims runtime execution or test passing without verifiable runtime logs ('${forbiddenPattern.source}').`
        );
        break;
      }
    }
  }

  // 5. Conflicting Evidence Guard: Static Presence vs Runtime Failure
  if (runtimeTestsFailed) {
    if (review.verdict === "passed") {
      errors.push(
        "Conflicting Evidence Violation: Review verdict is 'passed' despite verified runtime execution test failures."
      );
    }
  }

  // 6. Enforce Deterministic Evidence Gate Over AI Review Criteria
  const effectiveCriteriaResults = review.criteria_results.map((aiCrit, idx) => {
    const isCritical = contract.critical_criteria_indices.includes(idx) || aiCrit.critical;
    const deterministicEval = contractEvaluation.criterion_evaluations[idx];

    // If deterministic evaluation says not_met due to missing artifacts or domain mismatch, AI cannot say met
    if (deterministicEval && deterministicEval.status === "not_met" && aiCrit.status === "met") {
      errors.push(
        `Anti-Hallucination Violation: Review marked criterion '${aiCrit.criterion}' as 'met', but required deterministic evidence is missing.`
      );
      return {
        ...aiCrit,
        status: "not_met" as const,
        reason: deterministicEval.reason,
        critical: isCritical,
      };
    }

    return {
      ...aiCrit,
      critical: isCritical,
    };
  });

  // 7. Acceptance Criteria Coverage Check
  if (task.acceptance_criteria.length > 0) {
    const evaluatedCriteria = new Set(review.criteria_results.map((c) => c.criterion.toLowerCase().trim()));
    for (const expectedCriterion of task.acceptance_criteria) {
      const expNorm = expectedCriterion.toLowerCase().trim();
      const isEvaluated = Array.from(evaluatedCriteria).some((ev) => ev.includes(expNorm) || expNorm.includes(ev));
      if (!isEvaluated) {
        warnings.push(`Expected acceptance criterion '${expectedCriterion}' was not explicitly evaluated in review.`);
      }
    }
  }

  // 8. Deterministic Scoring & Verdict Policy Calculation
  // Scoring weights: Criteria (50%), Technical Quality (25%), Deliverables (15%), Documentation (10%)
  let criteriaScore = 0;
  if (effectiveCriteriaResults.length > 0) {
    let totalCritPoints = 0;
    for (const cr of effectiveCriteriaResults) {
      if (cr.status === "met") totalCritPoints += 100;
      else if (cr.status === "partially_met") totalCritPoints += 50;
      else if (cr.status === "unable_to_verify") totalCritPoints += 20;
      else totalCritPoints += 0;
    }
    criteriaScore = Math.round(totalCritPoints / effectiveCriteriaResults.length);
  }

  const tq = review.technical_quality;
  const techQualityScore = Math.round(
    (tq.architecture_score + tq.code_quality_score + tq.testing_score + tq.documentation_score) / 4
  );

  let deliverablesScore = 100;
  if ((review.deliverables_evaluated || []).length > 0) {
    const presentCount = review.deliverables_evaluated.filter((d) => d.status === "present").length;
    const partialCount = review.deliverables_evaluated.filter((d) => d.status === "incomplete").length;
    deliverablesScore = Math.round(
      ((presentCount * 100 + partialCount * 50) / review.deliverables_evaluated.length)
    );
  }

  const docScore = tq.documentation_score;

  let calculatedScore = Math.round(
    0.50 * criteriaScore + 0.25 * techQualityScore + 0.15 * deliverablesScore + 0.10 * docScore
  );

  // If contract evaluation failed (e.g. unrelated repo or missing critical artifacts), cap score strictly
  if (!contractEvaluation.can_pass) {
    calculatedScore = Math.min(calculatedScore, contractEvaluation.relevance_score, 55);
  }

  // If runtime tests failed, deduct from testing score and cap overall score
  if (runtimeTestsFailed) {
    calculatedScore = Math.min(calculatedScore, 55);
  }

  // 9. Critical Criterion Rule
  const hasCriticalFailure = effectiveCriteriaResults.some(
    (c) => c.critical && (c.status === "not_met" || c.status === "partially_met")
  );

  if (hasCriticalFailure) {
    calculatedScore = Math.min(calculatedScore, 55);
  }

  // 10. Determine Authoritative Adjusted Verdict
  let adjustedVerdict: "passed" | "needs_revision" | "manual_review" = review.verdict;

  if (evidence.collection_status === "private_restricted" || evidence.collection_status === "error") {
    adjustedVerdict = "manual_review";
  } else if (!contractEvaluation.can_pass) {
    // Deterministic gate blocks PASS
    adjustedVerdict = "needs_revision";
    if (review.verdict === "passed") {
      warnings.push(
        "Deterministic Gate: Review verdict adjusted from 'passed' to 'needs_revision' due to incomplete task-specific evidence contract."
      );
    }
  } else if (runtimeEvidence?.status === "verification_unavailable") {
    // Infrastructure failure is NOT student failure!
    adjustedVerdict = calculatedScore >= 75 ? "passed" : "needs_revision";
  } else if (runtimeTestsFailed || hasCriticalFailure) {
    adjustedVerdict = "needs_revision";
  } else if (review.verdict === "needs_revision") {
    adjustedVerdict = "needs_revision";
  } else if (calculatedScore >= 75 && review.verdict === "passed") {
    const notMetCount = effectiveCriteriaResults.filter((c) => c.status === "not_met").length;
    const partialCount = effectiveCriteriaResults.filter((c) => c.status === "partially_met").length;
    if (notMetCount === 0 && partialCount === 0) {
      adjustedVerdict = "passed";
    } else {
      adjustedVerdict = "needs_revision";
    }
  } else {
    adjustedVerdict = "needs_revision";
  }

  // 11. Check Next Step Exists for Revisions
  if (adjustedVerdict === "needs_revision" && (!review.next_step || review.next_step.length < 10)) {
    errors.push("Reviews requiring revision must provide specific, actionable next steps in 'next_step'.");
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    adjusted_score: calculatedScore,
    adjusted_verdict: adjustedVerdict,
  };
}
