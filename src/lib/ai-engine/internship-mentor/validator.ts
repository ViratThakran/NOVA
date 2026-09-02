import {
  internshipTaskSchema,
  type InternshipTask,
  type TaskValidationResult,
  type InternshipDefinition,
  type CurriculumMilestone,
  type StudentContext,
  type DifficultyLevel,
} from "../schemas";

export interface ValidateTaskOptions {
  task: unknown;
  internship: InternshipDefinition;
  currentMilestone: CurriculumMilestone;
  studentContext?: StudentContext;
  previousTasks?: Array<{
    title: string;
    objective: string;
    milestone_index?: number;
  }>;
  expectedDifficulty?: DifficultyLevel;
}

const PASSIVE_TASK_PATTERNS = [
  /^(read|study|watch|review|browse|research)\s+(the\s+)?([a-z0-9_-]+\s+)*(documentation|tutorial|videos?|articles?|docs|guide)/i,
  /^(learn|understand|explore)\s+([a-z0-9_-]+\s+)*(react|python|fastapi|docker|javascript|typescript|sql|html|css|basics|fundamentals)/i,
  /^complete\s+(a\s+)?(basic\s+)?(tutorial|course|video)/i,
];

const VAGUE_DELIVERABLES_PATTERNS = [
  /^(understanding|knowledge|notes|reading|tutorial completed|concept|nothing|thoughts|summary)$/i,
  /^understanding of/i,
];

const VAGUE_CRITERIA_PATTERNS = [
  /^(looks good|works fine|works properly|completed|read all|be fast|no bugs|nice code|done)$/i,
  /^should work well$/i,
  /^student understands/i,
];

export function validateTask(options: ValidateTaskOptions): TaskValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Zod schema validation
  const parsed = internshipTaskSchema.safeParse(options.task);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((iss) => `${iss.path.join(".")}: ${iss.message}`);
    return {
      valid: false,
      errors: [`Schema validation failed: ${errorDetails.join("; ")}`],
      warnings: [],
      score: 0,
    };
  }

  const task: InternshipTask = parsed.data;

  // 2. Passive / non-practical task prohibition
  for (const pattern of PASSIVE_TASK_PATTERNS) {
    if (pattern.test(task.title.trim()) || pattern.test(task.objective.trim())) {
      errors.push(
        `Task is a passive learning prompt ('${task.title}'). Tasks must be practical, measurable engineering work with deliverables.`
      );
    }
  }

  // 3. Internship alignment
  const internshipSkillsLower = new Set(
    [...options.internship.required_skills, ...options.internship.tools].map((s) => s.toLowerCase())
  );
  const taskSkills = task.skills_practiced.map((s) => s.toLowerCase());
  const hasSkillOverlap = taskSkills.some((s) =>
    internshipSkillsLower.has(s) ||
    Array.from(internshipSkillsLower).some((is) => is.includes(s) || s.includes(is))
  );

  if (!hasSkillOverlap && taskSkills.length > 0) {
    errors.push(
      `Practiced skills [${task.skills_practiced.join(", ")}] do not align with internship requirements [${options.internship.required_skills.slice(0, 5).join(", ")}...].`
    );
  }

  // 4. Milestone alignment
  if (task.milestone_index !== undefined && task.milestone_index !== options.currentMilestone.milestone_index) {
    errors.push(
      `Task milestone index (${task.milestone_index}) does not match current milestone (${options.currentMilestone.milestone_index}: ${options.currentMilestone.title}).`
    );
  }

  const milestoneSkillsLower = new Set(options.currentMilestone.skills_focused.map((s) => s.toLowerCase()));
  const matchesMilestoneSkills = taskSkills.some((s) =>
    milestoneSkillsLower.has(s) ||
    Array.from(milestoneSkillsLower).some((ms) => ms.includes(s) || s.includes(ms))
  );

  if (!matchesMilestoneSkills) {
    warnings.push(
      `Task skills [${task.skills_practiced.join(", ")}] have low direct overlap with current milestone skills [${options.currentMilestone.skills_focused.join(", ")}].`
    );
  }

  // 5. Time bounds
  if (task.estimated_hours < 2) {
    errors.push(`Estimated hours (${task.estimated_hours}h) is too short. Internship tasks must be between 2 and 20 hours.`);
  } else if (task.estimated_hours > 20) {
    errors.push(`Estimated hours (${task.estimated_hours}h) is too large for a single task. Decompose tasks to 20 hours or fewer.`);
  }

  // 6. Deliverables quality check
  if (!task.deliverables || task.deliverables.length === 0) {
    errors.push("Task must contain at least one tangible deliverable.");
  } else {
    for (const del of task.deliverables) {
      const trimmed = del.trim();
      if (trimmed.length < 4) {
        errors.push(`Deliverable '${del}' is too short/vague.`);
      }
      for (const pattern of VAGUE_DELIVERABLES_PATTERNS) {
        if (pattern.test(trimmed)) {
          errors.push(`Deliverable '${del}' is an abstract learning outcome, not a tangible project asset.`);
        }
      }
    }
  }

  // 7. Acceptance criteria quality check
  if (!task.acceptance_criteria || task.acceptance_criteria.length === 0) {
    errors.push("Task must contain at least one testable acceptance criterion.");
  } else {
    for (const crit of task.acceptance_criteria) {
      const trimmed = crit.trim();
      if (trimmed.length < 6) {
        errors.push(`Acceptance criterion '${crit}' is too brief.`);
      }
      for (const pattern of VAGUE_CRITERIA_PATTERNS) {
        if (pattern.test(trimmed)) {
          errors.push(`Acceptance criterion '${crit}' is vague and not measurably testable.`);
        }
      }
    }
  }

  // 8. Reason for assignment
  if (!task.reason_for_assignment || task.reason_for_assignment.trim().length < 15) {
    errors.push("Task must provide a meaningful reason_for_assignment (at least 15 characters) explaining pedagogical context.");
  }

  // 9. Difficulty check
  if (options.expectedDifficulty && task.difficulty !== options.expectedDifficulty) {
    // Check if within 1 level step
    const levels = ["beginner", "intermediate", "advanced"];
    const expIdx = levels.indexOf(options.expectedDifficulty);
    const actIdx = levels.indexOf(task.difficulty);
    if (Math.abs(expIdx - actIdx) > 1) {
      errors.push(`Task difficulty '${task.difficulty}' differs significantly from target difficulty '${options.expectedDifficulty}'.`);
    } else {
      warnings.push(`Task difficulty '${task.difficulty}' deviates slightly from target '${options.expectedDifficulty}'.`);
    }
  }

  // 10. Duplicate / Redundancy Prevention
  if (options.previousTasks && options.previousTasks.length > 0) {
    const normalize = (text: string) =>
      text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

    const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "");
    const extractTokens = (text: string) =>
      new Set(normalize(text).split(" ").filter((w) => w.length > 2).map(stem));

    const currentTitleNorm = normalize(task.title);
    const currentTokens = extractTokens(task.title);

    for (const prev of options.previousTasks) {
      const prevTitleNorm = normalize(prev.title);
      if (currentTitleNorm === prevTitleNorm) {
        errors.push(`Duplicate task: title matches previous task '${prev.title}' exactly.`);
        break;
      }

      const prevTokens = extractTokens(prev.title);
      const intersection = Array.from(currentTokens).filter((t) => prevTokens.has(t));
      const union = new Set([...Array.from(currentTokens), ...Array.from(prevTokens)]);
      const jaccard = union.size > 0 ? intersection.length / union.size : 0;

      if (jaccard >= 0.70) {
        errors.push(`Duplicate task: high similarity (${Math.round(jaccard * 100)}% token overlap) with previous task '${prev.title}'.`);
        break;
      }
    }
  }

  const valid = errors.length === 0;
  const score = valid ? Math.max(70, 100 - warnings.length * 10) : 0;

  return {
    valid,
    errors,
    warnings,
    score,
  };
}

export function checkDuplicateTask(
  title: string,
  previousTasks: Array<{ title: string; objective?: string }>
): { isDuplicate: boolean; reason?: string } {
  const normalize = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "");
  const extractTokens = (text: string) =>
    new Set(normalize(text).split(" ").filter((w) => w.length > 2).map(stem));

  const currentTitleNorm = normalize(title);
  const currentTokens = extractTokens(title);

  for (const prev of previousTasks) {
    const prevTitleNorm = normalize(prev.title);
    if (currentTitleNorm === prevTitleNorm) {
      return { isDuplicate: true, reason: `Exact title match with '${prev.title}'.` };
    }

    const prevTokens = extractTokens(prev.title);
    const intersection = Array.from(currentTokens).filter((t) => prevTokens.has(t));
    const union = new Set([...Array.from(currentTokens), ...Array.from(prevTokens)]);
    const jaccard = union.size > 0 ? intersection.length / union.size : 0;

    if (jaccard >= 0.70) {
      return {
        isDuplicate: true,
        reason: `High similarity (${Math.round(jaccard * 100)}% token overlap) with '${prev.title}'.`,
      };
    }
  }

  return { isDuplicate: false };
}

