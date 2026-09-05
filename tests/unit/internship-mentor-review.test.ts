import { describe, it, expect, beforeEach } from "vitest";
import {
  parseGitHubUrl,
  registerMockRepository,
  clearMockRepositoryRegistry,
  GitHubEvidenceCollector,
} from "../../src/lib/ai-engine/internship-mentor/evidence/collector";
import { selectRelevantEvidence } from "../../src/lib/ai-engine/internship-mentor/evidence/selector";
import { formatReviewPrompt } from "../../src/lib/ai-engine/internship-mentor/review/context";
import { generateInternshipReview, generateFallbackReview } from "../../src/lib/ai-engine/internship-mentor/review/agent";
import { validateReview } from "../../src/lib/ai-engine/internship-mentor/review/validator";
import {
  createSubmissionRecord,
  evaluateSubmission,
} from "../../src/lib/ai-engine/internship-mentor/review/service";
import {
  AIML_INTERNSHIP_DEFINITION,
  FULLSTACK_INTERNSHIP_DEFINITION,
  CLOUD_DEVOPS_INTERNSHIP_DEFINITION,
} from "../../src/lib/ai-engine/internship-mentor/definitions";
import {
  generateCurriculumPlan,
  getMilestoneByIndex,
} from "../../src/lib/ai-engine/internship-mentor/curriculum";
import { buildStudentContext } from "../../src/lib/ai-engine/internship-mentor/context";
import type {
  InternshipTask,
  InternshipSubmission,
  RepositoryEvidence,
  ReviewContext,
} from "../../src/lib/ai-engine/internship-mentor/types";

describe("PHASE 2: Submission, Evidence Collection & AI Review Foundation", () => {
  beforeEach(() => {
    clearMockRepositoryRegistry();
  });

  describe("1. GitHub URL Parsing & Submission Model", () => {
    it("parses valid GitHub repository URLs accurately", () => {
      const parsed = parseGitHubUrl("https://github.com/alex-dev/nova-ml-classifier");
      expect(parsed.isValid).toBe(true);
      expect(parsed.owner).toBe("alex-dev");
      expect(parsed.repo).toBe("nova-ml-classifier");

      const withTree = parseGitHubUrl("https://github.com/alex-dev/nova-ml-classifier/tree/main/src");
      expect(withTree.isValid).toBe(true);
      expect(withTree.branch).toBe("main");
      expect(withTree.subpath).toBe("src");
    });

    it("rejects invalid or malformed repository URLs", () => {
      expect(parseGitHubUrl("https://gitlab.com/user/repo").isValid).toBe(false);
      expect(parseGitHubUrl("not-a-url").isValid).toBe(false);
      expect(parseGitHubUrl("https://github.com/incomplete").isValid).toBe(false);
    });

    it("creates valid submission record with attempt numbering", () => {
      const sub1 = createSubmissionRecord({
        taskId: "task_101",
        studentId: "student_a",
        enrollmentId: "enroll_1",
        githubUrl: "https://github.com/alex-dev/nova-ml-classifier",
        studentExplanation: "Implemented feature scaling and logistic regression model with tests.",
      }, 1);

      expect(sub1.id).toBeTruthy();
      expect(sub1.attempt_number).toBe(1);
      expect(sub1.status).toBe("submitted");

      const sub2 = createSubmissionRecord({
        taskId: "task_101",
        studentId: "student_a",
        enrollmentId: "enroll_1",
        githubUrl: "https://github.com/alex-dev/nova-ml-classifier",
        studentExplanation: "Added missing input validation schemas and error handling.",
      }, 2);

      expect(sub2.attempt_number).toBe(2);
      expect(sub2.submitted_at).toBeTruthy();
    });
  });

  describe("2. Safe Static Evidence Collection (Zero Code Execution)", () => {
    const collector = new GitHubEvidenceCollector();

    it("extracts file tree, README, source files, and test files from registered mock repository", async () => {
      const repoUrl = "https://github.com/student-dev/ml-pipeline";
      registerMockRepository(repoUrl, {
        readme: "# Student ML Pipeline\nModular data pipeline with scikit-learn transformers.",
        file_tree: [
          { path: "README.md", type: "file" },
          { path: "src/pipeline.py", type: "file" },
          { path: "tests/test_pipeline.py", type: "file" },
          { path: "requirements.txt", type: "file" },
        ],
        source_files: [
          {
            path: "src/pipeline.py",
            content: "import pandas as pd\ndef clean_data(df):\n    return df.dropna()",
            language: "python",
            line_count: 3,
          },
        ],
        test_files: [
          {
            path: "tests/test_pipeline.py",
            content: "def test_clean_data():\n    assert True",
            framework: "pytest",
          },
        ],
        config_files: [
          {
            path: "requirements.txt",
            content: "pandas>=2.0.0\npytest>=8.0.0",
          },
        ],
        collection_status: "success",
      });

      const submission = createSubmissionRecord({
        taskId: "task_ml_1",
        studentId: "s1",
        enrollmentId: "e1",
        githubUrl: repoUrl,
        studentExplanation: "Completed data cleaning module.",
      });

      const evidence = await collector.collect(submission);

      expect(evidence.collection_status).toBe("success");
      expect(evidence.repository.owner).toBe("student-dev");
      expect(evidence.repository.name).toBe("ml-pipeline");
      expect(evidence.readme).toContain("Modular data pipeline");
      expect(evidence.file_tree).toHaveLength(4);
      expect(evidence.source_files).toHaveLength(1);
      expect(evidence.test_files).toHaveLength(1);
      expect(evidence.config_files).toHaveLength(1);
    });

    it("safely handles private/restricted repositories by flagging private_restricted without crashing", async () => {
      const submission = createSubmissionRecord({
        taskId: "task_ml_1",
        studentId: "s1",
        enrollmentId: "e1",
        githubUrl: "https://github.com/private-restricted-user/secret-repo",
        studentExplanation: "Here is my private repo.",
      });

      const evidence = await collector.collect(submission);
      expect(evidence.collection_status).toBe("private_restricted");
      expect(evidence.error_message).toContain("private");
      expect(evidence.file_tree).toHaveLength(0);
    });
  });

  describe("3. Evidence Selection & Criteria Mapping", () => {
    it("ranks relevant files and maps acceptance criteria to candidate files", () => {
      const task: InternshipTask = {
        title: "Build Data Cleaning & Feature Preprocessing Pipeline",
        business_context: "Raw student telemetry contains missing values.",
        objective: "Develop a modular data cleaning pipeline using Pandas with Pytest suites.",
        instructions: [
          "Create src/pipeline.py with missing value imputation",
          "Add Pytest assertions in tests/test_pipeline.py",
        ],
        deliverables: [
          "src/pipeline.py clean transformation module",
          "tests/test_pipeline.py unit test suite",
        ],
        acceptance_criteria: [
          "Pipeline handles missing values without dropping critical rows",
          "Pytest suite verifies transformer shapes and non-empty outputs",
        ],
        skills_practiced: ["Python", "Pandas", "Pytest"],
        estimated_hours: 5,
        difficulty: "beginner",
        reason_for_assignment: "Starting data preprocessing.",
        milestone_index: 0,
      };

      const evidence: RepositoryEvidence = {
        repository: { owner: "alex", name: "ml-repo", default_branch: "main", is_private: false, topics: [], languages: [] },
        readme: "# ML Repo",
        file_tree: [
          { path: "src/pipeline.py", type: "file" },
          { path: "src/unrelated.py", type: "file" },
          { path: "tests/test_pipeline.py", type: "file" },
        ],
        source_files: [
          { path: "src/pipeline.py", content: "def clean_data(df): return df.fillna(0)", line_count: 1 },
          { path: "src/unrelated.py", content: "print('hello')", line_count: 1 },
        ],
        test_files: [
          { path: "tests/test_pipeline.py", content: "def test_clean(): assert True", framework: "pytest" },
        ],
        config_files: [{ path: "requirements.txt", content: "pandas\npytest" }],
        collected_at: new Date().toISOString(),
        collection_status: "success",
      };

      const selected = selectRelevantEvidence(task, evidence);

      expect(selected.prioritizedSourceFiles[0].path).toBe("src/pipeline.py");
      expect(selected.prioritizedTestFiles[0].path).toBe("tests/test_pipeline.py");
      expect(selected.criteriaMapping).toHaveLength(2);
      expect(selected.criteriaMapping[0].candidateFiles).toContain("src/pipeline.py");
    });
  });

  describe("4. AI Review Agent & Deterministic Validation", () => {
    const curriculum = generateCurriculumPlan(AIML_INTERNSHIP_DEFINITION);
    const milestone = getMilestoneByIndex(curriculum, 0)!;
    const studentContext = buildStudentContext({
      student: { id: "s1", name: "Elena Rostova", declared_skills: ["Python", "Pandas"] },
      internship: AIML_INTERNSHIP_DEFINITION,
      performanceRecords: [],
    });

    const task: InternshipTask = {
      title: "Build Data Cleaning & Feature Preprocessing Pipeline",
      business_context: "EdTech telemetry requires clean imputation.",
      objective: "Develop data preprocessing module in Python with Pytest suite.",
      instructions: [
        "Create pipeline/cleaner.py with imputation logic",
        "Add unit tests in tests/test_cleaner.py",
      ],
      deliverables: [
        "pipeline/cleaner.py data cleaning module",
        "tests/test_cleaner.py test suite",
      ],
      acceptance_criteria: [
        "Data cleaning replaces missing values and encodes categorical features",
        "Pytest test suite achieves high branch coverage over edge cases",
      ],
      skills_practiced: ["Python", "Pandas", "Data Cleaning"],
      estimated_hours: 5,
      difficulty: "beginner",
      reason_for_assignment: "Starting Milestone 0.",
      milestone_index: 0,
    };

    const evidence: RepositoryEvidence = {
      repository: { owner: "elena", name: "cleaner-repo", default_branch: "main", is_private: false, topics: [], languages: [] },
      readme: "# Cleaner Repo",
      file_tree: [
        { path: "pipeline/cleaner.py", type: "file" },
        { path: "tests/test_cleaner.py", type: "file" },
      ],
      source_files: [
        { path: "pipeline/cleaner.py", content: "def clean(df): return df.fillna(0)", line_count: 1 },
      ],
      test_files: [
        { path: "tests/test_cleaner.py", content: "def test_clean(): assert True" },
      ],
      config_files: [],
      collected_at: new Date().toISOString(),
      collection_status: "success",
    };

    const submission = createSubmissionRecord({
      taskId: "task_cleaner",
      studentId: "s1",
      enrollmentId: "e1",
      githubUrl: "https://github.com/elena/cleaner-repo",
      studentExplanation: "Implemented imputation and written test assertions.",
    });

    const reviewContext: ReviewContext = {
      task,
      internship: AIML_INTERNSHIP_DEFINITION,
      currentMilestone: milestone,
      studentContext,
      currentSubmission: submission,
      evidence,
    };

    it("evaluates high quality submission and passes review with score >= 85", async () => {
      const review = await generateInternshipReview(reviewContext);
      const validation = validateReview(review, reviewContext);

      expect(validation.valid).toBe(true);
      expect(validation.adjusted_verdict).toBe("passed");
      expect(validation.adjusted_score).toBeGreaterThanOrEqual(85);
      expect(review.criteria_results.every((c) => c.status === "met")).toBe(true);
      expect(review.review_engine_version).toBe("1.0");
    });

    it("generates structured fallback review when AI is unreachable", () => {
      const fallback = generateFallbackReview(reviewContext);
      const val = validateReview(fallback, reviewContext);

      expect(fallback.review_id).toBeTruthy();
      expect(val.valid).toBe(true);
      expect(fallback.criteria_results).toHaveLength(2);
      expect(fallback.technical_quality.notes).toBeTruthy();
    });
  });

  describe("5. Anti-Hallucination & Runtime Claim Guardrails", () => {
    const curriculum = generateCurriculumPlan(AIML_INTERNSHIP_DEFINITION);
    const milestone = getMilestoneByIndex(curriculum, 0)!;
    const studentContext = buildStudentContext({
      student: { id: "s1", name: "Elena Rostova", declared_skills: [] },
      internship: AIML_INTERNSHIP_DEFINITION,
      performanceRecords: [],
    });

    const task: InternshipTask = {
      title: "Sample Task",
      business_context: "Context",
      objective: "Objective",
      instructions: ["Ins 1"],
      deliverables: ["src/app.ts"],
      acceptance_criteria: ["App works"],
      skills_practiced: ["TypeScript"],
      estimated_hours: 4,
      difficulty: "beginner",
      reason_for_assignment: "Starting task.",
      milestone_index: 0,
    };

    const evidence: RepositoryEvidence = {
      repository: { owner: "user", name: "repo", default_branch: "main", is_private: false, topics: [], languages: [] },
      readme: null,
      file_tree: [{ path: "src/app.ts", type: "file" }],
      source_files: [{ path: "src/app.ts", content: "export const x = 1;", line_count: 1 }],
      test_files: [],
      config_files: [],
      collected_at: new Date().toISOString(),
      collection_status: "success",
    };

    const submission = createSubmissionRecord({
      taskId: "task_1",
      studentId: "s1",
      enrollmentId: "e1",
      githubUrl: "https://github.com/user/repo",
      studentExplanation: "Implemented the core application components.",
    });

    const reviewContext: ReviewContext = {
      task,
      internship: AIML_INTERNSHIP_DEFINITION,
      currentMilestone: milestone,
      studentContext,
      currentSubmission: submission,
      evidence,
    };

    it("rejects AI review citing non-existent files not in collected repository evidence", () => {
      // Mock prompt containing fake file flag
      const fakeReview = {
        review_id: "rev_fake",
        submission_id: "sub_1",
        task_id: "task_1",
        attempt_number: 1,
        verdict: "passed" as const,
        score: 90,
        summary: "Verified all files.",
        criteria_results: [
          {
            criterion: "App works",
            status: "met" as const,
            evidence: ["src/nonexistent_fake_auth_module.ts"], // NOT in evidence!
            reason: "Found in fake auth module.",
            critical: true,
          },
        ],
        technical_quality: {
          architecture_score: 90,
          code_quality_score: 90,
          testing_score: 90,
          documentation_score: 90,
          notes: "Good.",
        },
        deliverables_evaluated: [
          { deliverable: "src/app.ts", status: "present" as const, evidence_path: "src/app.ts" },
        ],
        strengths: ["Clean."],
        improvements: [],
        next_step: "Proceed.",
        review_engine_version: "1.0",
        created_at: new Date().toISOString(),
      };

      const val = validateReview(fakeReview, reviewContext);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => e.includes("Anti-Hallucination Violation") && e.includes("nonexistent_fake_auth_module.ts"))).toBe(true);
    });

    it("rejects AI review claiming runtime execution or tests passed without verifiable logs", () => {
      const runtimeClaimReview = {
        review_id: "rev_runtime",
        submission_id: "sub_1",
        task_id: "task_1",
        attempt_number: 1,
        verdict: "passed" as const,
        score: 95,
        summary: "Executed the test suite and all tests passed successfully at runtime.",
        criteria_results: [
          {
            criterion: "App works",
            status: "met" as const,
            evidence: ["src/app.ts"],
            reason: "Ran the tests and they passed without errors.",
            critical: false,
          },
        ],
        technical_quality: {
          architecture_score: 90,
          code_quality_score: 90,
          testing_score: 95,
          documentation_score: 90,
          notes: "Live execution verified.",
        },
        deliverables_evaluated: [
          { deliverable: "src/app.ts", status: "present" as const, evidence_path: "src/app.ts" },
        ],
        strengths: ["Runtime passes."],
        improvements: [],
        next_step: "Next milestone.",
        review_engine_version: "1.0",
        created_at: new Date().toISOString(),
      };

      const val = validateReview(runtimeClaimReview, reviewContext);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => e.includes("Anti-Hallucination Violation") && e.includes("runtime execution"))).toBe(true);
    });
  });

  describe("6. Critical Acceptance Criteria Policy", () => {
    it("forces verdict to 'needs_revision' and caps score at <= 55 if a critical criterion is not met", () => {
      const task: InternshipTask = {
        title: "Auth Service",
        business_context: "Security context",
        objective: "Build auth",
        instructions: ["Ins 1"],
        deliverables: ["src/auth.ts"],
        acceptance_criteria: [
          "Enforce cryptographic password hashing with Argon2id",
          "Build user registration REST endpoint",
        ],
        skills_practiced: ["Security", "Cryptography"],
        estimated_hours: 6,
        difficulty: "intermediate",
        reason_for_assignment: "Auth milestone",
        milestone_index: 1,
      };

      const evidence: RepositoryEvidence = {
        repository: { owner: "user", name: "auth-repo", default_branch: "main", is_private: false, topics: [], languages: [] },
        readme: null,
        file_tree: [{ path: "src/auth.ts", type: "file" }],
        source_files: [{ path: "src/auth.ts", content: "export const hash = 'sha256';", line_count: 1 }],
        test_files: [],
        config_files: [],
        collected_at: new Date().toISOString(),
        collection_status: "success",
      };

      const context: ReviewContext = {
        task,
        internship: AIML_INTERNSHIP_DEFINITION,
        currentMilestone: generateCurriculumPlan(AIML_INTERNSHIP_DEFINITION).milestones[0],
        studentContext: buildStudentContext({
          student: { id: "s1", name: "User", declared_skills: [] },
          internship: AIML_INTERNSHIP_DEFINITION,
          performanceRecords: [],
        }),
        currentSubmission: createSubmissionRecord({
          taskId: "task_auth",
          studentId: "s1",
          enrollmentId: "e1",
          githubUrl: "https://github.com/user/auth-repo",
          studentExplanation: "Implemented auth.",
        }),
        evidence,
      };

      const criticalFailReview = {
        review_id: "rev_crit",
        submission_id: "sub_1",
        task_id: "task_auth",
        attempt_number: 1,
        verdict: "passed" as const, // Model attempts to pass
        score: 95,                  // Model gives high score
        summary: "Auth endpoint works.",
        criteria_results: [
          {
            criterion: "Enforce cryptographic password hashing with Argon2id",
            status: "not_met" as const, // Critical failure
            evidence: ["src/auth.ts"],
            reason: "Used weak SHA-256 instead of Argon2id.",
            critical: true,
          },
          {
            criterion: "Build user registration REST endpoint",
            status: "met" as const,
            evidence: ["src/auth.ts"],
            reason: "Endpoint is functional.",
            critical: false,
          },
        ],
        technical_quality: {
          architecture_score: 90,
          code_quality_score: 85,
          testing_score: 80,
          documentation_score: 85,
          notes: "Good structure.",
        },
        deliverables_evaluated: [
          { deliverable: "src/auth.ts", status: "present" as const, evidence_path: "src/auth.ts" },
        ],
        strengths: ["Modular routes."],
        improvements: ["Upgrade password hashing to Argon2id."],
        next_step: "Fix password hashing algorithm to Argon2id and resubmit for evaluation.",
        review_engine_version: "1.0",
        created_at: new Date().toISOString(),
      };

      const val = validateReview(criticalFailReview, context);
      expect(val.valid).toBe(true);
      expect(val.adjusted_verdict).toBe("needs_revision");
      expect(val.adjusted_score).toBeLessThanOrEqual(55);
    });
  });

  describe("7. Progressive Revision Lifecycle (Attempt 1 -> Attempt 2 -> Attempt 3 -> Pass)", () => {
    it("simulates full multi-attempt revision loop and verifies attempt preservation and state updates", async () => {
      const curriculum = generateCurriculumPlan(FULLSTACK_INTERNSHIP_DEFINITION);
      const milestone = getMilestoneByIndex(curriculum, 0)!;
      let studentContext = buildStudentContext({
        student: { id: "student_marcus", name: "Marcus Chen", declared_skills: ["React", "TypeScript"] },
        internship: FULLSTACK_INTERNSHIP_DEFINITION,
        performanceRecords: [],
      });

      const task: InternshipTask = {
        title: "Build Responsive Student Progress Card Component",
        business_context: "Residency portal requires progress widgets.",
        objective: "Create reusable React component with input validation and tests.",
        instructions: [
          "Create src/components/ProgressCard.tsx",
          "Add input prop validation",
          "Write unit tests in tests/ProgressCard.test.tsx",
        ],
        deliverables: [
          "src/components/ProgressCard.tsx component",
          "tests/ProgressCard.test.tsx test suite",
        ],
        acceptance_criteria: [
          "Component renders progress percentage and status badge accurately",
          "Input props are validated preventing NaN or negative numbers",
          "Unit test suite covers both valid progress and boundary error states",
        ],
        skills_practiced: ["React", "TypeScript", "Jest"],
        estimated_hours: 5,
        difficulty: "beginner",
        reason_for_assignment: "Starting frontend milestone.",
        milestone_index: 0,
      };

      const repoUrl = "https://github.com/marcus/progress-card";

      // ATTEMPT 1: Missing validation
      registerMockRepository(repoUrl, {
        file_tree: [
          { path: "src/components/ProgressCard.tsx", type: "file" },
          { path: "README.md", type: "file" },
        ],
        source_files: [
          { path: "src/components/ProgressCard.tsx", content: "export function ProgressCard(props) { return <div>{props.pct}%</div>; }", line_count: 1 },
        ],
        test_files: [],
        config_files: [{ path: "package.json", content: "{}" }],
        collection_status: "success",
      });

      const sub1 = createSubmissionRecord({
        taskId: "task_prog_card",
        studentId: "student_marcus",
        enrollmentId: "enroll_fs_1",
        githubUrl: repoUrl,
        studentExplanation: "Initial implementation of ProgressCard component. SIMULATE_PROGRESSIVE_REVISION",
      }, 1);

      const result1 = await evaluateSubmission({
        submission: sub1,
        task,
        internship: FULLSTACK_INTERNSHIP_DEFINITION,
        currentMilestone: milestone,
        studentContext,
        previousSubmissions: [],
        previousReviews: [],
      });

      expect(result1.review.verdict).toBe("needs_revision");
      expect(result1.notificationEvent).toBe("REVISION_REQUIRED");
      expect(result1.review.score).toBeLessThan(75);
      expect(result1.review.improvements.length).toBeGreaterThan(0);

      // ATTEMPT 2: Validation added, but tests missing
      registerMockRepository(repoUrl, {
        file_tree: [
          { path: "src/components/ProgressCard.tsx", type: "file" },
          { path: "tests/ProgressCard.test.tsx", type: "file" },
          { path: "README.md", type: "file" },
        ],
        source_files: [
          { path: "src/components/ProgressCard.tsx", content: "export function ProgressCard({ pct }: { pct: number }) { if (pct < 0) return <div>Invalid</div>; return <div>{pct}%</div>; }", line_count: 1 },
        ],
        test_files: [
          { path: "tests/ProgressCard.test.tsx", content: "// Basic render test only" },
        ],
        config_files: [{ path: "package.json", content: "{}" }],
        collection_status: "success",
      });

      const sub2 = createSubmissionRecord({
        taskId: "task_prog_card",
        studentId: "student_marcus",
        enrollmentId: "enroll_fs_1",
        githubUrl: repoUrl,
        studentExplanation: "Added input prop validation checking for negative numbers. SIMULATE_PROGRESSIVE_REVISION",
      }, 2);

      const result2 = await evaluateSubmission({
        submission: sub2,
        task,
        internship: FULLSTACK_INTERNSHIP_DEFINITION,
        currentMilestone: milestone,
        studentContext: result1.updatedStudentContext || studentContext,
        previousSubmissions: [result1.submission],
        previousReviews: [result1.review],
      });

      expect(result2.review.verdict).toBe("needs_revision");
      expect(result2.review.summary).toContain("validation issue identified in your previous attempt has been");
      expect(result2.review.score).toBeGreaterThan(result1.review.score); // Proves score improvement!

      // ATTEMPT 3: Validation and comprehensive unit tests added
      registerMockRepository(repoUrl, {
        file_tree: [
          { path: "src/components/ProgressCard.tsx", type: "file" },
          { path: "tests/ProgressCard.test.tsx", type: "file" },
          { path: "README.md", type: "file" },
        ],
        source_files: [
          { path: "src/components/ProgressCard.tsx", content: "export function ProgressCard({ pct }: { pct: number }) { if (pct < 0 || isNaN(pct)) return <div role='alert'>Invalid progress</div>; return <div>{pct}%</div>; }", line_count: 1 },
        ],
        test_files: [
          { path: "tests/ProgressCard.test.tsx", content: "describe('ProgressCard', () => { it('renders pct', () => ...); it('renders alert for invalid values', () => ...); });" },
        ],
        config_files: [{ path: "package.json", content: "{}" }],
        collection_status: "success",
      });

      const sub3 = createSubmissionRecord({
        taskId: "task_prog_card",
        studentId: "student_marcus",
        enrollmentId: "enroll_fs_1",
        githubUrl: repoUrl,
        studentExplanation: "Added comprehensive Jest unit tests covering boundary error states. SIMULATE_PROGRESSIVE_REVISION",
      }, 3);

      const result3 = await evaluateSubmission({
        submission: sub3,
        task,
        internship: FULLSTACK_INTERNSHIP_DEFINITION,
        currentMilestone: milestone,
        studentContext: result2.updatedStudentContext || studentContext,
        previousSubmissions: [result1.submission, result2.submission],
        previousReviews: [result1.review, result2.review],
      });

      expect(result3.review.verdict).toBe("passed");
      expect(result3.notificationEvent).toBe("TASK_PASSED");
      expect(result3.review.score).toBeGreaterThanOrEqual(90);
      expect(result3.updatedStudentContext?.progress.completed_task_count).toBe(1);
      expect(result3.updatedStudentContext?.performance.recent_records).toHaveLength(3); // All 3 attempts preserved in context
    });
  });

  describe("8. Cross-Domain Resilience (Cloud & DevOps Track)", () => {
    it("evaluates a Cloud & DevOps containerization submission", async () => {
      const curriculum = generateCurriculumPlan(CLOUD_DEVOPS_INTERNSHIP_DEFINITION);
      const milestone = getMilestoneByIndex(curriculum, 0)!;
      const studentContext = buildStudentContext({
        student: { id: "s_devops", name: "Alex Mercer", declared_skills: ["Docker", "Linux"] },
        internship: CLOUD_DEVOPS_INTERNSHIP_DEFINITION,
        performanceRecords: [],
      });

      const task: InternshipTask = {
        title: "Containerize Microservice with Multi-Stage Dockerfile",
        business_context: "Packaging Python API into non-root Alpine container.",
        objective: "Write multi-stage Dockerfile with healthchecks and docker-compose.",
        instructions: [
          "Create Dockerfile with builder and runner stages",
          "Enforce USER non-root directive",
          "Create docker-compose.yml",
        ],
        deliverables: [
          "Dockerfile multi-stage build",
          "docker-compose.yml orchestration file",
        ],
        acceptance_criteria: [
          "Dockerfile includes multi-stage build reducing image footprint",
          "Container enforces non-root USER execution",
          "docker-compose.yml defines service with healthcheck",
        ],
        skills_practiced: ["Docker", "Linux", "Security"],
        estimated_hours: 5,
        difficulty: "beginner",
        reason_for_assignment: "Starting DevOps milestone.",
        milestone_index: 0,
      };

      const repoUrl = "https://github.com/alex/cloud-docker-service";
      registerMockRepository(repoUrl, {
        file_tree: [
          { path: "Dockerfile", type: "file" },
          { path: "docker-compose.yml", type: "file" },
          { path: "README.md", type: "file" },
        ],
        source_files: [
          { path: "Dockerfile", content: "FROM python:3.11-slim as builder\nWORKDIR /app\nFROM python:3.11-alpine\nUSER appuser\nCMD ['python', 'app.py']", line_count: 5 },
        ],
        test_files: [],
        config_files: [
          { path: "docker-compose.yml", content: "version: '3.8'\nservices:\n  app:\n    build: .\n    healthcheck:\n      test: ['CMD', 'curl', '-f', 'http://localhost:8080/health']" },
        ],
        collection_status: "success",
      });

      const submission = createSubmissionRecord({
        taskId: "task_docker",
        studentId: "s_devops",
        enrollmentId: "e_devops",
        githubUrl: repoUrl,
        studentExplanation: "Created multi-stage Dockerfile with non-root user and docker-compose healthchecks.",
      });

      const result = await evaluateSubmission({
        submission,
        task,
        internship: CLOUD_DEVOPS_INTERNSHIP_DEFINITION,
        currentMilestone: milestone,
        studentContext,
      });

      expect(result.review.verdict).toBe("passed");
      expect(result.review.score).toBeGreaterThanOrEqual(85);
      expect(result.notificationEvent).toBe("TASK_PASSED");
    });
  });

  describe("9. Synthetic End-to-End Task-to-Pass Journey (AI/ML Track)", () => {
    it("completes full closed-loop: Phase 1 task generation -> submission -> evidence -> review revision -> resubmit -> pass -> context update", async () => {
      const curriculum = generateCurriculumPlan(AIML_INTERNSHIP_DEFINITION);
      const milestone = getMilestoneByIndex(curriculum, 0)!;

      // 1. Initial Student Context
      let studentContext = buildStudentContext({
        student: { id: "student_elena", name: "Elena Rostova", declared_skills: ["Python", "Pandas", "Scikit-learn"] },
        internship: AIML_INTERNSHIP_DEFINITION,
        performanceRecords: [],
      });

      // 2. Task Generated in Phase 1
      const task: InternshipTask = {
        title: "Build Data Cleaning & Feature Preprocessing Pipeline",
        business_context: "Raw student telemetry contains missing values and categorical strings.",
        objective: "Develop a modular data cleaning pipeline with missing value imputation and Pytest unit tests.",
        instructions: [
          "Create pipeline/cleaner.py with missing value imputation",
          "Handle missing numeric features with median and categorical with mode",
          "Write Pytest unit test suite in tests/test_cleaner.py",
        ],
        deliverables: [
          "pipeline/cleaner.py clean transformation module",
          "tests/test_cleaner.py unit test suite",
        ],
        acceptance_criteria: [
          "Data cleaner replaces missing values and encodes categorical features",
          "Pytest test suite achieves high branch coverage over boundary conditions",
        ],
        skills_practiced: ["Python", "Pandas", "Data Cleaning"],
        estimated_hours: 5,
        difficulty: "beginner",
        reason_for_assignment: "Starting Milestone 0 of AI/ML Engineering track.",
        milestone_index: 0,
      };

      const repoUrl = "https://github.com/elena/edtech-ml-pipeline";

      // 3. Attempt 1: Incomplete submission (missing categorical handling & tests)
      registerMockRepository(repoUrl, {
        file_tree: [
          { path: "pipeline/cleaner.py", type: "file" },
          { path: "README.md", type: "file" },
        ],
        source_files: [
          { path: "pipeline/cleaner.py", content: "def clean(df): return df.dropna()", line_count: 1 },
        ],
        test_files: [],
        config_files: [{ path: "requirements.txt", content: "pandas" }],
        collection_status: "success",
      });

      const sub1 = createSubmissionRecord({
        taskId: "task_cleaner_0",
        studentId: "student_elena",
        enrollmentId: "enroll_ml_1",
        githubUrl: repoUrl,
        studentExplanation: "Implemented preliminary dropna cleaning in cleaner.py. SIMULATE_PARTIAL_SUBMISSION",
      }, 1);

      // 4. Review 1 Evaluation
      const eval1 = await evaluateSubmission({
        submission: sub1,
        task,
        internship: AIML_INTERNSHIP_DEFINITION,
        currentMilestone: milestone,
        studentContext,
      });

      expect(eval1.submission.status).toBe("needs_revision");
      expect(eval1.review.verdict).toBe("needs_revision");
      expect(eval1.notificationEvent).toBe("REVISION_REQUIRED");
      expect(eval1.review.score).toBeLessThan(75);
      expect(eval1.review.next_step).toBeTruthy();

      // 5. Attempt 2: Student improves code (imputation + categorical encoding + Pytest tests)
      registerMockRepository(repoUrl, {
        file_tree: [
          { path: "pipeline/cleaner.py", type: "file" },
          { path: "tests/test_cleaner.py", type: "file" },
          { path: "README.md", type: "file" },
        ],
        source_files: [
          {
            path: "pipeline/cleaner.py",
            content: "import pandas as pd\ndef clean(df):\n    df = df.copy()\n    df['score'] = df['score'].fillna(df['score'].median())\n    df['tier'] = df['tier'].fillna(df['tier'].mode()[0])\n    return df",
            line_count: 6,
          },
        ],
        test_files: [
          {
            path: "tests/test_cleaner.py",
            content: "def test_clean_imputes_nulls():\n    df = pd.DataFrame({'score': [10, None], 'tier': ['A', None]})\n    cleaned = clean(df)\n    assert cleaned.isna().sum().sum() == 0",
            framework: "pytest",
          },
        ],
        config_files: [{ path: "requirements.txt", content: "pandas\npytest" }],
        collection_status: "success",
      });

      const sub2 = createSubmissionRecord({
        taskId: "task_cleaner_0",
        studentId: "student_elena",
        enrollmentId: "enroll_ml_1",
        githubUrl: repoUrl,
        studentExplanation: "Fixed missing value imputation for numeric/categorical columns and added Pytest assertions.",
      }, 2);

      // 6. Review 2 Evaluation
      const eval2 = await evaluateSubmission({
        submission: sub2,
        task,
        internship: AIML_INTERNSHIP_DEFINITION,
        currentMilestone: milestone,
        studentContext: eval1.updatedStudentContext || studentContext,
        previousSubmissions: [eval1.submission],
        previousReviews: [eval1.review],
      });

      // 7. Verification of Final Pass and Updated Context
      expect(eval2.submission.status).toBe("passed");
      expect(eval2.review.verdict).toBe("passed");
      expect(eval2.notificationEvent).toBe("TASK_PASSED");
      expect(eval2.review.score).toBeGreaterThanOrEqual(90);

      const finalContext = eval2.updatedStudentContext!;
      expect(finalContext.progress.completed_task_count).toBe(1);
      expect(finalContext.performance.recent_records).toHaveLength(2); // Attempt 1 and Attempt 2 recorded
      expect(finalContext.performance.recent_records[1].verdict).toBe("passed");
      expect(finalContext.learning_state.skill_ratings.find((r) => r.skill.toLowerCase() === "python")?.attempts_count).toBeGreaterThanOrEqual(1);
    });
  });
});

