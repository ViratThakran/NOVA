import type { ExecutionLimits, SupportedExecutionProfile } from "../types";
import { prepareRepositoryWorkspace, verifyCommitSha } from "../repository/fetcher";

export interface SandboxInstance {
  id: string;
  profile: SupportedExecutionProfile;
  limits: ExecutionLimits;
  workspacePath: string;
  status: "created" | "prepared" | "verified" | "executing" | "completed" | "destroyed";
  createdAt: string;
  actualCommitSha?: string;
  simulationFlags: string[];
}

export interface RawExecutionResult {
  status: "completed" | "failed" | "timed_out" | "resource_exceeded" | "blocked";
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
  tests: { total: number; passed: number; failed: number; skipped: number };
  resourceUsage: { peak_memory_bytes?: number; cpu_time_ms?: number };
}

export interface CollectedOutput {
  status: RawExecutionResult["status"];
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
  tests: { total: number; passed: number; failed: number; skipped: number };
  resourceUsage: { peak_memory_bytes?: number; cpu_time_ms?: number };
}

/**
 * Pluggable Sandbox Lifecycle Interface
 */
export interface SandboxLifecycle {
  create(jobId: string, profile: SupportedExecutionProfile, limits: ExecutionLimits, simulationFlags?: string[]): Promise<SandboxInstance>;
  prepare(instance: SandboxInstance, repoUrl: string, commitSha: string): Promise<void>;
  verify(instance: SandboxInstance, commitSha: string): Promise<boolean>;
  execute(instance: SandboxInstance, command: string, env: Record<string, string>): Promise<RawExecutionResult>;
  collect(instance: SandboxInstance, executionResult: RawExecutionResult): Promise<CollectedOutput>;
  destroy(instance: SandboxInstance): Promise<void>;
}

/**
 * MockSandboxBackend for safe, deterministic local testing and CI
 * Never executes host processes or dangerous binaries.
 */
export class MockSandboxBackend implements SandboxLifecycle {
  public activeInstances = new Map<string, SandboxInstance>();
  public destructionLog: string[] = [];

  async create(
    jobId: string,
    profile: SupportedExecutionProfile,
    limits: ExecutionLimits,
    simulationFlags: string[] = []
  ): Promise<SandboxInstance> {
    if (simulationFlags.includes("SIMULATE_VM_CREATION_FAILURE")) {
      throw new Error("Hypervisor failure: unable to allocate MicroVM instance");
    }

    const instance: SandboxInstance = {
      id: `vm_${jobId}_${Date.now()}`,
      profile,
      limits,
      workspacePath: `/tmp/sandboxes/${jobId}`,
      status: "created",
      createdAt: new Date().toISOString(),
      simulationFlags,
    };

    this.activeInstances.set(instance.id, instance);
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
      throw new Error(res.error || "Repository acquisition failed");
    }
    instance.actualCommitSha = res.actualCommitSha;
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
    _env: Record<string, string>
  ): Promise<RawExecutionResult> {
    instance.status = "executing";
    const flags = instance.simulationFlags;

    // Simulate Timeout (exit code 124)
    if (flags.includes("SIMULATE_TIMEOUT")) {
      return {
        status: "timed_out",
        exitCode: 124,
        durationMs: instance.limits.timeoutSeconds * 1000,
        stdout: `Executing ${command}...\n[TIMEOUT] Reached ${instance.limits.timeoutSeconds}s wall-clock limit.`,
        stderr: "Process group terminated with SIGKILL.",
        tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
        resourceUsage: { cpu_time_ms: instance.limits.timeoutSeconds * 1000 },
      };
    }

    // Simulate OOM (exit code 137)
    if (flags.includes("SIMULATE_OOM")) {
      return {
        status: "resource_exceeded",
        exitCode: 137,
        durationMs: 1400,
        stdout: `Executing ${command}...\nAllocating memory heap...`,
        stderr: `Memory limit exceeded: killed by cgroup memory controller (${instance.limits.maxMemoryMb}MB limit).`,
        tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
        resourceUsage: { peak_memory_bytes: instance.limits.maxMemoryMb * 1024 * 1024 },
      };
    }

    // Simulate Network Block
    if (flags.includes("SIMULATE_NETWORK_ACCESS")) {
      return {
        status: "blocked",
        exitCode: 1,
        durationMs: 300,
        stdout: `Executing ${command}...\nConnecting to metadata service...`,
        stderr: "Network request blocked: NETWORK = DENY enforced. (EHOSTUNREACH).",
        tests: { total: 1, passed: 0, failed: 1, skipped: 0 },
        resourceUsage: {},
      };
    }

    // Simulate Huge Logs
    if (flags.includes("SIMULATE_HUGE_LOGS")) {
      const hugeText = "Log stream line output repeated for buffer testing.\n".repeat(2000);
      return {
        status: "completed",
        exitCode: 0,
        durationMs: 800,
        stdout: hugeText,
        stderr: "",
        tests: { total: 5, passed: 5, failed: 0, skipped: 0 },
        resourceUsage: { peak_memory_bytes: 45000000 },
      };
    }

    // Simulate Failing Tests
    if (flags.includes("SIMULATE_FAILING_TESTS")) {
      return {
        status: "failed",
        exitCode: 1,
        durationMs: 1200,
        stdout: `Executing ${command}...\nFAIL tests/app.test.ts\n  ✕ 404 handler test failed\n  ✕ validation test failed`,
        stderr: "",
        tests: { total: 4, passed: 2, failed: 2, skipped: 0 },
        resourceUsage: { peak_memory_bytes: 65000000 },
      };
    }

    // Clean Default Pass
    const isPython = instance.profile === "python";
    return {
      status: "completed",
      exitCode: 0,
      durationMs: 950,
      stdout: isPython
        ? `============================= test session starts ==============================\npytest-7.4.0 -- Python 3.11.4\ncollected 8 items\ntests/test_app.py ........ [100%]\n============================== 8 passed in 0.95s ===============================`
        : `PASS tests/app.test.ts\n  ✓ GET /students returns 200 (15ms)\n  ✓ POST /students validates schema (22ms)\n\nTest Suites: 1 passed, 1 total\nTests: 8 passed, 8 total`,
      stderr: "",
      tests: { total: 8, passed: 8, failed: 0, skipped: 0 },
      resourceUsage: { peak_memory_bytes: 52000000, cpu_time_ms: 780 },
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
    this.activeInstances.delete(instance.id);
    this.destructionLog.push(instance.id);
  }
}
