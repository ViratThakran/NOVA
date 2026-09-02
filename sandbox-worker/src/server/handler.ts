import type {
  WorkerExecuteRequest,
  WorkerExecuteResponse,
  WorkerHealthResponse,
} from "../types";
import { workerExecuteRequestSchema } from "../types";
import { verifyWorkerSignature } from "../auth/hmac";
import {
  WORKER_EXECUTION_POLICIES,
  resolveVerificationCommand,
  buildSanitizedEnvironment,
  DEFAULT_WORKER_LIMITS,
} from "../policy";
import { buildRuntimeEvidence } from "../evidence/collector";
import type { SandboxLifecycle } from "../sandbox/lifecycle";
import { MockSandboxBackend } from "../sandbox/lifecycle";

export const WORKER_VERSION = "1.0.0";

export interface WorkerHttpRequest {
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
  parsedBody?: any;
}

export interface WorkerHttpResponse {
  statusCode: number;
  body: any;
}

/**
 * Handles GET /health
 */
export function handleHealthCheck(
  startTime: number,
  backendName: string = "MockSandboxBackend"
): WorkerHttpResponse {
  const health: WorkerHealthResponse = {
    status: "healthy",
    version: WORKER_VERSION,
    backend: backendName,
    supported_profiles: Object.keys(WORKER_EXECUTION_POLICIES),
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  };

  return { statusCode: 200, body: health };
}

/**
 * Handles POST /v1/execute
 */
export async function handleExecuteJob(
  req: WorkerHttpRequest,
  secret: string,
  backend: SandboxLifecycle = new MockSandboxBackend()
): Promise<WorkerHttpResponse> {
  const startTime = Date.now();
  const logs: string[] = [];

  // 1. Authenticate Request via HMAC-SHA256 Signature
  const authResult = verifyWorkerSignature(req.headers, req.rawBody, secret);
  if (!authResult.valid) {
    return {
      statusCode: 401,
      body: {
        error: "Unauthorized",
        message: authResult.error || "HMAC signature verification failed",
      },
    };
  }

  // 2. Validate Request Schema
  let parsedPayload: WorkerExecuteRequest;
  try {
    const rawJson = req.parsedBody ?? JSON.parse(req.rawBody);
    parsedPayload = workerExecuteRequestSchema.parse(rawJson);
  } catch (err: any) {
    return {
      statusCode: 400,
      body: {
        error: "Bad Request",
        message: "Invalid execute request payload",
        details: err?.errors || err?.message,
      },
    };
  }

  const {
    execution_id,
    submission_id,
    repository_url,
    commit_sha,
    execution_profile,
    profile_version = "1.0",
    limits = DEFAULT_WORKER_LIMITS,
    simulation_flags = [],
  } = parsedPayload;

  logs.push(`[Worker] Job ${execution_id} accepted for ${execution_profile} at commit ${commit_sha.substring(0, 7)}.`);

  // 3. Ephemeral Sandbox Lifecycle Execution
  let instance: any = null;
  try {
    // A. CREATE Sandbox
    instance = await backend.create(execution_id, execution_profile, limits, simulation_flags);
    logs.push(`[Worker] Disposable sandbox ${instance.id} created.`);

    // B. PREPARE Repository
    await backend.prepare(instance, repository_url, commit_sha);
    logs.push(`[Worker] Repository source prepared.`);

    // C. VERIFY Commit SHA
    const isShaVerified = await backend.verify(instance, commit_sha);
    if (!isShaVerified) {
      logs.push(`[Worker] Commit SHA verification failed: mismatch with ${commit_sha}.`);
      const blockedEvidence = buildRuntimeEvidence({
        executionId: execution_id,
        submissionId: submission_id,
        commitSha: commit_sha,
        runnerVersion: WORKER_VERSION,
        profileVersion: profile_version,
        status: "blocked",
        exitCode: 1,
        durationMs: Date.now() - startTime,
        testsSummary: { total: 0, passed: 0, failed: 0, skipped: 0 },
        buildSummary: { attempted: false, status: "failed", details: "Commit SHA verification failed" },
        lintSummary: { attempted: false, status: "skipped" },
        stdout: "",
        stderr: `Commit SHA mismatch: requested ${commit_sha} but repository tree did not match.`,
      });

      const response: WorkerExecuteResponse = {
        job: {
          id: execution_id,
          submission_id,
          commit_sha,
          execution_profile,
          status: "blocked",
          runner_version: WORKER_VERSION,
          profile_version,
          completed_at: new Date().toISOString(),
        },
        evidence: blockedEvidence,
        logs,
      };

      return { statusCode: 200, body: response };
    }

    // D. EXECUTE Allowlisted Verification Command
    const command = resolveVerificationCommand(execution_profile);
    const sanitizedEnv = buildSanitizedEnvironment();
    logs.push(`[Worker] Executing verified command: '${command}' under NETWORK=DENY.`);

    const rawExecResult = await backend.execute(instance, command, sanitizedEnv);

    // E. COLLECT Structured Output
    const collected = await backend.collect(instance, rawExecResult);
    logs.push(`[Worker] Execution finished with exit code ${collected.exitCode} (${collected.status}).`);

    const evidence = buildRuntimeEvidence({
      executionId: execution_id,
      submissionId: submission_id,
      commitSha: commit_sha,
      runnerVersion: WORKER_VERSION,
      profileVersion: profile_version,
      status: collected.status,
      exitCode: collected.exitCode,
      durationMs: collected.durationMs,
      testsSummary: collected.tests,
      stdout: collected.stdout,
      stderr: collected.stderr,
      resourceUsage: collected.resourceUsage,
    });

    const response: WorkerExecuteResponse = {
      job: {
        id: execution_id,
        submission_id,
        commit_sha,
        execution_profile,
        status: collected.status,
        runner_version: WORKER_VERSION,
        profile_version,
        completed_at: new Date().toISOString(),
      },
      evidence,
      logs,
    };

    return { statusCode: 200, body: response };
  } catch (err: any) {
    logs.push(`[Worker] Infrastructure failure: ${err?.message || err}`);

    const unavailableEvidence = buildRuntimeEvidence({
      executionId: execution_id,
      submissionId: submission_id,
      commitSha: commit_sha,
      runnerVersion: WORKER_VERSION,
      profileVersion: profile_version,
      status: "verification_unavailable",
      exitCode: 1,
      durationMs: Date.now() - startTime,
      testsSummary: { total: 0, passed: 0, failed: 0, skipped: 0 },
      buildSummary: { attempted: false, status: "skipped", details: `Infrastructure error: ${err?.message || err}` },
      lintSummary: { attempted: false, status: "skipped" },
      stdout: "",
      stderr: `Sandbox Worker Error: ${err?.message || err}`,
    });

    const response: WorkerExecuteResponse = {
      job: {
        id: execution_id,
        submission_id,
        commit_sha,
        execution_profile,
        status: "verification_unavailable",
        runner_version: WORKER_VERSION,
        profile_version,
        completed_at: new Date().toISOString(),
      },
      evidence: unavailableEvidence,
      logs,
    };

    return { statusCode: 200, body: response };
  } finally {
    // F. GUARANTEED DESTROY Cleanup
    if (instance) {
      try {
        await backend.destroy(instance);
        logs.push(`[Worker] Disposable sandbox ${instance.id} destroyed.`);
      } catch (cleanupErr: any) {
        logs.push(`[Worker] Warning: cleanup error on ${instance.id}: ${cleanupErr?.message || cleanupErr}`);
      }
    }
  }
}
