import type {
  InternshipTask,
  RepositoryEvidence,
  RuntimeEvidence,
  CriterionResult,
  DeliverableEvaluation,
} from "../../schemas";

export type TaskDomain =
  | "data_ml"
  | "web_fullstack"
  | "cloud_devops"
  | "cybersecurity"
  | "uiux_design"
  | "general";

export interface RequiredArtifact {
  id: string;
  name: string;
  path_patterns: RegExp[];
  description: string;
  critical: boolean;
  artifact_type: "source" | "test" | "data" | "doc" | "config";
}

export interface RequiredCodeConcept {
  id: string;
  concept: string;
  description: string;
  keywords: string[];
  patterns: RegExp[];
  critical: boolean;
  min_occurrences: number;
}

export interface RequiredTestRequirement {
  id: string;
  description: string;
  test_name_patterns: RegExp[];
  file_patterns: RegExp[];
  critical: boolean;
  min_test_count: number;
}

export interface RequiredOutputRequirement {
  id: string;
  description: string;
  path_patterns: RegExp[];
  critical: boolean;
}

export interface RequiredDocRequirement {
  id: string;
  description: string;
  path_patterns: RegExp[];
  critical: boolean;
  min_length: number;
}

export interface TaskEvidenceContract {
  task_title: string;
  domain: TaskDomain;
  required_artifacts: RequiredArtifact[];
  required_code_concepts: RequiredCodeConcept[];
  required_tests: RequiredTestRequirement[];
  required_outputs: RequiredOutputRequirement[];
  required_documentation: RequiredDocRequirement[];
  critical_criteria_indices: number[];
  allowed_file_extensions: string[];
  unrelated_framework_signals: Array<{ name: string; pattern: RegExp; reason: string }>;
}

export interface ContractEvaluationResult {
  can_pass: boolean;
  relevance_score: number; // 0-100
  is_domain_relevant: boolean;
  domain_mismatch_reasons: string[];
  satisfied_artifacts: Array<{ id: string; name: string; matched_file: string }>;
  missing_artifacts: Array<{ id: string; name: string; description: string; critical: boolean }>;
  satisfied_concepts: Array<{ id: string; concept: string; matched_files: string[] }>;
  missing_concepts: Array<{ id: string; concept: string; description: string; critical: boolean }>;
  test_verification: {
    has_test_files: boolean;
    tests_match_task: boolean;
    runtime_tests_verified: boolean;
    details: string;
  };
  output_verification: {
    satisfied_outputs: string[];
    missing_outputs: string[];
  };
  doc_verification: {
    satisfied_docs: string[];
    missing_docs: string[];
  };
  commit_provenance: {
    commit_sha: string;
    has_relevant_changes: boolean;
    changed_files_count: number;
    relevant_changed_files: string[];
    authorship_notes: string;
  };
  criterion_evaluations: CriterionResult[];
  deliverables_evaluated: DeliverableEvaluation[];
  block_reasons: string[];
  actionable_feedback: string[];
}

/**
 * Detects the engineering domain of the task from its title, skills, and deliverables.
 */
export function detectTaskDomain(task: InternshipTask): TaskDomain {
  const combined = [
    task.title,
    task.objective,
    ...(task.skills_practiced || []),
    ...(task.deliverables || []),
  ].join(" ").toLowerCase();

  if (
    combined.includes("data cleaning") ||
    combined.includes("pandas") ||
    combined.includes("numpy") ||
    combined.includes("machine learning") ||
    combined.includes("scikit-learn") ||
    combined.includes("feature pipeline") ||
    combined.includes("dataset") ||
    combined.includes("csv") ||
    combined.includes("analytics") ||
    combined.includes("ai/ml")
  ) {
    return "data_ml";
  }

  if (
    combined.includes("docker") ||
    combined.includes("container") ||
    combined.includes("orchestrat") ||
    combined.includes("devops") ||
    combined.includes("kubernetes") ||
    combined.includes("ci/cd") ||
    combined.includes("github actions") ||
    combined.includes("terraform") ||
    combined.includes("cloud")
  ) {
    return "cloud_devops";
  }

  if (
    combined.includes("react") ||
    combined.includes("next.js") ||
    combined.includes("typescript") ||
    combined.includes("fullstack") ||
    combined.includes("frontend") ||
    combined.includes("backend") ||
    combined.includes("api endpoint") ||
    combined.includes("rest api") ||
    combined.includes("database") ||
    combined.includes("prisma") ||
    combined.includes("express")
  ) {
    return "web_fullstack";
  }

  if (
    combined.includes("security") ||
    combined.includes("vulnerability") ||
    combined.includes("penetration") ||
    combined.includes("auth") ||
    combined.includes("owasp")
  ) {
    return "cybersecurity";
  }

  return "general";
}

/**
 * Deterministically derives a machine-checkable evidence contract from an assigned task.
 */
export function deriveTaskEvidenceContract(task: InternshipTask): TaskEvidenceContract {
  const domain = detectTaskDomain(task);
  const required_artifacts: RequiredArtifact[] = [];
  const required_code_concepts: RequiredCodeConcept[] = [];
  const required_tests: RequiredTestRequirement[] = [];
  const required_outputs: RequiredOutputRequirement[] = [];
  const required_documentation: RequiredDocRequirement[] = [];
  const unrelated_framework_signals: Array<{ name: string; pattern: RegExp; reason: string }> = [];

  const allTaskText = [
    task.title,
    task.objective,
    task.business_context || "",
    ...(task.instructions || []),
    ...(task.deliverables || []),
    ...(task.acceptance_criteria || []),
    ...(task.skills_practiced || []),
  ].join(" ").toLowerCase();

  // Extract critical criteria indices (e.g. index 0 or criteria mentioning core logic / tests)
  const critical_criteria_indices: number[] = [];
  task.acceptance_criteria.forEach((crit, idx) => {
    const cLower = crit.toLowerCase();
    if (
      idx === 0 ||
      cLower.includes("must") ||
      cLower.includes("clean") ||
      cLower.includes("missing") ||
      cLower.includes("test") ||
      cLower.includes("pipeline") ||
      cLower.includes("valid") ||
      cLower.includes("core")
    ) {
      critical_criteria_indices.push(idx);
    }
  });
  if (critical_criteria_indices.length === 0 && task.acceptance_criteria.length > 0) {
    critical_criteria_indices.push(0);
  }

  // 1. Deliverables to Required Artifacts
  for (const deliv of task.deliverables) {
    const dLower = deliv.toLowerCase();
    const isCritical = !dLower.includes("optional") && !dLower.includes("stretch");

    // Check for explicit file paths in deliverable string (e.g. `src/pipeline/cleaner.py`, `Dockerfile`, `docker-compose.yml`)
    const fileMatches = deliv.match(/([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+|Dockerfile)/gi) || [];
    if (fileMatches.length > 0) {
      for (const filePath of fileMatches) {
        const baseName = filePath.split("/").pop() || filePath;
        const ext = baseName.includes(".") ? baseName.split(".").pop() || "" : "";
        const isTest = baseName.startsWith("test_") || baseName.endsWith("_test.py") || baseName.includes(".test.") || baseName.includes(".spec.");
        const isDoc = ext === "md" || ext === "txt" || ext === "rst";
        const isData = ext === "csv" || ext === "json" || ext === "parquet" || ext === "xlsx";
        const isConfig = baseName === "Dockerfile" || ext === "yml" || ext === "yaml" || ext === "toml" || ext === "json";
        
        const escaped = baseName.replace(/\./g, "\\.");
        const fullEscaped = filePath.replace(/\./g, "\\.").replace(/\//g, "[\\/\\\\]");
        const pattern = new RegExp(`(^|[\\/\\\\])${escaped}$`, "i");
        const fullPattern = new RegExp(`(^|[\\/\\\\])${fullEscaped}$`, "i");

        required_artifacts.push({
          id: `artifact_${baseName.replace(/[^a-z0-9]/gi, "_")}`,
          name: filePath,
          path_patterns: [fullPattern, pattern],
          description: `Required deliverable artifact: ${deliv}`,
          critical: isCritical,
          artifact_type: isTest ? "test" : isDoc ? "doc" : isData ? "data" : isConfig ? "config" : "source",
        });
      }
    } else {
      // Descriptive deliverable
      if (dLower.includes("clean") || dLower.includes("pipeline") || dLower.includes("preprocess")) {
        required_artifacts.push({
          id: "artifact_pipeline_module",
          name: "Data Cleaning / Pipeline Module",
          path_patterns: [/(clean|pipeline|preprocess|transform|feature).*\.py$/i, /\.py$/i],
          description: `Implementation module satisfying: ${deliv}`,
          critical: isCritical,
          artifact_type: "source",
        });
      } else if (dLower.includes("test")) {
        required_artifacts.push({
          id: "artifact_test_suite",
          name: "Test Suite",
          path_patterns: [/test_.*\.py$/i, /.*_test\.py$/i, /tests?\/.*\.py$/i],
          description: `Test suite satisfying: ${deliv}`,
          critical: isCritical,
          artifact_type: "test",
        });
      }
    }
  }

  // 2. Domain-Specific Artifacts & Code Concepts
  if (domain === "data_ml") {
    // Prohibited Signals: Submitting pure web frontend frameworks for data pipeline tasks
    unrelated_framework_signals.push(
      {
        name: "applypilot_ai_frontend",
        pattern: /(applypilot|job.*app|resume.*builder|chrome.*extension)/i,
        reason: "Repository appears to be an unrelated AI Job / Application Pilot project rather than the assigned Data Cleaning & Feature Pipeline.",
      },
      {
        name: "unrelated_pure_react_nextjs",
        pattern: /(next\.config\.(js|ts|mjs)|tailwind\.config\.(js|ts)|vite\.config\.(js|ts))/i,
        reason: "Repository is configured as a JavaScript/React frontend web app, whereas the assigned task requires a Python/Pandas data processing pipeline.",
      }
    );

    // If no python files specified in deliverables, guarantee general python pipeline artifacts are required
    const hasSourceArtifact = required_artifacts.some((a) => a.artifact_type === "source");
    if (!hasSourceArtifact) {
      required_artifacts.push({
        id: "artifact_data_pipeline_py",
        name: "Python Data Pipeline Source (.py)",
        path_patterns: [/(clean|pipeline|preprocess|transform|feature|scaler|encoder).*\.py$/i, /\.py$/i],
        description: "Python source file implementing data cleaning and transformation pipeline",
        critical: true,
        artifact_type: "source",
      });
    }

    if (allTaskText.includes("test") || allTaskText.includes("pytest")) {
      const hasTestArtifact = required_artifacts.some((a) => a.artifact_type === "test");
      if (!hasTestArtifact) {
        required_artifacts.push({
          id: "artifact_data_tests_py",
          name: "Pytest Test Suite (test_*.py)",
          path_patterns: [/test_.*\.py$/i, /.*_test\.py$/i, /tests?\/.*\.py$/i],
          description: "Pytest unit tests verifying data transformations and edge cases",
          critical: true,
          artifact_type: "test",
        });
      }

      required_tests.push({
        id: "req_tests_pipeline",
        description: "Pytest tests covering cleaning, missing values, or feature transformation",
        test_name_patterns: [/test.*/i],
        file_patterns: [/test_.*\.py$/i, /.*_test\.py$/i],
        critical: true,
        min_test_count: 1,
      });

      required_code_concepts.push({
        id: "concept_test_assertions",
        concept: "Automated Test Assertions",
        description: "Pytest / unittest assertions checking output shapes, null counts, or transformations",
        keywords: ["def test_", "assert ", "pytest", "assertEqual"],
        patterns: [/def\s+test_[a-zA-Z0-9_]+\s*\(/i, /assert\s+[a-zA-Z0-9_]/i],
        critical: true,
        min_occurrences: 1,
      });
    }

    // Core primary domain concept
    required_code_concepts.push({
      id: "concept_data_pipeline",
      concept: "Data Cleaning / Pipeline Logic",
      description: "Python data processing, imputation, transformations, or Pandas operations",
      keywords: ["clean", "fillna", "dropna", "isna", "isnull", "impute", "transform", "process", "scale", "encode", "df", "pandas", "read_csv"],
      patterns: [/def\s+[a-zA-Z0-9_]+\s*\(/i, /fillna\s*\(/i, /dropna\s*\(/i, /imput/i, /transform/i, /df/i],
      critical: true,
      min_occurrences: 1,
    });

    if (allTaskText.includes("missing") || allTaskText.includes("null") || allTaskText.includes("imput") || allTaskText.includes("clean")) {
      required_code_concepts.push({
        id: "concept_missing_values",
        concept: "Missing Value Imputation / Handling",
        description: "Handling missing/null values (e.g. fillna, dropna, SimpleImputer, isna)",
        keywords: ["fillna", "dropna", "isna", "isnull", "impute", "simpleimputer", "median", "mean", "mode"],
        patterns: [/fillna\s*\(/i, /dropna\s*\(/i, /isna\s*\(/i, /isnull\s*\(/i, /imput/i],
        critical: false,
        min_occurrences: 1,
      });
    }

    if (allTaskText.includes("scale") || allTaskText.includes("scaler") || allTaskText.includes("standard") || allTaskText.includes("minmax")) {
      required_code_concepts.push({
        id: "concept_scaling",
        concept: "Feature Scaling / Normalization",
        description: "Scaling numerical features",
        keywords: ["standardscaler", "minmaxscaler", "scale", "fit_transform"],
        patterns: [/standardscaler/i, /minmaxscaler/i, /scale\s*\(/i],
        critical: false,
        min_occurrences: 1,
      });
    }

    if (allTaskText.includes("encode") || allTaskText.includes("onehot") || allTaskText.includes("categorical") || allTaskText.includes("get_dummies")) {
      required_code_concepts.push({
        id: "concept_encoding",
        concept: "Categorical Encoding",
        description: "Encoding categorical variables",
        keywords: ["get_dummies", "onehotencoder", "ordinalencoder", "encode"],
        patterns: [/get_dummies/i, /onehotencoder/i, /ordinalencoder/i, /encode/i],
        critical: false,
        min_occurrences: 1,
      });
    }

    if (allTaskText.includes("read_csv") || allTaskText.includes("load") || allTaskText.includes("dataset") || allTaskText.includes("csv")) {
      required_code_concepts.push({
        id: "concept_data_loading",
        concept: "Data Ingestion / Loading",
        description: "Loading dataset using Pandas/CSV reader",
        keywords: ["read_csv", "dataframe", "load_data", "read_parquet", "csv.reader", "df"],
        patterns: [/read_csv\s*\(/i, /pd\.DataFrame/i, /load_data/i, /df/i],
        critical: false,
        min_occurrences: 1,
      });
    }

    // Required Documentation
    if (allTaskText.includes("readme") || allTaskText.includes("document")) {
      required_documentation.push({
        id: "req_docs_readme",
        description: "Project README or pipeline documentation outlining imputation strategies and setup",
        path_patterns: [/readme(\.md|\.rst|\.txt)?$/i, /docs?\/.*\.md$/i],
        critical: true,
        min_length: 50,
      });
    }
  } else if (domain === "cloud_devops") {
    if (allTaskText.includes("docker") || allTaskText.includes("container")) {
      required_code_concepts.push({
        id: "concept_dockerfile",
        concept: "Dockerfile Configuration",
        description: "Container specification with base image and user",
        keywords: ["FROM ", "WORKDIR", "USER ", "CMD ", "RUN ", "COPY "],
        patterns: [/FROM\s+[a-zA-Z0-9_\-.:]+/i, /USER\s+/i, /CMD\s+/i, /WORKDIR\s+/i],
        critical: true,
        min_occurrences: 1,
      });
    }

    if (allTaskText.includes("compose") || allTaskText.includes("orchestrat")) {
      required_code_concepts.push({
        id: "concept_docker_compose",
        concept: "Docker Compose Service Orchestration",
        description: "Service orchestration with healthcheck and build context",
        keywords: ["services:", "build:", "healthcheck:", "image:"],
        patterns: [/services:/i, /build:/i, /healthcheck:/i],
        critical: true,
        min_occurrences: 1,
      });
    }
  } else if (domain === "web_fullstack") {
    unrelated_framework_signals.push({
      name: "pure_data_cleaning_script",
      pattern: /(import pandas|read_csv|scikit-learn)/i,
      reason: "Repository contains data analysis scripts rather than the requested Fullstack Web application.",
    });

    required_code_concepts.push({
      id: "concept_api_or_ui",
      concept: "Component / API Handler Implementation",
      description: "React components, API route handlers, or server logic",
      keywords: ["export ", "function ", "const ", "return (", "async function", "router", "status("],
      patterns: [/export\s+(default\s+)?(function|const|class)/i, /return\s+\(/i, /router\./i, /status\s*\(/i],
      critical: true,
      min_occurrences: 1,
    });
  }

  // Universal Test Suite Requirement Detection across all domains
  if (allTaskText.includes("test") || allTaskText.includes("pytest") || allTaskText.includes("jest") || allTaskText.includes("vitest")) {
    const hasTestArtifact = required_artifacts.some((a) => a.artifact_type === "test");
    if (!hasTestArtifact) {
      required_artifacts.push({
        id: "artifact_tests",
        name: "Test Suite",
        path_patterns: [/test.*(\.py|\.ts|\.tsx|\.js|\.jsx)$/i, /.*_test\..*$/i, /tests?\/.*$/i, /.*\.spec\..*$/i, /.*\.test\..*$/i],
        description: "Unit tests verifying functionality",
        critical: true,
        artifact_type: "test",
      });
    }

    if (required_tests.length === 0) {
      required_tests.push({
        id: "req_tests",
        description: "Automated test suite verifying task implementation",
        test_name_patterns: [/test.*/i, /it\s*\(/i, /describe\s*\(/i, /def\s+test_/i],
        file_patterns: [/test/i, /\.spec\./i],
        critical: true,
        min_test_count: 1,
      });
    }
  }

  const allowed_file_extensions = [
    ".py", ".ipynb", ".ts", ".tsx", ".js", ".jsx", ".json", ".csv",
    ".parquet", ".md", ".txt", ".yaml", ".yml", ".toml", "Dockerfile",
    "docker-compose.yml", ".sql", ".sh", ".css", ".html", ".env.example",
  ];

  return {
    task_title: task.title,
    domain,
    required_artifacts,
    required_code_concepts,
    required_tests,
    required_outputs,
    required_documentation,
    critical_criteria_indices,
    allowed_file_extensions,
    unrelated_framework_signals,
  };
}

/**
 * Evaluates repository static evidence, commit metadata, and runtime results against the task contract.
 */
export function evaluateEvidenceContract(
  contract: TaskEvidenceContract,
  evidence: RepositoryEvidence,
  runtimeEvidence?: RuntimeEvidence | null,
  task?: InternshipTask
): ContractEvaluationResult {
  const block_reasons: string[] = [];
  const domain_mismatch_reasons: string[] = [];
  const actionable_feedback: string[] = [];

  const allFiles = [
    ...(evidence.file_tree || []).map((f) => f.path),
    ...(evidence.source_files || []).map((f) => f.path),
    ...(evidence.test_files || []).map((f) => f.path),
    ...(evidence.config_files || []).map((f) => f.path),
    ...(evidence.data_files || []).map((f) => f.path),
    ...(evidence.doc_files || []).map((f) => f.path),
  ];
  const uniqueFilePaths = Array.from(new Set(allFiles));

  // 1. Domain & Unrelated Signals Check
  for (const signal of contract.unrelated_framework_signals) {
    const hitsPath = uniqueFilePaths.some((p) => signal.pattern.test(p));
    const hitsReadme = evidence.readme ? signal.pattern.test(evidence.readme) : false;
    const hitsConfigs = (evidence.config_files || []).some((c) => signal.pattern.test(c.path) || signal.pattern.test(c.content));

    if (hitsPath || hitsReadme || hitsConfigs) {
      domain_mismatch_reasons.push(signal.reason);
    }
  }

  // Check language alignment (e.g. data_ml domain MUST have at least one Python file or data file)
  if (contract.domain === "data_ml") {
    const hasPyFiles = uniqueFilePaths.some((p) => p.endsWith(".py") || p.endsWith(".ipynb"));
    const hasDataFiles = uniqueFilePaths.some((p) => p.endsWith(".csv") || p.endsWith(".parquet") || p.endsWith(".json"));
    if (!hasPyFiles && !hasDataFiles) {
      domain_mismatch_reasons.push(
        "Repository contains no Python source files (.py) or data artifacts required for the Data Cleaning and Feature Pipeline task."
      );
    }
  }

  const is_domain_relevant = domain_mismatch_reasons.length === 0;
  if (!is_domain_relevant) {
    block_reasons.push(...domain_mismatch_reasons);
  }

  // 2. Required Artifacts Verification
  const satisfied_artifacts: Array<{ id: string; name: string; matched_file: string }> = [];
  const missing_artifacts: Array<{ id: string; name: string; description: string; critical: boolean }> = [];

  for (const reqArt of contract.required_artifacts) {
    let matchedPath: string | undefined;

    for (const filePath of uniqueFilePaths) {
      const isTestPath =
        filePath.startsWith("test_") ||
        filePath.includes("/test_") ||
        filePath.includes("\\test_") ||
        filePath.endsWith("_test.py") ||
        filePath.includes("/tests/") ||
        filePath.includes("\\tests\\") ||
        filePath.includes(".test.") ||
        filePath.includes(".spec.");

      // Disallow test files from matching non-test artifacts
      if (reqArt.artifact_type !== "test" && isTestPath) {
        continue;
      }
      // Disallow non-test files from matching test artifacts
      if (reqArt.artifact_type === "test" && !isTestPath) {
        continue;
      }

      const isMatch = reqArt.path_patterns.some((pat) => pat.test(filePath));
      if (isMatch) {
        matchedPath = filePath;
        break;
      }
    }

    if (matchedPath) {
      satisfied_artifacts.push({ id: reqArt.id, name: reqArt.name, matched_file: matchedPath });
    } else {
      missing_artifacts.push({
        id: reqArt.id,
        name: reqArt.name,
        description: reqArt.description,
        critical: reqArt.critical,
      });

      if (reqArt.critical) {
        block_reasons.push(`Missing mandatory artifact: '${reqArt.name}' (${reqArt.description}).`);
        actionable_feedback.push(`Create and commit '${reqArt.name}' implementing the required logic.`);
      }
    }
  }

  // 3. Required Code Concepts Verification
  const satisfied_concepts: Array<{ id: string; concept: string; matched_files: string[] }> = [];
  const missing_concepts: Array<{ id: string; concept: string; description: string; critical: boolean }> = [];

  for (const concept of contract.required_code_concepts) {
    const matchedFiles: string[] = [];

    // Search in source files
    for (const sf of evidence.source_files || []) {
      const matchPattern = concept.patterns.some((p) => p.test(sf.content));
      const matchKeyword = concept.keywords.some((kw) => sf.content.toLowerCase().includes(kw.toLowerCase()));
      if (matchPattern || matchKeyword) {
        matchedFiles.push(sf.path);
      }
    }

    // Also search in test files if relevant
    for (const tf of evidence.test_files || []) {
      const matchPattern = concept.patterns.some((p) => p.test(tf.content));
      const matchKeyword = concept.keywords.some((kw) => tf.content.toLowerCase().includes(kw.toLowerCase()));
      if (matchPattern || matchKeyword) {
        if (!matchedFiles.includes(tf.path)) matchedFiles.push(tf.path);
      }
    }

    // Also search in config files (for Dockerfile / Compose)
    for (const cf of evidence.config_files || []) {
      const matchPattern = concept.patterns.some((p) => p.test(cf.content));
      const matchKeyword = concept.keywords.some((kw) => cf.content.toLowerCase().includes(kw.toLowerCase()));
      if (matchPattern || matchKeyword) {
        if (!matchedFiles.includes(cf.path)) matchedFiles.push(cf.path);
      }
    }

    if (matchedFiles.length >= concept.min_occurrences) {
      satisfied_concepts.push({ id: concept.id, concept: concept.concept, matched_files: matchedFiles });
    } else {
      missing_concepts.push({
        id: concept.id,
        concept: concept.concept,
        description: concept.description,
        critical: concept.critical,
      });

      if (concept.critical) {
        block_reasons.push(`Missing mandatory code implementation: '${concept.concept}' (${concept.description}).`);
        actionable_feedback.push(`Implement ${concept.concept} in your source code.`);
      }
    }
  }

  // 4. Test Verification & Disambiguation (Decouples unrelated tests from task test verification)
  const testFiles = evidence.test_files || [];
  const has_test_files = testFiles.length > 0;
  let tests_match_task = false;
  let runtime_tests_verified = false;
  let test_details = "";

  if (has_test_files) {
    for (const tf of testFiles) {
      const tfContent = tf.content.toLowerCase();
      const matchesAnyReqTest = contract.required_tests.some((rt) =>
        rt.test_name_patterns.some((p) => p.test(tf.content))
      );
      const isTestSyntax =
        tfContent.includes("def test_") ||
        tfContent.includes("it(") ||
        tfContent.includes("it.only(") ||
        tfContent.includes("test(") ||
        tfContent.includes("describe(") ||
        tfContent.includes("assert") ||
        tfContent.includes("expect(") ||
        tfContent.includes("asserttrue") ||
        tfContent.includes("assertequal");

      if (matchesAnyReqTest || isTestSyntax) {
        if (contract.domain === "data_ml") {
          if (tfContent.includes("clean") || tfContent.includes("null") || tfContent.includes("imput") || tfContent.includes("scal") || tfContent.includes("dataset") || tfContent.includes("pipeline") || tfContent.includes("assert") || tfContent.includes("df") || tfContent.includes("test")) {
            tests_match_task = true;
            break;
          }
        } else {
          tests_match_task = true;
          break;
        }
      }
    }
  }

  if (runtimeEvidence) {
    const stdout = runtimeEvidence.bounded_stdout || "";
    const stderr = runtimeEvidence.bounded_stderr || "";
    const combinedLogs = `${stdout}\n${stderr}`;

    const exitZero = runtimeEvidence.exit_code === 0;
    const noFails = runtimeEvidence.tests_summary.failed === 0 && runtimeEvidence.tests_summary.passed > 0;

    const logsMentionTaskTests =
      contract.domain === "data_ml"
        ? /(test_.*\.py|clean|preprocess|imput|scaler|encoder|pipeline|assert|tests)/i.test(combinedLogs)
        : true;

    if (exitZero && noFails && logsMentionTaskTests && tests_match_task) {
      runtime_tests_verified = true;
      test_details = `Verified ${runtimeEvidence.tests_summary.passed} passing unit tests matching task specification.`;
    } else if (runtimeEvidence.status === "verification_unavailable") {
      test_details = "Runtime execution runner unavailable; relying on static test analysis.";
    } else if (exitZero && !logsMentionTaskTests) {
      test_details = "Runtime tests executed successfully, but tests were for unrelated modules.";
      block_reasons.push("Passing runtime tests belong to an unrelated test suite and do not test the assigned task.");
    } else {
      test_details = `Runtime tests failed with exit code ${runtimeEvidence.exit_code} (${runtimeEvidence.tests_summary.failed} failed).`;
      block_reasons.push(`Automated unit test suite failed (${runtimeEvidence.tests_summary.failed} failures).`);
    }
  }

  if (contract.required_tests.length > 0 && !has_test_files) {
    block_reasons.push("No automated test files found in repository.");
    actionable_feedback.push("Add a unit test suite (e.g. tests/test_pipeline.py) verifying your implementation.");
  }

  // 5. Output Verification
  const satisfied_outputs: string[] = [];
  const missing_outputs: string[] = [];
  for (const reqOut of contract.required_outputs) {
    const match = uniqueFilePaths.find((p) => reqOut.path_patterns.some((pat) => pat.test(p)));
    if (match) {
      satisfied_outputs.push(match);
    } else {
      missing_outputs.push(reqOut.description);
      if (reqOut.critical) {
        block_reasons.push(`Missing required output artifact: ${reqOut.description}.`);
      }
    }
  }

  // 6. Documentation Verification
  const satisfied_docs: string[] = [];
  const missing_docs: string[] = [];
  for (const reqDoc of contract.required_documentation) {
    const match = uniqueFilePaths.find((p) => reqDoc.path_patterns.some((pat) => pat.test(p)));
    if (match && (evidence.readme?.length || 0) >= reqDoc.min_length) {
      satisfied_docs.push(match);
    } else {
      missing_docs.push(reqDoc.description);
      if (reqDoc.critical) {
        block_reasons.push(`Missing required documentation: ${reqDoc.description}.`);
        actionable_feedback.push("Provide documentation in README.md describing your pipeline architecture and setup.");
      }
    }
  }

  // 7. Commit Provenance & Changed Files Verification
  const commitMeta = evidence.commit_metadata;
  let has_relevant_changes = true;
  const changedFiles = commitMeta?.changed_files || [];
  const relevant_changed_files: string[] = [];

  if (commitMeta && changedFiles.length > 0) {
    for (const cf of changedFiles) {
      const isRelevant = contract.allowed_file_extensions.some((ext) => cf.path.endsWith(ext) || cf.path === ext || cf.path.includes(ext));
      if (isRelevant) {
        relevant_changed_files.push(cf.path);
      }
    }

    if (relevant_changed_files.length === 0) {
      has_relevant_changes = false;
      block_reasons.push(
        `Submitted Git commit (${commitMeta.commit_sha?.slice(0, 7) || "pinned SHA"}) contains no changes to task-relevant files (only modified ${changedFiles.map((c) => c.path).join(", ")}).`
      );
      actionable_feedback.push("Ensure your changes are committed to the specific commit SHA you submit for review.");
    }
  }

  // 8. Map Criteria to Evaluated Results
  const criterion_evaluations: CriterionResult[] = [];
  const taskCriteria = task?.acceptance_criteria || [];

  for (let i = 0; i < taskCriteria.length; i++) {
    const crit = taskCriteria[i];
    const isCritical = contract.critical_criteria_indices.includes(i);
    const critLower = crit.toLowerCase();

    let matchedFiles: string[] = [];
    let status: "met" | "partially_met" | "not_met" | "unable_to_verify" = "not_met";
    let reason = "";

    // If whole domain is mismatched, criterion is strictly not met
    if (!is_domain_relevant) {
      status = "not_met";
      reason = `Repository does not contain implementation for '${contract.task_title}'. Missing domain artifacts.`;
    } else {
      // Find candidate files
      matchedFiles = satisfied_artifacts
        .filter((a) => {
          const aLower = a.name.toLowerCase();
          return (
            (critLower.includes("clean") && aLower.includes("clean")) ||
            (critLower.includes("test") && (aLower.includes("test") || a.matched_file.includes("test"))) ||
            (critLower.includes("missing") && aLower.includes("clean")) ||
            (critLower.includes("dataset") && (aLower.includes("csv") || aLower.includes("data"))) ||
            (critLower.includes("docker") && (aLower.includes("docker"))) ||
            (critLower.includes("compose") && (aLower.includes("compose"))) ||
            (critLower.includes("doc") && (aLower.includes("readme") || aLower.includes("doc")))
          );
        })
        .map((a) => a.matched_file);

      if (matchedFiles.length === 0 && satisfied_artifacts.length > 0) {
        matchedFiles = [satisfied_artifacts[0].matched_file];
      }

      // Check concept satisfaction
      const hasConcepts = satisfied_concepts.length > 0;

      if (critLower.includes("test")) {
        if (runtime_tests_verified || (has_test_files && tests_match_task)) {
          status = "met";
          reason = `Verified automated test suite in ${testFiles.map((t) => t.path).join(", ")}. ${test_details}`;
        } else if (has_test_files) {
          status = "partially_met";
          reason = `Test files present (${testFiles.map((t) => t.path).join(", ")}), but runtime verification did not pass.`;
        } else {
          status = "not_met";
          reason = "No unit test files found in repository.";
        }
      } else if (matchedFiles.length > 0 && hasConcepts) {
        status = "met";
        reason = `Implementation verified statically in ${matchedFiles.join(", ")}.`;
      } else if (matchedFiles.length > 0) {
        status = "partially_met";
        reason = `Files present (${matchedFiles.join(", ")}) but key implementation concepts are incomplete.`;
      } else {
        status = "not_met";
        reason = `No source files or artifacts found satisfying '${crit}'.`;
      }
    }

    criterion_evaluations.push({
      criterion: crit,
      status,
      evidence: matchedFiles,
      runtime_evidence: runtimeEvidence?.status === "completed" ? test_details : null,
      reason,
      critical: isCritical,
      verification_method: critLower.includes("test") ? "runtime_test" : "static_analysis",
      source: matchedFiles[0] || "unverified",
    });
  }

  // 9. Deliverables Evaluated
  const deliverables_evaluated: DeliverableEvaluation[] = (task?.deliverables || []).map((d) => {
    const match = satisfied_artifacts.find((sa) => d.toLowerCase().includes(sa.matched_file.toLowerCase()) || sa.matched_file.toLowerCase().includes(d.toLowerCase()) || sa.name.toLowerCase().includes(d.toLowerCase()));
    return {
      deliverable: d,
      status: match ? "present" : "missing",
      evidence_path: match ? match.matched_file : null,
    };
  });

  // 10. Compute Deterministic Relevance Score & Can Pass
  const criticalArtifactsMissing = missing_artifacts.some((a) => a.critical);
  const criticalConceptsMissing = missing_concepts.some((c) => c.critical);
  const criticalCriteriaUnmet = criterion_evaluations.some((ce) => ce.critical && ce.status !== "met");

  let relevance_score = 0;
  if (is_domain_relevant) {
    const artifactWeight = 35;
    const conceptWeight = 35;
    const testWeight = contract.required_tests.length > 0 ? 20 : 0;
    const docWeight = 10;
    const baseWeight = contract.required_tests.length > 0 ? 0 : 20;

    const artifactPct = contract.required_artifacts.length > 0 ? satisfied_artifacts.length / contract.required_artifacts.length : 1;
    const conceptPct = contract.required_code_concepts.length > 0 ? satisfied_concepts.length / contract.required_code_concepts.length : 1;
    const testPct = contract.required_tests.length > 0 ? (tests_match_task ? (runtime_tests_verified ? 1 : 0.7) : (has_test_files ? 0.3 : 0)) : 1;
    const docPct = satisfied_docs.length > 0 || (evidence.readme?.length || 0) > 20 ? 1 : 0;

    relevance_score = Math.round(
      artifactWeight * artifactPct +
      conceptWeight * conceptPct +
      testWeight * testPct +
      docWeight * docPct +
      baseWeight
    );
  } else {
    relevance_score = 15; // Low baseline for unrelated repositories
  }

  const can_pass =
    is_domain_relevant &&
    !criticalArtifactsMissing &&
    !criticalConceptsMissing &&
    !criticalCriteriaUnmet &&
    has_relevant_changes &&
    relevance_score >= 70 &&
    (runtimeEvidence && runtimeEvidence.status === "completed" ? runtimeEvidence.exit_code === 0 && runtimeEvidence.tests_summary.failed === 0 : true);

  return {
    can_pass,
    relevance_score,
    is_domain_relevant,
    domain_mismatch_reasons,
    satisfied_artifacts,
    missing_artifacts,
    satisfied_concepts,
    missing_concepts,
    test_verification: {
      has_test_files,
      tests_match_task,
      runtime_tests_verified,
      details: test_details,
    },
    output_verification: {
      satisfied_outputs,
      missing_outputs,
    },
    doc_verification: {
      satisfied_docs,
      missing_docs,
    },
    commit_provenance: {
      commit_sha: evidence.repository.commit_sha || "HEAD",
      has_relevant_changes,
      changed_files_count: changedFiles.length,
      relevant_changed_files,
      authorship_notes: commitMeta?.author_name ? `Author: ${commitMeta.author_name} (${commitMeta.author_email || "no-email"})` : "Commit author unverified",
    },
    criterion_evaluations,
    deliverables_evaluated,
    block_reasons,
    actionable_feedback,
  };
}
