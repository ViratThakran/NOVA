import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  submitInternshipTaskAction,
  getSubmissionStatusAction,
  getLatestTaskSubmissionAction,
} from "../../src/app/student/actions";
import { MockProvider, setAiProvider } from "../../src/lib/ai-engine/providers";

const { mockSupabase, studentId, otherStudentId, enrollmentId, taskId, nextTaskId } = vi.hoisted(() => {
  const sId = "stu_workspace_user";
  const oId = "stu_other_user";
  const eId = "enr_workspace_01";
  const tId = "task_workspace_01";
  const nId = "task_workspace_02";

  const store = {
    user_roles: [{ user_id: sId, role: "student" }],
    enrollments: new Map<string, any>(),
    internship_tasks: new Map<string, any>(),
    internship_submissions: new Map<string, any>(),
    execution_jobs: new Map<string, any>(),
    internship_reviews: new Map<string, any>(),
    runtime_evidences: new Map<string, any>(),
    student_learning_states: new Map<string, any>(),
    enrollment_milestones: new Map<string, any>(),
    student_profiles: new Map<string, any>(),
  };

  const client: any = {
    _store: store,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: sId, email: "student@example.com" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      let currentTable = table;
      let filters: Record<string, any> = {};
      let isSingle = false;
      let isMaybeSingle = false;
      let limitCount: number | null = null;

      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn((col: string, val: any) => {
          filters[col] = val;
          return builder;
        }),
        in: vi.fn((col: string, vals: any[]) => {
          filters[col] = { $in: vals };
          return builder;
        }),
        order: vi.fn(() => builder),
        limit: vi.fn((n: number) => {
          limitCount = n;
          return builder;
        }),
        single: vi.fn(() => {
          isSingle = true;
          return builder;
        }),
        maybeSingle: vi.fn(() => {
          isMaybeSingle = true;
          return builder;
        }),
        insert: vi.fn((payload: any) => {
          const tableStore = (store as any)[currentTable];
          const items = Array.isArray(payload) ? payload : [payload];
          const inserted = items.map((item) => {
            const row = { id: item.id || `gen_${Date.now()}_${Math.random()}`, ...item };
            tableStore.set(row.id, row);
            return row;
          });
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({ data: inserted[0], error: null })),
              maybeSingle: vi.fn(async () => ({ data: inserted[0], error: null })),
              data: inserted,
              error: null,
            })),
            data: items.length === 1 ? inserted[0] : inserted,
            error: null,
          };
        }),
        upsert: vi.fn((payload: any) => {
          const tableStore = (store as any)[currentTable];
          const row = { id: payload.id || `upsert_${Date.now()}`, ...payload };
          tableStore.set(row.id, row);
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({ data: row, error: null })),
              maybeSingle: vi.fn(async () => ({ data: row, error: null })),
            })),
            data: row,
            error: null,
          };
        }),
        update: vi.fn((payload: any) => {
          const tableStore = (store as any)[currentTable];
          return {
            eq: vi.fn(async (col: string, val: any) => {
              for (const [k, v] of tableStore.entries()) {
                if (v[col] === val) {
                  const updated = { ...v, ...payload };
                  tableStore.set(k, updated);
                }
              }
              return { data: null, error: null };
            }),
          };
        }),
        delete: vi.fn(() => {
          const tableStore = (store as any)[currentTable];
          return {
            eq: vi.fn(async (col: string, val: any) => {
              for (const [k, v] of tableStore.entries()) {
                if (v[col] === val) {
                  tableStore.delete(k);
                }
              }
              return { data: null, error: null };
            }),
          };
        }),
        then: vi.fn((resolve) => {
          const tableStore = (store as any)[currentTable];
          let results: any[] = [];

          if (currentTable === "user_roles") {
            results = store.user_roles.filter((r) => r.user_id === filters.user_id);
          } else if (tableStore instanceof Map) {
            results = Array.from(tableStore.values()).filter((row: any) => {
              for (const [col, val] of Object.entries(filters)) {
                if (val && typeof val === "object" && "$in" in val) {
                  if (!val.$in.includes(row[col])) return false;
                } else if (row[col] !== val) {
                  return false;
                }
              }
              return true;
            });
          }

          if (isSingle || isMaybeSingle) {
            resolve({ data: results[0] || null, error: null });
          } else {
            if (limitCount !== null) results = results.slice(0, limitCount);
            resolve({ data: results, error: null });
          }
        }),
      };

      return builder;
    }),
  };

  return {
    mockSupabase: client,
    studentId: sId,
    otherStudentId: oId,
    enrollmentId: eId,
    taskId: tId,
    nextTaskId: nId,
  };
});

vi.mock("next/server", () => ({
  after: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("../../src/lib/auth", () => ({
  getAuthenticatedUser: vi.fn().mockImplementation(async () => ({
    supabase: mockSupabase,
    user: { id: studentId, email: "student@example.com" },
    roles: ["student"],
  })),
  requireRole: vi.fn().mockImplementation(async () => ({
    supabase: mockSupabase,
    user: { id: studentId, email: "student@example.com" },
    roles: ["student"],
  })),
}));

describe("Student Learning Workspace Unit & Integration Tests (Stage 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAiProvider(new MockProvider());

    // Reset tables
    mockSupabase._store.enrollments.clear();
    mockSupabase._store.internship_tasks.clear();
    mockSupabase._store.internship_submissions.clear();
    mockSupabase._store.execution_jobs.clear();
    mockSupabase._store.internship_reviews.clear();
    mockSupabase._store.runtime_evidences.clear();
    mockSupabase._store.student_learning_states.clear();
    mockSupabase._store.enrollment_milestones.clear();
    mockSupabase._store.student_profiles.clear();

    // Seed Active Enrollment
    mockSupabase._store.enrollments.set(enrollmentId, {
      id: enrollmentId,
      student_id: studentId,
      internship_id: "int_01",
      status: "active",
      internship: {
        id: "int_01",
        title: "AI/ML Engineering Intern",
        description: "Develop production ML systems",
        duration_weeks: 12,
        companies: { name: "Nova Technologies" },
      },
    });

    // Seed Task 1
    mockSupabase._store.internship_tasks.set(taskId, {
      id: taskId,
      enrollment_id: enrollmentId,
      student_id: studentId,
      internship_id: "int_01",
      milestone_index: 0,
      title: "Build Production Model Training Pipeline",
      objective: "Implement a clean modular Python data ingestion and model training pipeline",
      business_context: "The enterprise platform requires automated retraining on fresh data",
      instructions: ["Set up src/pipeline.py", "Add tests/test_pipeline.py"],
      deliverables: ["src/pipeline.py", "tests/test_pipeline.py"],
      acceptance_criteria: ["Pipeline executes end-to-end", "Unit tests pass"],
      skills_practiced: ["Python", "Machine Learning", "Testing"],
      difficulty: "intermediate",
      estimated_hours: 6,
      status: "assigned",
    });

    // Seed Milestone 0 & 1
    mockSupabase._store.enrollment_milestones.set("ms_01", {
      id: "ms_01",
      enrollment_id: enrollmentId,
      milestone_index: 0,
      title: "Model Pipeline & Ingestion",
      status: "in_progress",
    });
    mockSupabase._store.enrollment_milestones.set("ms_02", {
      id: "ms_02",
      enrollment_id: enrollmentId,
      milestone_index: 1,
      title: "Model Evaluation & Metrics",
      status: "locked",
    });
  });

  describe("1. Authorization & Security Boundaries", () => {
    it("rejects unauthenticated user submission", async () => {
      const { getAuthenticatedUser } = await import("../../src/lib/auth");
      vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null as any);

      const fd = new FormData();
      fd.set("task_id", taskId);
      fd.set("github_url", "https://github.com/test/repo");
      fd.set("commit_sha", "7fd1a60");
      fd.set("student_explanation", "Implemented model training");

      const res = await submitInternshipTaskAction(null, fd);
      expect(res.status).toBe("error");
      expect(res.message).toContain("session has expired");
    });

    it("rejects non-student roles from submitting task reviews", async () => {
      const { getAuthenticatedUser } = await import("../../src/lib/auth");
      vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({
        supabase: mockSupabase,
        user: { id: studentId },
        roles: ["employee"],
      } as any);

      const fd = new FormData();
      fd.set("task_id", taskId);
      fd.set("github_url", "https://github.com/test/repo");
      fd.set("commit_sha", "7fd1a60");
      fd.set("student_explanation", "Implemented model training");

      const res = await submitInternshipTaskAction(null, fd);
      expect(res.status).toBe("error");
      expect(res.message).toContain("Only students can submit");
    });

    it("rejects submission if task belongs to a different student", async () => {
      mockSupabase._store.internship_tasks.set(taskId, {
        id: taskId,
        enrollment_id: "enr_other_student",
        student_id: otherStudentId, // Belongs to different student
      });
      mockSupabase._store.enrollments.set("enr_other_student", {
        id: "enr_other_student",
        student_id: otherStudentId,
        status: "active",
      });

      const fd = new FormData();
      fd.set("task_id", taskId);
      fd.set("github_url", "https://github.com/test/repo");
      fd.set("commit_sha", "7fd1a60");
      fd.set("student_explanation", "Unauthorized attempt");

      const res = await submitInternshipTaskAction(null, fd);
      expect(res.status).toBe("error");
      expect(res.message).toContain("Unauthorized");
    });

    it("rejects submission if student enrollment is no longer active", async () => {
      mockSupabase._store.enrollments.set(enrollmentId, {
        id: enrollmentId,
        student_id: studentId,
        status: "completed", // Inactive
      });

      const fd = new FormData();
      fd.set("task_id", taskId);
      fd.set("github_url", "https://github.com/test/repo");
      fd.set("commit_sha", "7fd1a60");
      fd.set("student_explanation", "Inactive enrollment submission");

      const res = await submitInternshipTaskAction(null, fd);
      expect(res.status).toBe("error");
      expect(res.message).toContain("not currently active");
    });
  });

  describe("2. Submission Form Validation & Input Safety", () => {
    it("validates GitHub repository URL format", async () => {
      const fd = new FormData();
      fd.set("task_id", taskId);
      fd.set("github_url", "https://invalid-url.com/something");
      fd.set("commit_sha", "7fd1a60");
      fd.set("student_explanation", "Valid explanation text here");

      const res = await submitInternshipTaskAction(null, fd);
      expect(res.status).toBe("error");
      expect(res.message).toContain("valid public GitHub repository URL");
    });

    it("validates Git commit SHA length and presence", async () => {
      const fd = new FormData();
      fd.set("task_id", taskId);
      fd.set("github_url", "https://github.com/test/repo");
      fd.set("commit_sha", "123"); // Too short
      fd.set("student_explanation", "Valid explanation text here");

      const res = await submitInternshipTaskAction(null, fd);
      expect(res.status).toBe("error");
      expect(res.message).toContain("valid pinned Git commit SHA");
    });

    it("validates student explanation length", async () => {
      const fd = new FormData();
      fd.set("task_id", taskId);
      fd.set("github_url", "https://github.com/test/repo");
      fd.set("commit_sha", "7fd1a60");
      fd.set("student_explanation", "short"); // Too short

      const res = await submitInternshipTaskAction(null, fd);
      expect(res.status).toBe("error");
      expect(res.message).toContain("explanation of your implementation");
    });
  });

  describe("3. Asynchronous Pipeline & Live Status Polling", () => {
    it("creates submission and execution job returning immediately with queued status", async () => {
      const fd = new FormData();
      fd.set("task_id", taskId);
      fd.set("github_url", "https://github.com/test/repo");
      fd.set("branch", "feature-pipeline");
      fd.set("commit_sha", "commit_unique_async_12345");
      fd.set("student_explanation", "Built modular training pipeline with comprehensive unit test suite.");

      const res = await submitInternshipTaskAction(null, fd);
      expect(res.status).toBe("success");
      expect(res.jobStatus).toBe("queued");
      expect(res.attemptNumber).toBe(1);
      expect(res.submissionId).toBeDefined();
      expect(res.jobId).toBeDefined();

      const createdSub = mockSupabase._store.internship_submissions.get(res.submissionId);
      expect(createdSub.status).toBe("submitted");
      expect(createdSub.commit_sha).toBe("commit_unique_async_12345");

      const createdJob = mockSupabase._store.execution_jobs.get(res.jobId);
      expect(createdJob.status).toBe("queued");
      expect(createdJob.repository).toBe("test/repo");
    });

    it("polling getSubmissionStatusAction returns real-time job and review transitions", async () => {
      // Seed submission & job
      const subId = "sub_poll_01";
      const jobId = "job_poll_01";

      mockSupabase._store.internship_submissions.set(subId, {
        id: subId,
        task_id: taskId,
        student_id: studentId,
        enrollment_id: enrollmentId,
        commit_sha: "7fd1a60",
        attempt_number: 1,
        status: "in_review",
        submitted_at: new Date().toISOString(),
      });

      mockSupabase._store.execution_jobs.set(jobId, {
        id: jobId,
        submission_id: subId,
        status: "running",
        exit_code: null,
      });

      // Poll in-flight status
      const inFlightRes = await getSubmissionStatusAction(subId);
      expect(inFlightRes.status).toBe("success");
      expect(inFlightRes.submission.status).toBe("in_review");
      expect(inFlightRes.job.status).toBe("running");
      expect(inFlightRes.review).toBeNull();

      // Transition to completed with review
      mockSupabase._store.internship_submissions.set(subId, {
        ...mockSupabase._store.internship_submissions.get(subId),
        status: "passed",
      });
      mockSupabase._store.execution_jobs.set(jobId, {
        ...mockSupabase._store.execution_jobs.get(jobId),
        status: "completed",
        exit_code: 0,
        duration_ms: 3200,
      });
      mockSupabase._store.internship_reviews.set("rev_01", {
        id: "rev_01",
        submission_id: subId,
        task_id: taskId,
        attempt_number: 1,
        verdict: "passed",
        score: 95,
        summary: "Excellent modular pipeline implementation",
        strengths: ["Clean code separation", "Passing tests"],
        improvements: ["Add performance profiling"],
        criteria_results: [
          { criterion: "Pipeline executes end-to-end", status: "met", reason: "Verified in test runner", evidence: ["src/pipeline.py"] },
        ],
        technical_quality: { architecture_score: 95, code_quality_score: 95, testing_score: 95, documentation_score: 95 },
        next_step: "Proceed to milestone 2",
        created_at: new Date().toISOString(),
      });

      const completedRes = await getSubmissionStatusAction(subId);
      expect(completedRes.status).toBe("success");
      expect(completedRes.submission.status).toBe("passed");
      expect(completedRes.job.status).toBe("completed");
      expect(completedRes.review.verdict).toBe("passed");
      expect(completedRes.review.score).toBe(95);
    });
  });

  describe("4. Review States, Revisions & Next Task Progression", () => {
    it("handles NEEDS_REVISION and increments attempt number on resubmission", async () => {
      // Attempt 1: Needs revision
      mockSupabase._store.internship_submissions.set("sub_att_01", {
        id: "sub_att_01",
        task_id: taskId,
        student_id: studentId,
        enrollment_id: enrollmentId,
        commit_sha: "commit_att_01",
        attempt_number: 1,
        status: "needs_revision",
        submitted_at: new Date().toISOString(),
      });

      mockSupabase._store.internship_reviews.set("rev_att_01", {
        id: "rev_att_01",
        submission_id: "sub_att_01",
        task_id: taskId,
        attempt_number: 1,
        verdict: "needs_revision",
        score: 65,
        summary: "Missing edge-case error tests",
      });

      // Student submits Attempt 2
      const fd = new FormData();
      fd.set("task_id", taskId);
      fd.set("github_url", "https://github.com/test/repo");
      fd.set("commit_sha", "commit_att_02");
      fd.set("student_explanation", "Added edge-case tests as requested by mentor.");

      const res = await submitInternshipTaskAction(null, fd);
      expect(res.status).toBe("success");
      expect(res.attemptNumber).toBe(2);

      // Verify Attempt 1 remains immutable
      const att1 = mockSupabase._store.internship_submissions.get("sub_att_01");
      expect(att1.attempt_number).toBe(1);
      expect(att1.status).toBe("needs_revision");

      // Verify Attempt 2 created
      const att2 = mockSupabase._store.internship_submissions.get(res.submissionId);
      expect(att2.attempt_number).toBe(2);
      expect(att2.status).toBe("submitted");
    });

    it("resolves nextTaskId when task reaches PASSED verdict", async () => {
      // Seed Task 2 in Supabase
      mockSupabase._store.internship_tasks.set(nextTaskId, {
        id: nextTaskId,
        enrollment_id: enrollmentId,
        student_id: studentId,
        milestone_index: 1,
        title: "Model Evaluation & Performance Benchmarking",
      });

      const passSubId = "sub_pass_01";
      mockSupabase._store.internship_submissions.set(passSubId, {
        id: passSubId,
        task_id: taskId,
        student_id: studentId,
        enrollment_id: enrollmentId,
        status: "passed",
        attempt_number: 1,
      });

      mockSupabase._store.internship_reviews.set("rev_pass_01", {
        id: "rev_pass_01",
        submission_id: passSubId,
        task_id: taskId,
        verdict: "passed",
        score: 92,
        summary: "All requirements met",
      });

      const status = await getSubmissionStatusAction(passSubId);
      expect(status.status).toBe("success");
      expect(status.review.verdict).toBe("passed");
      expect(status.nextTaskId).toBe(nextTaskId);
      expect(status.nextTaskTitle).toBe("Model Evaluation & Performance Benchmarking");
    });

    it("duplicate in-flight submission safely deduplicates without creating double jobs", async () => {
      const commitSha = "exact_duplicate_sha_123";

      // Seed in-flight submission
      mockSupabase._store.internship_submissions.set("sub_inflight_01", {
        id: "sub_inflight_01",
        task_id: taskId,
        student_id: studentId,
        enrollment_id: enrollmentId,
        commit_sha: commitSha,
        attempt_number: 1,
        status: "in_review",
      });

      const fd = new FormData();
      fd.set("task_id", taskId);
      fd.set("github_url", "https://github.com/test/repo");
      fd.set("commit_sha", commitSha);
      fd.set("student_explanation", "Duplicate submission attempt");

      const res = await submitInternshipTaskAction(null, fd);
      expect(res.status).toBe("success");
      expect(res.submissionId).toBe("sub_inflight_01");
      expect(res.message).toContain("already processing");
    });
  });
});
