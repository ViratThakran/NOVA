import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getAiProvider,
  setAiProvider,
  resetAiProvider,
  MockProvider,
  AnthropicProvider,
  OpenAiProvider,
  GeminiProvider,
} from "../../src/lib/ai-engine/providers";
import {
  decideNextMentorAction,
  generateNextInternshipTask,
  buildStudentContext,
  generateCurriculumPlan,
  FULLSTACK_INTERNSHIP_DEFINITION,
  validateReview,
  type StudentContext,
  type InternshipReview,
  type RuntimeEvidence,
  type RepositoryEvidence,
} from "../../src/lib/ai-engine/internship-mentor";
import { verifyCommitSha } from "../../sandbox-worker/src/repository/fetcher";

describe("PHASE 4: REAL AI + ADAPTIVE INTERNSHIP MENTOR SUITE", () => {
  beforeEach(() => {
    resetAiProvider();
  });

  afterEach(() => {
    resetAiProvider();
  });

  describe("1. Multi-Provider AI Resolution & Selection", () => {
    it("resolves to MockProvider when no API keys are present", () => {
      const origAnthropic = process.env.ANTHROPIC_API_KEY;
      const origOpenAi = process.env.OPENAI_API_KEY;
      const origGemini = process.env.GEMINI_API_KEY;

      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      resetAiProvider();
      const provider = getAiProvider();
      expect(provider.name).toBe("mock");

      // Restore
      if (origAnthropic) process.env.ANTHROPIC_API_KEY = origAnthropic;
      if (origOpenAi) process.env.OPENAI_API_KEY = origOpenAi;
      if (origGemini) process.env.GEMINI_API_KEY = origGemini;
    });

    it("resolves to AnthropicProvider when ANTHROPIC_API_KEY is present", () => {
      const origKey = process.env.ANTHROPIC_API_KEY;
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-12345";
      resetAiProvider();

      const provider = getAiProvider();
      expect(provider.name).toBe("anthropic");
      expect(provider instanceof AnthropicProvider).toBe(true);

      if (origKey) process.env.ANTHROPIC_API_KEY = origKey;
      else delete process.env.ANTHROPIC_API_KEY;
    });

    it("resolves to OpenAiProvider when OPENAI_API_KEY is set without Anthropic", () => {
      const origAnthropic = process.env.ANTHROPIC_API_KEY;
      const origOpenAi = process.env.OPENAI_API_KEY;

      delete process.env.ANTHROPIC_API_KEY;
      process.env.OPENAI_API_KEY = "sk-proj-test-12345";
      resetAiProvider();

      const provider = getAiProvider();
      expect(provider.name).toBe("openai");
      expect(provider instanceof OpenAiProvider).toBe(true);

      if (origAnthropic) process.env.ANTHROPIC_API_KEY = origAnthropic;
      if (origOpenAi) process.env.OPENAI_API_KEY = origOpenAi;
      else delete process.env.OPENAI_API_KEY;
    });

    it("allows dynamic setAiProvider override for test harness", async () => {
      const customMock = new MockProvider();
      setAiProvider(customMock);
      expect(getAiProvider()).toBe(customMock);
    });
  });

  describe("2. Next-Task Deterministic Decision Engine", () => {
    const internship = FULLSTACK_INTERNSHIP_DEFINITION;
    const curriculum = generateCurriculumPlan(internship);

    it("decides REVISION_REQUIRED when previous review verdict is needs_revision", () => {
      const studentContext = buildStudentContext({
        student: { id: "stu_1", name: "Alex Chen" },
        internship,
      });

      const failingReview: InternshipReview = {
        review_id: "rev_fail",
        submission_id: "sub_1",
        task_id: "task_1",
        attempt_number: 1,
        verdict: "needs_revision",
        score: 60,
        summary: "Unit tests failed for component state handlers.",
        criteria_results: [
          { criterion: "Pass unit tests", status: "not_met", evidence: ["tests/test.ts"], reason: "Failed", critical: true },
        ],
        technical_quality: {
          architecture_score: 70,
          code_quality_score: 65,
          testing_score: 40,
          documentation_score: 70,
          notes: "Tests failed.",
        },
        deliverables_evaluated: [{ deliverable: "Card component", status: "present", evidence_path: "Card.tsx" }],
        strengths: ["Clean code"],
        improvements: ["Fix event handler state update", "Add unit tests"],
        next_step: "Fix failing tests",
        review_engine_version: "1.0",
        created_at: new Date().toISOString(),
      };

      const decision = decideNextMentorAction({
        studentContext,
        curriculum,
        lastReview: failingReview,
      });

      expect(decision.action).toBe("REVISION_REQUIRED");
      expect(decision.targetMilestoneIndex).toBe(0);
      expect(decision.scaffoldingProvided).toBe(true);
      expect(decision.pedagogicalRationale).toContain("requires revision");
    });

    it("decides TARGETED_REMEDIATION when student exhibits repeated error patterns", () => {
      const studentContext: StudentContext = {
        ...buildStudentContext({ student: { id: "stu_2", name: "Bob Smith" }, internship }),
        performance: {
          recent_records: [
            {
              task_id: "t1",
              task_title: "Task 1",
              milestone_index: 0,
              score: 70,
              verdict: "passed",
              strengths: [],
              weaknesses: ["Missing schema validation"],
              skills_tested: ["React"],
              completed_at: new Date().toISOString(),
            },
          ],
          strengths: [],
          weaknesses: ["Missing schema validation"],
          repeated_errors: ["Missing schema validation"],
          average_score: 70,
        },
      };

      const decision = decideNextMentorAction({
        studentContext,
        curriculum,
      });

      expect(decision.action).toBe("TARGETED_REMEDIATION");
      expect(decision.focusSkills).toContain("Missing schema validation");
      expect(decision.remediationObjective).toBeDefined();
    });

    it("decides CONTINUE_MILESTONE_SCALE_UP for high-performing students", () => {
      const studentContext: StudentContext = {
        ...buildStudentContext({ student: { id: "stu_3", name: "Clara Wong" }, internship }),
        performance: {
          recent_records: [
            {
              task_id: "t1",
              task_title: "Task 1",
              milestone_index: 0,
              score: 96,
              verdict: "passed",
              strengths: ["Clean architecture", "Comprehensive test coverage"],
              weaknesses: [],
              skills_tested: ["React", "TypeScript"],
              completed_at: new Date().toISOString(),
            },
          ],
          strengths: ["Clean architecture"],
          weaknesses: [],
          repeated_errors: [],
          average_score: 96,
        },
      };

      const decision = decideNextMentorAction({
        studentContext,
        curriculum,
      });

      expect(decision.action).toBe("ADVANCE_MILESTONE");
      expect(decision.targetDifficulty).toBe("advanced");
      expect(decision.targetMilestoneIndex).toBe(1);
    });

    it("decides CAPSTONE_ASSIGNMENT when all curriculum milestones are completed", () => {
      const totalMilestones = curriculum.milestones.length;
      const studentContext: StudentContext = {
        ...buildStudentContext({ student: { id: "stu_4", name: "David Kim" }, internship }),
        progress: {
          current_milestone_index: totalMilestones - 1,
          completed_task_count: totalMilestones,
          completion_percentage: 100,
        },
        performance: {
          recent_records: [
            {
              task_id: "t_last",
              task_title: "Final Milestone Task",
              milestone_index: totalMilestones - 1,
              score: 94,
              verdict: "passed",
              strengths: ["Production deployment ready"],
              weaknesses: [],
              skills_tested: ["Kubernetes", "CI/CD"],
              completed_at: new Date().toISOString(),
            },
          ],
          strengths: [],
          weaknesses: [],
          repeated_errors: [],
          average_score: 94,
        },
      };

      const decision = decideNextMentorAction({
        studentContext,
        curriculum,
      });

      expect(decision.action).toBe("CAPSTONE_ASSIGNMENT");
      expect(decision.targetDifficulty).toBe("advanced");
      expect(decision.capstoneTraceability).toBeDefined();
    });
  });

  describe("3. Task Personalization Across Varied Student Profiles", () => {
    const internship = FULLSTACK_INTERNSHIP_DEFINITION;
    const curriculum = generateCurriculumPlan(internship);

    it("generates different task requirements for Student A (High Velocity) vs Student C (Needs Remediation)", async () => {
      // Student A: High performer (Score: 98)
      const studentA = buildStudentContext({
        student: { id: "stu_a", name: "Student A", declared_skills: ["TypeScript", "React"] },
        internship,
        performanceRecords: [
          {
            task_id: "t0",
            task_title: "Setup",
            milestone_index: 0,
            score: 98,
            verdict: "passed",
            strengths: ["Exceptional speed", "Zero bugs"],
            weaknesses: [],
            skills_tested: ["React"],
            completed_at: new Date().toISOString(),
          },
        ],
      });

      // Student C: Struggling student (Score: 55, repeated validation errors)
      const studentC = buildStudentContext({
        student: { id: "stu_c", name: "Student C", declared_skills: ["HTML", "CSS"] },
        internship,
        performanceRecords: [
          {
            task_id: "t0",
            task_title: "Setup",
            milestone_index: 0,
            score: 55,
            verdict: "needs_revision",
            strengths: [],
            weaknesses: ["Missing input validation", "Missing input validation"],
            skills_tested: ["JavaScript"],
            completed_at: new Date().toISOString(),
          },
        ],
      });

      const taskResA = await generateNextInternshipTask({ internship, curriculum, studentContext: studentA });
      const taskResC = await generateNextInternshipTask({ internship, curriculum, studentContext: studentC });

      expect(taskResA.task.difficulty).toBe("advanced");
      expect(taskResC.task.difficulty).not.toBe("advanced");
      expect(taskResA.decision?.action).not.toBe(taskResC.decision?.action);
    });
  });

  describe("4. GitHub Commit SHA Integrity & Resolution", () => {
    it("verifies exact match and short SHA prefix match", () => {
      const fullSha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      const shortSha = "e3b0c44";

      expect(verifyCommitSha(fullSha, fullSha)).toBe(true);
      expect(verifyCommitSha(shortSha, fullSha)).toBe(true);
      expect(verifyCommitSha(fullSha, shortSha)).toBe(true);
      expect(verifyCommitSha("mismatch_sha", fullSha)).toBe(false);
      expect(verifyCommitSha("", fullSha)).toBe(false);
    });
  });

  describe("5. Deterministic AI Review Guard & Anti-Hallucination", () => {
    it("strictly overrides review verdict to needs_revision if runtime exit code != 0", () => {
      const fakePassingReview: InternshipReview = {
        review_id: "rev_hallucinated",
        submission_id: "sub_1",
        task_id: "task_1",
        attempt_number: 1,
        verdict: "passed",
        score: 95,
        summary: "Code looks amazing! All tests passed perfectly.",
        criteria_results: [
          { criterion: "Tests pass", status: "met", evidence: ["tests/test.ts"], reason: "All passed", critical: true },
        ],
        technical_quality: {
          architecture_score: 95,
          code_quality_score: 95,
          testing_score: 95,
          documentation_score: 95,
          notes: "Good architecture.",
        },
        deliverables_evaluated: [{ deliverable: "Component", status: "present", evidence_path: "Comp.tsx" }],
        strengths: ["Great work"],
        improvements: [],
        next_step: "Proceed",
        review_engine_version: "1.0",
        created_at: new Date().toISOString(),
      };

      const failingRuntimeEvidence: RuntimeEvidence = {
        execution_id: "exec_1",
        submission_id: "sub_1",
        commit_sha: "sha123",
        runner_version: "1.0",
        profile_version: "1.0",
        status: "failed",
        exit_code: 1,
        duration_ms: 1200,
        tests_summary: { total: 5, passed: 3, failed: 2, skipped: 0 },
        build_summary: { attempted: true, status: "passed" },
        lint_summary: { attempted: false, status: "skipped", warnings: 0, errors: 0 },
        bounded_stdout: "",
        bounded_stderr: "AssertionError: expected false to be true",
        resource_usage: {},
        collected_at: new Date().toISOString(),
      };

      const staticEvidence: RepositoryEvidence = {
        collected_at: new Date().toISOString(),
        repository: {
          name: "repo",
          owner: "test",
          default_branch: "main",
          topics: [],
          languages: ["TypeScript"],
          is_private: false,
          commit_sha: "sha123",
        },
        collection_status: "success",
        file_tree: [{ path: "Comp.tsx", type: "file" }, { path: "tests/test.ts", type: "file" }],
        source_files: [{ path: "Comp.tsx", content: "export default () => null;", line_count: 1 }],
        test_files: [{ path: "tests/test.ts", content: "test('works', () => {});", framework: "vitest" }],
        config_files: [],
      };

      const internship = FULLSTACK_INTERNSHIP_DEFINITION;
      const curriculum = generateCurriculumPlan(internship);

      const guardedResult = validateReview(fakePassingReview, {
        task: {
          title: "Test Task",
          business_context: "Context",
          objective: "Goal",
          instructions: ["Step 1"],
          deliverables: ["Component"],
          acceptance_criteria: ["Tests pass"],
          skills_practiced: ["React"],
          estimated_hours: 4,
          difficulty: "beginner",
          reason_for_assignment: "Reason",
        },
        internship,
        currentMilestone: curriculum.milestones[0],
        studentContext: buildStudentContext({ student: { id: "stu_1", name: "Alex Chen" }, internship }),
        currentSubmission: {
          id: "sub_1",
          task_id: "task_1",
          student_id: "stu_1",
          enrollment_id: "enr_1",
          submission_type: "github",
          github_url: "https://github.com/test/repo",
          branch: "main",
          commit_sha: "sha123",
          student_explanation: "Done",
          attempt_number: 1,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        },
        evidence: staticEvidence,
        runtimeEvidence: failingRuntimeEvidence,
      });

      expect(guardedResult.adjusted_verdict).toBe("needs_revision");
      expect(guardedResult.adjusted_score).toBeLessThanOrEqual(68);
      expect(guardedResult.errors.some((e) => e.includes("Conflicting Evidence Violation"))).toBe(true);
    });
  });
});
