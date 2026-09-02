import type { ExecutionProfile, RepositoryEvidence } from "../../schemas";
import type { ExecutionLimits, ExecutionPolicy } from "./types";

export const DEFAULT_EXECUTION_LIMITS: ExecutionLimits = {
  timeoutSeconds: 60,
  maxMemoryMb: 512,
  maxCpus: 1,
  maxProcesses: 16,
  maxOutputBytes: 65536, // 64 KB log cap
  network: "DENY",
};

export const ALLOWED_EXECUTION_POLICIES: Record<ExecutionProfile, ExecutionPolicy> = {
  node_typescript: {
    profile: "node_typescript",
    allowedCommands: [
      "npm test -- --runInBand --ci",
      "npm test",
      "npm run test",
      "npm run lint",
      "npm run build",
      "npx jest --ci --runInBand",
      "npx vitest run",
    ],
    defaultTestCommand: "npm test -- --runInBand --ci",
    defaultLintCommand: "npm run lint",
    defaultBuildCommand: "npm run build",
    limits: DEFAULT_EXECUTION_LIMITS,
  },
  python: {
    profile: "python",
    allowedCommands: [
      "pytest -v --tb=short",
      "python -m pytest -v --tb=short",
      "pytest",
      "flake8",
      "ruff check .",
    ],
    defaultTestCommand: "pytest -v --tb=short",
    defaultLintCommand: "flake8",
    limits: DEFAULT_EXECUTION_LIMITS,
  },
  custom: {
    profile: "custom",
    allowedCommands: [],
    defaultTestCommand: "",
    limits: DEFAULT_EXECUTION_LIMITS,
  },
};

/**
 * Detects the execution profile based on repository static evidence manifests.
 * If cannot be safely classified, returns null (triggering manual_review or unsupported_runtime).
 */
export function detectExecutionProfile(evidence: RepositoryEvidence): ExecutionProfile | null {
  const filePaths = (evidence.file_tree || []).map((f) => f.path.toLowerCase());
  const configPaths = (evidence.config_files || []).map((f) => f.path.toLowerCase());

  // Check Node / TypeScript
  const hasPackageJson = configPaths.some((p) => p.endsWith("package.json")) || filePaths.some((p) => p.endsWith("package.json"));
  const hasTsConfig = filePaths.some((p) => p.endsWith("tsconfig.json"));
  const hasJsOrTsFiles = filePaths.some((p) => /\.(ts|tsx|js|jsx)$/i.test(p));

  if (hasPackageJson || (hasTsConfig && hasJsOrTsFiles)) {
    return "node_typescript";
  }

  // Check Python
  const hasRequirements = configPaths.some((p) => p.endsWith("requirements.txt") || p.endsWith("pyproject.toml") || p.endsWith("setup.py"));
  const hasPyFiles = filePaths.some((p) => /\.py$/i.test(p));

  if (hasRequirements || hasPyFiles) {
    return "python";
  }

  return null;
}

/**
 * Verifies whether a command is allowlisted for the specified profile.
 * Rejects any arbitrary or modified student shell command.
 */
export function isCommandAllowlisted(profile: ExecutionProfile, command: string): boolean {
  const policy = ALLOWED_EXECUTION_POLICIES[profile];
  if (!policy) return false;
  const normalized = command.trim();
  return policy.allowedCommands.includes(normalized);
}
