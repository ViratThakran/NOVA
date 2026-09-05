import { getAiProvider, sanitizeJsonOutput } from "../../providers";
import { internshipReviewSchema, type InternshipReview } from "../../schemas";
import type { ReviewContext } from "../types";
import { formatReviewPrompt } from "./context";
import { deriveTaskEvidenceContract, evaluateEvidenceContract } from "../evidence/contract";

/**
 * Executes AI-assisted code review over collected static repository evidence.
 */
export async function generateInternshipReview(
  context: ReviewContext,
  validationFeedback?: string[]
): Promise<InternshipReview> {
  const provider = getAiProvider();
  const { systemPrompt, userPrompt } = formatReviewPrompt(context, validationFeedback);

  const rawJson = await provider.complete({
    systemPrompt,
    userPrompt,
    responseFormat: "internship_review",
  });

  const rawParsed = JSON.parse(sanitizeJsonOutput(rawJson));
  const parsed = rawParsed.review || rawParsed.internship_review || rawParsed.data || rawParsed;

  if (Array.isArray(parsed.deliverables_evaluated)) {
    parsed.deliverables_evaluated = parsed.deliverables_evaluated.map((d: any) => {
      let status: "present" | "missing" | "incomplete" = "incomplete";
      const s = String(d.status || "").toLowerCase();
      if (s.includes("present") && !s.includes("inadequate") && !s.includes("incomplete") && !s.includes("miss")) {
        status = "present";
      } else if (s.includes("miss") || s.includes("absent") || s.includes("none") || s.includes("not present")) {
        status = "missing";
      } else {
        status = "incomplete";
      }
      return {
        ...d,
        status,
      };
    });
  }

  if (Array.isArray(parsed.acceptance_criteria_evaluated)) {
    parsed.acceptance_criteria_evaluated = parsed.acceptance_criteria_evaluated.map((a: any) => {
      let status: "passed" | "failed" | "partially_met" = "failed";
      const s = String(a.status || "").toLowerCase();
      if (s.includes("pass") || s.includes("met") || s.includes("satisfied")) {
        status = "passed";
      } else if (s.includes("partial") || s.includes("incomplete")) {
        status = "partially_met";
      } else {
        status = "failed";
      }
      return {
        ...a,
        status,
      };
    });
  }

  if (parsed.next_step && typeof parsed.next_step === "string" && parsed.next_step.length > 2900) {
    parsed.next_step = parsed.next_step.slice(0, 2900);
  }
  if (parsed.summary && typeof parsed.summary === "string" && parsed.summary.length > 2900) {
    parsed.summary = parsed.summary.slice(0, 2900);
  }

  return internshipReviewSchema.parse({
    review_id: parsed.review_id || `rev_ai_${Date.now()}`,
    submission_id: parsed.submission_id || context.currentSubmission.id,
    task_id: parsed.task_id || context.task.title.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    attempt_number: parsed.attempt_number ?? context.currentSubmission.attempt_number,
    created_at: parsed.created_at || new Date().toISOString(),
    review_engine_version: parsed.review_engine_version || "1.0",
    ...parsed,
  });
}

/**
 * Deterministic Fallback Review Synthesizer
 * Produces an objective, evidence-grounded review if AI provider is unreachable or returns malformed data.
 */
export function generateFallbackReview(context: ReviewContext): InternshipReview {
  const { task, currentSubmission, evidence, runtimeEvidence } = context;

  const contract = deriveTaskEvidenceContract(task);
  const evaluation = evaluateEvidenceContract(contract, evidence, runtimeEvidence, task);

  const verdict = evaluation.can_pass ? "passed" : "needs_revision";
  const score = evaluation.can_pass ? 88 : Math.min(evaluation.relevance_score, 55);

  const summary =
    verdict === "passed"
      ? "The submitted repository contains clean, well-structured code fulfilling all core deliverables and acceptance criteria."
      : evaluation.block_reasons.length > 0
      ? `Task requirements incomplete: ${evaluation.block_reasons.join(" ")}`
      : "The core project structure is established, but some required criteria or edge cases require additional implementation and testing.";

  const nextStep =
    verdict === "passed"
      ? "Great work! Proceed to the next progressive task in your curriculum milestone."
      : evaluation.actionable_feedback.length > 0
      ? evaluation.actionable_feedback.join(" ")
      : "Refactor the flagged criteria, ensure all required files are committed to GitHub, and resubmit for review.";

  return internshipReviewSchema.parse({
    review_id: `rev_fallback_${Date.now()}`,
    submission_id: currentSubmission.id,
    task_id: task.title.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    attempt_number: currentSubmission.attempt_number,
    verdict,
    score,
    summary,
    criteria_results: evaluation.criterion_evaluations,
    technical_quality: {
      architecture_score: verdict === "passed" ? 88 : 45,
      code_quality_score: verdict === "passed" ? 85 : 45,
      testing_score: (evidence.test_files || []).length > 0 ? (evaluation.test_verification.tests_match_task ? 80 : 35) : 20,
      documentation_score: evidence.readme ? 75 : 30,
      notes: evaluation.block_reasons.length > 0 ? evaluation.block_reasons.join(" ") : "Static structural inspection completed.",
    },
    deliverables_evaluated: evaluation.deliverables_evaluated,
    strengths:
      verdict === "passed"
        ? [
            "Modular file architecture adhering to domain standard conventions.",
            "Clear separation of concerns across configuration, implementation, and test files.",
          ]
        : ["Repository is publicly accessible with valid Git commit."],
    improvements:
      verdict === "passed"
        ? ["Consider adding expanded integration test coverage across additional edge cases."]
        : evaluation.block_reasons.length > 0
        ? evaluation.block_reasons
        : [
            "Ensure all acceptance criteria have corresponding unit test assertions.",
            "Verify documentation outlines local verification and setup instructions clearly.",
          ],
    next_step: nextStep,
    review_engine_version: "1.0",
    created_at: new Date().toISOString(),
  });
}
