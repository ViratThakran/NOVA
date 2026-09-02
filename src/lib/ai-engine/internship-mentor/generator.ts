import { getAiProvider, sanitizeJsonOutput } from "../providers";
import { internshipTaskSchema, type InternshipTask, type TaskValidationResult } from "../schemas";
import { validateTask } from "./validator";
import { recordAiTelemetry } from "../observability";
import type { TaskGenerationInput, TaskGenerationResult } from "./types";

export class TaskGenerationError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: string[] = [],
    public readonly attempts: number = 0
  ) {
    super(message);
    this.name = "TaskGenerationError";
  }
}

export function buildTaskGenerationPrompt(input: TaskGenerationInput, validationFeedback?: string[]): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { internship, curriculum, currentMilestone, studentContext, previousTasks, targetDifficulty } = input;
  const difficulty = targetDifficulty || studentContext.learning_state.target_difficulty;
  const recommendation = studentContext.learning_state.difficulty_recommendation;
  const learningState = studentContext.learning_state;

  const systemPrompt = [
    "You are the NOVA AI Internship Mentor and Task Generation Engine.",
    "Your mission is to generate the NEXT BEST real-world engineering task for an enrolled intern.",
    "",
    "CRITICAL PRODUCT PRINCIPLES:",
    "1. DO NOT generate generic educational tasks (e.g. 'Read documentation', 'Watch tutorial', 'Learn React').",
    "2. Every task must be real engineering work with business context, measurable deliverables, and testable acceptance criteria.",
    "3. Ground the task in the specific internship curriculum milestone and connect to the capstone final project.",
    "4. Adapt the task to the student's observed skill level, demonstrated strengths, recurring weaknesses, and performance trajectory.",
    "5. Output MUST be strictly valid JSON conforming to the InternshipTask schema.",
  ].join("\n");

  const prevTasksSummary = (previousTasks || []).length > 0
    ? previousTasks!.map((t, idx) => `  ${idx + 1}. ${t.title} (Milestone ${t.milestone_index}, Score: ${t.score ?? "N/A"})`).join("\n")
    : "  None yet (Starting first task of the internship).";

  const demonstratedSkills = (learningState.demonstrated_skills || []).length > 0
    ? learningState.demonstrated_skills.join(", ")
    : "None recorded yet";

  const weakSkills = (learningState.weak_skills || []).length > 0
    ? learningState.weak_skills.join(", ")
    : "None detected";

  const recurringFailures = (learningState.recurring_failure_categories || []).length > 0
    ? learningState.recurring_failure_categories.join(", ")
    : "None";

  const completedMilestonesStr = (learningState.completed_milestones || []).length > 0
    ? `Milestones [${learningState.completed_milestones.join(", ")}] completed`
    : "No milestones completed yet";

  const userPromptLines = [
    "=== INTERNSHIP SPECIFICATION ===",
    `Title: ${internship.title}`,
    `Domain: ${internship.domain}`,
    `Duration: ${internship.duration_weeks} weeks`,
    `Required Skills: ${internship.required_skills.join(", ")}`,
    `Tools: ${internship.tools.join(", ")}`,
    `Final Project Capstone: ${internship.final_project.title}`,
    `Final Project Outcome: ${internship.final_project.expected_outcome}`,
    "",
    "=== ACTIVE MILESTONE ===",
    `Milestone Index: ${currentMilestone.milestone_index}`,
    `Milestone Title: ${currentMilestone.title}`,
    `Milestone Description: ${currentMilestone.description}`,
    `Learning Objectives: ${currentMilestone.learning_objectives.join(" | ")}`,
    `Skills Focused: ${currentMilestone.skills_focused.join(", ")}`,
    `Milestone Contribution to Final Project: ${currentMilestone.final_project_contribution}`,
    "",
    "=== STUDENT STRUCTURED LEARNING PROFILE ===",
    `Student: ${studentContext.student.name}`,
    `Declared Skills: ${studentContext.student.declared_skills.join(", ")}`,
    `Demonstrated Verified Skills: ${demonstratedSkills}`,
    `Identified Weak Skills: ${weakSkills}`,
    `Recurring Failure Categories to Remediate: ${recurringFailures}`,
    `Curriculum Status: ${completedMilestonesStr} (Current Active Milestone: ${studentContext.progress.current_milestone_index})`,
    `Total Completed Tasks: ${studentContext.progress.completed_task_count}`,
    `Total Revision Attempts: ${learningState.revision_count || 0}`,
    `Difficulty Recommendation: ${recommendation}`,
    `Target Task Difficulty: ${difficulty}`,
    `Feedback Themes: ${(learningState.feedback_themes || []).join(" | ") || "Standard progression"}`,
    "",
    "=== PREVIOUS TASKS COMPLETED ===",
    prevTasksSummary,
  ];

  if (input.customInstructions) {
    userPromptLines.push(
      "",
      "=== CUSTOM INSTRUCTIONS / FLAGS ===",
      input.customInstructions
    );
  }

  if (validationFeedback && validationFeedback.length > 0) {
    userPromptLines.push(
      "",
      "=== PREVIOUS ATTEMPT VALIDATION FAILURES (CORRECT THESE ISSUES) ===",
      ...validationFeedback.map((err) => `- ${err}`)
    );
  }

  userPromptLines.push(
    "",
    "=== INSTRUCTIONS ===",
    "Generate the next actionable, production-quality engineering task for this student.",
    "Requirements:",
    "- title: Concise, professional task title",
    "- business_context: Why the company or platform needs this component",
    "- objective: Clear engineering goal",
    "- instructions: 4-6 step-by-step practical implementation guidelines",
    "- deliverables: List of tangible files, repositories, test suites, or documentation",
    "- acceptance_criteria: List of verifiable, testable conditions (endpoints, schemas, coverage %, error states)",
    "- skills_practiced: Array of skills exercised",
    "- estimated_hours: Realistic time (2 - 15 hours)",
    "- difficulty: 'beginner' | 'intermediate' | 'advanced'",
    "- reason_for_assignment: Pedagogical explanation of why this specific task is assigned based on student history and current milestone",
    "- milestone_index: Current milestone index integer",
    "",
    "Output JSON only."
  );

  return {
    systemPrompt,
    userPrompt: userPromptLines.join("\n"),
  };
}

export function generateFallbackTask(input: TaskGenerationInput): InternshipTask {
  const { internship, currentMilestone, studentContext, targetDifficulty } = input;
  const difficulty = targetDifficulty || studentContext.learning_state.target_difficulty;
  const primarySkill = currentMilestone.skills_focused[0] || internship.required_skills[0] || "Python";
  const primaryObjective = currentMilestone.learning_objectives[0] || `Implement ${primarySkill} component`;

  return {
    title: `Implement ${primarySkill} Component for ${currentMilestone.title}`,
    business_context: `NOVA engineering platform requires a robust, test-verified implementation of the ${currentMilestone.title} subsystem for ${internship.title}.`,
    objective: `Build, test, and document the core ${primarySkill} module according to the milestone objective: ${primaryObjective}`,
    instructions: [
      `Review the requirements for ${currentMilestone.title} and establish the project directory structure.`,
      `Implement the core logic in ${primarySkill} handling required business rules and data transformations.`,
      `Add input validation and error handling for edge cases and malformed parameters.`,
      `Write unit tests verifying happy path, error handling, and boundary conditions.`,
      `Document API usage, setup instructions, and test commands in the project README.`
    ],
    deliverables: [
      `Core ${primarySkill} source code files with documented functions`,
      `Automated test suite with unit tests for all public interfaces`,
      `README.md with setup instructions, prerequisites, and execution commands`
    ],
    acceptance_criteria: [
      `Source code passes linting and type checks with zero unhandled exceptions`,
      `Automated test suite passes with >= 80% branch coverage`,
      `Invalid inputs trigger structured error responses with descriptive messages`,
      `README contains reproducible verification steps verified end-to-end`
    ],
    skills_practiced: currentMilestone.skills_focused.slice(0, 3),
    estimated_hours: 5,
    difficulty,
    reason_for_assignment: `Foundational task generated for Milestone ${currentMilestone.milestone_index} to establish verified proficiency in ${primarySkill} before advancing.`,
    milestone_index: currentMilestone.milestone_index,
    capstone_connection: currentMilestone.final_project_contribution || `Directly contributes to final capstone: ${internship.final_project.title}`,
  };
}

export interface GenerateTaskOptions {
  maxRetries?: number;
  disableFallback?: boolean;
}

export async function generateTask(
  input: TaskGenerationInput,
  optionsOrFeedback?: GenerateTaskOptions | string[]
): Promise<InternshipTask> {
  const options: GenerateTaskOptions = Array.isArray(optionsOrFeedback)
    ? { maxRetries: 2 }
    : optionsOrFeedback ?? {};
  const maxRetries = options.maxRetries ?? 3;
  const disableFallback = options.disableFallback ?? true;
  const provider = getAiProvider();
  const logs: string[] = [];
  let validationErrors: string[] = Array.isArray(optionsOrFeedback) ? optionsOrFeedback : [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const startTime = Date.now();
    const { systemPrompt, userPrompt } = buildTaskGenerationPrompt(input, validationErrors.length > 0 ? validationErrors : undefined);

    try {
      const responseText = await provider.complete({
        systemPrompt,
        userPrompt,
        responseFormat: "internship_task",
      });

      const rawParsed = JSON.parse(sanitizeJsonOutput(responseText));
      let parsedJson = rawParsed;
      if (rawParsed && typeof rawParsed === "object") {
        if (rawParsed.task && typeof rawParsed.task === "object") {
          parsedJson = rawParsed.task;
        } else if (rawParsed.internship_task && typeof rawParsed.internship_task === "object") {
          parsedJson = rawParsed.internship_task;
        } else if (rawParsed.response && typeof rawParsed.response === "object") {
          parsedJson = rawParsed.response;
        } else if (rawParsed.data && typeof rawParsed.data === "object") {
          parsedJson = rawParsed.data;
        } else if (rawParsed.result && typeof rawParsed.result === "object") {
          parsedJson = rawParsed.result;
        } else if (rawParsed.output && typeof rawParsed.output === "object") {
          parsedJson = rawParsed.output;
        }
      }

      const primarySkill = input.currentMilestone.skills_focused[0] || input.internship.required_skills[0] || "TypeScript";
      const instructions = Array.isArray(parsedJson.instructions) && parsedJson.instructions.length > 0
        ? parsedJson.instructions
        : typeof parsedJson.instructions === "string"
        ? [parsedJson.instructions]
        : [
            `Review the specification for ${input.currentMilestone.title}.`,
            `Implement the core data structures and logic in ${primarySkill}.`,
            `Add edge case handling and input validation.`,
            `Write automated unit tests verifying core interfaces.`,
            `Document setup and test instructions in README.md.`,
          ];

      const deliverables = Array.isArray(parsedJson.deliverables) && parsedJson.deliverables.length > 0
        ? parsedJson.deliverables
        : typeof parsedJson.deliverables === "string"
        ? [parsedJson.deliverables]
        : [
            `src/${primarySkill.toLowerCase()}-module.ts`,
            `tests/${primarySkill.toLowerCase()}-module.test.ts`,
            "README.md",
          ];

      const acceptance_criteria = Array.isArray(parsedJson.acceptance_criteria) && parsedJson.acceptance_criteria.length > 0
        ? parsedJson.acceptance_criteria
        : typeof parsedJson.acceptance_criteria === "string"
        ? [parsedJson.acceptance_criteria]
        : [
            "Automated test suite executes and passes with zero unhandled exceptions",
            "Invalid inputs trigger structured error responses with descriptive messages",
            "Source code adheres to clean architecture principles and passes linting",
          ];

      const skills_practiced = Array.isArray(parsedJson.skills_practiced) && parsedJson.skills_practiced.length > 0
        ? parsedJson.skills_practiced
        : input.currentMilestone.skills_focused.slice(0, 3);

      const title = parsedJson.title && typeof parsedJson.title === "string" && parsedJson.title.trim().length >= 5
        ? parsedJson.title.trim()
        : `Implement ${primarySkill} Component for ${input.currentMilestone.title}`;

      const business_context = parsedJson.business_context && typeof parsedJson.business_context === "string" && parsedJson.business_context.trim().length >= 10
        ? parsedJson.business_context.trim()
        : `NOVA engineering requires an enterprise-ready ${primarySkill} implementation supporting ${input.internship.title}.`;

      const objective = parsedJson.objective && typeof parsedJson.objective === "string" && parsedJson.objective.trim().length >= 10
        ? parsedJson.objective.trim()
        : `Design, build, and test the core ${primarySkill} module for milestone: ${input.currentMilestone.title}.`;

      const estimated_hours = typeof parsedJson.estimated_hours === "number" && parsedJson.estimated_hours >= 1 && parsedJson.estimated_hours <= 40
        ? parsedJson.estimated_hours
        : 6;

      const candidateTask = internshipTaskSchema.parse({
        title,
        business_context,
        objective,
        instructions,
        deliverables,
        acceptance_criteria,
        skills_practiced,
        estimated_hours,
        difficulty: parsedJson.difficulty || input.targetDifficulty || input.studentContext.learning_state.target_difficulty,
        milestone_index: parsedJson.milestone_index ?? input.currentMilestone.milestone_index,
        capstone_connection: parsedJson.capstone_connection || input.currentMilestone.final_project_contribution || `Directly contributes to final capstone: ${input.internship.final_project.title}`,
        reason_for_assignment: parsedJson.reason_for_assignment || `Assigned for Milestone ${input.currentMilestone.milestone_index} to reinforce core engineering deliverables aligned with ${input.internship.title}.`,
        role_responsibility: parsedJson.role_responsibility || input.internship.title,
        technical_requirements: parsedJson.technical_requirements || input.internship.required_skills,
        inputs: parsedJson.inputs || [],
        testing_requirements: parsedJson.testing_requirements,
        documentation_requirements: parsedJson.documentation_requirements,
      });

      // Deterministic Quality Gate
      const validationResult = validateTask({
        task: candidateTask,
        internship: input.internship,
        currentMilestone: input.currentMilestone,
        studentContext: input.studentContext,
        previousTasks: input.previousTasks,
        expectedDifficulty: input.targetDifficulty,
      });

      const latencyMs = Date.now() - startTime;

      recordAiTelemetry({
        requestId: `task_gen_${Date.now()}_${attempt}`,
        operation: "task_generation",
        studentId: input.studentContext.student.id,
        provider: provider.name,
        configuredModel: (provider as any).model || "default",
        actualModel: (provider as any).model || "default",
        modelFallbackTriggered: false,
        latencyMs,
        validationSuccess: validationResult.valid,
        validationErrors: validationResult.errors,
        validationWarnings: validationResult.warnings,
        retryCount: attempt - 1,
      });

      if (validationResult.valid) {
        return candidateTask;
      }

      // Record errors for next prompt retry
      validationErrors = validationResult.errors;
      logs.push(`[TaskGenerator] Attempt ${attempt} failed validation: ${validationErrors.join("; ")}`);
    } catch (err: any) {
      logs.push(`[TaskGenerator] Attempt ${attempt} error: ${err?.message || err}`);
      validationErrors = [`Generation failed: ${err?.message || err}`];
    }
  }

  // If retries exhausted and fallback disabled, throw safe error
  if (disableFallback) {
    throw new TaskGenerationError(
      `Task generation failed after ${maxRetries} attempts due to validation errors.`,
      validationErrors,
      maxRetries
    );
  }

  // Dev fallback with verified structure
  const fallback = generateFallbackTask(input);
  return fallback;
}
