import type { ExecutionLimits, SupportedExecutionProfile } from "../types";

export const DEFAULT_WORKER_LIMITS: ExecutionLimits = {
  timeoutSeconds: 60,
  maxMemoryMb: 512,
  maxCpus: 1,
  maxProcesses: 16,
  maxOutputBytes: 65536, // 64KB log cap
  network: "DENY",
};

export interface ExecutionPolicyConfig {
  profile: SupportedExecutionProfile;
  runtimeImage: string;
  defaultCommand: string;
  allowedCommands: string[];
  workingDirectory: string;
  limits: ExecutionLimits;
}

export const WORKER_EXECUTION_POLICIES: Record<SupportedExecutionProfile, ExecutionPolicyConfig> = {
  node_typescript: {
    profile: "node_typescript",
    runtimeImage: "nova-runner-node:20-alpine",
    defaultCommand: "npm test -- --runInBand --ci",
    allowedCommands: [
      "npm test -- --runInBand --ci",
      "npm test",
      "npm run test",
      "npm run lint",
      "npm run build",
      "npx jest --ci --runInBand",
      "npx vitest run",
    ],
    workingDirectory: "/workspace",
    limits: DEFAULT_WORKER_LIMITS,
  },
  python: {
    profile: "python",
    runtimeImage: "nova-runner-python:3.11-slim",
    defaultCommand: "pytest -v --tb=short",
    allowedCommands: [
      "pytest -v --tb=short",
      "pytest",
      "python -m pytest -v --tb=short",
      "flake8",
      "ruff check .",
    ],
    workingDirectory: "/workspace",
    limits: DEFAULT_WORKER_LIMITS,
  },
};

/**
 * Validates if an execution profile is supported
 */
export function isProfileSupported(profile: string): profile is SupportedExecutionProfile {
  return profile === "node_typescript" || profile === "python";
}

/**
 * Resolves the approved verification command for a given profile
 * Guarantees that commands NEVER originate from student inputs
 */
export function resolveVerificationCommand(profile: SupportedExecutionProfile): string {
  const policy = WORKER_EXECUTION_POLICIES[profile];
  if (!policy) {
    throw new Error(`Unsupported execution profile: '${profile}'`);
  }
  return policy.defaultCommand;
}

/**
 * Builds a strictly sanitized minimal environment for guest execution.
 * Guarantees ZERO production secrets (no Supabase keys, AI keys, DB URLs).
 */
export function buildSanitizedEnvironment(): Record<string, string> {
  return {
    PATH: "/usr/local/bin:/usr/bin:/bin",
    NODE_ENV: "test",
    PYTHONUNBUFFERED: "1",
    HOME: "/workspace",
    TMPDIR: "/workspace/tmp",
  };
}
