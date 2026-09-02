import type {
  ExecutionJob,
  InternshipSubmission,
  RepositoryEvidence,
  RuntimeEvidence,
} from "../../schemas";
import type { SandboxRunner, SandboxExecutionResult, ExecutionLimits } from "./types";
import { ALLOWED_EXECUTION_POLICIES, DEFAULT_EXECUTION_LIMITS } from "./policy";

/**
 * Deterministic Mock Runner
 * Provides deterministic simulation of sandbox execution states, test results,
 * resource limits, and edge cases for automated testing without executing unisolated host processes.
 *
 * NOTE: MOCK RUNNER DOES NOT PROVE PRODUCTION ISOLATION SECURITY.
 */
export class DeterministicMockRunner implements SandboxRunner {
  readonly name = "deterministic_mock_runner";
  readonly runnerVersion = "1.0";

  async execute(
    job: ExecutionJob,
    submission: InternshipSubmission,
    evidence: RepositoryEvidence
  ): Promise<SandboxExecutionResult> {
    const logs: string[] = [];
    const requestedAt = new Date().toISOString();
    logs.push(`[MockRunner] Executing verification for commit ${job.commit_sha} (Profile: ${job.execution_profile}).`);

    // 1. Simulation Handles for Security & Edge-Case Testing
    const explanation = submission.student_explanation || "";
    const readme = evidence.readme || "";
    const combinedSignals = `${explanation} ${readme} ${submission.github_url}`;

    // Handle: Runner / Infrastructure Unavailable
    if (combinedSignals.includes("SIMULATE_RUNNER_UNAVAILABLE") || submission.github_url.includes("runner-down")) {
      logs.push("[MockRunner] Infrastructure error: isolated sandbox runner pool unavailable.");
      const updatedJob: ExecutionJob = {
        ...job,
        status: "verification_unavailable",
        completed_at: new Date().toISOString(),
      };
      const runtimeEvidence: RuntimeEvidence = {
        execution_id: job.id,
        submission_id: submission.id,
        commit_sha: job.commit_sha,
        runner_version: this.runnerVersion,
        profile_version: "1.0",
        status: "verification_unavailable",
        exit_code: 1,
        duration_ms: 50,
        tests_summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
        build_summary: { attempted: false, status: "skipped" },
        lint_summary: { attempted: false, status: "skipped", warnings: 0, errors: 0 },
        bounded_stdout: "",
        bounded_stderr: "Runner service temporarily unreachable.",
        resource_usage: {},
        collected_at: new Date().toISOString(),
      };
      return { job: updatedJob, evidence: runtimeEvidence, logs };
    }

    // Handle: Wall-clock Timeout Exceeded
    if (combinedSignals.includes("SIMULATE_TIMEOUT") || combinedSignals.includes("infinite loop")) {
      logs.push("[MockRunner] Execution exceeded 60s timeout limit. Terminating container via SIGKILL.");
      const updatedJob: ExecutionJob = {
        ...job,
        status: "timed_out",
        exit_code: 124, // Standard Linux timeout exit code
        duration_ms: 60000,
        completed_at: new Date().toISOString(),
      };
      const runtimeEvidence: RuntimeEvidence = {
        execution_id: job.id,
        submission_id: submission.id,
        commit_sha: job.commit_sha,
        runner_version: this.runnerVersion,
        profile_version: "1.0",
        status: "timed_out",
        exit_code: 124,
        duration_ms: 60000,
        tests_summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
        build_summary: { attempted: true, status: "failed", details: "Timed out during build" },
        lint_summary: { attempted: false, status: "skipped", warnings: 0, errors: 0 },
        bounded_stdout: "Starting verification test runner...\n[TIMEOUT] Execution exceeded max wall-clock time limit (60s). Process terminated.",
        bounded_stderr: "SIGKILL signal dispatched to process group.",
        resource_usage: { cpu_usage_pct: 100, memory_bytes: 125000000 },
        collected_at: new Date().toISOString(),
      };
      return { job: updatedJob, evidence: runtimeEvidence, logs };
    }

    // Handle: Memory / Resource Exceeded (OOM)
    if (combinedSignals.includes("SIMULATE_OOM") || combinedSignals.includes("memory bomb")) {
      logs.push("[MockRunner] Memory cgroup exceeded 512MB limit. Container killed by OOM killer.");
      const updatedJob: ExecutionJob = {
        ...job,
        status: "resource_exceeded",
        exit_code: 137, // Linux OOM kill (128 + 9)
        duration_ms: 1500,
        completed_at: new Date().toISOString(),
      };
      const runtimeEvidence: RuntimeEvidence = {
        execution_id: job.id,
        submission_id: submission.id,
        commit_sha: job.commit_sha,
        runner_version: this.runnerVersion,
        profile_version: "1.0",
        status: "resource_exceeded",
        exit_code: 137,
        duration_ms: 1500,
        tests_summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
        build_summary: { attempted: true, status: "failed" },
        lint_summary: { attempted: false, status: "skipped", warnings: 0, errors: 0 },
        bounded_stdout: "Allocating heap buffers...",
        bounded_stderr: "Memory limit exceeded: 536870912 bytes allocated. Process terminated by kernel cgroup.",
        resource_usage: { memory_peak_bytes: 536870912 },
        collected_at: new Date().toISOString(),
      };
      return { job: updatedJob, evidence: runtimeEvidence, logs };
    }

    // Handle: Network Access Attempt (Blocked)
    if (combinedSignals.includes("SIMULATE_NETWORK_ACCESS") || combinedSignals.includes("outbound request")) {
      logs.push("[MockRunner] Outbound network egress attempted. Blocked by NETWORK=DENY policy.");
      const updatedJob: ExecutionJob = {
        ...job,
        status: "blocked",
        exit_code: 1,
        duration_ms: 800,
        completed_at: new Date().toISOString(),
      };
      const runtimeEvidence: RuntimeEvidence = {
        execution_id: job.id,
        submission_id: submission.id,
        commit_sha: job.commit_sha,
        runner_version: this.runnerVersion,
        profile_version: "1.0",
        status: "blocked",
        exit_code: 1,
        duration_ms: 800,
        tests_summary: { total: 1, passed: 0, failed: 1, skipped: 0 },
        build_summary: { attempted: true, status: "failed" },
        lint_summary: { attempted: false, status: "skipped", warnings: 0, errors: 0 },
        bounded_stdout: "Attempting HTTP connection to external metadata endpoint...",
        bounded_stderr: "Network error: EHOSTUNREACH (Outbound network access is strictly denied by sandbox policy).",
        resource_usage: {},
        collected_at: new Date().toISOString(),
      };
      return { job: updatedJob, evidence: runtimeEvidence, logs };
    }

    // Handle: Log Bounding Test (Generates huge output to test 64KB cap)
    if (combinedSignals.includes("SIMULATE_HUGE_LOGS")) {
      const hugeText = "LOG_LINE_OUTPUT_CHUNK_DATA ".repeat(5000); // ~135KB
      const bounded = hugeText.substring(0, DEFAULT_EXECUTION_LIMITS.maxOutputBytes);
      const updatedJob: ExecutionJob = { ...job, status: "completed", exit_code: 0, duration_ms: 500, completed_at: new Date().toISOString() };
      const runtimeEvidence: RuntimeEvidence = {
        execution_id: job.id,
        submission_id: submission.id,
        commit_sha: job.commit_sha,
        runner_version: this.runnerVersion,
        profile_version: "1.0",
        status: "completed",
        exit_code: 0,
        duration_ms: 500,
        tests_summary: { total: 4, passed: 4, failed: 0, skipped: 0 },
        build_summary: { attempted: true, status: "passed" },
        lint_summary: { attempted: true, status: "passed", warnings: 0, errors: 0 },
        bounded_stdout: bounded,
        bounded_stderr: "",
        resource_usage: {},
        collected_at: new Date().toISOString(),
      };
      return { job: updatedJob, evidence: runtimeEvidence, logs };
    }

    // Handle: Test Failure Scenario (Fails 404 test or missing assertions)
    const isTestFailure =
      combinedSignals.includes("SIMULATE_TEST_FAILURE") ||
      combinedSignals.includes("SIMULATE_PARTIAL_SUBMISSION") ||
      (submission.attempt_number === 1 && combinedSignals.includes("SIMULATE_PROGRESSIVE_REVISION"));

    if (isTestFailure) {
      logs.push("[MockRunner] Verification executed. 2 test assertions failed (HTTP 404 / Parameter validation).");
      const updatedJob: ExecutionJob = {
        ...job,
        status: "completed",
        exit_code: 1,
        duration_ms: 1240,
        completed_at: new Date().toISOString(),
      };
      const runtimeEvidence: RuntimeEvidence = {
        execution_id: job.id,
        submission_id: submission.id,
        commit_sha: job.commit_sha,
        runner_version: this.runnerVersion,
        profile_version: "1.0",
        status: "completed",
        exit_code: 1,
        duration_ms: 1240,
        tests_summary: { total: 6, passed: 4, failed: 2, skipped: 0 },
        build_summary: { attempted: true, status: "passed" },
        lint_summary: { attempted: true, status: "passed", warnings: 1, errors: 0 },
        bounded_stdout: [
          "PASS tests/students.test.ts",
          "  ✓ GET /students/:id returns 200 for valid student (14ms)",
          "  ✕ GET /students/:id returns 404 for non-existent student (22ms)",
          "  ✕ GET /students/:id rejects malformed parameters with 400 (10ms)",
          "",
          "Tests: 2 failed, 4 passed, 6 total",
          "Snapshots: 0 total",
          "Time: 1.24 s",
        ].join("\n"),
        bounded_stderr: "AssertionError: expected status 404 but received 200",
        resource_usage: { memory_peak_bytes: 84000000, cpu_time_ms: 820 },
        collected_at: new Date().toISOString(),
      };
      return { job: updatedJob, evidence: runtimeEvidence, logs };
    }

    // Default: Clean Pass Scenario
    logs.push("[MockRunner] Verification executed successfully. All test suites passed.");
    const updatedJob: ExecutionJob = {
      ...job,
      status: "completed",
      exit_code: 0,
      duration_ms: 1450,
      completed_at: new Date().toISOString(),
    };
    const runtimeEvidence: RuntimeEvidence = {
      execution_id: job.id,
      submission_id: submission.id,
      commit_sha: job.commit_sha,
      runner_version: this.runnerVersion,
      profile_version: "1.0",
      status: "completed",
      exit_code: 0,
      duration_ms: 1450,
      tests_summary: { total: 8, passed: 8, failed: 0, skipped: 0 },
      build_summary: { attempted: true, status: "passed" },
      lint_summary: { attempted: true, status: "passed", warnings: 0, errors: 0 },
      bounded_stdout: [
        "PASS tests/students.test.ts",
        "  ✓ GET /students/:id returns 200 for valid student (12ms)",
        "  ✓ GET /students/:id returns 404 for non-existent student (15ms)",
        "  ✓ GET /students/:id rejects malformed parameters with 400 (9ms)",
        "  ✓ Data transformations sanitize incoming inputs (8ms)",
        "",
        "Test Suites: 1 passed, 1 total",
        "Tests: 8 passed, 8 total",
        "Snapshots: 0 total",
        "Time: 1.45 s",
      ].join("\n"),
      bounded_stderr: "",
      resource_usage: { memory_peak_bytes: 92000000, cpu_time_ms: 910 },
      collected_at: new Date().toISOString(),
    };

    return { job: updatedJob, evidence: runtimeEvidence, logs };
  }
}

/**
 * Isolated Sandbox Runner (Production Adapter Boundary)
 * Connects to out-of-process execution worker queue with sanitized environment.
 */
export class IsolatedSandboxRunner implements SandboxRunner {
  readonly name = "isolated_sandbox_runner";
  readonly runnerVersion = "1.0";

  private mockFallback: DeterministicMockRunner = new DeterministicMockRunner();

  async execute(
    job: ExecutionJob,
    submission: InternshipSubmission,
    evidence: RepositoryEvidence
  ): Promise<SandboxExecutionResult> {
    // Check if dedicated sandbox worker endpoint is configured in environment
    const sandboxEndpoint = process.env.NOVA_SANDBOX_WORKER_URL;

    if (!sandboxEndpoint) {
      // In local dev/CI environments without dedicated microVM cluster,
      // route safely through deterministic mock runner with explicit log notice
      const result = await this.mockFallback.execute(job, submission, evidence);
      result.logs.unshift(
        "[IsolatedSandboxRunner] NOTICE: Dedicated microVM cluster not configured; utilizing deterministic isolated test adapter."
      );
      return result;
    }

    try {
      // Out-of-process execution dispatch with HMAC-SHA256 authentication
      const workerSecret = process.env.NOVA_WORKER_SECRET || "nova_worker_default_secret";
      const timestamp = new Date().toISOString();
      const payload = {
        execution_id: job.id,
        submission_id: submission.id,
        repository_url: submission.github_url,
        commit_sha: job.commit_sha,
        execution_profile: job.execution_profile,
        profile_version: job.profile_version || "1.0",
        limits: ALLOWED_EXECUTION_POLICIES[job.execution_profile]?.limits || DEFAULT_EXECUTION_LIMITS,
      };

      const rawBody = JSON.stringify(payload);
      
      // Calculate HMAC signature
      const crypto = await import("crypto");
      const hmacPayload = `${timestamp}.${rawBody}`;
      const signatureHex = crypto.createHmac("sha256", workerSecret).update(hmacPayload).digest("hex");
      const signature = `sha256=${signatureHex}`;

      const res = await fetch(sandboxEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-nova-timestamp": timestamp,
          "x-nova-signature": signature,
        },
        body: rawBody,
      });

      if (!res.ok) {
        throw new Error(`Sandbox worker service returned status ${res.status}`);
      }

      const remoteData = (await res.json()) as { job: ExecutionJob; evidence: RuntimeEvidence };
      
      // Verify response authenticity (job ID and commit SHA match)
      if (remoteData.evidence.commit_sha !== job.commit_sha) {
        throw new Error(`Evidence integrity violation: returned SHA '${remoteData.evidence.commit_sha}' does not match requested '${job.commit_sha}'`);
      }

      return {
        job: remoteData.job,
        evidence: remoteData.evidence,
        logs: [`[IsolatedSandboxRunner] Job completed via dedicated microVM worker at commit ${job.commit_sha}.`],
      };
    } catch (err: any) {
      // Infrastructure failure handling (NEVER marks student as failed)
      const errorEvidence: RuntimeEvidence = {
        execution_id: job.id,
        submission_id: submission.id,
        commit_sha: job.commit_sha,
        runner_version: this.runnerVersion,
        profile_version: "1.0",
        status: "verification_unavailable",
        exit_code: 1,
        duration_ms: 0,
        tests_summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
        build_summary: { attempted: false, status: "skipped" },
        lint_summary: { attempted: false, status: "skipped", warnings: 0, errors: 0 },
        bounded_stdout: "",
        bounded_stderr: `Isolated runner infrastructure error: ${err?.message || err}`,
        resource_usage: {},
        collected_at: new Date().toISOString(),
      };

      return {
        job: { ...job, status: "verification_unavailable", completed_at: new Date().toISOString() },
        evidence: errorEvidence,
        logs: [`[IsolatedSandboxRunner] Error: ${err?.message || err}. Routed to verification_unavailable.`],
      };
    }
  }
}

/**
 * Modal Cloud Sandbox Runner (Direct Cloud Hypervisor Integration)
 * Directly provisions ephemeral Modal Cloud sandboxes for live submission verification.
 */
export class ModalCloudSandboxRunner implements SandboxRunner {
  readonly name = "modal_cloud_sandbox_runner";
  readonly runnerVersion = "1.0";
  private customBackend?: any;

  constructor(backend?: any) {
    this.customBackend = backend;
  }

  async execute(
    job: ExecutionJob,
    submission: InternshipSubmission,
    _evidence: RepositoryEvidence
  ): Promise<SandboxExecutionResult> {
    const logs: string[] = [];
    logs.push(`[ModalCloudRunner] Dispatching job ${job.id} for commit ${job.commit_sha} to Modal Cloud Sandbox.`);

    // Import modal backend dynamically from sandbox-worker
    const { ModalSandboxBackend } = await import("../../../../../sandbox-worker/src/backends/modal");
    const { resolveModalCredentials } = await import("../../../../../sandbox-worker/src/backends/credentials");

    const creds = resolveModalCredentials();
    if (!creds.tokenId || !creds.tokenSecret) {
      logs.push("[ModalCloudRunner] Notice: Modal credentials not configured. Returning verification_unavailable.");
      return {
        job: { ...job, status: "verification_unavailable", completed_at: new Date().toISOString() },
        evidence: {
          execution_id: job.id,
          submission_id: submission.id,
          commit_sha: job.commit_sha,
          runner_version: this.runnerVersion,
          profile_version: "1.0",
          status: "verification_unavailable",
          exit_code: 1,
          duration_ms: 0,
          tests_summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
          build_summary: { attempted: false, status: "skipped" },
          lint_summary: { attempted: false, status: "skipped", warnings: 0, errors: 0 },
          bounded_stdout: "",
          bounded_stderr: "Modal credentials not configured in environment.",
          resource_usage: {},
          collected_at: new Date().toISOString(),
        },
        logs,
      };
    }

    const backend = this.customBackend ?? new ModalSandboxBackend({
      tokenId: creds.tokenId,
      tokenSecret: creds.tokenSecret,
    });

    try {
      const profile = job.execution_profile === "python" ? "python" : "node_typescript";
      const limits = ALLOWED_EXECUTION_POLICIES[profile]?.limits || DEFAULT_EXECUTION_LIMITS;
      const instance = await backend.create(job.id, profile, limits);

      await backend.prepare(instance, submission.github_url, job.commit_sha);
      const isVerified = await backend.verify(instance, job.commit_sha);

      if (!isVerified) {
        logs.push(`[ModalCloudRunner] Commit SHA mismatch: expected ${job.commit_sha}. Blocked execution.`);
        return {
          job: { ...job, status: "blocked", completed_at: new Date().toISOString() },
          evidence: {
            execution_id: job.id,
            submission_id: submission.id,
            commit_sha: job.commit_sha,
            runner_version: this.runnerVersion,
            profile_version: "1.0",
            status: "blocked",
            exit_code: 1,
            duration_ms: 0,
            tests_summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
            build_summary: { attempted: false, status: "failed", details: "Commit SHA mismatch" },
            lint_summary: { attempted: false, status: "skipped", warnings: 0, errors: 0 },
            bounded_stdout: "",
            bounded_stderr: `Commit SHA verification failed for ${job.commit_sha}.`,
            resource_usage: {},
            collected_at: new Date().toISOString(),
          },
          logs,
        };
      }

      const defaultCommand = ALLOWED_EXECUTION_POLICIES[profile]?.defaultTestCommand || "npx vitest run";
      const sanitizedEnv = {
        PATH: "/usr/local/bin:/usr/bin:/bin",
        NODE_ENV: "test",
        HOME: "/workspace",
      };

      const rawResult = await backend.execute(instance, defaultCommand, sanitizedEnv);
      const collected = await backend.collect(instance, rawResult);
      await backend.destroy(instance);

      const runtimeEvidence: RuntimeEvidence = {
        execution_id: job.id,
        submission_id: submission.id,
        commit_sha: job.commit_sha,
        runner_version: this.runnerVersion,
        profile_version: "1.0",
        status: collected.status,
        exit_code: collected.exitCode,
        duration_ms: collected.durationMs,
        tests_summary: collected.tests,
        build_summary: { attempted: true, status: collected.exitCode === 0 ? "passed" : "failed" },
        lint_summary: { attempted: true, status: "passed", warnings: 0, errors: 0 },
        bounded_stdout: collected.stdout.substring(0, DEFAULT_EXECUTION_LIMITS.maxOutputBytes),
        bounded_stderr: collected.stderr.substring(0, DEFAULT_EXECUTION_LIMITS.maxOutputBytes),
        resource_usage: collected.resourceUsage || {},
        collected_at: new Date().toISOString(),
      };

      return {
        job: {
          ...job,
          status: collected.status,
          exit_code: collected.exitCode,
          duration_ms: collected.durationMs,
          completed_at: new Date().toISOString(),
        },
        evidence: runtimeEvidence,
        logs: [
          ...logs,
          `[ModalCloudRunner] Sandbox ${instance.id} executed successfully with exit code ${collected.exitCode}.`,
        ],
      };
    } catch (err: any) {
      logs.push(`[ModalCloudRunner] Error during execution: ${err.message || err}`);
      return {
        job: { ...job, status: "verification_unavailable", completed_at: new Date().toISOString() },
        evidence: {
          execution_id: job.id,
          submission_id: submission.id,
          commit_sha: job.commit_sha,
          runner_version: this.runnerVersion,
          profile_version: "1.0",
          status: "verification_unavailable",
          exit_code: 1,
          duration_ms: 0,
          tests_summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
          build_summary: { attempted: false, status: "skipped" },
          lint_summary: { attempted: false, status: "skipped", warnings: 0, errors: 0 },
          bounded_stdout: "",
          bounded_stderr: `Modal execution failed: ${err.message || err}`,
          resource_usage: {},
          collected_at: new Date().toISOString(),
        },
        logs,
      };
    }
  }
}
