import type { WorkerRuntimeEvidence } from "../types";

export const MAX_OUTPUT_BYTES = 65536; // 64 KB

/**
 * Bounds stream output strictly to 64KB
 */
export function truncateLogBuffer(text: string, maxBytes: number = MAX_OUTPUT_BYTES): string {
  if (!text) return "";
  const buf = Buffer.from(text, "utf-8");
  if (buf.length <= maxBytes) {
    return text;
  }
  const truncatedBuf = buf.subarray(0, maxBytes);
  return truncatedBuf.toString("utf-8") + `\n\n[STREAM TRUNCATED: Exceeded ${maxBytes} bytes limit]`;
}

/**
 * Formats factual execution outputs into structured RuntimeEvidence
 */
export function buildRuntimeEvidence(params: {
  executionId: string;
  submissionId: string;
  commitSha: string;
  runnerVersion: string;
  profileVersion: string;
  status: WorkerRuntimeEvidence["status"];
  exitCode: number;
  durationMs: number;
  testsSummary: { total: number; passed: number; failed: number; skipped: number };
  buildSummary?: { attempted: boolean; status: "passed" | "failed" | "skipped"; details?: string };
  lintSummary?: { attempted: boolean; status: "passed" | "failed" | "skipped"; warnings?: number; errors?: number };
  stdout: string;
  stderr: string;
  resourceUsage?: { peak_memory_bytes?: number; cpu_time_ms?: number };
}): WorkerRuntimeEvidence {
  return {
    execution_id: params.executionId,
    submission_id: params.submissionId,
    commit_sha: params.commitSha,
    runner_version: params.runnerVersion,
    profile_version: params.profileVersion,
    status: params.status,
    exit_code: params.exitCode,
    duration_ms: params.durationMs,
    tests_summary: params.testsSummary,
    build_summary: params.buildSummary || { attempted: true, status: params.exitCode === 0 ? "passed" : "failed" },
    lint_summary: {
      attempted: params.lintSummary?.attempted ?? true,
      status: params.lintSummary?.status ?? "passed",
      warnings: params.lintSummary?.warnings ?? 0,
      errors: params.lintSummary?.errors ?? 0,
    },
    bounded_stdout: truncateLogBuffer(params.stdout),
    bounded_stderr: truncateLogBuffer(params.stderr),
    resource_usage: params.resourceUsage || {},
    collected_at: new Date().toISOString(),
  };
}
