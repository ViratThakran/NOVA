import { describe, it, expect, beforeEach } from "vitest";
import {
  ModalSandboxBackend,
  MODAL_PROFILE_IMAGES,
  handleExecuteJob,
  createWorkerSignature,
  TIMESTAMP_HEADER,
  SIGNATURE_HEADER,
  getSandboxBackend,
} from "../src";

describe("Phase 3H: Modal Sandbox Backend Integration", () => {
  const TEST_SECRET = "test_nova_modal_secret_key_9876543210fedcba";
  let modalBackend: ModalSandboxBackend;

  beforeEach(() => {
    modalBackend = new ModalSandboxBackend({
      tokenId: "mock_modal_token_id_123",
      tokenSecret: "mock_modal_token_secret_456",
      appName: "nova-internship-mentor-test",
    });
  });

  describe("1. Backend Factory & Configuration", () => {
    it("returns MockSandboxBackend by default when backendType is unset", () => {
      const backend = getSandboxBackend("mock");
      expect(backend.constructor.name).toBe("MockSandboxBackend");
    });

    it("returns ModalSandboxBackend when backendType is 'modal'", () => {
      const backend = getSandboxBackend("modal");
      expect(backend.constructor.name).toBe("ModalSandboxBackend");
    });

    it("maps approved profiles to controlled pre-baked Modal container images", () => {
      expect(MODAL_PROFILE_IMAGES.node_typescript).toBe("nova-modal-node20-jest:latest");
      expect(MODAL_PROFILE_IMAGES.python).toBe("nova-modal-python311-pytest:latest");
    });
  });

  describe("2. Modal Sandbox Lifecycle Execution", () => {
    it("executes Node/TypeScript verification cleanly through Modal adapter", async () => {
      const timestamp = new Date().toISOString();
      const payload = {
        execution_id: "modal_job_node_1",
        submission_id: "modal_sub_1",
        repository_url: "https://github.com/student/fullstack-app",
        commit_sha: "a1b2c3d4e5f67890",
        execution_profile: "node_typescript" as const,
        profile_version: "1.0",
        simulation_flags: ["TEST_MODAL_ADAPTER"],
      };
      const rawBody = JSON.stringify(payload);
      const signature = createWorkerSignature(timestamp, rawBody, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob(
        { headers, rawBody, parsedBody: payload },
        TEST_SECRET,
        modalBackend
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.job.status).toBe("completed");
      expect(res.body.evidence.exit_code).toBe(0);
      expect(res.body.evidence.tests_summary.passed).toBe(8);
      expect(res.body.evidence.bounded_stdout).toContain("PASS tests/app.test.ts");

      // Verify Modal sandbox instance was destroyed on completion
      expect(modalBackend.activeSandboxes.size).toBe(0);
      expect(modalBackend.destructionLog.length).toBe(1);
    });

    it("executes Python verification cleanly through Modal adapter", async () => {
      const timestamp = new Date().toISOString();
      const payload = {
        execution_id: "modal_job_py_1",
        submission_id: "modal_sub_2",
        repository_url: "https://github.com/student/data-cleaning",
        commit_sha: "b2c3d4e5f6789012",
        execution_profile: "python" as const,
        profile_version: "1.0",
        simulation_flags: ["TEST_MODAL_ADAPTER"],
      };
      const rawBody = JSON.stringify(payload);
      const signature = createWorkerSignature(timestamp, rawBody, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob(
        { headers, rawBody, parsedBody: payload },
        TEST_SECRET,
        modalBackend
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.job.status).toBe("completed");
      expect(res.body.evidence.exit_code).toBe(0);
      expect(res.body.evidence.tests_summary.passed).toBe(8);
      expect(res.body.evidence.bounded_stdout).toContain("8 passed in");

      expect(modalBackend.activeSandboxes.size).toBe(0);
      expect(modalBackend.destructionLog.length).toBe(1);
    });
  });

  describe("3. Modal Infrastructure Failure Handling", () => {
    it("handles Modal API downtime gracefully producing status 'verification_unavailable'", async () => {
      const timestamp = new Date().toISOString();
      const payload = {
        execution_id: "modal_job_down",
        submission_id: "modal_sub_down",
        repository_url: "https://github.com/student/app",
        commit_sha: "c3d4e5f678901234",
        execution_profile: "node_typescript" as const,
        simulation_flags: ["SIMULATE_MODAL_API_UNAVAILABLE"],
      };
      const rawBody = JSON.stringify(payload);
      const signature = createWorkerSignature(timestamp, rawBody, TEST_SECRET);

      const headers = {
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      };

      const res = await handleExecuteJob(
        { headers, rawBody, parsedBody: payload },
        TEST_SECRET,
        modalBackend
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.job.status).toBe("verification_unavailable");
      expect(res.body.evidence.status).toBe("verification_unavailable");
      expect(res.body.evidence.bounded_stderr).toContain("Modal API unavailable");
    });
  });
});
