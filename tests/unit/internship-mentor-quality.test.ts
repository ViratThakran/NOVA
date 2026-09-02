import { describe, it, expect } from "vitest";
import {
  AI_ML_INTERNSHIP_DEFINITION,
  FULLSTACK_INTERNSHIP_DEFINITION,
  CLOUD_DEVOPS_INTERNSHIP_DEFINITION,
  DATA_ENGINEERING_INTERNSHIP_DEFINITION,
  CYBERSECURITY_INTERNSHIP_DEFINITION,
  UIUX_DESIGN_INTERNSHIP_DEFINITION,
  getStandardInternshipDefinition,
} from "../../src/lib/ai-engine/internship-mentor/definitions";
import {
  generateCurriculumPlan,
  getMilestoneByIndex,
} from "../../src/lib/ai-engine/internship-mentor/curriculum";
import {
  buildStudentContext,
  estimateStudentSkillLevels,
  deriveDifficultyRecommendation,
} from "../../src/lib/ai-engine/internship-mentor/context";
import {
  validateTask,
  checkDuplicateTask,
} from "../../src/lib/ai-engine/internship-mentor/validator";
import {
  generateNextInternshipTask,
  generateCurriculumForInternship,
} from "../../src/lib/ai-engine/internship-mentor/service";
import { generateFallbackTask } from "../../src/lib/ai-engine/internship-mentor/generator";
import type {
  InternshipDefinition,
  StudentPerformanceRecord,
  InternshipTask,
} from "../../src/lib/ai-engine/internship-mentor/types";

describe("PHASE 1 QUALITY VALIDATION: Multi-Domain & Multi-Student Evaluation Suite", () => {
  const ALL_TRACKS: { name: string; definition: InternshipDefinition }[] = [
    { name: "AI/ML Engineering", definition: AI_ML_INTERNSHIP_DEFINITION },
    { name: "Full-Stack Web Development", definition: FULLSTACK_INTERNSHIP_DEFINITION },
    { name: "Cloud & DevOps Engineering", definition: CLOUD_DEVOPS_INTERNSHIP_DEFINITION },
    { name: "Data Engineering", definition: DATA_ENGINEERING_INTERNSHIP_DEFINITION },
    { name: "Cybersecurity", definition: CYBERSECURITY_INTERNSHIP_DEFINITION },
    { name: "UI/UX Design", definition: UIUX_DESIGN_INTERNSHIP_DEFINITION },
  ];

  // Helper to generate a multi-task journey for a given student archetype
  async function generateJourney(
    definition: InternshipDefinition,
    studentType: "strong" | "average" | "struggling",
    extraWeakness?: string
  ): Promise<{ tasks: InternshipTask[]; validationResults: any[] }> {
    const curriculum = generateCurriculumPlan(definition);
    const tasks: InternshipTask[] = [];
    const validationResults: any[] = [];
    const history: StudentPerformanceRecord[] = [];

    // Simulate 5 progressive task generations
    for (let step = 0; step < 5; step++) {
      // Determine milestone for this step (milestone 0 for steps 0 & 1, milestone 1 for step 2, milestone 2 for step 3, milestone 3 for step 4)
      const milestoneIdx = step === 0 || step === 1 ? 0 : step === 2 ? 1 : step === 3 ? 2 : 3;
      const currentMilestone = getMilestoneByIndex(curriculum, milestoneIdx)!;

      const studentContext = buildStudentContext({
        student: {
          id: `student_${studentType}_${definition.title.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
          full_name: `${studentType.toUpperCase()} Candidate`,
          declared_skills: definition.required_skills.slice(0, 4),
        },
        internship: definition,
        performanceRecords: history,
        progress: {
          current_milestone_index: milestoneIdx,
          completed_task_count: step,
        },
      });

      if (extraWeakness && studentType === "struggling") {
        studentContext.performance.weaknesses.push(extraWeakness);
        studentContext.performance.repeated_errors.push(extraWeakness);
      }

      const generationResult = await generateNextInternshipTask({
        internship: definition,
        curriculum,
        currentMilestone,
        studentContext,
        previousTasks: tasks.map((t) => ({
          title: t.title,
          objective: t.objective,
          milestone_index: t.milestone_index,
        })),
      });

      tasks.push(generationResult.task);
      validationResults.push(generationResult.validation);

      // Simulate submission & review score based on archetype
      let score = 80;
      let verdict: "passed" | "needs_revision" = "passed";
      if (studentType === "strong") {
        score = 92 + Math.floor(Math.random() * 7); // 92 - 98
        verdict = "passed";
      } else if (studentType === "average") {
        score = 75 + Math.floor(Math.random() * 10); // 75 - 84
        verdict = "passed";
      } else {
        score = 52 + Math.floor(Math.random() * 12); // 52 - 63
        verdict = "needs_revision";
      }

      history.push({
        task_id: `task_${step}`,
        task_title: generationResult.task.title,
        milestone_index: milestoneIdx,
        score,
        verdict,
        strengths: studentType === "strong" ? ["Speed", "Quality"] : [],
        weaknesses: studentType === "struggling" && extraWeakness ? [extraWeakness] : [],
        skills_tested: generationResult.task.skills_practiced,
        completed_at: new Date(Date.now() - (5 - step) * 86400000).toISOString(),
      });
    }

    return { tasks, validationResults };
  }

  describe("1. Real Internship Relevance & Tech Stack Alignment Across All 6 Tracks", () => {
    for (const track of ALL_TRACKS) {
      it(`validates that all tasks generated for ${track.name} strictly match its domain and tools`, async () => {
        const { tasks, validationResults } = await generateJourney(track.definition, "average");

        expect(tasks.length).toBe(5);
        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          const val = validationResults[i];

          // Deterministic validator passed
          expect(val.valid).toBe(true);
          expect(val.errors).toHaveLength(0);

          // Task uses track tools or required skills
          const hasRelevantSkill = task.skills_practiced.some(
            (s) =>
              track.definition.required_skills.some((rs) => rs.toLowerCase().includes(s.toLowerCase())) ||
              track.definition.tools.some((t) => t.toLowerCase().includes(s.toLowerCase()))
          );
          expect(hasRelevantSkill).toBe(true);

          // Task has realistic time bound (2–20 hours)
          expect(task.estimated_hours).toBeGreaterThanOrEqual(2);
          expect(task.estimated_hours).toBeLessThanOrEqual(20);

          // Has concrete deliverables and testable acceptance criteria
          expect(task.deliverables.length).toBeGreaterThanOrEqual(2);
          expect(task.acceptance_criteria.length).toBeGreaterThanOrEqual(2);
        }
      });
    }
  });

  describe("2. Progressive Multi-Task Chains (Task N builds on Task N-1 toward Final Capstone)", () => {
    for (const track of ALL_TRACKS) {
      it(`verifies progressive task sequencing and capstone culmination for ${track.name}`, async () => {
        const { tasks } = await generateJourney(track.definition, "average");

        // Milestone progression: Task 0 & 1 -> Milestone 0, Task 2 -> Milestone 1, Task 3 -> Milestone 2, Task 4 -> Milestone 3
        expect(tasks[0].milestone_index).toBe(0);
        expect(tasks[1].milestone_index).toBe(0);
        expect(tasks[2].milestone_index).toBe(1);
        expect(tasks[3].milestone_index).toBe(2);
        expect(tasks[4].milestone_index).toBe(3);

        // Titles must all be distinct
        const titles = tasks.map((t) => t.title);
        const uniqueTitles = new Set(titles);
        expect(uniqueTitles.size).toBe(5);

        // Final task (Task 4) must connect to capstone project deliverables
        const finalTask = tasks[4];
        expect(finalTask.difficulty).toBe("advanced");
        expect(finalTask.reason_for_assignment.toLowerCase()).toContain("capstone");
      });
    }
  });

  describe("3. Student Personalization & Difficulty Adaptation (Strong vs Average vs Struggling)", () => {
    it("proves tasks meaningfully differ between Strong (SCALE_UP), Average (MAINTAIN), and Struggling (SCAFFOLD)", async () => {
      const def = AI_ML_INTERNSHIP_DEFINITION;

      const strongJourney = await generateJourney(def, "strong");
      const avgJourney = await generateJourney(def, "average");
      const strugglingJourney = await generateJourney(def, "struggling", "Unhandled NaN values");

      // Strong student on Milestone 1 (Step 2) gets advanced difficulty & hyperparameter tuning
      const strongM1 = strongJourney.tasks[2];
      expect(strongM1.difficulty).toBe("advanced");
      expect(strongM1.estimated_hours).toBeGreaterThanOrEqual(7);

      // Average student on Milestone 1 (Step 2) gets intermediate difficulty
      const avgM1 = avgJourney.tasks[2];
      expect(avgM1.difficulty).toBe("intermediate");
      expect(avgM1.estimated_hours).toBe(6);

      // Struggling student on Milestone 0 (Step 0) gets beginner difficulty, targeted scaffolding, and lower estimated hours
      const strugglingM0 = strugglingJourney.tasks[0];
      expect(strugglingM0.difficulty).toBe("beginner");
      expect(strugglingM0.estimated_hours).toBeLessThanOrEqual(4);
      expect(strugglingM0.title.toLowerCase()).toContain("remediation");
      expect(strugglingM0.reason_for_assignment.toLowerCase()).toContain("scaffolding");
    });
  });

  describe("4. Repeated Weakness Handling & Targeted Remediation", () => {
    it("identifies specific error 'Unhandled NaN values' and generates targeted remediation task", async () => {
      const def = AI_ML_INTERNSHIP_DEFINITION;
      const curriculum = generateCurriculumPlan(def);
      const currentMilestone = getMilestoneByIndex(curriculum, 0)!;

      const history: StudentPerformanceRecord[] = [
        {
          task_id: "task_0",
          task_title: "Initial Ingestion",
          milestone_index: 0,
          score: 55,
          verdict: "needs_revision",
          strengths: [],
          weaknesses: ["Unhandled NaN values"],
          skills_tested: ["Pandas"],
          completed_at: new Date().toISOString(),
        },
      ];

      const studentContext = buildStudentContext({
        student: { id: "student_c", full_name: "Devon Taylor", declared_skills: ["Python"] },
        internship: def,
        performanceRecords: history,
      });

      expect(studentContext.performance.weaknesses).toContain("Unhandled NaN values");
      expect(studentContext.learning_state.target_difficulty).toBe("beginner");

      const result = await generateNextInternshipTask({
        internship: def,
        curriculum,
        currentMilestone,
        studentContext,
        previousTasks: [],
      });

      expect(result.task.title).toContain("Missing Value Imputation");
      expect(result.task.instructions.some((ins) => ins.toLowerCase().includes("nan"))).toBe(true);
      expect(result.task.acceptance_criteria.some((c) => c.toLowerCase().includes("nan"))).toBe(true);
    });
  });

  describe("5. Deterministic Duplicate Detection & Paraphrase Rejection", () => {
    it("rejects identical task titles and near-duplicate variations", () => {
      const curriculum = generateCurriculumPlan(FULLSTACK_INTERNSHIP_DEFINITION);
      const currentMilestone = getMilestoneByIndex(curriculum, 1)!;

      const existingTask: InternshipTask = {
        title: "Develop Secure Student Milestone REST API Endpoints",
        business_context: "Need backend API endpoints.",
        objective: "Build RESTful API endpoints using Node.js and PostgreSQL.",
        instructions: ["Implement GET and POST routes", "Add Zod validation"],
        deliverables: ["API route handlers", "Zod validation schemas"],
        acceptance_criteria: ["GET returns 200 OK", "POST returns 422 for invalid payloads"],
        skills_practiced: ["Node.js", "REST APIs", "PostgreSQL", "Zod"],
        estimated_hours: 6,
        difficulty: "intermediate",
        reason_for_assignment: "Student is progressing from frontend components to backend API development in Milestone 1.",
        milestone_index: 1,
      };

      // Exact match test
      const exactDupResult = validateTask({
        task: existingTask,
        internship: FULLSTACK_INTERNSHIP_DEFINITION,
        currentMilestone,
        previousTasks: [{ title: existingTask.title, objective: existingTask.objective }],
      });
      expect(exactDupResult.valid).toBe(false);
      expect(exactDupResult.errors.some((e) => e.includes("Duplicate task: title matches previous task"))).toBe(true);

      // High similarity test
      const paraphraseTask = {
        ...existingTask,
        title: "Develop Secure Student Milestone REST API Endpoint Service",
      };
      const paraphraseResult = validateTask({
        task: paraphraseTask,
        internship: FULLSTACK_INTERNSHIP_DEFINITION,
        currentMilestone,
        previousTasks: [{ title: existingTask.title, objective: existingTask.objective }],
      });
      expect(paraphraseResult.valid).toBe(false);
      expect(paraphraseResult.errors.some((e) => e.includes("Duplicate task: high similarity"))).toBe(true);
    });
  });

  describe("6. Robust Anti-Passive Learning Validator Guardrails", () => {
    it("rejects passive learning tasks such as 'Learn React' or 'Read Documentation'", () => {
      const curriculum = generateCurriculumPlan(FULLSTACK_INTERNSHIP_DEFINITION);
      const currentMilestone = getMilestoneByIndex(curriculum, 0)!;

      const passiveTask: InternshipTask = {
        title: "Learn React and Read Documentation",
        business_context: "You need to understand React components before building UI.",
        objective: "Read documentation and study React hooks.",
        instructions: ["Read tutorial", "Watch videos"],
        deliverables: ["Understanding of React", "Notes"],
        acceptance_criteria: ["Code should be good", "Student understands React"],
        skills_practiced: ["React"],
        estimated_hours: 5,
        difficulty: "beginner",
        reason_for_assignment: "To learn React.",
        milestone_index: 0,
      };

      const result = validateTask({
        task: passiveTask,
        internship: FULLSTACK_INTERNSHIP_DEFINITION,
        currentMilestone,
        previousTasks: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("passive learning prompt"))).toBe(true);
      expect(result.errors.some((e) => e.includes("abstract learning outcome"))).toBe(true);
      expect(result.errors.some((e) => e.includes("vague and not measurably testable"))).toBe(true);
    });
  });

  describe("7. Deterministic Fallback Generation Quality", () => {
    for (const track of ALL_TRACKS) {
      it(`verifies that fallback task for ${track.name} is concrete, rich, and domain-appropriate`, () => {
        const curriculum = generateCurriculumPlan(track.definition);
        const currentMilestone = getMilestoneByIndex(curriculum, 1)!;
        const studentContext = buildStudentContext({
          student: { id: "student_f", full_name: "Fallback Candidate", declared_skills: [] },
          internship: track.definition,
          performanceRecords: [],
        });

        const fallback = generateFallbackTask({
          internship: track.definition,
          curriculum,
          currentMilestone,
          studentContext,
        });

        expect(fallback.title).toBeTruthy();
        expect(fallback.business_context.length).toBeGreaterThan(20);
        expect(fallback.objective.length).toBeGreaterThan(20);
        expect(fallback.deliverables.length).toBeGreaterThanOrEqual(2);
        expect(fallback.acceptance_criteria.length).toBeGreaterThanOrEqual(2);
        expect(fallback.estimated_hours).toBeGreaterThanOrEqual(2);
        expect(fallback.estimated_hours).toBeLessThanOrEqual(20);
        expect(fallback.milestone_index).toBe(1);

        // Fallback must pass validator cleanly!
        const val = validateTask({
          task: fallback,
          internship: track.definition,
          currentMilestone,
          previousTasks: [],
        });
        expect(val.valid).toBe(true);
        expect(val.errors).toHaveLength(0);
      });
    }
  });
});

