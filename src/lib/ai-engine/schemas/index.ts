// Structured AI output schemas. Orchestration NEVER depends on arbitrary
// model prose — every model response is parsed as JSON and validated
// against one of these schemas before anything in the response is acted
// on. A response that fails validation fails the task safely (status
// 'failed', no tasks created, no tool executed) rather than being
// interpreted loosely.

import { z } from "zod";

// The AI Project Manager's decomposition of a service request into child
// tasks. agent_slug/capability_slugs are the MODEL's claim about what it
// thinks is appropriate — agents/project-manager.ts independently
// re-verifies both against the real agent_definitions/
// agent_definition_capabilities tables before creating anything. A model
// claiming a capability an agent doesn't actually have is rejected, not
// trusted ("never blindly execute arbitrary instructions returned by the
// model").
export const taskPlanSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(2000),
        agent_slug: z.string().min(1).max(100),
        capability_slugs: z.array(z.string().min(1).max(100)).max(10).default([]),
        // Index into this same tasks array that must complete first, or
        // null for "no dependency, can be planned immediately." Validated
        // structurally (must point backward, never to itself or forward)
        // in agents/project-manager.ts, not here — Zod checks shape, not
        // graph validity.
        depends_on_index: z.number().int().nonnegative().nullable().optional(),
      })
    )
    .min(1, "A plan must contain at least one task")
    .max(10, "A plan is capped at 10 tasks to keep decomposition reviewable"),
});

export type TaskPlan = z.infer<typeof taskPlanSchema>;

// The Research Agent's structured result for a single research task.
export const researchResultSchema = z.object({
  summary: z.string().min(1).max(5000),
  findings: z.array(z.string().min(1).max(1000)).min(1).max(20),
  sources: z.array(z.string().max(500)).max(20).default([]),
});

export type ResearchResult = z.infer<typeof researchResultSchema>;

// The Developer Agent's generated deliverable — a small, capped set of
// virtual files. This is NEVER written to the real NOVA filesystem and
// NEVER executed; it is the customer's generated deliverable, stored as an
// ai_artifacts row and rendered/downloaded, not run. Capped at 8 files /
// 20,000 chars each to keep a single AI response bounded and reviewable.
export const websiteBuildSchema = z.object({
  files: z
    .array(
      z.object({
        path: z.string().min(1).max(200),
        content: z.string().min(1).max(20000),
      })
    )
    .min(1, "A website build must contain at least one file")
    .max(8, "A website build is capped at 8 files to keep output reviewable"),
});

export type WebsiteBuild = z.infer<typeof websiteBuildSchema>;

// The QA Agent's structured verdict. `status` is the field
// workflows/orchestrator.ts inspects to decide whether to advance or route
// the work back to the Developer Agent — see
// WorkflowTaskTemplate.onFailureReturnToKey (workflows/types.ts).
export const qaResultSchema = z.object({
  status: z.enum(["passed", "failed"]),
  issues: z.array(z.string().min(1).max(500)).max(20).default([]),
  recommendations: z.array(z.string().min(1).max(500)).max(20).default([]),
  confidence: z.number().min(0).max(1),
});

export type QaResult = z.infer<typeof qaResultSchema>;

// The Content & Marketing Agent's generated draft. This is
// `generate_content` (capability: write_draft, no approval) — publishing
// or sending it anywhere is a SEPARATE, approval-required capability
// (publish_content / send_email) that no code path invokes automatically.
export const contentDraftSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  format: z.enum(["website_copy", "seo_content", "social_post", "email_draft", "product_description", "advertisement"]),
});

export type ContentDraft = z.infer<typeof contentDraftSchema>;

// ============================================================================
// NOVA AI INTERNSHIP MENTOR SCHEMAS (Phase 1)
// ============================================================================

export const difficultyLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
export type DifficultyLevel = z.infer<typeof difficultyLevelSchema>;

export const difficultyRecommendationSchema = z.enum(["SCALE_UP", "MAINTAIN", "SCAFFOLD"]);
export type DifficultyRecommendation = z.infer<typeof difficultyRecommendationSchema>;

export const internshipDefinitionSchema = z.object({
  title: z.string().min(1).max(200),
  duration_weeks: z.number().int().min(1).max(52),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "beginner_to_intermediate"]),
  domain: z.string().min(1).max(100),
  required_skills: z.array(z.string().min(1).max(100)).min(1).max(30),
  tools: z.array(z.string().min(1).max(100)).min(1).max(30),
  learning_objectives: z.array(z.string().min(1).max(500)).min(1).max(20),
  final_project: z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    expected_outcome: z.string().min(1).max(2000),
    key_deliverables: z.array(z.string().min(1).max(300)).min(1).max(15),
  }),
  prerequisites: z.array(z.string().min(1).max(300)).default([]),
});

export type InternshipDefinition = z.infer<typeof internshipDefinitionSchema>;

export const curriculumMilestoneSchema = z.object({
  milestone_index: z.number().int().nonnegative(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  learning_objectives: z.array(z.string().min(1).max(500)).min(1).max(10),
  skills_focused: z.array(z.string().min(1).max(100)).min(1).max(15),
  target_difficulty: difficultyLevelSchema,
  estimated_duration_weeks: z.number().min(0.5).max(12),
  prerequisites: z.array(z.string().min(1).max(200)).default([]),
  expected_outcomes: z.array(z.string().min(1).max(500)).min(1).max(10),
  final_project_contribution: z.string().min(1).max(1000),
});

export type CurriculumMilestone = z.infer<typeof curriculumMilestoneSchema>;

export const curriculumPlanSchema = z.object({
  internship_title: z.string().min(1).max(200),
  total_duration_weeks: z.number().int().min(1).max(52),
  milestones: z.array(curriculumMilestoneSchema).min(1).max(20),
  final_outcome: z.string().min(1).max(2000),
});

export type CurriculumPlan = z.infer<typeof curriculumPlanSchema>;

export const studentSkillAssessmentSchema = z.object({
  skill: z.string().min(1).max(100),
  declared_score: z.number().min(0).max(10).nullable().optional(),
  observed_score: z.number().min(0).max(10).nullable().optional(),
  confidence: z.enum(["low", "medium", "high"]),
  attempts_count: z.number().int().nonnegative().default(0),
  last_evaluated_at: z.string().nullable().optional(),
});

export type StudentSkillAssessment = z.infer<typeof studentSkillAssessmentSchema>;

export const studentPerformanceRecordSchema = z.object({
  task_id: z.string().min(1),
  task_title: z.string().min(1),
  milestone_index: z.number().int().nonnegative(),
  score: z.number().min(0).max(100),
  verdict: z.enum(["passed", "needs_revision"]),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  skills_tested: z.array(z.string()).default([]),
  completed_at: z.string().optional(),
});

export type StudentPerformanceRecord = z.infer<typeof studentPerformanceRecordSchema>;

export const failureCategorySchema = z.enum([
  "knowledge_gap",
  "implementation_error",
  "testing_failure",
  "documentation_failure",
  "misunderstanding_requirements",
  "timeout_or_infrastructure",
  "provider_rate_limit",
  "provider_outage",
  "schema_validation_failed",
  "prompt_injection_detected",
  "anti_hallucination_violation",
]);
export type FailureCategory = z.infer<typeof failureCategorySchema>;

export const difficultyHistoryEntrySchema = z.object({
  milestone_index: z.number().int().nonnegative(),
  difficulty: difficultyLevelSchema,
  score: z.number().min(0).max(100),
});
export type DifficultyHistoryEntry = z.infer<typeof difficultyHistoryEntrySchema>;

export const studentContextSchema = z.object({
  student: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    education: z.string().optional(),
    declared_skills: z.array(z.string()).default([]),
    experience_level: z.string().optional(),
    github_handle: z.string().optional(),
  }),
  internship: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    domain: z.string().min(1),
    duration_weeks: z.number().int().min(1),
    level: z.string(),
  }),
  progress: z.object({
    current_milestone_index: z.number().int().nonnegative(),
    completed_task_count: z.number().int().nonnegative(),
    completion_percentage: z.number().min(0).max(100),
    active_task_id: z.string().nullable().optional(),
  }),
  performance: z.object({
    average_score: z.number().min(0).max(100).nullable().optional(),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    repeated_errors: z.array(z.string()).default([]),
    recent_records: z.array(studentPerformanceRecordSchema).default([]),
  }),
  learning_state: z.object({
    skill_ratings: z.array(studentSkillAssessmentSchema).default([]),
    target_difficulty: difficultyLevelSchema,
    difficulty_recommendation: z.enum(["SCALE_UP", "MAINTAIN", "SCAFFOLD"]),
    recommended_focus_areas: z.array(z.string()).default([]),
    demonstrated_skills: z.array(z.string()).default([]),
    weak_skills: z.array(z.string()).default([]),
    recurring_failure_categories: z.array(z.string()).default([]),
    completed_milestones: z.array(z.number().int().nonnegative()).default([]),
    revision_count: z.number().int().nonnegative().default(0),
    difficulty_history: z.array(difficultyHistoryEntrySchema).default([]),
    feedback_themes: z.array(z.string()).default([]),
  }),
});

export type StudentContext = z.infer<typeof studentContextSchema>;

export const internshipTaskSchema = z.object({
  title: z.string().min(3).max(200),
  business_context: z.string().min(10).max(2000),
  objective: z.string().min(10).max(2000),
  instructions: z.array(z.string().min(5).max(1500)).min(1).max(20),
  deliverables: z.array(z.string().min(3).max(500)).min(1).max(15),
  acceptance_criteria: z.array(z.string().min(5).max(500)).min(1).max(15),
  skills_practiced: z.array(z.string().min(1).max(100)).min(1).max(10),
  estimated_hours: z.number().min(1).max(40),
  difficulty: difficultyLevelSchema,
  reason_for_assignment: z.string().min(10).max(2000),
  milestone_index: z.number().int().nonnegative().optional(),
  capstone_connection: z.string().min(5).max(2000).optional(),
});

export type InternshipTask = z.infer<typeof internshipTaskSchema>;

export const taskValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
  score: z.number().min(0).max(100).optional(),
});

export type TaskValidationResult = z.infer<typeof taskValidationResultSchema>;

// =========================================================================
// PHASE 2: SUBMISSION, EVIDENCE COLLECTION & AI REVIEW SCHEMAS
// =========================================================================

export const submissionTypeSchema = z.enum(["github", "figma", "document", "url"]);
export type SubmissionType = z.infer<typeof submissionTypeSchema>;

export const submissionStatusSchema = z.enum([
  "submitted",
  "collecting_evidence",
  "running_verification",
  "in_review",
  "ready_for_review",
  "reviewing",
  "reviewed",
  "needs_revision",
  "passed",
  "manual_review",
  "failed",
]);
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;

export const internshipSubmissionSchema = z.object({
  id: z.string().min(1),
  task_id: z.string().min(1),
  student_id: z.string().min(1),
  enrollment_id: z.string().min(1),
  submission_type: submissionTypeSchema.default("github"),
  github_url: z.string().regex(/^(https:\/\/github\.com\/[^/]+\/[^/]+|file:\/\/.+|(\/|[A-Za-z]:[\\/]).+)/, "Must be a valid GitHub or repository URL"),
  branch: z.string().default("main"),
  commit_sha: z.string().default("HEAD"),
  student_explanation: z.string().min(10).max(3000),
  submitted_at: z.string().default(() => new Date().toISOString()),
  attempt_number: z.number().int().positive().default(1),
  status: submissionStatusSchema.default("submitted"),
});
export type InternshipSubmission = z.infer<typeof internshipSubmissionSchema>;

export const evidenceCollectionStatusSchema = z.enum([
  "success",
  "partial",
  "private_restricted",
  "not_found",
  "error",
]);
export type EvidenceCollectionStatus = z.infer<typeof evidenceCollectionStatusSchema>;

export const commitChangedFileSchema = z.object({
  path: z.string(),
  status: z.enum(["added", "modified", "deleted", "renamed", "unchanged"]).default("modified"),
  additions: z.number().default(0),
  deletions: z.number().default(0),
  patch: z.string().optional(),
});
export type CommitChangedFile = z.infer<typeof commitChangedFileSchema>;

export const commitMetadataSchema = z.object({
  commit_sha: z.string().optional(),
  author_name: z.string().optional(),
  author_email: z.string().optional(),
  committer_name: z.string().optional(),
  committer_email: z.string().optional(),
  committed_at: z.string().optional(),
  message: z.string().optional(),
  parent_shas: z.array(z.string()).default([]),
  changed_files: z.array(commitChangedFileSchema).default([]),
  provenance_verified: z.boolean().default(false),
});
export type CommitMetadata = z.infer<typeof commitMetadataSchema>;

export const repositoryEvidenceSchema = z.object({
  repository: z.object({
    owner: z.string().min(1),
    name: z.string().min(1),
    default_branch: z.string().default("main"),
    commit_sha: z.string().default("HEAD").optional(),
    description: z.string().nullable().optional(),
    topics: z.array(z.string()).default([]).optional(),
    languages: z.array(z.string()).default([]).optional(),
    is_private: z.boolean().default(false),
  }),
  readme: z.string().nullable().optional(),
  file_tree: z.array(
    z.object({
      path: z.string().min(1),
      type: z.enum(["file", "dir"]),
      size: z.number().nonnegative().optional(),
    })
  ).default([]).optional(),
  source_files: z.array(
    z.object({
      path: z.string().min(1),
      content: z.string(),
      language: z.string().optional(),
      line_count: z.number().nonnegative().default(0),
    })
  ).default([]).optional(),
  test_files: z.array(
    z.object({
      path: z.string().min(1),
      content: z.string(),
      framework: z.string().optional(),
    })
  ).default([]).optional(),
  config_files: z.array(
    z.object({
      path: z.string().min(1),
      content: z.string(),
    })
  ).default([]).optional(),
  data_files: z.array(
    z.object({
      path: z.string().min(1),
      size: z.number().nonnegative().optional(),
      preview: z.string().optional(),
    })
  ).default([]).optional(),
  doc_files: z.array(
    z.object({
      path: z.string().min(1),
      content: z.string(),
    })
  ).default([]).optional(),
  commit_metadata: commitMetadataSchema.optional(),
  collected_at: z.string().default(() => new Date().toISOString()),
  collection_status: evidenceCollectionStatusSchema.default("success"),
  error_message: z.string().nullable().optional(),
});
export type RepositoryEvidence = z.infer<typeof repositoryEvidenceSchema>;

// =========================================================================
// PHASE 3: SECURE RUNTIME VERIFICATION & SANDBOX SCHEMAS
// =========================================================================

export const executionJobStatusSchema = z.enum([
  "queued",
  "preparing",
  "running",
  "completed",
  "timed_out",
  "resource_exceeded",
  "blocked",
  "failed",
  "cancelled",
  "verification_unavailable",
]);
export type ExecutionJobStatus = z.infer<typeof executionJobStatusSchema>;

export const executionProfileSchema = z.enum(["node_typescript", "python", "custom"]);
export type ExecutionProfile = z.infer<typeof executionProfileSchema>;

export const executionJobSchema = z.object({
  id: z.string().min(1),
  submission_id: z.string().min(1),
  repository: z.string().min(1),
  commit_sha: z.string().min(1),
  execution_profile: executionProfileSchema,
  status: executionJobStatusSchema.default("queued"),
  runner_version: z.string().default("1.0"),
  profile_version: z.string().default("1.0"),
  timeout_seconds: z.number().int().positive().default(60),
  exit_code: z.number().nullable().optional(),
  duration_ms: z.number().nonnegative().nullable().optional(),
  requested_at: z.string().default(() => new Date().toISOString()),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
});
export type ExecutionJob = z.infer<typeof executionJobSchema>;

export const runtimeEvidenceSchema = z.object({
  execution_id: z.string().min(1),
  submission_id: z.string().min(1),
  commit_sha: z.string().min(1),
  runner_version: z.string().default("1.0"),
  profile_version: z.string().default("1.0"),
  status: z.enum(["completed", "timed_out", "resource_exceeded", "blocked", "failed", "verification_unavailable"]),
  exit_code: z.number().default(0),
  duration_ms: z.number().nonnegative().default(0),
  tests_summary: z.object({
    total: z.number().nonnegative(),
    passed: z.number().nonnegative(),
    failed: z.number().nonnegative(),
    skipped: z.number().nonnegative().default(0),
  }),
  build_summary: z.object({
    attempted: z.boolean().default(false),
    status: z.enum(["passed", "failed", "skipped"]).default("skipped"),
    details: z.string().optional(),
  }),
  lint_summary: z.object({
    attempted: z.boolean().default(false),
    status: z.enum(["passed", "failed", "skipped"]).default("skipped"),
    warnings: z.number().nonnegative().default(0),
    errors: z.number().nonnegative().default(0),
  }),
  bounded_stdout: z.string().default(""), // Max 64KB bounded log
  bounded_stderr: z.string().default(""), // Max 64KB bounded log
  resource_usage: z.record(z.unknown()).default({}),
  collected_at: z.string().default(() => new Date().toISOString()),
});
export type RuntimeEvidence = z.infer<typeof runtimeEvidenceSchema>;

export const criterionStatusSchema = z.enum(["met", "partially_met", "not_met", "unable_to_verify"]);
export type CriterionStatus = z.infer<typeof criterionStatusSchema>;

export const criterionVerificationMethodSchema = z.enum([
  "static_analysis",
  "runtime_test",
  "commit_diff",
  "manual",
  "none",
]);
export type CriterionVerificationMethod = z.infer<typeof criterionVerificationMethodSchema>;

export const criterionResultSchema = z.object({
  criterion: z.string().min(1),
  status: criterionStatusSchema,
  evidence: z.array(z.string()).default([]), // Static file citations
  runtime_evidence: z.string().nullable().optional(), // Factual runner verification citation
  reason: z.string().min(5).max(2000),
  critical: z.boolean().default(false),
  verification_method: criterionVerificationMethodSchema.default("static_analysis").optional(),
  source: z.string().optional(),
});
export type CriterionResult = z.infer<typeof criterionResultSchema>;

export const technicalQualitySchema = z.object({
  architecture_score: z.number().min(0).max(100),
  code_quality_score: z.number().min(0).max(100),
  testing_score: z.number().min(0).max(100),
  documentation_score: z.number().min(0).max(100),
  notes: z.string().min(5).max(2000),
});
export type TechnicalQuality = z.infer<typeof technicalQualitySchema>;

export const deliverableEvaluationSchema = z.object({
  deliverable: z.string().min(1),
  status: z.enum(["present", "missing", "incomplete"]),
  evidence_path: z.string().nullable().optional(),
});
export type DeliverableEvaluation = z.infer<typeof deliverableEvaluationSchema>;

export const internshipReviewSchema = z.object({
  review_id: z.string().min(1),
  submission_id: z.string().min(1),
  task_id: z.string().min(1),
  attempt_number: z.number().int().positive(),
  verdict: z.enum(["passed", "needs_revision", "manual_review"]),
  score: z.number().min(0).max(100),
  summary: z.string().min(10).max(3000),
  criteria_results: z.array(criterionResultSchema).min(1),
  technical_quality: technicalQualitySchema,
  deliverables_evaluated: z.array(deliverableEvaluationSchema).default([]),
  strengths: z.array(z.string().min(3).max(1500)).default([]),
  improvements: z.array(z.string().min(3).max(1500)).default([]),
  next_step: z.string().min(5).max(3000),
  review_engine_version: z.string().default("1.0"),
  created_at: z.string().default(() => new Date().toISOString()),
});
export type InternshipReview = z.infer<typeof internshipReviewSchema>;

export const reviewValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
  adjusted_score: z.number().min(0).max(100),
  adjusted_verdict: z.enum(["passed", "needs_revision", "manual_review"]),
});
export type ReviewValidationResult = z.infer<typeof reviewValidationResultSchema>;

// Pure, independent structural inspection of a Developer Agent's generated
// website — the QA Agent's "must not simply trust another agent's output"
// requirement satisfied concretely: this looks at the actual file content,
// not the Developer Agent's own self-reported success. Kept pure/exported
// so it's directly unit-testable without a database or an AI provider call.
export function checkWebsiteBuildStructure(build: WebsiteBuild): { issues: string[] } {
  const issues: string[] = [];
  const hasEntryPoint = build.files.some((file) => /(^|\/)index\.html$/i.test(file.path));
  if (!hasEntryPoint) {
    issues.push("No index.html entry point found among the generated files.");
  }
  for (const file of build.files) {
    if (file.content.trim().length === 0) {
      issues.push(`File '${file.path}' is empty.`);
    }
    if (/\{\{|\btodo\b/i.test(file.content)) {
      issues.push(`File '${file.path}' contains an unresolved template placeholder or TODO marker.`);
    }
  }
  const paths = build.files.map((file) => file.path.toLowerCase());
  if (new Set(paths).size !== paths.length) {
    issues.push("Duplicate file paths were generated.");
  }
  return { issues };
}

// Pure structural validation of a plan's dependency graph — every
// depends_on_index must point strictly backward (< its own index, >= 0).
// Kept out of agents/project-manager.ts so it's directly unit-testable
// without a database, the same "pure logic extracted for testing"
// convention used throughout this codebase (see e.g.
// application-view-state.ts).
export function findInvalidDependencyIndex(plan: TaskPlan): number | null {
  for (let i = 0; i < plan.tasks.length; i++) {
    const dep = plan.tasks[i].depends_on_index;
    if (dep !== null && dep !== undefined && (dep >= i || dep < 0)) {
      return i;
    }
  }
  return null;
}
