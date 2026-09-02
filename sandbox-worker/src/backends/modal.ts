import type { ExecutionLimits, SupportedExecutionProfile } from "../types";
import type {
  SandboxLifecycle,
  SandboxInstance,
  RawExecutionResult,
  CollectedOutput,
} from "../sandbox/lifecycle";
import type { ModalBackendConfig } from "./types";
import { prepareRepositoryWorkspace, verifyCommitSha } from "../repository/fetcher";
import { resolveModalCredentials } from "./credentials";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

/**
 * Modal Image Identifiers for approved verification profiles
 */
export const MODAL_PROFILE_IMAGES: Record<SupportedExecutionProfile, string> = {
  node_typescript: "nova-modal-node20-jest:latest",
  python: "nova-modal-python311-pytest:latest",
};

/**
 * Resolves the python executable to invoke Modal SDK
 */
function resolvePythonCommand(): { cmd: string; args: string[] } {
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return { cmd: process.env.PYTHON_PATH, args: [] };
  }
  const defaultWinPython = "C:\\Users\\virat\\AppData\\Local\\Programs\\Python\\Python310\\python.exe";
  if (fs.existsSync(defaultWinPython)) {
    return { cmd: defaultWinPython, args: [] };
  }
  return { cmd: "py", args: [] };
}

/**
 * Executes Modal runner python bridge for genuine cloud container execution
 */
async function invokeModalCloudRunner(payload: any): Promise<{
  sandbox_id: string;
  status: "completed" | "failed" | "timed_out" | "resource_exceeded" | "blocked";
  exit_code: number;
  create_duration_ms: number;
  exec_duration_ms: number;
  total_duration_ms: number;
  stdout: string;
  stderr: string;
  tests: { total: number; passed: number; failed: number; skipped: number };
  runtime_nonce?: string;
}> {
  return new Promise((resolve, reject) => {
    const { cmd, args } = resolvePythonCommand();
    const scriptPath = path.join(__dirname, "modal_runner.py");

    const child = spawn(cmd, [...args, scriptPath], {
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
      },
    });

    let stdoutBuffer = "";
    let stderrBuffer = "";

    child.stdout.setEncoding("utf-8");
    child.stderr.setEncoding("utf-8");

    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderrBuffer += chunk;
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to spawn Modal Python bridge runner: ${err.message}`));
    });

    child.on("close", (code) => {
      const trimmed = stdoutBuffer.trim();
      if (trimmed) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.error && parsed.status === "verification_unavailable") {
            return reject(new Error(`Modal Cloud Execution Error: ${parsed.error}\n${parsed.traceback || ""}`));
          }
          return resolve(parsed);
        } catch {
          return reject(
            new Error(`Failed to parse Modal bridge output: ${stdoutBuffer.substring(0, 500)}\nStderr: ${stderrBuffer}`)
          );
        }
      }
      return reject(new Error(`Modal runner exited with code ${code} without output. Stderr: ${stderrBuffer}`));
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

/**
 * ModalSandboxBackend
 * Real cloud isolated execution adapter using official Modal Sandbox containers.
 *
 * Guaranteed Properties:
 * 1. Hardware Container/VM Boundary: Executes untrusted code inside isolated Modal cloud hypervisors.
 * 2. Network Denial: Configured with `block_network: true` by default.
 * 3. Minimal Environment: Only explicit non-sensitive variables passed (PATH, NODE_ENV=test).
 * 4. Resource Caps: Enforces vCPU, Memory, Hard Timeout, and Output Buffer limits.
 * 5. Guaranteed Cleanup: Sandboxes terminated on completion or failure.
 */
export class ModalSandboxBackend implements SandboxLifecycle {
  private config: ModalBackendConfig;
  public activeSandboxes = new Map<string, any>();
  public destructionLog: string[] = [];

  constructor(config?: ModalBackendConfig) {
    const resolved = resolveModalCredentials();
    this.config = {
      tokenId: config?.tokenId || resolved.tokenId,
      tokenSecret: config?.tokenSecret || resolved.tokenSecret,
      environment: config?.environment || process.env.MODAL_ENVIRONMENT || "main",
      apiEndpoint: config?.apiEndpoint || process.env.MODAL_API_ENDPOINT || "https://api.modal.com",
      appName: config?.appName || process.env.MODAL_APP_NAME || "nova-internship-mentor",
    };
  }

  public isConfigured(): boolean {
    return Boolean(this.config.tokenId && this.config.tokenSecret);
  }

  async create(
    jobId: string,
    profile: SupportedExecutionProfile,
    limits: ExecutionLimits,
    simulationFlags: string[] = []
  ): Promise<SandboxInstance> {
    if (simulationFlags.includes("SIMULATE_MODAL_API_UNAVAILABLE")) {
      throw new Error("Modal API unavailable: connection timeout to api.modal.com");
    }

    if (!this.isConfigured() && !simulationFlags.includes("TEST_MODAL_ADAPTER")) {
      throw new Error(
        "ModalSandboxBackend is not configured. Missing MODAL_TOKEN_ID or MODAL_TOKEN_SECRET in worker environment."
      );
    }

    const instance: SandboxInstance = {
      id: `sb_pending_${jobId}_${Date.now()}`,
      profile,
      limits,
      workspacePath: "/workspace",
      status: "created",
      createdAt: new Date().toISOString(),
      simulationFlags,
    };

    this.activeSandboxes.set(instance.id, {
      instance,
      createdAt: Date.now(),
    });

    return instance;
  }

  async prepare(instance: SandboxInstance, repoUrl: string, commitSha: string): Promise<void> {
    const res = await prepareRepositoryWorkspace(repoUrl, commitSha, instance.simulationFlags);
    if (!res.verified) {
      if (res.actualCommitSha) {
        instance.actualCommitSha = res.actualCommitSha;
        instance.status = "prepared";
        return;
      }
      throw new Error(res.error || "Repository acquisition failed in Modal workspace");
    }
    instance.actualCommitSha = res.actualCommitSha;
    if (res.sourcePath && fs.existsSync(res.sourcePath)) {
      instance.workspacePath = res.sourcePath;
    }
    instance.status = "prepared";
  }

  async verify(instance: SandboxInstance, commitSha: string): Promise<boolean> {
    const isValid = verifyCommitSha(instance.actualCommitSha || "", commitSha);
    if (isValid) {
      instance.status = "verified";
    }
    return isValid;
  }

  async execute(
    instance: SandboxInstance,
    command: string,
    env: Record<string, string>
  ): Promise<RawExecutionResult> {
    instance.status = "executing";

    // Unit test fast path: only when TEST_MODAL_ADAPTER flag is explicitly set in unit tests
    if (instance.simulationFlags.includes("TEST_MODAL_ADAPTER")) {
      const flags = instance.simulationFlags;
      if (flags.includes("SIMULATE_TIMEOUT")) {
        return {
          status: "timed_out",
          exitCode: 124,
          durationMs: instance.limits.timeoutSeconds * 1000,
          stdout: `[Modal Sandbox ${instance.id}] Executing ${command}...\n[TIMEOUT] Reached ${instance.limits.timeoutSeconds}s wall-clock limit.`,
          stderr: "Modal container terminated by hypervisor timeout controller.",
          tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
          resourceUsage: { cpu_time_ms: instance.limits.timeoutSeconds * 1000 },
        };
      }

      if (flags.includes("SIMULATE_OOM")) {
        return {
          status: "resource_exceeded",
          exitCode: 137,
          durationMs: 1200,
          stdout: `[Modal Sandbox ${instance.id}] Allocating memory heap...`,
          stderr: `Memory limit exceeded: killed by Modal cgroup memory controller (${instance.limits.maxMemoryMb}MB limit).`,
          tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
          resourceUsage: { peak_memory_bytes: instance.limits.maxMemoryMb * 1024 * 1024 },
        };
      }

      if (flags.includes("SIMULATE_NETWORK_ACCESS")) {
        return {
          status: "blocked",
          exitCode: 1,
          durationMs: 250,
          stdout: `[Modal Sandbox ${instance.id}] Testing outbound network access...`,
          stderr: "Network error: EHOSTUNREACH (Modal sandbox network_access=False enforced).",
          tests: { total: 1, passed: 0, failed: 1, skipped: 0 },
          resourceUsage: {},
        };
      }

      if (flags.includes("SIMULATE_FAILING_TESTS")) {
        return {
          status: "failed",
          exitCode: 1,
          durationMs: 1450,
          stdout: `[Modal Sandbox ${instance.id}] FAIL tests/app.test.ts\n  ✕ 404 handler failed\n  ✕ input validation failed`,
          stderr: "",
          tests: { total: 4, passed: 2, failed: 2, skipped: 0 },
          resourceUsage: { peak_memory_bytes: 68000000 },
        };
      }

      if (flags.includes("SIMULATE_HUGE_LOGS")) {
        const hugeLog = "Modal container log stream output line for 64KB cap testing.\n".repeat(2500);
        return {
          status: "completed",
          exitCode: 0,
          durationMs: 900,
          stdout: hugeLog,
          stderr: "",
          tests: { total: 8, passed: 8, failed: 0, skipped: 0 },
          resourceUsage: { peak_memory_bytes: 42000000 },
        };
      }

      const isPy = instance.profile === "python";
      return {
        status: "completed",
        exitCode: 0,
        durationMs: 120,
        stdout: isPy
          ? "============================== 8 passed in 0.12s ==============================="
          : "PASS tests/app.test.ts\nTests: 8 passed, 8 total",
        stderr: "",
        tests: { total: 8, passed: 8, failed: 0, skipped: 0 },
        resourceUsage: { cpu_time_ms: 80 },
      };
    }

    // Build execution command argument array
    let cmdArgs: string[] = [];
    if (command.startsWith("npm test") || command.startsWith("npx vitest")) {
      cmdArgs = ["vitest", "run"];
    } else if (command.startsWith("pytest")) {
      cmdArgs = ["pytest", "-v", "--tb=short"];
    } else {
      cmdArgs = command.split(" ");
    }

    const payload = {
      repo_path: instance.workspacePath,
      command: cmdArgs,
      profile: instance.profile,
      timeout: instance.limits.timeoutSeconds,
      memory_mb: instance.limits.maxMemoryMb,
      cpu: instance.limits.maxCpus,
      block_network: instance.limits.network === "DENY",
      env,
      app_name: this.config.appName,
    };

    const runnerRes = await invokeModalCloudRunner(payload);

    // Update instance ID with actual Modal Cloud Sandbox ID
    if (runnerRes.sandbox_id) {
      this.activeSandboxes.delete(instance.id);
      instance.id = runnerRes.sandbox_id;
      this.activeSandboxes.set(instance.id, {
        instance,
        cloudSandboxId: runnerRes.sandbox_id,
        createdAt: Date.now(),
      });
    }

    return {
      status: runnerRes.status,
      exitCode: runnerRes.exit_code,
      durationMs: runnerRes.total_duration_ms,
      stdout: runnerRes.stdout,
      stderr: runnerRes.stderr,
      tests: runnerRes.tests,
      resourceUsage: {
        cpu_time_ms: runnerRes.exec_duration_ms,
      },
    };
  }

  async collect(_instance: SandboxInstance, executionResult: RawExecutionResult): Promise<CollectedOutput> {
    return {
      status: executionResult.status,
      exitCode: executionResult.exitCode,
      durationMs: executionResult.durationMs,
      stdout: executionResult.stdout,
      stderr: executionResult.stderr,
      tests: executionResult.tests,
      resourceUsage: executionResult.resourceUsage,
    };
  }

  async destroy(instance: SandboxInstance): Promise<void> {
    instance.status = "destroyed";
    this.activeSandboxes.delete(instance.id);
    this.destructionLog.push(instance.id);
  }
}
