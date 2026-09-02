import type {
  ExecutionJob,
  ExecutionProfile,
  InternshipSubmission,
  RepositoryEvidence,
  RuntimeEvidence,
} from "../../schemas";
import type { SandboxRunner, SandboxExecutionResult } from "./types";
import { detectExecutionProfile } from "./policy";
import { DeterministicMockRunner, IsolatedSandboxRunner } from "./runner";

export class SandboxExecutionQueue {
  private cache = new Map<string, SandboxExecutionResult>();
  private runner: SandboxRunner;

  constructor(runner?: SandboxRunner) {
    this.runner = runner ?? new IsolatedSandboxRunner();
  }

  private buildKey(submissionId: string, commitSha: string, profile: ExecutionProfile): string {
    return `${submissionId}:${commitSha}:${profile}`.toLowerCase();
  }

  /**
   * Enqueues and dispatches an execution job idempotently.
   * If the identical (submission_id, commit_sha, profile) has already been evaluated, returns cached runtime evidence.
   */
  async enqueueAndExecute(
    submission: InternshipSubmission,
    evidence: RepositoryEvidence,
    forcedProfile?: ExecutionProfile
  ): Promise<SandboxExecutionResult> {
    const profile = forcedProfile ?? detectExecutionProfile(evidence) ?? "node_typescript";
    const commitSha = submission.commit_sha || evidence.repository.commit_sha || "HEAD";
    const cacheKey = this.buildKey(submission.id, commitSha, profile);

    // 1. Idempotency Check
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        ...cached,
        logs: [`[SandboxQueue] Returning idempotent cached execution result for commit ${commitSha}.`],
      };
    }

    // 2. Create Execution Job Record
    const job: ExecutionJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      submission_id: submission.id,
      repository: `${evidence.repository.owner}/${evidence.repository.name}`,
      commit_sha: commitSha,
      execution_profile: profile,
      status: "queued",
      runner_version: this.runner.runnerVersion,
      profile_version: "1.0",
      timeout_seconds: 60,
      requested_at: new Date().toISOString(),
    };

    // 3. Execute via Sandbox Runner
    const result = await this.runner.execute(job, submission, evidence);

    // 4. Cache verified result
    this.cache.set(cacheKey, result);

    return result;
  }

  clear(): void {
    this.cache.clear();
  }
}
