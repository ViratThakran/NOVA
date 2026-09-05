import { describe, it, expect } from "vitest";
import {
  AI_ML_INTERNSHIP_DEFINITION,
  FULLSTACK_INTERNSHIP_DEFINITION,
  CLOUD_DEVOPS_INTERNSHIP_DEFINITION,
  createInternshipDefinition,
  getStandardInternshipDefinition,
  generateCurriculumPlan,
  getMilestoneByIndex,
  calculateCurriculumProgress,
  buildStudentContext,
  estimateStudentSkillLevels,
  deriveDifficultyRecommendation,
  computeTargetDifficulty,
  validateTask,
  generateTask,
  generateFallbackTask,
  generateNextInternshipTask,
} from "../../src/lib/ai-engine/internship-mentor";
import {
  internshipDefinitionSchema,
  internshipTaskSchema,
} from "../../src/lib/ai-engine/schemas";

describe("Internship Definition Engine", () => {
  it("validates standard AI/ML internship definition", () => {
    const parsed = internshipDefinitionSchema.safeParse(AI_ML_INTERNSHIP_DEFINITION);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe("AI/ML Engineering Intern");
      expect(parsed.data.duration_weeks).toBe(8);
      expect(parsed.data.required_skills).toContain("Python");
      expect(parsed.data.tools).toContain("FastAPI");
      expect(parsed.data.final_project.key_deliverables.length).toBeGreaterThan(0);
    }
  });

  it("validates standard Full-Stack and Cloud/DevOps definitions", () => {
    expect(internshipDefinitionSchema.safeParse(FULLSTACK_INTERNSHIP_DEFINITION).success).toBe(true);
    expect(internshipDefinitionSchema.safeParse(CLOUD_DEVOPS_INTERNSHIP_DEFINITION).success).toBe(true);
  });

  it("retrieves standard definition by slug or domain keyword", () => {
    const aiDef = getStandardInternshipDefinition("ai-ml");
    expect(aiDef.title).toBe("AI/ML Engineering Intern");

    const webDef = getStandardInternshipDefinition("web-development");
    expect(webDef.title).toBe("Full-Stack Web Development Intern");

    const cloudDef = getStandardInternshipDefinition("devops");
    expect(cloudDef.title).toBe("Cloud & DevOps Engineering Intern");
  });

  it("rejects invalid definition with missing title or duration", () => {
    const invalid = {
      ...AI_ML_INTERNSHIP_DEFINITION,
      title: "",
    };
    expect(internshipDefinitionSchema.safeParse(invalid).success).toBe(false);

    const invalidDuration = {
      ...AI_ML_INTERNSHIP_DEFINITION,
      duration_weeks: 0,
    };
    expect(internshipDefinitionSchema.safeParse(invalidDuration).success).toBe(false);
  });

  it("rejects definition with missing final project or empty skills", () => {
    const noSkills = {
      ...AI_ML_INTERNSHIP_DEFINITION,
      required_skills: [],
    };
    expect(internshipDefinitionSchema.safeParse(noSkills).success).toBe(false);
  });
});

describe("Curriculum Engine", () => {
  const curriculum = generateCurriculumPlan(AI_ML_INTERNSHIP_DEFINITION);

  it("creates ordered milestones with progressive difficulty", () => {
    expect(curriculum.milestones.length).toBe(4);
    expect(curriculum.milestones[0].milestone_index).toBe(0);
    expect(curriculum.milestones[1].milestone_index).toBe(1);
    expect(curriculum.milestones[2].milestone_index).toBe(2);
    expect(curriculum.milestones[3].milestone_index).toBe(3);

    expect(curriculum.milestones[0].target_difficulty).toBe("beginner");
    expect(curriculum.milestones[3].target_difficulty).toBe("advanced");
  });

  it("ensures milestones contain learning objectives and final project contributions", () => {
    for (const milestone of curriculum.milestones) {
      expect(milestone.learning_objectives.length).toBeGreaterThan(0);
      expect(milestone.skills_focused.length).toBeGreaterThan(0);
      expect(milestone.final_project_contribution.length).toBeGreaterThan(10);
    }
  });

  it("retrieves milestones by index correctly", () => {
    const m0 = getMilestoneByIndex(curriculum, 0);
    expect(m0?.title).toBe("Data Ingestion & Preprocessing Pipeline");

    const m2 = getMilestoneByIndex(curriculum, 2);
    expect(m2?.title).toBe("REST API Inference Service");

    const m99 = getMilestoneByIndex(curriculum, 99);
    expect(m99).toBeNull();
  });

  it("calculates curriculum progress percentage accurately", () => {
    expect(calculateCurriculumProgress(curriculum, 0, 0)).toBe(0);
    expect(calculateCurriculumProgress(curriculum, 1, 2)).toBe(25);
    expect(calculateCurriculumProgress(curriculum, 2, 4)).toBe(50);
    expect(calculateCurriculumProgress(curriculum, 3, 8)).toBe(100);
  });
});

describe("Student Context Engine", () => {
  it("distinguishes declared skills from observed skills with confidence ratings", () => {
    const declaredSkills = ["Python", "FastAPI", "Docker", "SQL"];
    const records = [
      {
        task_id: "t1",
        task_title: "Clean student dataset",
        milestone_index: 0,
        score: 90,
        verdict: "passed" as const,
        strengths: ["Pandas", "Python"],
        weaknesses: [],
        skills_tested: ["Python"],
        completed_at: "2026-08-01T10:00:00Z",
      },
      {
        task_id: "t2",
        task_title: "Feature engineering pipeline",
        milestone_index: 0,
        score: 95,
        verdict: "passed" as const,
        strengths: ["Data transformations"],
        weaknesses: [],
        skills_tested: ["Python"],
        completed_at: "2026-08-03T10:00:00Z",
      },
      {
        task_id: "t3",
        task_title: "Train regression baseline",
        milestone_index: 1,
        score: 88,
        verdict: "passed" as const,
        strengths: ["Scikit-learn"],
        weaknesses: [],
        skills_tested: ["Python"],
        completed_at: "2026-08-05T10:00:00Z",
      },
      {
        task_id: "t4",
        task_title: "Write unit tests for data pipeline",
        milestone_index: 0,
        score: 55,
        verdict: "needs_revision" as const,
        strengths: [],
        weaknesses: ["Missing edge cases", "Pytest assertions"],
        skills_tested: ["Pytest"],
        completed_at: "2026-08-06T10:00:00Z",
      },
    ];

    const ratings = estimateStudentSkillLevels(declaredSkills, records);
    const pythonRating = ratings.find((r) => r.skill.toLowerCase() === "python");
    const pytestRating = ratings.find((r) => r.skill.toLowerCase() === "pytest");
    const dockerRating = ratings.find((r) => r.skill.toLowerCase() === "docker");

    // Python has 3 observed attempts -> high confidence, score calculated
    expect(pythonRating).toBeDefined();
    expect(pythonRating?.confidence).toBe("high");
    expect(pythonRating?.observed_score).toBeGreaterThanOrEqual(8.5);
    expect(pythonRating?.declared_score).toBe(7);

    // Pytest has 1 observed attempt -> medium confidence, lower score
    expect(pytestRating).toBeDefined();
    expect(pytestRating?.confidence).toBe("medium");
    expect(pytestRating?.observed_score).toBeLessThan(6.0);

    // Docker has 0 observed attempts -> low confidence, declared only
    expect(dockerRating).toBeDefined();
    expect(dockerRating?.confidence).toBe("low");
    expect(dockerRating?.observed_score).toBeNull();
  });

  it("recommends SCALE_UP for consistent high performers", () => {
    const highPerfRecords = [
      {
        task_id: "t1",
        task_title: "Task 1",
        milestone_index: 0,
        score: 92,
        verdict: "passed" as const,
        strengths: ["Fast execution"],
        weaknesses: [],
        skills_tested: ["Python"],
      },
      {
        task_id: "t2",
        task_title: "Task 2",
        milestone_index: 0,
        score: 95,
        verdict: "passed" as const,
        strengths: ["Code clean"],
        weaknesses: [],
        skills_tested: ["Python", "Pandas"],
      },
    ];

    const { recommendation } = deriveDifficultyRecommendation(highPerfRecords);
    expect(recommendation).toBe("SCALE_UP");
    expect(computeTargetDifficulty("beginner", recommendation)).toBe("intermediate");
    expect(computeTargetDifficulty("intermediate", recommendation)).toBe("advanced");
  });

  it("recommends SCAFFOLD for struggling students with low scores or revisions", () => {
    const strugglingRecords = [
      {
        task_id: "t1",
        task_title: "Task 1",
        milestone_index: 0,
        score: 52,
        verdict: "needs_revision" as const,
        strengths: [],
        weaknesses: ["Syntax errors", "Test failures"],
        skills_tested: ["Python"],
      },
      {
        task_id: "t2",
        task_title: "Task 2",
        milestone_index: 0,
        score: 48,
        verdict: "needs_revision" as const,
        strengths: [],
        weaknesses: ["Missing tests", "Data leakage"],
        skills_tested: ["Scikit-learn"],
      },
    ];

    const { recommendation } = deriveDifficultyRecommendation(strugglingRecords);
    expect(recommendation).toBe("SCAFFOLD");
    expect(computeTargetDifficulty("intermediate", recommendation)).toBe("beginner");
  });

  it("builds comprehensive StudentContext with strengths, weaknesses, and repeated errors", () => {
    const context = buildStudentContext({
      student: {
        id: "student-123",
        name: "Alex Rivera",
        education: "BS Computer Science",
        declared_skills: ["Python", "Git", "FastAPI"],
      },
      internship: {
        id: "intern-456",
        title: "AI/ML Engineering Intern",
        domain: "EdTech",
        duration_weeks: 8,
      },
      progress: {
        current_milestone_index: 1,
        completed_task_count: 2,
      },
      performanceRecords: [
        {
          task_id: "t1",
          task_title: "Data pipeline",
          milestone_index: 0,
          score: 85,
          verdict: "passed",
          strengths: ["Python"],
          weaknesses: ["Edge cases"],
          skills_tested: ["Python"],
        },
        {
          task_id: "t2",
          task_title: "Model baseline",
          milestone_index: 1,
          score: 75,
          verdict: "passed",
          strengths: ["Scikit-learn"],
          weaknesses: ["Edge cases", "Pytest assertions"],
          skills_tested: ["Scikit-learn", "Pytest"],
        },
      ],
    });

    expect(context.student.name).toBe("Alex Rivera");
    expect(context.progress.current_milestone_index).toBe(1);
    expect(context.performance.weaknesses).toContain("Edge cases");
    // "Edge cases" appeared in both t1 and t2 -> repeated error
    expect(context.performance.repeated_errors).toContain("Edge cases");
    expect(context.learning_state.difficulty_recommendation).toBe("MAINTAIN");
  });
});

describe("Task Validator Engine", () => {
  const internship = AI_ML_INTERNSHIP_DEFINITION;
  const curriculum = generateCurriculumPlan(internship);
  const milestone0 = curriculum.milestones[0];

  const validTask = {
    title: "Build Data Cleaning and Feature Pipeline for Student Analytics",
    business_context: "NOVA requires a reproducible preprocessing pipeline for student assessment telemetry.",
    objective: "Implement a modular Pandas pipeline handling missing values, encoding features, and running unit tests.",
    instructions: [
      "Load the raw CSV data into a Pandas DataFrame.",
      "Impute missing numeric values using median strategies.",
      "Encode categorical features with One-Hot encoding.",
      "Write Pytest unit tests verifying clean DataFrame output.",
    ],
    deliverables: [
      "pipeline.py module containing clean_data and transform_features functions",
      "test_pipeline.py containing Pytest test suite",
      "data_dictionary.md documenting columns and data types",
    ],
    acceptance_criteria: [
      "clean_data function returns a DataFrame with zero null values",
      "Pytest test suite passes with >= 4 test cases",
      "Script executes without unhandled exceptions on sample CSV",
    ],
    skills_practiced: ["Python", "Pandas", "Data Cleaning"],
    estimated_hours: 5,
    difficulty: "beginner" as const,
    reason_for_assignment: "Starting Milestone 0 to establish clean data preparation skills required for ML training.",
    milestone_index: 0,
  };

  it("passes a high-quality, practical, well-formed task", () => {
    const result = validateTask({
      task: validTask,
      internship,
      currentMilestone: milestone0,
      expectedDifficulty: "beginner",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("rejects passive learning tasks like 'Read documentation' or 'Learn React'", () => {
    const passiveTask = {
      ...validTask,
      title: "Read Pandas documentation online",
      objective: "Read documentation on Pandas DataFrame indexing.",
    };

    const result = validateTask({
      task: passiveTask,
      internship,
      currentMilestone: milestone0,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("passive learning prompt"))).toBe(true);
  });

  it("rejects tasks with no deliverables or vague abstract deliverables", () => {
    const noDeliverables = {
      ...validTask,
      deliverables: [],
    };
    expect(validateTask({ task: noDeliverables, internship, currentMilestone: milestone0 }).valid).toBe(false);

    const vagueDeliverables = {
      ...validTask,
      deliverables: ["Understanding", "Notes"],
    };
    const result = validateTask({ task: vagueDeliverables, internship, currentMilestone: milestone0 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("abstract learning outcome"))).toBe(true);
  });

  it("rejects tasks with vague or non-testable acceptance criteria", () => {
    const vagueCriteria = {
      ...validTask,
      acceptance_criteria: ["looks good", "works fine"],
    };
    const result = validateTask({ task: vagueCriteria, internship, currentMilestone: milestone0 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("vague and not measurably testable"))).toBe(true);
  });

  it("rejects tasks with out-of-bounds time estimates (< 2h or > 20h)", () => {
    const tooShort = { ...validTask, estimated_hours: 1 };
    expect(validateTask({ task: tooShort, internship, currentMilestone: milestone0 }).valid).toBe(false);

    const tooLong = { ...validTask, estimated_hours: 35 };
    expect(validateTask({ task: tooLong, internship, currentMilestone: milestone0 }).valid).toBe(false);
  });

  it("rejects tasks with completely unrelated skills", () => {
    const unrelatedSkills = {
      ...validTask,
      skills_practiced: ["Solidity", "Smart Contracts", "Web3"],
    };
    const result = validateTask({ task: unrelatedSkills, internship, currentMilestone: milestone0 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("do not align with internship requirements"))).toBe(true);
  });

  it("rejects duplicate or near-duplicate tasks", () => {
    const previousTasks = [
      {
        title: "Build Data Cleaning and Feature Pipeline for Student Analytics",
        objective: "Implement a modular Pandas pipeline",
        milestone_index: 0,
      },
    ];

    const result = validateTask({
      task: validTask,
      internship,
      currentMilestone: milestone0,
      previousTasks,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate task"))).toBe(true);
  });

  it("rejects tasks missing meaningful reason_for_assignment", () => {
    const noReason = {
      ...validTask,
      reason_for_assignment: "Short",
    };
    const result = validateTask({ task: noReason, internship, currentMilestone: milestone0 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("reason_for_assignment"))).toBe(true);
  });
});

describe("Task Generation Engine & Mock Provider", () => {
  const aiInternship = AI_ML_INTERNSHIP_DEFINITION;
  const aiCurriculum = generateCurriculumPlan(aiInternship);
  const context = buildStudentContext({
    student: {
      id: "student-1",
      name: "Jordan Lee",
      declared_skills: ["Python", "Pandas", "Scikit-learn"],
    },
    internship: {
      id: "intern-1",
      title: aiInternship.title,
      domain: aiInternship.domain,
      duration_weeks: 8,
    },
    progress: {
      current_milestone_index: 0,
      completed_task_count: 0,
    },
  });

  it("generates structured, internship-aligned task for AI/ML Milestone 0", async () => {
    const task = await generateTask({
      internship: aiInternship,
      curriculum: aiCurriculum,
      currentMilestone: aiCurriculum.milestones[0],
      studentContext: context,
    });

    expect(task.title).toBeDefined();
    expect(task.deliverables.length).toBeGreaterThan(0);
    expect(task.acceptance_criteria.length).toBeGreaterThan(0);
    expect(task.skills_practiced).toContain("Python");
    expect(task.estimated_hours).toBeGreaterThanOrEqual(2);
    expect(task.estimated_hours).toBeLessThanOrEqual(20);
  });

  it("generates progressive task for Milestone 1 (Model Training)", async () => {
    const task = await generateTask({
      internship: aiInternship,
      curriculum: aiCurriculum,
      currentMilestone: aiCurriculum.milestones[1],
      studentContext: {
        ...context,
        progress: { current_milestone_index: 1, completed_task_count: 2, completion_percentage: 25 },
      },
    });

    expect(task.skills_practiced).toContain("Scikit-learn");
    expect(task.milestone_index).toBe(1);
    expect(task.acceptance_criteria.some((c) => c.toLowerCase().includes("roc-auc") || c.toLowerCase().includes("model"))).toBe(true);
  });

  it("generates domain-specific tasks for Full-Stack and Cloud/DevOps", async () => {
    const fullstackDef = FULLSTACK_INTERNSHIP_DEFINITION;
    const fullstackCurriculum = generateCurriculumPlan(fullstackDef);
    const fsTask = await generateTask({
      internship: fullstackDef,
      curriculum: fullstackCurriculum,
      currentMilestone: fullstackCurriculum.milestones[0],
      studentContext: {
        ...context,
        internship: { id: "fs-1", title: fullstackDef.title, domain: fullstackDef.domain, duration_weeks: 8, level: "beginner" },
      },
    });

    expect(fsTask.skills_practiced).toContain("React");

    const cloudDef = CLOUD_DEVOPS_INTERNSHIP_DEFINITION;
    const cloudCurriculum = generateCurriculumPlan(cloudDef);
    const cloudTask = await generateTask({
      internship: cloudDef,
      curriculum: cloudCurriculum,
      currentMilestone: cloudCurriculum.milestones[0],
      studentContext: {
        ...context,
        internship: { id: "cloud-1", title: cloudDef.title, domain: cloudDef.domain, duration_weeks: 8, level: "intermediate" },
      },
    });

    expect(cloudTask.skills_practiced).toContain("Docker");
  });

  it("deterministic fallback task generator produces valid, schema-compliant task", () => {
    const fallback = generateFallbackTask({
      internship: aiInternship,
      curriculum: aiCurriculum,
      currentMilestone: aiCurriculum.milestones[0],
      studentContext: context,
    });

    expect(internshipTaskSchema.safeParse(fallback).success).toBe(true);
    const validation = validateTask({
      task: fallback,
      internship: aiInternship,
      currentMilestone: aiCurriculum.milestones[0],
      studentContext: context,
    });
    expect(validation.valid).toBe(true);
  });
});

describe("Internship Mentor Orchestrator Service", () => {
  const internship = AI_ML_INTERNSHIP_DEFINITION;
  const curriculum = generateCurriculumPlan(internship);

  it("successfully generates next validated task in end-to-end workflow", async () => {
    const studentContext = buildStudentContext({
      student: {
        id: "student-xyz",
        name: "Maya Patel",
        declared_skills: ["Python", "Git"],
      },
      internship: {
        id: "intern-xyz",
        title: internship.title,
        domain: internship.domain,
        duration_weeks: 8,
      },
      progress: {
        current_milestone_index: 0,
        completed_task_count: 0,
      },
    });

    const result = await generateNextInternshipTask({
      internship,
      curriculum,
      studentContext,
    });

    expect(result.validation.valid).toBe(true);
    expect(result.task.title).toBeDefined();
    expect(result.task.deliverables.length).toBeGreaterThan(0);
    expect(result.task.acceptance_criteria.length).toBeGreaterThan(0);
    expect(result.attempts).toBeGreaterThanOrEqual(1);
    expect(result.logs.length).toBeGreaterThan(0);
  });

  it("handles retry and fallback when initial generation produces issues", async () => {
    const studentContext = buildStudentContext({
      student: {
        id: "student-fallback",
        name: "Test Student",
        declared_skills: ["Python"],
      },
      internship: {
        id: "intern-1",
        title: internship.title,
        domain: internship.domain,
        duration_weeks: 8,
      },
      progress: {
        current_milestone_index: 0,
        completed_task_count: 0,
      },
    });

    // Custom instruction simulating invalid output to test recovery
    const result = await generateNextInternshipTask({
      internship,
      curriculum,
      studentContext,
      customInstructions: "SIMULATE_INVALID_JSON",
    });

    expect(result.task).toBeDefined();
    expect(result.validation.valid).toBe(true);
    expect(result.generatedBy).toBe("deterministic_fallback");
  });
});

describe("8-Week AI/ML Internship Simulation Across 3 Student Archetypes", () => {
  const internship = AI_ML_INTERNSHIP_DEFINITION;
  const curriculum = generateCurriculumPlan(internship);

  it("Simulates Student A (Fast Learner): High scores trigger SCALE_UP and advanced task difficulty", async () => {
    // Week 1-2: Completes Milestone 0 with distinction (95%, 98%)
    const studentAContext = buildStudentContext({
      student: { id: "student-a", name: "Elena Rostova", declared_skills: ["Python", "Pandas", "Math"] },
      internship: { id: "intern-1", title: internship.title, domain: internship.domain, duration_weeks: 8 },
      progress: { current_milestone_index: 1, completed_task_count: 2, completion_percentage: 25 },
      baselineDifficulty: "intermediate",
      performanceRecords: [
        {
          task_id: "t1",
          task_title: "Data preprocessing pipeline",
          milestone_index: 0,
          score: 95,
          verdict: "passed",
          strengths: ["Fast execution", "Pandas mastery"],
          weaknesses: [],
          skills_tested: ["Python", "Pandas"],
        },
        {
          task_id: "t2",
          task_title: "Automated data validation",
          milestone_index: 0,
          score: 98,
          verdict: "passed",
          strengths: ["Pytest fixtures", "Clean code"],
          weaknesses: [],
          skills_tested: ["Pytest", "Python"],
        },
      ],
    });

    expect(studentAContext.learning_state.difficulty_recommendation).toBe("SCALE_UP");
    expect(studentAContext.learning_state.target_difficulty).toBe("advanced");

    // Next Task for Milestone 1 (Model Training)
    const resultA = await generateNextInternshipTask({
      internship,
      curriculum,
      studentContext: studentAContext,
      milestoneIndex: 1,
    });

    expect(resultA.validation.valid).toBe(true);
    expect(resultA.task.difficulty).toBe("advanced");
    expect(resultA.task.skills_practiced).toContain("Scikit-learn");
    expect(resultA.task.reason_for_assignment.toLowerCase()).toContain("mastered");
  });

  it("Simulates Student B (Average Learner): Steady performance maintains intermediate difficulty", async () => {
    // Week 1-2: Completes Milestone 0 with solid scores (78%, 80%)
    const studentBContext = buildStudentContext({
      student: { id: "student-b", name: "Marcus Chen", declared_skills: ["Python", "Git"] },
      internship: { id: "intern-1", title: internship.title, domain: internship.domain, duration_weeks: 8 },
      progress: { current_milestone_index: 1, completed_task_count: 2, completion_percentage: 25 },
      baselineDifficulty: "intermediate",
      performanceRecords: [
        {
          task_id: "t1",
          task_title: "Data preprocessing pipeline",
          milestone_index: 0,
          score: 78,
          verdict: "passed",
          strengths: ["Python logic"],
          weaknesses: ["Missing null handling"],
          skills_tested: ["Python", "Pandas"],
        },
        {
          task_id: "t2",
          task_title: "Automated data validation",
          milestone_index: 0,
          score: 80,
          verdict: "passed",
          strengths: ["Pytest assertions"],
          weaknesses: [],
          skills_tested: ["Pytest"],
        },
      ],
    });

    expect(studentBContext.learning_state.difficulty_recommendation).toBe("MAINTAIN");
    expect(studentBContext.learning_state.target_difficulty).toBe("intermediate");

    // Next Task for Milestone 1
    const resultB = await generateNextInternshipTask({
      internship,
      curriculum,
      studentContext: studentBContext,
      milestoneIndex: 1,
    });

    expect(resultB.validation.valid).toBe(true);
    expect(resultB.task.difficulty).toBe("intermediate");
    expect(resultB.task.skills_practiced).toContain("Scikit-learn");
  });

  it("Simulates Student C (Struggling Learner): Low scores and revisions trigger SCAFFOLDING", async () => {
    // Week 1-2: Struggled in Milestone 0 (55% needs revision, 60% needs revision)
    const studentCContext = buildStudentContext({
      student: { id: "student-c", name: "Devon Taylor", declared_skills: ["Python"] },
      internship: { id: "intern-1", title: internship.title, domain: internship.domain, duration_weeks: 8 },
      progress: { current_milestone_index: 0, completed_task_count: 1, completion_percentage: 12 },
      baselineDifficulty: "intermediate",
      performanceRecords: [
        {
          task_id: "t1",
          task_title: "Data preprocessing pipeline",
          milestone_index: 0,
          score: 55,
          verdict: "needs_revision",
          strengths: [],
          weaknesses: ["Pandas index errors", "Unhandled NaNs"],
          skills_tested: ["Pandas"],
        },
        {
          task_id: "t2",
          task_title: "Data cleaning retry",
          milestone_index: 0,
          score: 62,
          verdict: "needs_revision",
          strengths: ["Basic loop logic"],
          weaknesses: ["Unhandled NaNs", "Type errors"],
          skills_tested: ["Pandas"],
        },
      ],
    });

    expect(studentCContext.learning_state.difficulty_recommendation).toBe("SCAFFOLD");
    expect(studentCContext.learning_state.target_difficulty).toBe("beginner");
    expect(studentCContext.performance.repeated_errors).toContain("Unhandled NaNs");

    // Next scaffolded task
    const resultC = await generateNextInternshipTask({
      internship,
      curriculum,
      studentContext: studentCContext,
      milestoneIndex: 0,
    });

    expect(resultC.validation.valid).toBe(true);
    expect(resultC.task.difficulty).toBe("beginner");
    expect(resultC.task.estimated_hours).toBeLessThanOrEqual(5);
    expect(resultC.task.reason_for_assignment.toLowerCase()).toContain("scaffolding");
  });
});

