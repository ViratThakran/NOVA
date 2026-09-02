import type {
  DifficultyLevel,
  InternshipDefinition,
  CurriculumMilestone,
  CurriculumPlan,
  StudentSkillAssessment,
  StudentPerformanceRecord,
  StudentContext,
  InternshipTask,
  TaskValidationResult,
  SubmissionType,
  SubmissionStatus,
  InternshipSubmission,
  EvidenceCollectionStatus,
  RepositoryEvidence,
  ExecutionJobStatus,
  ExecutionProfile,
  ExecutionJob,
  RuntimeEvidence,
  CriterionStatus,
  CriterionResult,
  TechnicalQuality,
  DeliverableEvaluation,
  InternshipReview,
  ReviewValidationResult,
} from "../schemas";

export type {
  DifficultyLevel,
  InternshipDefinition,
  CurriculumMilestone,
  CurriculumPlan,
  StudentSkillAssessment,
  StudentPerformanceRecord,
  StudentContext,
  InternshipTask,
  TaskValidationResult,
  SubmissionType,
  SubmissionStatus,
  InternshipSubmission,
  EvidenceCollectionStatus,
  RepositoryEvidence,
  ExecutionJobStatus,
  ExecutionProfile,
  ExecutionJob,
  RuntimeEvidence,
  CriterionStatus,
  CriterionResult,
  TechnicalQuality,
  DeliverableEvaluation,
  InternshipReview,
  ReviewValidationResult,
};

export type DifficultyRecommendation = "SCALE_UP" | "MAINTAIN" | "SCAFFOLD";

export interface TaskGenerationInput {
  internship: InternshipDefinition;
  curriculum: CurriculumPlan;
  currentMilestone: CurriculumMilestone;
  studentContext: StudentContext;
  previousTasks?: Array<{
    title: string;
    objective: string;
    milestone_index?: number;
    score?: number;
    verdict?: string;
  }>;
  targetDifficulty?: DifficultyLevel;
  customInstructions?: string;
}

import type { NextTaskDecision, MentorAction } from "./decision";

export type { NextTaskDecision, MentorAction };

export interface TaskGenerationResult {
  task: InternshipTask;
  validation: TaskValidationResult;
  attempts: number;
  generatedBy: "ai" | "ai_with_retry" | "deterministic_fallback";
  decision?: NextTaskDecision;
  logs: string[];
}

export interface ReviewContext {
  task: InternshipTask;
  internship: InternshipDefinition;
  currentMilestone: CurriculumMilestone;
  studentContext: StudentContext;
  currentSubmission: InternshipSubmission;
  evidence: RepositoryEvidence;
  runtimeEvidence?: RuntimeEvidence | null;
  previousSubmissions?: InternshipSubmission[];
  previousReviews?: InternshipReview[];
}

export interface SubmitTaskWorkInput {
  taskId: string;
  studentId: string;
  enrollmentId: string;
  submissionType?: SubmissionType;
  githubUrl: string;
  branch?: string;
  commitSha?: string;
  studentExplanation: string;
}

export interface SubmissionEvaluationResult {
  submission: InternshipSubmission;
  evidence: RepositoryEvidence;
  runtimeEvidence?: RuntimeEvidence | null;
  review: InternshipReview;
  validation: ReviewValidationResult;
  updatedStudentContext?: StudentContext;
  notificationEvent?: "TASK_PASSED" | "REVISION_REQUIRED" | "MANUAL_REVIEW_REQUIRED";
  logs: string[];
}

