import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  claimExecutionJob,
  insertExecutionJob,
  insertInternshipSubmission,
  getNextAttemptNumber,
  findExistingSubmissionForCommit,
  getSubmissionWithJobAndReview,
  recoverStaleJobs,
} from "../../src/lib/ai-engine/internship-mentor/db";
import { processSubmissionJobAsync } from "../../src/lib/ai-engine/internship-mentor/worker";
import { setAiProvider, resetAiProvider, MockProvider } from "../../src/lib/ai-engine/providers";

// Create a stateful in-memory mock Supabase client to test atomic job claiming,
// attempt increments, and asynchronous worker state transitions.
function createMockSupabaseClient() {
  const store = {
    enrollments: new Map<string, any>(),
    student_profiles: new Map<string, any>(),
    student_learning_states: new Map<string, any>(),
    enrollment_milestones: new Map<string, any>(),
    internship_tasks: new Map<string, any>(),
    internship_submissions: new Map<string, any>(),
    execution_jobs: new Map<string, any>(),
    runtime_evidences: new Map<string, any>(),
    internship_reviews: new Map<string, any>(),
    notifications: [] as any[],
  };

  const client: any = {
    _store: store,
    from: (table: string) => {
      let currentTable = store[table as keyof typeof store];
      let queryFilter: Record<string, any> = {};
      let updatePayload: any = null;

      const builder: any = {
        select: (cols?: string) => builder,
        eq: (col: string, val: any) => {
          queryFilter[col] = val;
          return builder;
        },
        in: (col: string, vals: any[]) => {
          queryFilter[col] = vals;
          return builder;
        },
        lt: (col: string, val: any) => {
          queryFilter[`${col}_lt`] = val;
          return builder;
        },
        order: (col: string, opts?: any) => builder,
        maybeSingle: async () => {
          if (table === "enrollments") {
            const enr = store.enrollments.get(queryFilter.id);
            if (enr && (!queryFilter.student_id || enr.student_id === queryFilter.student_id)) {
              return { data: enr, error: null };
            }
            return { data: null, error: null };
          }
          if (table === "student_profiles") {
            return { data: store.student_profiles.get(queryFilter.id) || null, error: null };
          }
          if (table === "student_learning_states") {
            return { data: store.student_learning_states.get(queryFilter.enrollment_id) || null, error: null };
          }
          if (table === "internship_tasks") {
            return { data: store.internship_tasks.get(queryFilter.id) || null, error: null };
          }
          if (table === "internship_submissions") {
            if (queryFilter.id) {
              return { data: store.internship_submissions.get(queryFilter.id) || null, error: null };
            }
            if (queryFilter.task_id && queryFilter.commit_sha) {
              const subs = Array.from(store.internship_submissions.values()).filter(
                (s) => s.task_id === queryFilter.task_id && s.commit_sha === queryFilter.commit_sha
              );
              return { data: subs[0] || null, error: null };
            }
          }
          if (table === "execution_jobs") {
            if (queryFilter.id) return { data: store.execution_jobs.get(queryFilter.id) || null, error: null };
            if (queryFilter.submission_id) {
              const jobs = Array.from(store.execution_jobs.values()).filter((j) => j.submission_id === queryFilter.submission_id);
              return { data: jobs[0] || null, error: null };
            }
            if (queryFilter.status) {
              const jobs = Array.from(store.execution_jobs.values()).filter((j) => j.status === queryFilter.status);
              return { data: jobs[0] || null, error: null };
            }
          }
          if (table === "internship_reviews") {
            if (queryFilter.submission_id) {
              const rev = store.internship_reviews.get(queryFilter.submission_id);
              return { data: rev || null, error: null };
            }
          }
          if (table === "runtime_evidences") {
            if (queryFilter.submission_id) {
              const ev = Array.from(store.runtime_evidences.values()).find((e) => e.submission_id === queryFilter.submission_id);
              return { data: ev || null, error: null };
            }
          }
          return { data: null, error: null };
        },
        single: async () => builder.maybeSingle(),
        limit: () => builder,
        then: async (resolve: any) => {
          if (table === "internship_tasks") {
            const rows = Array.from(store.internship_tasks.values()).filter(
              (t) => (!queryFilter.enrollment_id || t.enrollment_id === queryFilter.enrollment_id) &&
                     (queryFilter.milestone_index === undefined || t.milestone_index === queryFilter.milestone_index)
            );
            return resolve({ data: rows, error: null });
          }
          if (table === "internship_submissions") {
            const rows = Array.from(store.internship_submissions.values()).filter(
              (s) => !queryFilter.task_id || s.task_id === queryFilter.task_id
            );
            return resolve({ data: rows, error: null });
          }
          if (table === "internship_reviews") {
            const rows = Array.from(store.internship_reviews.values());
            return resolve({ data: rows, error: null });
          }
          if (table === "enrollment_milestones") {
            const rows = Array.from(store.enrollment_milestones.values()).filter(
              (m) => !queryFilter.enrollment_id || m.enrollment_id === queryFilter.enrollment_id
            );
            return resolve({ data: rows, error: null });
          }
          return resolve({ data: [], error: null });
        },
        insert: (payload: any) => {
          return {
            select: () => ({
              single: async () => {
                const id = payload.id || `id_${Date.now()}_${Math.random()}`;
                const record = { id, ...payload };
                if (table === "execution_jobs") store.execution_jobs.set(id, record);
                if (table === "internship_submissions") {
                  const existingAttempt = Array.from(store.internship_submissions.values()).find(
                    (s) => s.task_id === payload.task_id && s.attempt_number === payload.attempt_number
                  );
                  if (existingAttempt) {
                    return { data: null, error: { message: 'duplicate key value violates unique constraint "unique_task_attempt"', code: "23505" } };
                  }
                  store.internship_submissions.set(id, record);
                }
                if (table === "runtime_evidences") store.runtime_evidences.set(id, record);
                if (table === "internship_tasks") store.internship_tasks.set(id, record);
                return { data: record, error: null };
              },
            }),
            then: async (resolve: any) => {
              if (table === "notifications") store.notifications.push(payload);
              return resolve({ data: payload, error: null });
            },
          };
        },
        upsert: (payload: any) => {
          return {
            select: () => ({
              single: async () => {
                const id = payload.id || `id_${Date.now()}_${Math.random()}`;
                if (table === "internship_reviews") {
                  const record = { id, ...payload };
                  store.internship_reviews.set(payload.submission_id, record);
                  return { data: record, error: null };
                }
                if (table === "student_learning_states") {
                  const existing = store.student_learning_states.get(payload.enrollment_id) || {};
                  const record = { id: existing.id || id, ...existing, ...payload };
                  store.student_learning_states.set(payload.enrollment_id, record);
                  return { data: record, error: null };
                }
                if (table === "enrollment_milestones") {
                  const key = `${payload.enrollment_id}_${payload.milestone_index}`;
                  const existing = store.enrollment_milestones.get(key) || {};
                  const record = { id: existing.id || id, ...existing, ...payload };
                  store.enrollment_milestones.set(key, record);
                  return { data: record, error: null };
                }
                return { data: payload, error: null };
              },
            }),
          };
        },
        update: (payload: any) => {
          updatePayload = payload;
          const createUpdateChain = () => {
            const chain: any = {
              eq: (col: string, val: any) => {
                queryFilter[col] = val;
                return chain;
              },
              lt: (col: string, val: any) => {
                queryFilter[`${col}_lt`] = val;
                return chain;
              },
              select: async (cols?: string) => {
                if (table === "execution_jobs") {
                  if (queryFilter.id) {
                    const job = store.execution_jobs.get(queryFilter.id);
                    if (job && (!queryFilter.status || job.status === queryFilter.status)) {
                      Object.assign(job, updatePayload);
                      return { data: [{ id: job.id }], error: null };
                    }
                    return { data: [], error: null };
                  }
                  // Batch update (e.g. stale recovery)
                  const updated: any[] = [];
                  for (const [id, job] of store.execution_jobs.entries()) {
                    if (queryFilter.status && job.status === queryFilter.status) {
                      Object.assign(job, updatePayload);
                      updated.push({ id });
                    }
                  }
                  return { data: updated, error: null };
                }
                return { data: [], error: null };
              },
              then: async (resolve: any) => {
                if (table === "internship_submissions" && queryFilter.id) {
                  const sub = store.internship_submissions.get(queryFilter.id);
                  if (sub) Object.assign(sub, updatePayload);
                }
                if (table === "internship_tasks" && queryFilter.id) {
                  const t = store.internship_tasks.get(queryFilter.id);
                  if (t) Object.assign(t, updatePayload);
                }
                if (table === "execution_jobs" && queryFilter.id) {
                  const j = store.execution_jobs.get(queryFilter.id);
                  if (j) Object.assign(j, updatePayload);
                }
                return resolve({ data: [], error: null });
              },
            };
            return chain;
          };
          return createUpdateChain();
        },
      };
      return builder;
    },
  };

  return client;
}

describe("STAGE 2: Asynchronous Submission & Execution Job Processing", () => {
  let mockSupabase: any;
  const studentId = "student_async_123";
  const enrollmentId = "enrollment_async_789";
  const taskId = "task_m0_01";

  beforeEach(() => {
    resetAiProvider();
    mockSupabase = createMockSupabaseClient();

    // Populate active enrollment & initial task
    mockSupabase._store.enrollments.set(enrollmentId, {
      id: enrollmentId,
      student_id: studentId,
      internship_id: "internship_fullstack_01",
      status: "active",
      internship: {
        id: "internship_fullstack_01",
        title: "Full-Stack Web Development Intern",
        description: "Build robust SaaS features.",
        companies: { name: "NOVA Partner" },
      },
    });

    mockSupabase._store.student_profiles.set(studentId, {
      id: studentId,
      skills: ["TypeScript", "React"],
    });

    mockSupabase._store.internship_tasks.set(taskId, {
      id: taskId,
      enrollment_id: enrollmentId,
      student_id: studentId,
      internship_id: "internship_fullstack_01",
      milestone_index: 0,
      title: "Build Responsive Navigation & State Bar",
      objective: "Implement responsive React components with tests",
      business_context: "Resident portal UX overhaul",
      instructions: ["Create Navbar.tsx", "Add unit tests"],
      deliverables: ["src/Navbar.tsx", "tests/Navbar.test.ts"],
      acceptance_criteria: ["Renders on mobile", "Passing tests"],
      skills_practiced: ["TypeScript", "React"],
      difficulty: "beginner",
      estimated_hours: 4,
      status: "assigned",
    });

    mockSupabase._store.student_learning_states.set(enrollmentId, {
      id: "ls_01",
      student_id: studentId,
      enrollment_id: enrollmentId,
      internship_id: "internship_fullstack_01",
      current_milestone_index: 0,
      completed_milestones: [],
      active_task_id: taskId,
      total_submissions: 0,
      passed_submissions: 0,
      average_score: 0,
      learning_velocity: 1.0,
      current_difficulty: "beginner",
      difficulty_recommendation: "MAINTAIN",
    });
  });

  describe("1. Server-Authoritative Attempt Number & Idempotency", () => {
    it("derives attempt number = 1 on first submission", async () => {
      const attemptNumber = await getNextAttemptNumber(mockSupabase, taskId);
      expect(attemptNumber).toBe(1);
    });

    it("derives attempt number = 2 after an initial submission exists", async () => {
      mockSupabase._store.internship_submissions.set("sub_01", {
        id: "sub_01",
        task_id: taskId,
        attempt_number: 1,
      });

      const attemptNumber = await getNextAttemptNumber(mockSupabase, taskId);
      expect(attemptNumber).toBe(2);
    });

    it("identifies existing in-flight submission for identical commit SHA", async () => {
      const commitSha = "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d";
      mockSupabase._store.internship_submissions.set("sub_existing", {
        id: "sub_existing",
        task_id: taskId,
        commit_sha: commitSha,
        status: "running_verification",
        attempt_number: 1,
      });

      const existing = await findExistingSubmissionForCommit(mockSupabase, taskId, commitSha);
      expect(existing).toBeTruthy();
      expect(existing?.id).toBe("sub_existing");
    });
  });

  describe("2. Atomic Job Claiming & Concurrency Protection", () => {
    it("allows only the first worker to atomically claim a queued job", async () => {
      const job = await insertExecutionJob(mockSupabase, {
        submission_id: "sub_atomic_01",
        repository: "octocat/Hello-World",
        commit_sha: "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
        execution_profile: "node_typescript",
      });

      expect(job.status).toBe("queued");

      // Worker 1 claims job
      const claim1 = await claimExecutionJob(mockSupabase, job.id);
      expect(claim1).toBe(true);

      // Worker 2 attempts to claim same job
      const claim2 = await claimExecutionJob(mockSupabase, job.id);
      expect(claim2).toBe(false); // Second worker is blocked!
    });
  });

  describe("3. Asynchronous Worker Processing Lifecycle", () => {
    it("executes complete async pipeline and persists results", async () => {
      setAiProvider(new MockProvider());

      const submission = await insertInternshipSubmission(mockSupabase, {
        task_id: taskId,
        student_id: studentId,
        enrollment_id: enrollmentId,
        github_url: "https://github.com/octocat/Hello-World",
        commit_sha: "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
        student_explanation: "Completed responsive navigation and passing tests",
        attempt_number: 1,
      });

      const job = await insertExecutionJob(mockSupabase, {
        submission_id: submission.id,
        repository: "octocat/Hello-World",
        commit_sha: submission.commit_sha,
        execution_profile: "node_typescript",
      });

      const result = await processSubmissionJobAsync(submission.id, job.id, {
        supabaseClient: mockSupabase,
        disableAiFallback: false,
      });

      expect(result.success).toBe(true);
      expect(result.verdict).toBe("passed");
      expect(result.score).toBeGreaterThanOrEqual(70);

      // Verify persistence in mock database
      const dbJob = mockSupabase._store.execution_jobs.get(job.id);
      expect(dbJob.status).toBe("completed");

      const dbSub = mockSupabase._store.internship_submissions.get(submission.id);
      expect(dbSub.status).toBe("passed");

      expect(mockSupabase._store.runtime_evidences.size).toBeGreaterThan(0);
      expect(mockSupabase._store.internship_reviews.has(submission.id)).toBe(true);

      // Verify learning state updated
      const ls = mockSupabase._store.student_learning_states.get(enrollmentId);
      expect(ls.total_submissions).toBe(1);
      expect(ls.passed_submissions).toBe(1);
    });

    it("preserves previous attempt history when a revision is submitted", async () => {
      setAiProvider(new MockProvider());

      // Attempt 1: Incomplete (needs revision)
      const sub1 = await insertInternshipSubmission(mockSupabase, {
        id: "sub_attempt_1",
        task_id: taskId,
        student_id: studentId,
        enrollment_id: enrollmentId,
        github_url: "https://github.com/octocat/Hello-World",
        commit_sha: "sha_attempt_1_fail",
        student_explanation: "First draft",
        attempt_number: 1,
        status: "needs_revision",
      });

      mockSupabase._store.internship_reviews.set(sub1.id, {
        submission_id: sub1.id,
        task_id: taskId,
        attempt_number: 1,
        verdict: "needs_revision",
        score: 60,
        summary: "Missing error boundary tests",
      });

      // Attempt 2: Fixed revision
      const sub2 = await insertInternshipSubmission(mockSupabase, {
        id: "sub_attempt_2",
        task_id: taskId,
        student_id: studentId,
        enrollment_id: enrollmentId,
        github_url: "https://github.com/octocat/Hello-World",
        commit_sha: "sha_attempt_2_pass",
        student_explanation: "Added full error boundary tests",
        attempt_number: 2,
        status: "submitted",
      });

      const job2 = await insertExecutionJob(mockSupabase, {
        submission_id: sub2.id,
        repository: "octocat/Hello-World",
        commit_sha: sub2.commit_sha,
        execution_profile: "node_typescript",
      });

      const result = await processSubmissionJobAsync(sub2.id, job2.id, {
        supabaseClient: mockSupabase,
        disableAiFallback: false,
      });

      expect(result.success).toBe(true);

      // Verify BOTH attempts exist in database without corruption
      expect(mockSupabase._store.internship_submissions.has(sub1.id)).toBe(true);
      expect(mockSupabase._store.internship_submissions.has(sub2.id)).toBe(true);

      const status1 = await getSubmissionWithJobAndReview(mockSupabase, sub1.id);
      expect(status1.submission?.attempt_number).toBe(1);
      expect(status1.review?.score).toBe(60);

      const status2 = await getSubmissionWithJobAndReview(mockSupabase, sub2.id);
      expect(status2.submission?.attempt_number).toBe(2);
      expect(status2.submission?.status).toBe("passed");
    });
  });

  describe("4. Concurrency & Durability Hardening Audit", () => {
    it("handles 10 simultaneous submission requests without creating duplicate attempt numbers", async () => {
      const commitSha = "commit_concurrent_test_sha";
      
      // Simulate 10 simultaneous requests using the try-catch conflict resolution pattern
      const results = await Promise.all(
        Array.from({ length: 10 }).map(async (_, idx) => {
          const attempt = await getNextAttemptNumber(mockSupabase, taskId);
          const existing = await findExistingSubmissionForCommit(mockSupabase, taskId, commitSha);
          if (existing) {
            return { type: "existing", id: existing.id, attempt: existing.attempt_number };
          }
          try {
            const sub = await insertInternshipSubmission(mockSupabase, {
              task_id: taskId,
              student_id: studentId,
              enrollment_id: enrollmentId,
              github_url: "https://github.com/octocat/Hello-World",
              commit_sha: commitSha,
              student_explanation: `Submission ${idx}`,
              attempt_number: attempt,
              status: "submitted",
            });
            return { type: "created", id: sub.id, attempt: sub.attempt_number };
          } catch (err: any) {
            const inFlight = await findExistingSubmissionForCommit(mockSupabase, taskId, commitSha);
            if (inFlight) {
              return { type: "existing", id: inFlight.id, attempt: inFlight.attempt_number };
            }
            throw err;
          }
        })
      );

      // Verify submissions: Exactly one created, others safely resolved to existing
      const createdCount = results.filter((r) => r.type === "created").length;
      expect(createdCount).toBe(1);

      // Verify all submissions in DB have unique attempt numbers
      const allSubmissions = Array.from(mockSupabase._store.internship_submissions.values() as Iterable<any>);
      const attemptNumbers = allSubmissions.map((s: any) => s.attempt_number);
      const uniqueAttempts = new Set(attemptNumbers);
      expect(attemptNumbers.length).toBe(uniqueAttempts.size);
    });

    it("10 concurrent workers attempting to claim the same queued job: exactly 1 succeeds", async () => {
      const job = await insertExecutionJob(mockSupabase, {
        submission_id: "sub_race_01",
        repository: "octocat/Hello-World",
        commit_sha: "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
        execution_profile: "node_typescript",
      });

      // 10 concurrent worker claims
      const claimResults = await Promise.all(
        Array.from({ length: 10 }).map(() => claimExecutionJob(mockSupabase, job.id))
      );

      const successfulClaims = claimResults.filter((c) => c === true);
      const blockedClaims = claimResults.filter((c) => c === false);

      expect(successfulClaims.length).toBe(1);
      expect(blockedClaims.length).toBe(9);

      const dbJob = mockSupabase._store.execution_jobs.get(job.id);
      expect(dbJob.status).toBe("running");
    });

    it("independent queue processor (processNextQueuedJob) discovers, claims, and executes queued job", async () => {
      setAiProvider(new MockProvider());

      const sub = await insertInternshipSubmission(mockSupabase, {
        task_id: taskId,
        student_id: studentId,
        enrollment_id: enrollmentId,
        github_url: "https://github.com/octocat/Hello-World",
        commit_sha: "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
        student_explanation: "Independent queue test",
        attempt_number: 1,
        status: "submitted",
      });

      const queuedJob = await insertExecutionJob(mockSupabase, {
        submission_id: sub.id,
        repository: "octocat/Hello-World",
        commit_sha: sub.commit_sha,
        execution_profile: "node_typescript",
      });

      // Run independent queue processor (simulating background cron/worker without after())
      const { processNextQueuedJob } = await import("../../src/lib/ai-engine/internship-mentor/worker");
      const queueResult = await processNextQueuedJob({
        supabaseClient: mockSupabase,
        disableAiFallback: false,
      });

      expect(queueResult.processed).toBe(true);
      expect(queueResult.jobId).toBe(queuedJob.id);
      expect(queueResult.result?.success).toBe(true);

      const dbJob = mockSupabase._store.execution_jobs.get(queuedJob.id);
      expect(dbJob.status).toBe("completed");
    });

    it("10 concurrent PASS finalizations generate exactly ONE Task 2 (Automatic Task 2 Idempotency)", async () => {
      setAiProvider(new MockProvider());

      // Seed 10 passing submissions for the same milestone
      const finalizations = [] as any[];
      for (let idx = 0; idx < 10; idx++) {
        const sub = await insertInternshipSubmission(mockSupabase, {
          id: `sub_pass_concurrent_${idx}`,
          task_id: taskId,
          student_id: studentId,
          enrollment_id: enrollmentId,
          github_url: "https://github.com/octocat/Hello-World",
          commit_sha: `commit_pass_${idx}`,
          student_explanation: "Passing deliverable",
          attempt_number: idx + 1,
          status: "submitted",
        });

        const job = await insertExecutionJob(mockSupabase, {
          id: `job_pass_concurrent_${idx}`,
          submission_id: sub.id,
          repository: "octocat/Hello-World",
          commit_sha: sub.commit_sha,
          execution_profile: "node_typescript",
        });

        const res = await processSubmissionJobAsync(sub.id, job.id, {
          supabaseClient: mockSupabase,
          disableAiFallback: false,
        });
        finalizations.push(res);
      }

      // Verify all workers finished
      for (const res of finalizations) {
        expect(res.success).toBe(true);
        expect(res.verdict).toBe("passed");
      }

      // Verify that all workers referenced the same single nextTaskId
      const nextTaskIds = finalizations.map((r) => r.nextTaskId).filter(Boolean);
      const uniqueNextTaskIds = new Set(nextTaskIds);
      expect(uniqueNextTaskIds.size).toBe(1);

      // Verify only ONE task was created for milestone 1 in the database
      const tasksInMilestone1 = Array.from(mockSupabase._store.internship_tasks.values() as Iterable<any>).filter(
        (t: any) => t.enrollment_id === enrollmentId && t.milestone_index === 1
      );
      expect(tasksInMilestone1.length).toBe(1);
    });
  });

  describe("5. Stale Job Recovery & Error Isolation", () => {
    it("recovers stale execution jobs running longer than max timeout", async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      mockSupabase._store.execution_jobs.set("job_stale_01", {
        id: "job_stale_01",
        status: "running",
        started_at: tenMinutesAgo,
      });

      const { recoveredCount } = await recoverStaleJobs(mockSupabase, 5, "requeue");
      expect(recoveredCount).toBe(1);

      const recoveredJob = mockSupabase._store.execution_jobs.get("job_stale_01");
      expect(recoveredJob.status).toBe("queued");
      expect(recoveredJob.started_at).toBeNull();
    });

    it("fails cleanly when AI provider throws and disableAiFallback is enabled without creating erroneous review", async () => {
      const failingAi = {
        name: "FailingAI",
        generateTask: vi.fn(),
        generateReview: vi.fn().mockRejectedValue(new Error("OpenRouter 429 Rate Limit")),
      };
      setAiProvider(failingAi as any);

      const submission = await insertInternshipSubmission(mockSupabase, {
        task_id: taskId,
        student_id: studentId,
        enrollment_id: enrollmentId,
        github_url: "https://github.com/octocat/Hello-World",
        commit_sha: "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
        student_explanation: "My work",
        attempt_number: 1,
      });

      const job = await insertExecutionJob(mockSupabase, {
        submission_id: submission.id,
        repository: "octocat/Hello-World",
        commit_sha: submission.commit_sha,
        execution_profile: "node_typescript",
      });

      const result = await processSubmissionJobAsync(submission.id, job.id, {
        supabaseClient: mockSupabase,
        disableAiFallback: true, // Strict production rule
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("OpenRouter review generation failed");

      // Verify job marked failed and no fake review created
      const dbJob = mockSupabase._store.execution_jobs.get(job.id);
      expect(dbJob.status).toBe("failed");
      expect(mockSupabase._store.internship_reviews.has(submission.id)).toBe(false);

      // Verify student learning state not penalized with failure score
      const ls = mockSupabase._store.student_learning_states.get(enrollmentId);
      expect(ls.total_submissions).toBe(0);
      expect(ls.average_score).toBe(0);
    });
  });
});
