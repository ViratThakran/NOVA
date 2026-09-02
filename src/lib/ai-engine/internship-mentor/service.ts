import { generateCurriculumPlan, getMilestoneByIndex } from "./curriculum";
import { generateTask, generateFallbackTask } from "./generator";
import { validateTask } from "./validator";
import { decideNextMentorAction, type NextTaskDecision } from "./decision";
import type {
  TaskGenerationInput,
  TaskGenerationResult,
  InternshipDefinition,
  CurriculumMilestone,
  CurriculumPlan,
  StudentContext,
  DifficultyLevel,
} from "./types";

export { decideNextMentorAction };
export type { NextTaskDecision };

export function generateCurriculumForInternship(definition: InternshipDefinition): CurriculumPlan {
  return generateCurriculumPlan(definition);
}

export interface GenerateNextInternshipTaskOptions {
  internship: InternshipDefinition;
  curriculum?: CurriculumPlan;
  studentContext: StudentContext;
  milestoneIndex?: number;
  currentMilestoneIndex?: number;
  currentMilestone?: CurriculumMilestone;
  previousTasks?: Array<{
    title: string;
    objective: string;
    milestone_index?: number;
    score?: number;
    verdict?: string;
  }>;
  targetDifficulty?: DifficultyLevel;
  customInstructions?: string;
  decision?: NextTaskDecision;
  disableFallback?: boolean;
}

export async function generateNextInternshipTask(
  options: GenerateNextInternshipTaskOptions
): Promise<TaskGenerationResult> {
  const logs: string[] = [];
  const curriculum = options.curriculum ?? generateCurriculumPlan(options.internship);

  // Compute or resolve deterministic decision
  const decision =
    options.decision ??
    decideNextMentorAction({
      studentContext: options.studentContext,
      curriculum,
    });

  const milestoneIndex =
    options.currentMilestone?.milestone_index ??
    options.milestoneIndex ??
    options.currentMilestoneIndex ??
    decision.targetMilestoneIndex ??
    options.studentContext.progress.current_milestone_index;

  const currentMilestone =
    options.currentMilestone ??
    getMilestoneByIndex(curriculum, milestoneIndex) ??
    decision.targetMilestone ??
    curriculum.milestones[0];

  const targetDifficulty =
    options.targetDifficulty ??
    decision.targetDifficulty ??
    options.studentContext.learning_state.target_difficulty ??
    currentMilestone.target_difficulty;

  const customInstructions = [
    options.customInstructions,
    decision.remediationObjective ? `[REMEDIATION OBJECTIVE]: ${decision.remediationObjective}` : "",
    decision.scaffoldingProvided ? `[SCAFFOLDING REQUESTED]: Provide clear architectural hints and structured sub-steps.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const generationInput: TaskGenerationInput = {
    internship: options.internship,
    curriculum,
    currentMilestone,
    studentContext: options.studentContext,
    previousTasks: options.previousTasks ?? [],
    targetDifficulty,
    customInstructions: customInstructions.length > 0 ? customInstructions : undefined,
  };

  logs.push(
    `Mentor Decision: ${decision.action} -> Targeting milestone ${currentMilestone.milestone_index} (${currentMilestone.title}) at difficulty '${targetDifficulty}'. Rationale: ${decision.pedagogicalRationale}`
  );

  // Attempt 1: AI generation
  try {
    logs.push("Attempt 1: Generating task via AI provider...");
    const task1 = await generateTask(generationInput);
    const validation1 = validateTask({
      task: task1,
      internship: options.internship,
      currentMilestone,
      studentContext: options.studentContext,
      previousTasks: options.previousTasks,
      expectedDifficulty: targetDifficulty,
    });

    if (validation1.valid) {
      logs.push(`Attempt 1 succeeded with validation score: ${validation1.score ?? 100}`);
      return {
        task: task1,
        validation: validation1,
        attempts: 1,
        generatedBy: "ai",
        decision,
        logs,
      };
    }

    logs.push(`Attempt 1 failed validation: ${validation1.errors.join("; ")}`);

    // Attempt 2: AI generation with validation feedback
    logs.push("Attempt 2: Re-generating task with validation feedback...");
    const task2 = await generateTask(generationInput, validation1.errors);
    const validation2 = validateTask({
      task: task2,
      internship: options.internship,
      currentMilestone,
      studentContext: options.studentContext,
      previousTasks: options.previousTasks,
      expectedDifficulty: targetDifficulty,
    });

    if (validation2.valid) {
      logs.push(`Attempt 2 succeeded with validation score: ${validation2.score ?? 100}`);
      return {
        task: task2,
        validation: validation2,
        attempts: 2,
        generatedBy: "ai_with_retry",
        decision,
        logs,
      };
    }

    logs.push(`Attempt 2 failed validation: ${validation2.errors.join("; ")}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logs.push(`AI generation threw error: ${errorMsg}`);
  }

  // If fallback is disabled for real student journeys, fail cleanly without generating synthetic tasks
  if (options.disableFallback) {
    const errorSummary = logs.filter((l) => l.includes("failed") || l.includes("error")).join("; ");
    throw new Error(`AI Task Generation failed validation: ${errorSummary || "Unable to generate compliant engineering task"}`);
  }

  // Final Fallback: Deterministic fallback generator (for testing / demo purposes only)
  logs.push("Falling back to deterministic fallback task generator.");
  const fallbackTask = generateFallbackTask(generationInput);
  const fallbackValidation = validateTask({
    task: fallbackTask,
    internship: options.internship,
    currentMilestone,
    studentContext: options.studentContext,
    previousTasks: options.previousTasks,
    expectedDifficulty: targetDifficulty,
  });

  logs.push(`Deterministic fallback task ready with valid=${fallbackValidation.valid}.`);
  return {
    task: fallbackTask,
    validation: fallbackValidation,
    attempts: 3,
    generatedBy: "deterministic_fallback",
    decision,
    logs,
  };
}
