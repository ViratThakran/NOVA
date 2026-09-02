import {
  studentContextSchema,
  type StudentContext,
  type StudentSkillAssessment,
  type StudentPerformanceRecord,
  type DifficultyLevel,
  type DifficultyRecommendation,
} from "../schemas";

export interface BuildStudentContextParams {
  student: {
    id: string;
    name?: string;
    full_name?: string;
    education?: string;
    declared_skills?: string[];
    skills?: string[];
    experience_level?: string;
    github_handle?: string;
  };
  internship: {
    id?: string;
    title: string;
    domain: string;
    duration_weeks: number;
    level?: string;
    difficulty?: string;
  };
  progress?: {
    current_milestone_index?: number;
    completed_task_count?: number;
    completion_percentage?: number;
    active_task_id?: string | null;
  };
  performanceRecords?: StudentPerformanceRecord[];
  initialSkillRatings?: StudentSkillAssessment[];
  baselineDifficulty?: DifficultyLevel;
}

export function estimateStudentSkillLevels(
  declaredSkills: string[],
  performanceRecords: StudentPerformanceRecord[],
  initialRatings: StudentSkillAssessment[] = []
): StudentSkillAssessment[] {
  const skillMap = new Map<string, {
    declared_score?: number | null;
    scores: number[];
    lastEvaluated?: string;
  }>();

  // Seed with initial ratings
  for (const rating of initialRatings) {
    skillMap.set(rating.skill.toLowerCase(), {
      declared_score: rating.declared_score,
      scores: rating.observed_score !== null && rating.observed_score !== undefined ? [rating.observed_score] : [],
      lastEvaluated: rating.last_evaluated_at ?? undefined,
    });
  }

  // Seed with declared skills
  for (const skill of declaredSkills) {
    const key = skill.toLowerCase();
    if (!skillMap.has(key)) {
      skillMap.set(key, { declared_score: 7.0, scores: [] });
    }
  }

  // Fold in performance records
  for (const record of performanceRecords) {
    for (const skill of record.skills_tested) {
      const key = skill.toLowerCase();
      const existing = skillMap.get(key) ?? { declared_score: undefined, scores: [] };
      existing.scores.push(record.score / 10.0);
      existing.lastEvaluated = record.completed_at;
      skillMap.set(key, existing);
    }
  }

  const result: StudentSkillAssessment[] = [];

  for (const [skillKey, data] of skillMap.entries()) {
    let observedScore: number | null = null;
    let confidence: "low" | "medium" | "high" = "low";

    if (data.scores.length > 0) {
      observedScore = computeExponentialRecencyScore(data.scores);
      if (data.scores.length >= 3) {
        confidence = "high";
      } else {
        confidence = "medium";
      }
    }

    const originalSkillName =
      initialRatings.find((r) => r.skill.toLowerCase() === skillKey)?.skill ??
      declaredSkills.find((s) => s.toLowerCase() === skillKey) ??
      skillKey.charAt(0).toUpperCase() + skillKey.slice(1);

    result.push({
      skill: originalSkillName,
      declared_score: data.declared_score ?? null,
      observed_score: observedScore,
      confidence,
      attempts_count: data.scores.length,
      last_evaluated_at: data.lastEvaluated ?? null,
    });
  }

  return result;
}

export function computeExponentialRecencyScore(scores: number[], decayFactor = 0.5): number {
  if (scores.length === 0) return 0;
  if (scores.length === 1) return Math.round(scores[0] * 10) / 10;

  let totalWeight = 0;
  let weightedSum = 0;

  for (let i = 0; i < scores.length; i++) {
    const age = scores.length - 1 - i;
    const weight = Math.pow(1 - decayFactor, age);
    weightedSum += scores[i] * weight;
    totalWeight += weight;
  }

  const result = weightedSum / totalWeight;
  return Math.round(result * 10) / 10;
}

export function deriveDifficultyRecommendation(
  records: StudentPerformanceRecord[]
): { recommendation: DifficultyRecommendation; reasons: string[] } {
  const reasons: string[] = [];

  if (records.length === 0) {
    reasons.push("No previous performance records; starting at baseline difficulty.");
    return { recommendation: "MAINTAIN", reasons };
  }

  const recent = records.slice(-3);
  const avgScore = recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
  const recentRevisions = recent.filter((r) => r.verdict === "needs_revision").length;

  if (recent.length >= 2 && avgScore >= 85 && recentRevisions === 0) {
    reasons.push(`Student demonstrated strong performance (avg score: ${Math.round(avgScore)}%) across recent tasks.`);
    return { recommendation: "SCALE_UP", reasons };
  }

  if (avgScore < 65 || recentRevisions >= 2) {
    reasons.push(`Student struggled in recent tasks (avg score: ${Math.round(avgScore)}%, ${recentRevisions} revisions needed).`);
    return { recommendation: "SCAFFOLD", reasons };
  }

  reasons.push(`Student is progressing steadily (avg score: ${Math.round(avgScore)}%).`);
  return { recommendation: "MAINTAIN", reasons };
}

export function computeTargetDifficulty(
  baseline: DifficultyLevel,
  recommendation: DifficultyRecommendation
): DifficultyLevel {
  const levels: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];
  const currentIndex = levels.indexOf(baseline);

  if (recommendation === "SCALE_UP") {
    return levels[Math.min(levels.length - 1, currentIndex + 1)];
  }
  if (recommendation === "SCAFFOLD") {
    return levels[Math.max(0, currentIndex - 1)];
  }
  return baseline;
}

export function buildStudentContext(params: BuildStudentContextParams): StudentContext {
  const declaredSkills = params.student.declared_skills ?? params.student.skills ?? [];
  const studentName = params.student.name ?? params.student.full_name ?? "Student";
  const records = params.performanceRecords ?? [];
  const skillRatings = estimateStudentSkillLevels(
    declaredSkills,
    records,
    params.initialSkillRatings
  );

  const { recommendation } = deriveDifficultyRecommendation(records);
  const baselineDifficulty = params.baselineDifficulty ?? "intermediate";
  const targetDifficulty = computeTargetDifficulty(baselineDifficulty, recommendation);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const errorFrequency = new Map<string, number>();

  for (const rating of skillRatings) {
    if (rating.observed_score !== null && rating.observed_score !== undefined) {
      if (rating.observed_score >= 8.0) {
        strengths.push(rating.skill);
      } else if (rating.observed_score < 7.0) {
        weaknesses.push(rating.skill);
      }
    }
  }

  for (const r of records) {
    for (const s of r.strengths ?? []) {
      if (!strengths.includes(s)) strengths.push(s);
    }
    for (const w of r.weaknesses ?? []) {
      if (!weaknesses.includes(w)) weaknesses.push(w);
      errorFrequency.set(w, (errorFrequency.get(w) ?? 0) + 1);
    }
  }

  const repeatedErrors = Array.from(errorFrequency.entries())
    .filter(([_, count]) => count >= 2)
    .map(([err]) => err);

  const averageScore = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + r.score, 0) / records.length)
    : null;

  const totalTasksExpected = 8;
  const completedCount = params.progress?.completed_task_count ?? records.filter((r) => r.verdict === "passed").length;
  const completionPct = params.progress?.completion_percentage ??
    Math.min(100, Math.round((completedCount / totalTasksExpected) * 100));

  const recommendedFocus = weaknesses.length > 0 ? weaknesses.slice(0, 3) : ["Practical Application", "Testing"];

  // Structured Signals
  const demonstratedSkills = Array.from(new Set(
    records.filter((r) => r.verdict === "passed").flatMap((r) => r.skills_tested || [])
  ));
  const weakSkills = Array.from(new Set(weaknesses));
  
  const completedMilestones = Array.from(new Set(
    records.filter((r) => r.verdict === "passed").map((r) => r.milestone_index)
  )).sort((a, b) => a - b);

  const revisionCount = records.filter((r) => r.verdict === "needs_revision").length;

  const difficultyHistory = records.map((r) => ({
    milestone_index: r.milestone_index,
    difficulty: (r.score >= 85 ? "advanced" : r.score >= 65 ? "intermediate" : "beginner") as DifficultyLevel,
    score: r.score,
  }));

  // Infer failure categories from recurring weaknesses and error messages
  const failureCategories: string[] = [];
  for (const err of repeatedErrors) {
    const norm = err.toLowerCase();
    if (norm.includes("test") || norm.includes("assert") || norm.includes("coverage")) {
      if (!failureCategories.includes("testing_failure")) failureCategories.push("testing_failure");
    } else if (norm.includes("doc") || norm.includes("readme") || norm.includes("comment")) {
      if (!failureCategories.includes("documentation_failure")) failureCategories.push("documentation_failure");
    } else if (norm.includes("missing") || norm.includes("deliverable") || norm.includes("requirement")) {
      if (!failureCategories.includes("misunderstanding_requirements")) failureCategories.push("misunderstanding_requirements");
    } else if (norm.includes("concept") || norm.includes("architect") || norm.includes("pattern")) {
      if (!failureCategories.includes("knowledge_gap")) failureCategories.push("knowledge_gap");
    } else {
      if (!failureCategories.includes("implementation_error")) failureCategories.push("implementation_error");
    }
  }

  const feedbackThemes = Array.from(new Set([
    ...strengths.slice(0, 3).map((s) => `Demonstrated strength in ${s}`),
    ...weaknesses.slice(0, 3).map((w) => `Targeted practice needed in ${w}`),
  ]));

  return studentContextSchema.parse({
    student: {
      id: params.student.id,
      name: studentName,
      education: params.student.education,
      declared_skills: declaredSkills,
      experience_level: params.student.experience_level,
      github_handle: params.student.github_handle,
    },
    internship: {
      id: params.internship.id ?? params.internship.title.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      title: params.internship.title,
      domain: params.internship.domain,
      duration_weeks: params.internship.duration_weeks,
      level: params.internship.level ?? params.internship.difficulty ?? "beginner_to_intermediate",
    },
    progress: {
      current_milestone_index: params.progress?.current_milestone_index ?? 0,
      completed_task_count: completedCount,
      completion_percentage: completionPct,
      active_task_id: params.progress?.active_task_id ?? null,
    },
    performance: {
      average_score: averageScore,
      strengths,
      weaknesses,
      repeated_errors: repeatedErrors,
      recent_records: records.slice(-5),
    },
    learning_state: {
      skill_ratings: skillRatings,
      target_difficulty: targetDifficulty,
      difficulty_recommendation: recommendation,
      recommended_focus_areas: recommendedFocus,
      demonstrated_skills: demonstratedSkills,
      weak_skills: weakSkills,
      recurring_failure_categories: failureCategories,
      completed_milestones: completedMilestones,
      revision_count: revisionCount,
      difficulty_history: difficultyHistory,
      feedback_themes: feedbackThemes,
    },
  });
}
