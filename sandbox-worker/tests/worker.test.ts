import { describe, it, expect, beforeEach } from "vitest";
import {
  handleHealthCheck,
  handleExecuteJob,
  createWorkerSignature,
  verifyWorkerSignature,
  TIMESTAMP_HEADER,
  SIGNATURE_HEADER,
  WORKER_EXECUTION_POLICIES,
  resolveVerificationCommand,
  truncateLogBuffer,
  MockSandboxBackend,
} from "../src";

describe("NOVA Dedicated Sandbox Worker Service (Phases 3A - 3G)", () => {
  const TEST_SECRET = "test_nova_secret_key_1234567890abcdef";
  let backend: MockSandboxBackend;
  let startTime: number;

  beforeEach(() => {
    backend = new MockSandboxBackend();
    startTime = Date.now();
  });

  describe("1. Worker Health Endpoint (Phase 3A)", () => {
    it("returns healthy status, version, and supported profiles", () => {
      const res = handleHealthCheck(startTime, "MockSandboxBackend");
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("healthy");
      expect(res.body.version).toBe("1.0.0");
      expect(res.body.backend).toBe("MockSandboxBackend");
      expect(res.body.supported_profiles).toEqual(["node_typescript", "python"]);
    });
  });

  describe("2. HMAC-SHA256 Service Authentication (Phase 3B)", () => {
    it("accepts valid signature with fresh timestamp", async () => {
      const timestamp = new Date().toISOString();
      const payload = {
        execution_id: "job_valid_1",
        submission_id: "sub_1",
        repository_url: "https://github.com/student/app",
        commit_sha: "a1b2c3d4e5f67890",
        execution_profile: "node_typescript",
        profile_version: "1.0",
      };
      const rawBody = JSON.stringify(payload);
      const signature = createWorkerSignature(timestamp, rawBody, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob({ headers, rawBody, parsedBody: payload }, TEST_SECRET, backend);
      expect(res.statusCode).toBe(200);
      expect(res.body.job.status).toBe("completed");
      expect(res.body.evidence.exit_code).toBe(0);
    });

    it("rejects request with invalid signature", async () => {
      const timestamp = new Date().toISOString();
      const rawBody = JSON.stringify({ execution_id: "job_bad_sig" });
      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: "sha256=invalid_signature_hex_digest_9999",
      };

      const res = await handleExecuteJob({ headers, rawBody }, TEST_SECRET, backend);
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("rejects request with missing signature header", async () => {
      const timestamp = new Date().toISOString();
      const rawBody = JSON.stringify({ execution_id: "job_no_sig" });
      const headers = { [TIMESTAMP_HEADER]: timestamp };

      const res = await handleExecuteJob({ headers, rawBody }, TEST_SECRET, backend);
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Missing required header 'x-nova-signature'");
    });

    it("rejects request with tampered payload body", async () => {
      const timestamp = new Date().toISOString();
      const rawOriginal = JSON.stringify({ execution_id: "job_orig", score: 50 });
      const rawTampered = JSON.stringify({ execution_id: "job_orig", score: 100 });
      const signature = createWorkerSignature(timestamp, rawOriginal, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob({ headers, rawBody: rawTampered }, TEST_SECRET, backend);
      expect(res.statusCode).toBe(401);
    });

    it("rejects request with expired timestamp (> 300 seconds)", async () => {
      const expiredTimestamp = new Date(Date.now() - 400000).toISOString();
      const rawBody = JSON.stringify({ execution_id: "job_expired" });
      const signature = createWorkerSignature(expiredTimestamp, rawBody, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: expiredTimestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob({ headers, rawBody }, TEST_SECRET, backend);
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("expired or outside tolerance window");
    });
  });

  describe("3. Execution Policy & Profile Validation (Phase 3E)", () => {
    it("strictly resolves node_typescript to approved test command", () => {
      expect(resolveVerificationCommand("node_typescript")).toBe("npm test -- --runInBand --ci");
      expect(WORKER_EXECUTION_POLICIES.node_typescript.workingDirectory).toBe("/workspace");
    });

    it("strictly resolves python to approved pytest command", () => {
      expect(resolveVerificationCommand("python")).toBe("pytest -v --tb=short");
    });

    it("rejects unsupported or arbitrary execution profile", async () => {
      const timestamp = new Date().toISOString();
      const payload = {
        execution_id: "job_unsupported",
        submission_id: "sub_1",
        repository_url: "https://github.com/student/app",
        commit_sha: "a1b2c3d4e5f67890",
        execution_profile: "unsupported_ruby",
      };
      const rawBody = JSON.stringify(payload);
      const signature = createWorkerSignature(timestamp, rawBody, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob({ headers, rawBody }, TEST_SECRET, backend);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Invalid execute request payload");
    });
  });

  describe("4. Commit Verification & SHA Mismatch Handling (Phase 3C)", () => {
    it("produces blocked status when repository commit SHA does not match", async () => {
      const timestamp = new Date().toISOString();
      const payload = {
        execution_id: "job_sha_mismatch",
        submission_id: "sub_mismatch",
        repository_url: "https://github.com/student/app",
        commit_sha: "target_commit_sha_123",
        execution_profile: "node_typescript",
        simulation_flags: ["SIMULATE_SHA_MISMATCH"],
      };
      const rawBody = JSON.stringify(payload);
      const signature = createWorkerSignature(timestamp, rawBody, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob({ headers, rawBody, parsedBody: payload }, TEST_SECRET, backend);
      expect(res.statusCode).toBe(200);
      expect(res.body.job.status).toBe("blocked");
      expect(res.body.evidence.status).toBe("blocked");
      expect(res.body.evidence.bounded_stderr).toContain("Commit SHA mismatch");
      // Zero tests executed on commit mismatch
      expect(res.body.evidence.tests_summary.total).toBe(0);
    });
  });

  describe("5. Ephemeral Lifecycle & Guaranteed Destruction (Phase 3D)", () => {
    it("guarantees full lifecycle (create -> prepare -> verify -> execute -> collect -> destroy)", async () => {
      const timestamp = new Date().toISOString();
      const payload = {
        execution_id: "job_clean_lifecycle",
        submission_id: "sub_clean",
        repository_url: "https://github.com/student/app",
        commit_sha: "clean_sha_1234567",
        execution_profile: "node_typescript",
      };
      const rawBody = JSON.stringify(payload);
      const signature = createWorkerSignature(timestamp, rawBody, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob({ headers, rawBody, parsedBody: payload }, TEST_SECRET, backend);
      expect(res.statusCode).toBe(200);
      expect(res.body.evidence.status).toBe("completed");

      // Verify active instance was cleaned up from active backend map
      expect(backend.activeInstances.size).toBe(0);
      expect(backend.destructionLog.length).toBe(1);
    });

    it("destroys sandbox instance even when execution times out or fails", async () => {
      const timestamp = new Date().toISOString();
      const payload = {
        execution_id: "job_timeout_cleanup",
        submission_id: "sub_timeout",
        repository_url: "https://github.com/student/app",
        commit_sha: "timeout_sha_1234567",
        execution_profile: "node_typescript",
        simulation_flags: ["SIMULATE_TIMEOUT"],
      };
      const rawBody = JSON.stringify(payload);
      const signature = createWorkerSignature(timestamp, rawBody, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob({ headers, rawBody, parsedBody: payload }, TEST_SECRET, backend);
      expect(res.statusCode).toBe(200);
      expect(res.body.evidence.status).toBe("timed_out");
      expect(res.body.evidence.exit_code).toBe(124);

      // Verify sandbox was destroyed despite timeout
      expect(backend.activeInstances.size).toBe(0);
      expect(backend.destructionLog.length).toBe(1);
    });
  });

  describe("6. Resource Limits & Bounded Logs (Phase 3F)", () => {
    it("strictly bounds huge stdout output to 64KB (65536 bytes)", async () => {
      const timestamp = new Date().toISOString();
      const payload = {
        execution_id: "job_huge_logs",
        submission_id: "sub_logs",
        repository_url: "https://github.com/student/app",
        commit_sha: "logs_sha_1234567",
        execution_profile: "node_typescript",
        simulation_flags: ["SIMULATE_HUGE_LOGS"],
      };
      const rawBody = JSON.stringify(payload);
      const signature = createWorkerSignature(timestamp, rawBody, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob({ headers, rawBody, parsedBody: payload }, TEST_SECRET, backend);
      expect(res.statusCode).toBe(200);
      expect(res.body.evidence.bounded_stdout).toContain("[STREAM TRUNCATED: Exceeded 65536 bytes limit]");
      expect(Buffer.from(res.body.evidence.bounded_stdout).length).toBeLessThanOrEqual(66000);
    });

    it("handles OOM resource exhaustion gracefully (status: resource_exceeded, exit code: 137)", async () => {
      const timestamp = new Date().toISOString();
      const payload = {
        execution_id: "job_oom_test",
        submission_id: "sub_oom",
        repository_url: "https://github.com/student/app",
        commit_sha: "oom_sha_1234567",
        execution_profile: "node_typescript",
        simulation_flags: ["SIMULATE_OOM"],
      };
      const rawBody = JSON.stringify(payload);
      const signature = createWorkerSignature(timestamp, rawBody, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob({ headers, rawBody, parsedBody: payload }, TEST_SECRET, backend);
      expect(res.statusCode).toBe(200);
      expect(res.body.evidence.status).toBe("resource_exceeded");
      expect(res.body.evidence.exit_code).toBe(137);
      expect(res.body.evidence.bounded_stderr).toContain("Memory limit exceeded");
    });
  });

  describe("7. Infrastructure Failure Safety (Phase 3F)", () => {
    it("routes VM hypervisor creation error to verification_unavailable", async () => {
      const timestamp = new Date().toISOString();
      const payload = {
        execution_id: "job_hypervisor_down",
        submission_id: "sub_down",
        repository_url: "https://github.com/student/app",
        commit_sha: "down_sha_1234567",
        execution_profile: "node_typescript",
        simulation_flags: ["SIMULATE_VM_CREATION_FAILURE"],
      };
      const rawBody = JSON.stringify(payload);
      const signature = createWorkerSignature(timestamp, rawBody, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob({ headers, rawBody, parsedBody: payload }, TEST_SECRET, backend);
      expect(res.statusCode).toBe(200);
      expect(res.body.job.status).toBe("verification_unavailable");
      expect(res.body.evidence.status).toBe("verification_unavailable");
      expect(res.body.evidence.bounded_stderr).toContain("Hypervisor failure");
    });
  });
});
