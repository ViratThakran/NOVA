import type {
  StudentContext,
  CurriculumPlan,
  CurriculumMilestone,
  DifficultyLevel,
} from "./types";
import type { InternshipReview } from "../schemas";

export type MentorAction =
  | "ADVANCE_MILESTONE"
  | "CONTINUE_MILESTONE_STANDARD"
  | "CONTINUE_MILESTONE_SCALE_UP"
  | "CONTINUE_MILESTONE_SCAFFOLD"
  | "REVISION_REQUIRED"
  | "TARGETED_REMEDIATION"
  | "CAPSTONE_PREPARATION"
  | "CAPSTONE_ASSIGNMENT";

export type FailureRootCause =
  | "knowledge_gap"
  | "implementation_error"
  | "testing_failure"
  | "documentation_failure"
  | "misunderstanding_requirements"
  | "repeated_weakness"
  | "strong_performance"
  | "standard_progression";

export interface NextTaskDecision {
  action: MentorAction;
  targetMilestoneIndex: number;
  targetMilestone: CurriculumMilestone;
  targetDifficulty: DifficultyLevel;
  focusSkills: string[];
  failureRootCause?: FailureRootCause;
  remediationObjective?: string;
  scaffoldingProvided?: boolean;
  pedagogicalRationale: string;
  capstoneTraceability: string;
}

export interface DecisionEngineInput {
  studentContext: StudentContext;
  curriculum: CurriculumPlan;
  lastReview?: InternshipReview;
  lastTaskTitle?: string;
}

/**
 * Categorize the primary root cause of a student's submission outcome
 */
export function diagnoseFailureRootCause(
  review?: InternshipReview,
  repeatedErrors: string[] = []
): FailureRootCause {
  if (!review) return "standard_progression";
  if (review.verdict === "passed") {
    return review.score >= 90 ? "strong_performance" : "standard_progression";
  }

  if (repeatedErrors.length > 0) {
    return "repeated_weakness";
  }

  const tq = review.technical_quality;
  const missingDeliverables = (review.deliverables_evaluated || []).filter((d) => d.status === "missing");
  const failedCriteria = review.criteria_results.filter((c) => c.status === "not_met");

  // 1. Testing Failure: Code exists but tests are failing or missing
  if (tq && tq.testing_score < 60) {
    return "testing_failure";
  }

  // 2. Documentation Failure: Code works but setup/docs are absent
  if (tq && tq.documentation_score < 50 && tq.code_quality_score >= 70) {
    return "documentation_failure";
  }

  // 3. Misunderstanding Requirements: Deliverables are missing
  if (missingDeliverables.length > 0) {
    return "misunderstanding_requirements";
  }

  // 4. Knowledge Gap: Low architecture and code quality score
  if (tq && tq.architecture_score < 60) {
    return "knowledge_gap";
  }

  // 5. Implementation Error: Runtime logic bug
  if (failedCriteria.length > 0 || review.verdict === "needs_revision") {
    return "implementation_error";
  }

  return "standard_progression";
}

/**
 * Deterministic Next-Task Decision Engine
 * Acts as the pedagogical governor above LLM task generation.
 */
export function decideNextMentorAction(input: DecisionEngineInput): NextTaskDecision {
  const { studentContext, curriculum, lastReview } = input;
  const currentMilestoneIdx = studentContext.progress.current_milestone_index;
  const totalMilestones = curriculum.milestones.length;
  const currentMilestone =
    curriculum.milestones[currentMilestoneIdx] ||
    curriculum.milestones[0];

  const capstoneOutcome = curriculum.final_outcome || "Portfolio capstone production deployment";
  const repeatedErrors = studentContext.performance.repeated_errors || [];
  const rootCause = diagnoseFailureRootCause(lastReview, repeatedErrors);

  // 1. Check if last review requires revision
  if (lastReview && lastReview.verdict === "needs_revision") {
    let rationale = `Student submission requires revision to satisfy all acceptance criteria.`;
    let scaffolding = true;

    if (rootCause === "testing_failure") {
      rationale = `Student submission requires revision: Runtime test failures or missing test assertions detected. Re-attempting with focus on automated verification.`;
    } else if (rootCause === "misunderstanding_requirements") {
      rationale = `Student submission requires revision: Missing mandatory deliverables. Re-attempting to ensure all specified artifacts are included.`;
    } else if (rootCause === "knowledge_gap") {
      rationale = `Student submission requires revision: Architectural or design pattern misalignment. Providing targeted architectural constraints.`;
    }

    return {
      action: "REVISION_REQUIRED",
      targetMilestoneIndex: currentMilestoneIdx,
      targetMilestone: currentMilestone,
      targetDifficulty: studentContext.learning_state.target_difficulty,
      focusSkills: lastReview.improvements.slice(0, 3),
      failureRootCause: rootCause,
      remediationObjective: `Address feedback from previous attempt: ${lastReview.summary.slice(0, 150)}...`,
      scaffoldingProvided: scaffolding,
      pedagogicalRationale: rationale,
      capstoneTraceability: `Fulfills prerequisite components required for milestone ${currentMilestoneIdx} contributing to "${capstoneOutcome}".`,
    };
  }

  // 2. Check for persistent repeated errors across recent records
  if (repeatedErrors.length > 0) {
    return {
      action: "TARGETED_REMEDIATION",
      targetMilestoneIndex: currentMilestoneIdx,
      targetMilestone: currentMilestone,
      targetDifficulty: studentContext.learning_state.target_difficulty,
      focusSkills: repeatedErrors,
      failureRootCause: "repeated_weakness",
      remediationObjective: `Targeted practice to eliminate recurring error patterns in: ${repeatedErrors.join(", ")}.`,
      scaffoldingProvided: true,
      pedagogicalRationale: `Repeated weakness detected in ${repeatedErrors.join(", ")}. Assigning targeted remediation task with strict validation requirements.`,
      capstoneTraceability: `Eliminates code quality and architectural flaws before capstone assembly.`,
    };
  }

  // 3. Check if student is struggling (avg score < 65 or multiple revisions)
  const recentRecords = studentContext.performance.recent_records || [];
  const recentAvg =
    recentRecords.length > 0
      ? recentRecords.slice(-3).reduce((acc, r) => acc + r.score, 0) / Math.min(recentRecords.length, 3)
      : 80;

  if (recentRecords.length >= 2 && recentAvg < 65) {
    return {
      action: "CONTINUE_MILESTONE_SCAFFOLD",
      targetMilestoneIndex: currentMilestoneIdx,
      targetMilestone: currentMilestone,
      targetDifficulty: "beginner",
      focusSkills: currentMilestone.skills_focused,
      failureRootCause: "knowledge_gap",
      scaffoldingProvided: true,
      pedagogicalRationale: `Student performance indicates need for scaffolding (average score: ${Math.round(recentAvg)}%). Providing guided step-by-step engineering constraints.`,
      capstoneTraceability: `Builds fundamental building blocks for ${currentMilestone.title}.`,
    };
  }

  // 4. Check if student completed current milestone tasks
  const completedTasksForMilestone = recentRecords.filter(
    (r) => r.milestone_index === currentMilestoneIdx && r.verdict === "passed"
  ).length;

  const isMilestoneComplete = completedTasksForMilestone >= 1 && (lastReview?.verdict === "passed" || !lastReview);

  if (isMilestoneComplete) {
    const nextMilestoneIdx = currentMilestoneIdx + 1;

    if (nextMilestoneIdx >= totalMilestones) {
      // Final Capstone Ready
      const capstoneMilestone = curriculum.milestones[totalMilestones - 1] || currentMilestone;
      return {
        action: "CAPSTONE_ASSIGNMENT",
        targetMilestoneIndex: totalMilestones - 1,
        targetMilestone: capstoneMilestone,
        targetDifficulty: "advanced",
        focusSkills: capstoneMilestone.skills_focused,
        failureRootCause: "strong_performance",
        pedagogicalRationale: `All prerequisite curriculum milestones complete! Assigning final capstone integration project.`,
        capstoneTraceability: `Final capstone deliverable: ${capstoneOutcome}.`,
      };
    } else {
      // Advance to next milestone
      const nextMilestone = curriculum.milestones[nextMilestoneIdx];
      const targetDifficulty =
        recentAvg >= 90 ? "advanced" : nextMilestone.target_difficulty;

      return {
        action: "ADVANCE_MILESTONE",
        targetMilestoneIndex: nextMilestoneIdx,
        targetMilestone: nextMilestone,
        targetDifficulty,
        focusSkills: nextMilestone.skills_focused,
        failureRootCause: recentAvg >= 90 ? "strong_performance" : "standard_progression",
        pedagogicalRationale: `Successfully mastered Milestone ${currentMilestoneIdx} (${currentMilestone.title}). Advancing to Milestone ${nextMilestoneIdx} (${nextMilestone.title}).`,
        capstoneTraceability: nextMilestone.final_project_contribution,
      };
    }
  }

  // 5. High Performance Acceleration within current milestone
  if (recentRecords.length >= 1 && recentAvg >= 90) {
    return {
      action: "CONTINUE_MILESTONE_SCALE_UP",
      targetMilestoneIndex: currentMilestoneIdx,
      targetMilestone: currentMilestone,
      targetDifficulty: "advanced",
      focusSkills: currentMilestone.skills_focused,
      failureRootCause: "strong_performance",
      pedagogicalRationale: `Exceptional velocity and code quality demonstrated (score: ${Math.round(recentAvg)}%). Scaling task complexity with performance optimization criteria.`,
      capstoneTraceability: currentMilestone.final_project_contribution,
    };
  }

  // 6. Default: Standard Progression
  return {
    action: "CONTINUE_MILESTONE_STANDARD",
    targetMilestoneIndex: currentMilestoneIdx,
    targetMilestone: currentMilestone,
    targetDifficulty: currentMilestone.target_difficulty,
    focusSkills: currentMilestone.skills_focused,
    failureRootCause: "standard_progression",
    pedagogicalRationale: `Continuing active roadmap for ${currentMilestone.title}.`,
    capstoneTraceability: currentMilestone.final_project_contribution,
  };
}
