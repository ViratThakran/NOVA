import { z } from "zod";

/**
 * Supported execution profiles in the Sandbox Worker
 */
export const supportedExecutionProfileSchema = z.enum(["node_typescript", "python"]);
export type SupportedExecutionProfile = z.infer<typeof supportedExecutionProfileSchema>;

/**
 * Configurable Execution Resource Limits
 */
export const executionLimitsSchema = z.object({
  timeoutSeconds: z.number().int().min(1).max(300).default(60),
  maxMemoryMb: z.number().int().min(64).max(4096).default(512),
  maxCpus: z.number().min(0.1).max(8).default(1),
  maxProcesses: z.number().int().min(1).max(128).default(16),
  maxOutputBytes: z.number().int().min(1024).max(1048576).default(65536), // 64KB default
  network: z.enum(["DENY", "ALLOW"]).default("DENY"),
});
export type ExecutionLimits = z.infer<typeof executionLimitsSchema>;

/**
 * Worker Execute Job Request Payload
 * Strictly accepts job parameters, commit SHA, and profile.
 * ZERO student scores, grades, or arbitrary commands accepted.
 */
export const workerExecuteRequestSchema = z.object({
  execution_id: z.string().min(1),
  submission_id: z.string().min(1),
  repository_url: z.string().url().or(z.string().min(1)),
  commit_sha: z.string().min(4).max(64),
  execution_profile: supportedExecutionProfileSchema,
  profile_version: z.string().default("1.0"),
  limits: executionLimitsSchema.optional(),
  simulation_flags: z.array(z.string()).optional(), // For testing deterministic failure modes
});
export type WorkerExecuteRequest = z.infer<typeof workerExecuteRequestSchema>;

/**
 * Structured Factual Runtime Evidence returned by the worker
 */
export const workerRuntimeEvidenceSchema = z.object({
  execution_id: z.string(),
  submission_id: z.string(),
  commit_sha: z.string(),
  runner_version: z.string(),
  profile_version: z.string(),
  status: z.enum([
    "completed",
    "failed",
    "timed_out",
    "resource_exceeded",
    "blocked",
    "verification_unavailable",
  ]),
  exit_code: z.number().int(),
  duration_ms: z.number().int().min(0),
  tests_summary: z.object({
    total: z.number().int().min(0),
    passed: z.number().int().min(0),
    failed: z.number().int().min(0),
    skipped: z.number().int().min(0),
  }),
  build_summary: z.object({
    attempted: z.boolean(),
    status: z.enum(["passed", "failed", "skipped"]),
    details: z.string().optional(),
  }),
  lint_summary: z.object({
    attempted: z.boolean(),
    status: z.enum(["passed", "failed", "skipped"]),
    warnings: z.number().int().min(0).default(0),
    errors: z.number().int().min(0).default(0),
  }),
  bounded_stdout: z.string().max(1048576),
  bounded_stderr: z.string().max(1048576),
  resource_usage: z.object({
    peak_memory_bytes: z.number().optional(),
    cpu_time_ms: z.number().optional(),
  }),
  collected_at: z.string(),
});
export type WorkerRuntimeEvidence = z.infer<typeof workerRuntimeEvidenceSchema>;

/**
 * Worker Execute Job Response Payload
 */
export const workerExecuteResponseSchema = z.object({
  job: z.object({
    id: z.string(),
    submission_id: z.string(),
    commit_sha: z.string(),
    execution_profile: supportedExecutionProfileSchema,
    status: z.enum([
      "completed",
      "failed",
      "timed_out",
      "resource_exceeded",
      "blocked",
      "verification_unavailable",
    ]),
    runner_version: z.string(),
    profile_version: z.string(),
    completed_at: z.string(),
  }),
  evidence: workerRuntimeEvidenceSchema,
  logs: z.array(z.string()),
});
export type WorkerExecuteResponse = z.infer<typeof workerExecuteResponseSchema>;

/**
 * Worker Health Check Response
 */
export interface WorkerHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  backend: string;
  supported_profiles: string[];
  uptime_seconds: number;
  timestamp: string;
}
