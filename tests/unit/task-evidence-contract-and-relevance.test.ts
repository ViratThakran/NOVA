import { describe, it, expect, beforeEach } from "vitest";
import {
  deriveTaskEvidenceContract,
  evaluateEvidenceContract,
} from "../../src/lib/ai-engine/internship-mentor/evidence/contract";
import { runTaskRelevanceGate } from "../../src/lib/ai-engine/internship-mentor/evidence/gate";
import { validateReview } from "../../src/lib/ai-engine/internship-mentor/review/validator";
import { generateFallbackReview } from "../../src/lib/ai-engine/internship-mentor/review/agent";
import {
  registerMockRepository,
  clearMockRepositories,
  GitHubEvidenceCollector,
} from "../../src/lib/ai-engine/internship-mentor/evidence/collector";
import type {
  InternshipTask,
  InternshipSubmission,
  RepositoryEvidence,
  RuntimeEvidence,
  InternshipReview,
} from "../../src/lib/ai-engine/schemas";
import type { ReviewContext } from "../../src/lib/ai-engine/internship-mentor/types";

describe("Deterministic Task-Specific Evidence Contract & False-Positive Elimination (Step 12 Tests)", () => {
  beforeEach(() => {
    clearMockRepositories();
  });

  const dataCleaningTask: InternshipTask = {
    title: "Build Data Cleaning and Feature Pipeline for Student Analytics",
    objective: "Develop a modular data cleaning and feature engineering pipeline using Pandas with full Pytest suites.",
    business_context: "Downstream student analytics models fail when training due to unhandled missing values, raw categoricals, and unscaled features.",
    instructions: [
      "1. Load raw student assessment data using Pandas.",
      "2. Implement missing value imputation (median for numerical, mode for categorical) in `src/pipeline/cleaner.py`.",
      "3. Encode categorical features in `src/pipeline/encoder.py` and scale numerical features in `src/pipeline/scaler.py`.",
      "4. Export processed features to `data/processed/cleaned_features.csv`.",
      "5. Write Pytest test suites in `tests/test_cleaner.py` and `tests/test_pipeline.py`.",
      "6. Provide comprehensive documentation in `README.md`.",
    ],
    deliverables: [
      "src/pipeline/cleaner.py data cleaning module",
      "src/pipeline/encoder.py categorical encoder",
      "src/pipeline/scaler.py numerical scaler",
      "tests/test_cleaner.py test suite",
      "tests/test_pipeline.py end-to-end pipeline tests",
      "data/processed/cleaned_features.csv exported dataset",
      "README.md pipeline architecture documentation",
    ],
    acceptance_criteria: [
      "Loads student assessment CSV and handles missing values without dropping >5% records",
      "Categorical features are encoded and numerical features are scaled",
      "Pytest test suite achieves full coverage over cleaner and scaler modules",
      "Cleaned dataset is exported to data/processed/cleaned_features.csv",
      "Documentation specifies imputation strategies and setup instructions",
    ],
    skills_practiced: ["Python", "Pandas", "Data Cleaning", "Pytest"],
    estimated_hours: 6,
    difficulty: "intermediate",
    reason_for_assignment: "Core milestone task developing production data preparation competencies.",
  };

  const baseSubmission: InternshipSubmission = {
    id: "sub_test_001",
    task_id: "task_data_cleaning_001",
    student_id: "student_123",
    enrollment_id: "enrollment_123",
    submission_type: "github",
    github_url: "https://github.com/student/data-cleaning-pipeline",
    branch: "main",
    commit_sha: "a1b2c3d4e5f67890",
    student_explanation: "Implemented complete data cleaning and feature engineering pipeline with full Pytest coverage.",
    submitted_at: new Date().toISOString(),
    attempt_number: 1,
    status: "submitted",
  };

  // TEST 1: Assigned Data Cleaning task → unrelated React application (e.g. ApplyPilot) → MUST NOT PASS
  it("TEST 1: rejects unrelated React/ApplyPilot repository submitted against Data Cleaning task", async () => {
    const unrelatedRepoEvidence: Partial<RepositoryEvidence> = {
      repository: {
        owner: "student",
        name: "applypilot-ai-extension",
        default_branch: "main",
        commit_sha: "a1b2c3d4e5f67890",
        is_private: false,
        topics: ["react", "chrome-extension", "ai", "job-applications"],
        languages: ["typescript", "javascript", "css"],
      },
      readme: "# ApplyPilot AI\nAn AI-powered Chrome extension to automate job applications and resume parsing.",
      file_tree: [
        { path: "README.md", type: "file" },
        { path: "package.json", type: "file" },
        { path: "src/popup.tsx", type: "file" },
        { path: "src/content.ts", type: "file" },
        { path: "tests/popup.test.tsx", type: "file" },
      ],
      source_files: [
        {
          path: "src/popup.tsx",
          language: "typescript",
          content: "export function Popup() { return <div>ApplyPilot Auto-Applier</div>; }",
          line_count: 25,
        },
      ],
      test_files: [
        {
          path: "tests/popup.test.tsx",
          framework: "vitest",
          content: "test('renders popup', () => { expect(true).toBe(true); });",
        },
      ],
      config_files: [
        {
          path: "package.json",
          content: JSON.stringify({ name: "applypilot-ai", dependencies: { react: "^18.0.0" } }),
        },
      ],
      commit_metadata: {
        commit_sha: "a1b2c3d4e5f67890",
        changed_files: [
          { path: "src/popup.tsx", status: "modified", additions: 25, deletions: 2 },
        ],
        parent_shas: ["p0"],
        provenance_verified: true,
      },
      collection_status: "success",
    };

    registerMockRepository("https://github.com/student/applypilot-ai-extension", unrelatedRepoEvidence);

    const collector = new GitHubEvidenceCollector();
    const evidence = await collector.collect({
      ...baseSubmission,
      github_url: "https://github.com/student/applypilot-ai-extension",
    });

    const gateResult = runTaskRelevanceGate(dataCleaningTask, evidence, baseSubmission);

    expect(gateResult.status).toBe("rejected");
    expect(gateResult.rejectionReview?.verdict).toBe("needs_revision");
    expect(gateResult.rejectionReview?.score).toBeLessThanOrEqual(45);
    expect(gateResult.rejectionReview?.summary).toContain("Task Relevance Gate");
    expect(gateResult.rejectionReview?.summary).toContain("domain mismatch");
  });

  // TEST 2: Assigned Python ML task → unrelated Next.js website → MUST NOT PASS
  it("TEST 2: rejects unrelated Next.js website submitted against Python Data/ML task", async () => {
    const nextjsEvidence: Partial<RepositoryEvidence> = {
      repository: {
        owner: "student",
        name: "nextjs-portfolio-blog",
        default_branch: "main",
        commit_sha: "b2c3d4e5f6a17890",
        is_private: false,
        languages: ["typescript"],
      },
      readme: "# Modern Developer Portfolio\nBuilt with Next.js App Router and Tailwind CSS.",
      file_tree: [
        { path: "README.md", type: "file" },
        { path: "next.config.js", type: "file" },
        { path: "package.json", type: "file" },
        { path: "src/app/page.tsx", type: "file" },
        { path: "src/app/layout.tsx", type: "file" },
      ],
      source_files: [
        {
          path: "src/app/page.tsx",
          language: "typescript",
          content: "export default function Home() { return <main>Welcome to my portfolio</main>; }",
          line_count: 30,
        },
      ],
      test_files: [],
      config_files: [
        {
          path: "next.config.js",
          content: "module.exports = { reactStrictMode: true };",
        },
      ],
      commit_metadata: {
        commit_sha: "b2c3d4e5f6a17890",
        changed_files: [{ path: "src/app/page.tsx", status: "modified", additions: 30, deletions: 0 }],
        parent_shas: ["p0"],
        provenance_verified: true,
      },
      collection_status: "success",
    };

    registerMockRepository("https://github.com/student/nextjs-portfolio-blog", nextjsEvidence);

    const collector = new GitHubEvidenceCollector();
    const evidence = await collector.collect({
      ...baseSubmission,
      github_url: "https://github.com/student/nextjs-portfolio-blog",
      commit_sha: "b2c3d4e5f6a17890",
    });

    const gateResult = runTaskRelevanceGate(dataCleaningTask, evidence, baseSubmission);

    expect(gateResult.status).toBe("rejected");
    expect(gateResult.evaluation.is_domain_relevant).toBe(false);
    expect(gateResult.evaluation.can_pass).toBe(false);
    expect(gateResult.rejectionReview?.verdict).toBe("needs_revision");
  });

  // TEST 3: Correct repository structure but NO relevant changes in submitted commit → MUST NOT PASS
  it("TEST 3: rejects submission when submitted commit contains 0 relevant changes", async () => {
    const validFilesNoChanges: Partial<RepositoryEvidence> = {
      repository: {
        owner: "student",
        name: "data-cleaning-pipeline",
        default_branch: "main",
        commit_sha: "c3d4e5f6a1b27890",
        is_private: false,
      },
      readme: "# Student Analytics Data Cleaning Pipeline",
      file_tree: [
        { path: "README.md", type: "file" },
        { path: "src/pipeline/cleaner.py", type: "file" },
        { path: "tests/test_cleaner.py", type: "file" },
        { path: ".gitignore", type: "file" },
      ],
      source_files: [
        {
          path: "src/pipeline/cleaner.py",
          language: "python",
          content: "import pandas as pd\ndef clean_data(df):\n    return df.fillna(df.median())",
          line_count: 10,
        },
      ],
      test_files: [
        {
          path: "tests/test_cleaner.py",
          framework: "pytest",
          content: "def test_cleaner():\n    assert True",
        },
      ],
      config_files: [],
      commit_metadata: {
        commit_sha: "c3d4e5f6a1b27890",
        // Only touched .gitignore - no pipeline changes!
        changed_files: [
          { path: ".gitignore", status: "modified", additions: 1, deletions: 0 },
        ],
        parent_shas: ["p0"],
        provenance_verified: true,
      },
      collection_status: "success",
    };

    registerMockRepository("https://github.com/student/data-cleaning-pipeline", validFilesNoChanges);

    const collector = new GitHubEvidenceCollector();
    const evidence = await collector.collect({
      ...baseSubmission,
      commit_sha: "c3d4e5f6a1b27890",
    });

    const gateResult = runTaskRelevanceGate(dataCleaningTask, evidence, baseSubmission);

    expect(gateResult.status).toBe("rejected");
    expect(gateResult.evaluation.commit_provenance.has_relevant_changes).toBe(false);
    expect(gateResult.evaluation.can_pass).toBe(false);
  });

  // TEST 4: Correct repository with ONLY README changed → MUST NOT PASS if implementation is required
  it("TEST 4: rejects commit that only modifies README without any implementation changes", async () => {
    const contract = deriveTaskEvidenceContract(dataCleaningTask);
    const evidence: RepositoryEvidence = {
      repository: {
        owner: "student",
        name: "data-pipeline",
        default_branch: "main",
        commit_sha: "d4e5f6a1b2c37890",
        is_private: false,
        topics: [],
        languages: ["python"],
      },
      readme: "# Updated README with high promises but no code modified in this commit",
      file_tree: [
        { path: "README.md", type: "file" },
      ],
      source_files: [],
      test_files: [],
      config_files: [],
      data_files: [],
      doc_files: [],
      commit_metadata: {
        commit_sha: "d4e5f6a1b2c37890",
        changed_files: [{ path: "README.md", status: "modified", additions: 20, deletions: 5 }],
        parent_shas: ["p0"],
        provenance_verified: true,
      },
      collected_at: new Date().toISOString(),
      collection_status: "success",
    };

    const evaluation = evaluateEvidenceContract(contract, evidence, undefined, dataCleaningTask);

    expect(evaluation.can_pass).toBe(false);
    expect(evaluation.missing_artifacts.some((a) => a.critical)).toBe(true);
    expect(evaluation.missing_concepts.some((c) => c.critical)).toBe(true);
  });

  // TEST 5: Correct repository with required implementation missing (e.g. cleaner.py missing) → MUST NOT PASS
  it("TEST 5: rejects repository missing required core source files", async () => {
    const contract = deriveTaskEvidenceContract(dataCleaningTask);
    const partialEvidence: RepositoryEvidence = {
      repository: {
        owner: "student",
        name: "data-pipeline",
        default_branch: "main",
        commit_sha: "e5f6a1b2c3d47890",
        is_private: false,
        topics: [],
        languages: ["python"],
      },
      readme: "# Partial pipeline",
      file_tree: [
        { path: "README.md", type: "file" },
        { path: "tests/test_cleaner.py", type: "file" },
      ],
      source_files: [], // cleaner.py missing!
      test_files: [
        {
          path: "tests/test_cleaner.py",
          framework: "pytest",
          content: "def test_dummy(): assert True",
        },
      ],
      config_files: [],
      data_files: [],
      doc_files: [],
      commit_metadata: {
        commit_sha: "e5f6a1b2c3d47890",
        changed_files: [{ path: "tests/test_cleaner.py", status: "added", additions: 10, deletions: 0 }],
        parent_shas: ["p0"],
        provenance_verified: true,
      },
      collected_at: new Date().toISOString(),
      collection_status: "success",
    };

    const evaluation = evaluateEvidenceContract(contract, partialEvidence, undefined, dataCleaningTask);

    expect(evaluation.can_pass).toBe(false);
    expect(evaluation.missing_artifacts.some((a) => a.critical && a.name.includes("cleaner"))).toBe(true);
  });

  // TEST 6: Correct implementation but runtime tests fail → MUST NOT PASS
  it("TEST 6: rejects submission when runtime tests fail with non-zero exit code", () => {
    const contract = deriveTaskEvidenceContract(dataCleaningTask);
    const validStaticEvidence: RepositoryEvidence = {
      repository: {
        owner: "student",
        name: "data-cleaning-pipeline",
        default_branch: "main",
        commit_sha: "f6a1b2c3d4e57890",
        is_private: false,
        topics: [],
        languages: ["python"],
      },
      readme: "# Student Analytics Data Cleaning Pipeline",
      file_tree: [
        { path: "README.md", type: "file" },
        { path: "src/pipeline/cleaner.py", type: "file" },
        { path: "src/pipeline/encoder.py", type: "file" },
        { path: "src/pipeline/scaler.py", type: "file" },
        { path: "tests/test_cleaner.py", type: "file" },
        { path: "tests/test_pipeline.py", type: "file" },
        { path: "data/processed/cleaned_features.csv", type: "file" },
      ],
      source_files: [
        {
          path: "src/pipeline/cleaner.py",
          language: "python",
          content: "import pandas as pd\nfrom sklearn.impute import SimpleImputer\ndef clean_data(df):\n    df = pd.read_csv('data/raw/student_assessments.csv')\n    return df.fillna(df.median())",
          line_count: 20,
        },
        {
          path: "src/pipeline/scaler.py",
          language: "python",
          content: "from sklearn.preprocessing import StandardScaler\ndef scale_features(df):\n    scaler = StandardScaler()\n    return scaler.fit_transform(df)",
          line_count: 15,
        },
      ],
      test_files: [
        {
          path: "tests/test_cleaner.py",
          framework: "pytest",
          content: "import pytest\ndef test_cleaner_handles_missing_values():\n    assert False, 'AssertionError: Missing values remained'",
        },
      ],
      config_files: [],
      data_files: [{ path: "data/processed/cleaned_features.csv" }],
      doc_files: [],
      commit_metadata: {
        commit_sha: "f6a1b2c3d4e57890",
        changed_files: [
          { path: "src/pipeline/cleaner.py", status: "modified", additions: 20, deletions: 0 },
          { path: "tests/test_cleaner.py", status: "modified", additions: 10, deletions: 0 },
        ],
        parent_shas: ["p0"],
        provenance_verified: true,
      },
      collected_at: new Date().toISOString(),
      collection_status: "success",
    };

    const failingRuntimeEvidence: RuntimeEvidence = {
      execution_id: "job_fail_123",
      submission_id: "sub_test_001",
      commit_sha: "f6a1b2c3d4e57890",
      runner_version: "1.0",
      profile_version: "1.0",
      status: "completed",
      exit_code: 1, // Exit code 1 = test failure
      duration_ms: 1200,
      tests_summary: { total: 4, passed: 2, failed: 2, skipped: 0 },
      build_summary: { attempted: true, status: "passed" },
      lint_summary: { attempted: true, status: "passed", warnings: 0, errors: 0 },
      bounded_stdout: "FAILED tests/test_cleaner.py::test_cleaner_handles_missing_values",
      bounded_stderr: "AssertionError: Missing values remained",
      resource_usage: {},
      collected_at: new Date().toISOString(),
    };

    const evaluation = evaluateEvidenceContract(contract, validStaticEvidence, failingRuntimeEvidence, dataCleaningTask);

    expect(evaluation.can_pass).toBe(false);
    expect(evaluation.test_verification.runtime_tests_verified).toBe(false);
    expect(evaluation.block_reasons.some((r) => r.includes("test"))).toBe(true);

    // Cross-validate with ReviewValidator
    const reviewContext: ReviewContext = {
      task: dataCleaningTask,
      internship: {} as any,
      currentMilestone: {} as any,
      studentContext: {} as any,
      currentSubmission: baseSubmission,
      evidence: validStaticEvidence,
      runtimeEvidence: failingRuntimeEvidence,
    };

    const fallbackReview = generateFallbackReview(reviewContext);
    const validation = validateReview(fallbackReview, reviewContext);

    expect(validation.adjusted_verdict).toBe("needs_revision");
    expect(validation.adjusted_score).toBeLessThanOrEqual(55);
  });

  // TEST 7: Correct implementation with required criteria satisfied → CAN PASS (score >= 75)
  it("TEST 7: passes valid submission containing all deliverables, concepts, and passing tests", () => {
    const contract = deriveTaskEvidenceContract(dataCleaningTask);
    const fullValidEvidence: RepositoryEvidence = {
      repository: {
        owner: "student",
        name: "data-cleaning-pipeline",
        default_branch: "main",
        commit_sha: "7777777777777777",
        is_private: false,
        topics: ["python", "pandas", "data-cleaning"],
        languages: ["python"],
      },
      readme: "# Student Analytics Data Cleaning & Feature Pipeline\nModular data pipeline implementing missing value imputation and scaling.",
      file_tree: [
        { path: "README.md", type: "file" },
        { path: "src/pipeline/cleaner.py", type: "file" },
        { path: "src/pipeline/encoder.py", type: "file" },
        { path: "src/pipeline/scaler.py", type: "file" },
        { path: "tests/test_cleaner.py", type: "file" },
        { path: "tests/test_pipeline.py", type: "file" },
        { path: "data/processed/cleaned_features.csv", type: "file" },
      ],
      source_files: [
        {
          path: "src/pipeline/cleaner.py",
          language: "python",
          content: "import pandas as pd\nfrom sklearn.impute import SimpleImputer\ndef clean_data(df):\n    df = pd.read_csv('data/raw/student_assessments.csv')\n    return df.fillna(df.median())",
          line_count: 35,
        },
        {
          path: "src/pipeline/encoder.py",
          language: "python",
          content: "import pandas as pd\ndef encode_features(df):\n    return pd.get_dummies(df, columns=['gender', 'department'])",
          line_count: 25,
        },
        {
          path: "src/pipeline/scaler.py",
          language: "python",
          content: "from sklearn.preprocessing import StandardScaler\ndef scale_features(df):\n    scaler = StandardScaler()\n    return scaler.fit_transform(df)",
          line_count: 20,
        },
      ],
      test_files: [
        {
          path: "tests/test_cleaner.py",
          framework: "pytest",
          content: "import pytest\ndef test_cleaner_imputes_missing_values():\n    assert True\ndef test_pipeline_transforms_features():\n    assert True",
        },
        {
          path: "tests/test_pipeline.py",
          framework: "pytest",
          content: "def test_end_to_end_pipeline():\n    assert True",
        },
      ],
      config_files: [],
      data_files: [{ path: "data/processed/cleaned_features.csv", preview: "id,score,passed\n1,85,1" }],
      doc_files: [],
      commit_metadata: {
        commit_sha: "7777777777777777",
        changed_files: [
          { path: "src/pipeline/cleaner.py", status: "added", additions: 35, deletions: 0 },
          { path: "src/pipeline/encoder.py", status: "added", additions: 25, deletions: 0 },
          { path: "src/pipeline/scaler.py", status: "added", additions: 20, deletions: 0 },
          { path: "tests/test_cleaner.py", status: "added", additions: 15, deletions: 0 },
        ],
        parent_shas: ["p0"],
        provenance_verified: true,
      },
      collected_at: new Date().toISOString(),
      collection_status: "success",
    };

    const passingRuntimeEvidence: RuntimeEvidence = {
      execution_id: "job_pass_777",
      submission_id: "sub_test_001",
      commit_sha: "7777777777777777",
      runner_version: "1.0",
      profile_version: "1.0",
      status: "completed",
      exit_code: 0,
      duration_ms: 1400,
      tests_summary: { total: 6, passed: 6, failed: 0, skipped: 0 },
      build_summary: { attempted: true, status: "passed" },
      lint_summary: { attempted: true, status: "passed", warnings: 0, errors: 0 },
      bounded_stdout: "PASS tests/test_cleaner.py::test_cleaner_imputes_missing_values\nPASS tests/test_pipeline.py::test_end_to_end_pipeline\n6 passed in 1.4s",
      bounded_stderr: "",
      resource_usage: {},
      collected_at: new Date().toISOString(),
    };

    const evaluation = evaluateEvidenceContract(contract, fullValidEvidence, passingRuntimeEvidence, dataCleaningTask);

    expect(evaluation.can_pass).toBe(true);
    expect(evaluation.relevance_score).toBeGreaterThanOrEqual(75);
    expect(evaluation.missing_artifacts.length).toBe(0);

    const reviewContext: ReviewContext = {
      task: dataCleaningTask,
      internship: {} as any,
      currentMilestone: {} as any,
      studentContext: {} as any,
      currentSubmission: baseSubmission,
      evidence: fullValidEvidence,
      runtimeEvidence: passingRuntimeEvidence,
    };

    const fallbackReview = generateFallbackReview(reviewContext);
    const validation = validateReview(fallbackReview, reviewContext);

    expect(validation.adjusted_verdict).toBe("passed");
    expect(validation.adjusted_score).toBeGreaterThanOrEqual(75);
  });

  // TEST 8: Correct implementation but documentation missing when documentation is mandatory → MUST NOT PASS
  it("TEST 8: blocks pass when required documentation is missing or empty", () => {
    const contract = deriveTaskEvidenceContract(dataCleaningTask);
    const noDocsEvidence: RepositoryEvidence = {
      repository: {
        owner: "student",
        name: "data-cleaning-pipeline",
        default_branch: "main",
        commit_sha: "8888888888888888",
        is_private: false,
        topics: [],
        languages: ["python"],
      },
      readme: null, // No README!
      file_tree: [
        { path: "src/pipeline/cleaner.py", type: "file" },
        { path: "tests/test_cleaner.py", type: "file" },
      ],
      source_files: [
        {
          path: "src/pipeline/cleaner.py",
          language: "python",
          content: "import pandas as pd\ndef clean_data(df): return df.fillna(0)",
          line_count: 10,
        },
      ],
      test_files: [
        {
          path: "tests/test_cleaner.py",
          framework: "pytest",
          content: "def test_clean(): assert True",
        },
      ],
      config_files: [],
      data_files: [],
      doc_files: [],
      commit_metadata: {
        commit_sha: "8888888888888888",
        changed_files: [{ path: "src/pipeline/cleaner.py", status: "added", additions: 10, deletions: 0 }],
        parent_shas: ["p0"],
        provenance_verified: true,
      },
      collected_at: new Date().toISOString(),
      collection_status: "success",
    };

    const evaluation = evaluateEvidenceContract(contract, noDocsEvidence, undefined, dataCleaningTask);

    expect(evaluation.doc_verification.missing_docs.length).toBeGreaterThan(0);
    expect(evaluation.can_pass).toBe(false);
  });

  // TEST 9: Repository contains required files but submitted commit does NOT introduce or modify relevant code
  it("TEST 9: rejects pre-existing code when student commit does not introduce task changes", () => {
    const contract = deriveTaskEvidenceContract(dataCleaningTask);
    const preExistingEvidence: RepositoryEvidence = {
      repository: {
        owner: "student",
        name: "data-pipeline",
        default_branch: "main",
        commit_sha: "9999999999999999",
        is_private: false,
        topics: [],
        languages: ["python"],
      },
      readme: "# Data Pipeline",
      file_tree: [
        { path: "README.md", type: "file" },
        { path: "src/pipeline/cleaner.py", type: "file" },
        { path: "LICENSE", type: "file" },
      ],
      source_files: [
        {
          path: "src/pipeline/cleaner.py",
          language: "python",
          content: "import pandas as pd\ndef clean_data(df): return df.fillna(0)",
          line_count: 10,
        },
      ],
      test_files: [],
      config_files: [],
      data_files: [],
      doc_files: [],
      commit_metadata: {
        commit_sha: "9999999999999999",
        // Student commit only modified LICENSE
        changed_files: [{ path: "LICENSE", status: "modified", additions: 1, deletions: 1 }],
        parent_shas: ["p0"],
        provenance_verified: true,
      },
      collected_at: new Date().toISOString(),
      collection_status: "success",
    };

    const evaluation = evaluateEvidenceContract(contract, preExistingEvidence, undefined, dataCleaningTask);

    expect(evaluation.commit_provenance.has_relevant_changes).toBe(false);
    expect(evaluation.can_pass).toBe(false);
  });

  // TEST 10: AI claims implementation exists (hallucination) but deterministic evidence says it does not → MUST NOT PASS
  it("TEST 10: deterministic validator overrides AI hallucinated pass verdict when evidence is missing", () => {
    const emptyRepoEvidence: RepositoryEvidence = {
      repository: {
        owner: "student",
        name: "empty-repo",
        default_branch: "main",
        commit_sha: "1010101010101010",
        is_private: false,
        topics: [],
        languages: [],
      },
      readme: "# Empty Repository",
      file_tree: [{ path: "README.md", type: "file" }],
      source_files: [],
      test_files: [],
      config_files: [],
      data_files: [],
      doc_files: [],
      commit_metadata: {
        commit_sha: "1010101010101010",
        changed_files: [],
        parent_shas: [],
        provenance_verified: false,
      },
      collected_at: new Date().toISOString(),
      collection_status: "success",
    };

    // Construct a hallucinated AI review praising the non-existent code
    const hallucinatedAiReview: InternshipReview = {
      review_id: "rev_hallucinated_999",
      submission_id: "sub_test_001",
      task_id: "task_data_cleaning_001",
      attempt_number: 1,
      verdict: "passed", // AI claims PASSED!
      score: 98, // AI gives 98/100!
      summary: "Exceptional data cleaning pipeline! All missing values are cleanly handled and scaled perfectly.",
      criteria_results: [
        {
          criterion: "Loads student assessment CSV and handles missing values without dropping >5% records",
          status: "met", // AI claims met!
          evidence: ["src/pipeline/cleaner.py"], // Cites non-existent file!
          reason: "Cleaner module handles median imputation flawlessly.",
          critical: true,
        },
      ],
      technical_quality: {
        architecture_score: 98,
        code_quality_score: 98,
        testing_score: 95,
        documentation_score: 100,
        notes: "Flawless implementation.",
      },
      deliverables_evaluated: [
        {
          deliverable: "src/pipeline/cleaner.py",
          status: "present",
          evidence_path: "src/pipeline/cleaner.py",
        },
      ],
      strengths: ["Great architecture."],
      improvements: [],
      next_step: "Proceed to Task 2.",
      review_engine_version: "1.0",
      created_at: new Date().toISOString(),
    };

    const reviewContext: ReviewContext = {
      task: dataCleaningTask,
      internship: {} as any,
      currentMilestone: {} as any,
      studentContext: {} as any,
      currentSubmission: baseSubmission,
      evidence: emptyRepoEvidence,
      runtimeEvidence: null,
    };

    const validationResult = validateReview(hallucinatedAiReview, reviewContext);

    // Deterministic validation MUST override AI and force NEEDS_REVISION
    expect(validationResult.adjusted_verdict).toBe("needs_revision");
    expect(validationResult.adjusted_score).toBeLessThanOrEqual(55);
    expect(validationResult.errors.length).toBeGreaterThan(0);
    expect(validationResult.errors.some((e) => e.includes("Anti-Hallucination") || e.includes("Deterministic"))).toBe(true);
  });
});
