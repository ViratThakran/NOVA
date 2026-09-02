import type {
  ExecutionJob,
  ExecutionProfile,
  RuntimeEvidence,
  InternshipSubmission,
  RepositoryEvidence,
} from "../../schemas";

export interface ExecutionLimits {
  timeoutSeconds: number; // default: 60s
  maxMemoryMb: number; // default: 512MB
  maxCpus: number; // default: 1 vCPU
  maxProcesses: number; // default: 16
  maxOutputBytes: number; // default: 64KB (65536)
  network: "DENY" | "ALLOW"; // default: DENY
}

export interface ExecutionPolicy {
  profile: ExecutionProfile;
  allowedCommands: string[];
  defaultTestCommand: string;
  defaultLintCommand?: string;
  defaultBuildCommand?: string;
  limits: ExecutionLimits;
}

export interface SandboxExecutionResult {
  job: ExecutionJob;
  evidence: RuntimeEvidence;
  logs: string[];
}

export interface SandboxRunner {
  readonly name: string;
  readonly runnerVersion: string;
  execute(
    job: ExecutionJob,
    submission: InternshipSubmission,
    evidence: RepositoryEvidence
  ): Promise<SandboxExecutionResult>;
}
