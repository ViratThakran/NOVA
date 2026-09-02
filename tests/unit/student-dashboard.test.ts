import { describe, it, expect, vi, beforeEach } from "vitest";
import { getStudentDashboardState } from "../../src/lib/ai-engine/internship-mentor/dashboard";
import { MockProvider, setAiProvider } from "../../src/lib/ai-engine/providers";

// Create in-memory mock client using vi.hoisted
const { mockSupabase, studentId, otherStudentId, enrollmentId, taskId, nextTaskId } = vi.hoisted(() => {
  const sId = "stu_dashboard_user_01";
  const oId = "stu_other_user_99";
  const eId = "enr_dashboard_01";
  const tId = "task_dashboard_01";
  const nId = "task_dashboard_02";

  const store = {
    profiles: new Map<string, any>(),
    enrollments: new Map<string, any>(),
    internship_tasks: new Map<string, any>(),
    internship_submissions: new Map<string, any>(),
    execution_jobs: new Map<string, any>(),
    internship_reviews: new Map<string, any>(),
    runtime_evidences: new Map<string, any>(),
    student_learning_states: new Map<string, any>(),
    enrollment_milestones: new Map<string, any>(),
  };

  const client: any = {
    _store: store,
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
        then: vi.fn((resolve) => {
          const tableStore = (store as any)[currentTable];
          let results: any[] = [];

          if (tableStore instanceof Map) {
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

describe("Student Internship Dashboard Unit & Integration Tests (Stage 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAiProvider(new MockProvider());

    // Clear tables
    mockSupabase._store.profiles.clear();
    mockSupabase._store.enrollments.clear();
    mockSupabase._store.internship_tasks.clear();
    mockSupabase._store.internship_submissions.clear();
    mockSupabase._store.execution_jobs.clear();
    mockSupabase._store.internship_reviews.clear();
    mockSupabase._store.runtime_evidences.clear();
    mockSupabase._store.student_learning_states.clear();
    mockSupabase._store.enrollment_milestones.clear();

    // Default student profile
    mockSupabase._store.profiles.set(studentId, {
      id: studentId,
      first_name: "Alex",
      last_name: "Chen",
      email: "alex.chen@example.com",
      onboarded: true,
    });
  });

  describe("1. Authentication & Enrollment Boundaries", () => {
    it("returns no_enrollment status when student has no active enrollment", async () => {
      const state = await getStudentDashboardState(mockSupabase, studentId);
      expect(state.status).toBe("no_enrollment");
      expect(state.profile.first_name).toBe("Alex");
      expect(state.enrollment).toBeUndefined();
      expect(state.nextAction.type).toBe("no_submission");
      expect(state.nextAction.ctaLabel).toBe("Browse Internships");
    });

    it("scopes all data to the authenticated student and ignores other students' records", async () => {
      // Seed enrollment for other student
      mockSupabase._store.enrollments.set("enr_other_01", {
        id: "enr_other_01",
        student_id: otherStudentId,
        status: "active",
        internship: { title: "Other Company Internship" },
      });

      const state = await getStudentDashboardState(mockSupabase, studentId);
      expect(state.status).toBe("no_enrollment");
    });
  });

  describe("2. Active Internship & Real State Derivation", () => {
    beforeEach(() => {
      // Seed active enrollment
      mockSupabase._store.enrollments.set(enrollmentId, {
        id: enrollmentId,
        student_id: studentId,
        status: "active",
        created_at: new Date().toISOString(),
        internship: {
          id: "int_ai_01",
          title: "AI / ML Systems Engineer Intern",
          description: "Develop production distributed pipelines",
          duration_weeks: 12,
          companies: { name: "Nova Technologies" },
        },
      });

      // Seed Task 1
      mockSupabase._store.internship_tasks.set(taskId, {
        id: taskId,
        enrollment_id: enrollmentId,
        student_id: studentId,
        milestone_index: 0,
        title: "Build Distributed Ingestion Pipeline",
        objective: "Develop a fault-tolerant batch ingestion microservice",
        deliverables: ["src/ingest.py", "tests/test_ingest.py"],
        status: "assigned",
        difficulty: "intermediate",
        estimated_hours: 6,
      });

      // Seed Milestones 0 to 3
      mockSupabase._store.enrollment_milestones.set("ms_0", {
        id: "ms_0",
        enrollment_id: enrollmentId,
        milestone_index: 0,
        title: "Data Pipeline & Ingestion",
        status: "in_progress",
        completed_task_count: 0,
      });
      mockSupabase._store.enrollment_milestones.set("ms_1", {
        id: "ms_1",
        enrollment_id: enrollmentId,
        milestone_index: 1,
        title: "Baseline Models & Training",
        status: "locked",
        completed_task_count: 0,
      });
      mockSupabase._store.enrollment_milestones.set("ms_2", {
        id: "ms_2",
        enrollment_id: enrollmentId,
        milestone_index: 2,
        title: "Model Evaluation & Benchmarking",
        status: "locked",
        completed_task_count: 0,
      });
      mockSupabase._store.enrollment_milestones.set("ms_3", {
        id: "ms_3",
        enrollment_id: enrollmentId,
        milestone_index: 3,
        title: "Production Serving & Inference",
        status: "locked",
        completed_task_count: 0,
      });

      // Seed learning state
      mockSupabase._store.student_learning_states.set("state_01", {
        id: "state_01",
        student_id: studentId,
        enrollment_id: enrollmentId,
        current_milestone_index: 0,
        active_task_id: taskId,
        completed_milestones: [],
        average_score: 0,
        total_submissions: 0,
        current_difficulty: "intermediate",
      });
    });

    it("derives active internship hero metadata and initial 'Start Task' action", async () => {
      const state = await getStudentDashboardState(mockSupabase, studentId);
      expect(state.status).toBe("active");
      expect(state.enrollment?.internshipTitle).toBe("AI / ML Systems Engineer Intern");
      expect(state.enrollment?.companyName).toBe("Nova Technologies");
      expect(state.currentMilestoneIndex).toBe(0);
      expect(state.currentTask?.title).toBe("Build Distributed Ingestion Pipeline");
      expect(state.nextAction.type).toBe("no_submission");
      expect(state.nextAction.ctaLabel).toBe("Start Task");
      expect(state.nextAction.ctaHref).toContain(`/student/learning?taskId=${taskId}`);
    });

    it("derives in-flight processing state when a submission is currently in review", async () => {
      // Seed submission & job
      const subId = "sub_active_01";
      mockSupabase._store.internship_submissions.set(subId, {
        id: subId,
        enrollment_id: enrollmentId,
        task_id: taskId,
        student_id: studentId,
        commit_sha: "7fd1a60b01f9",
        attempt_number: 1,
        status: "in_review",
        submitted_at: new Date().toISOString(),
      });

      mockSupabase._store.execution_jobs.set("job_01", {
        id: "job_01",
        submission_id: subId,
        status: "running",
      });

      const state = await getStudentDashboardState(mockSupabase, studentId);
      expect(state.nextAction.type).toBe("processing");
      expect(state.nextAction.badgeText).toBe("Review in Progress");
      expect(state.nextAction.ctaLabel).toBe("View Live Review");
      expect(state.nextAction.currentStageLabel).toContain("Running test sandbox");
    });

    it("derives NEEDS_REVISION state and displays mentor summary and revision CTA", async () => {
      const subId = "sub_rev_01";
      mockSupabase._store.internship_submissions.set(subId, {
        id: subId,
        enrollment_id: enrollmentId,
        task_id: taskId,
        student_id: studentId,
        commit_sha: "7fd1a60b01f9",
        attempt_number: 1,
        status: "needs_revision",
        submitted_at: new Date().toISOString(),
      });

      mockSupabase._store.internship_reviews.set("rev_01", {
        id: "rev_01",
        submission_id: subId,
        task_id: taskId,
        attempt_number: 1,
        verdict: "needs_revision",
        score: 68,
        summary: "Pipeline handles ingestion but lacks exception recovery tests.",
        improvements: ["Add unit tests for network timeout errors"],
        created_at: new Date().toISOString(),
      });

      const state = await getStudentDashboardState(mockSupabase, studentId);
      expect(state.nextAction.type).toBe("needs_revision");
      expect(state.nextAction.badgeText).toBe("Revision Required");
      expect(state.nextAction.ctaLabel).toBe("Revise Submission");
      expect(state.latestReview?.score).toBe(68);
      expect(state.recentMentorFeedback.length).toBe(1);
      expect(state.recentMentorFeedback[0].summary).toContain("Pipeline handles ingestion");
    });

    it("derives PASSED state and navigates to the pre-existing Task 2 without regenerating", async () => {
      // Seed Task 2 in Supabase
      mockSupabase._store.internship_tasks.set(nextTaskId, {
        id: nextTaskId,
        enrollment_id: enrollmentId,
        student_id: studentId,
        milestone_index: 1,
        title: "Baseline Models & Training Pipeline",
        status: "assigned",
      });

      const subId = "sub_pass_01";
      mockSupabase._store.internship_submissions.set(subId, {
        id: subId,
        enrollment_id: enrollmentId,
        task_id: taskId,
        student_id: studentId,
        commit_sha: "8ae2b71c02f0",
        attempt_number: 2,
        status: "passed",
        submitted_at: new Date().toISOString(),
      });

      mockSupabase._store.internship_reviews.set("rev_02", {
        id: "rev_02",
        submission_id: subId,
        task_id: taskId,
        attempt_number: 2,
        verdict: "passed",
        score: 96,
        summary: "Superb fault-tolerant ingestion pipeline. All edge cases validated.",
        strengths: ["Comprehensive test coverage", "Clean architecture"],
        created_at: new Date().toISOString(),
      });

      // Update task status to completed
      mockSupabase._store.internship_tasks.set(taskId, {
        ...mockSupabase._store.internship_tasks.get(taskId),
        status: "completed",
      });

      const state = await getStudentDashboardState(mockSupabase, studentId);
      expect(state.nextAction.type).toBe("passed");
      expect(state.nextAction.badgeText).toBe("Milestone Completed");
      expect(state.nextAction.ctaLabel).toBe("Continue to Next Task");
      expect(state.nextAction.ctaHref).toContain(`/student/learning?taskId=${nextTaskId}`);
      expect(state.nextAvailableTask?.title).toBe("Baseline Models & Training Pipeline");
    });

    it("correctly calculates milestone progress, average score, and revisions", async () => {
      // Mark milestone 0 as completed
      mockSupabase._store.enrollment_milestones.set("ms_0", {
        id: "ms_0",
        enrollment_id: enrollmentId,
        milestone_index: 0,
        title: "Data Pipeline & Ingestion",
        status: "completed",
        average_score: 96,
      });

      // Seed 2 submissions (1 revision)
      mockSupabase._store.internship_submissions.set("sub_01", {
        id: "sub_01",
        enrollment_id: enrollmentId,
        task_id: taskId,
        attempt_number: 1,
        status: "needs_revision",
      });
      mockSupabase._store.internship_submissions.set("sub_02", {
        id: "sub_02",
        enrollment_id: enrollmentId,
        task_id: taskId,
        attempt_number: 2,
        status: "passed",
      });

      mockSupabase._store.internship_reviews.set("rev_01", {
        id: "rev_01",
        submission_id: "sub_01",
        score: 68,
      });
      mockSupabase._store.internship_reviews.set("rev_02", {
        id: "rev_02",
        submission_id: "sub_02",
        score: 96,
      });

      mockSupabase._store.student_learning_states.set("state_01", {
        id: "state_01",
        student_id: studentId,
        enrollment_id: enrollmentId,
        average_score: 96,
        current_difficulty: "intermediate",
      });

      const state = await getStudentDashboardState(mockSupabase, studentId);
      expect(state.performanceMetrics.totalMilestones).toBe(4);
      expect(state.performanceMetrics.completedMilestonesCount).toBe(1);
      expect(state.performanceMetrics.progressPercentage).toBe(25);
      expect(state.performanceMetrics.averageScore).toBe(96);
      expect(state.performanceMetrics.totalRevisions).toBe(1);
    });

    it("handles failed infrastructure execution gracefully", async () => {
      const subId = "sub_fail_01";
      mockSupabase._store.internship_submissions.set(subId, {
        id: subId,
        enrollment_id: enrollmentId,
        task_id: taskId,
        student_id: studentId,
        commit_sha: "7fd1a60b01f9",
        attempt_number: 1,
        status: "failed",
        submitted_at: new Date().toISOString(),
      });

      mockSupabase._store.execution_jobs.set("job_fail_01", {
        id: "job_fail_01",
        submission_id: subId,
        status: "failed",
      });

      const state = await getStudentDashboardState(mockSupabase, studentId);
      expect(state.nextAction.type).toBe("failed");
      expect(state.nextAction.badgeText).toBe("Verification Interrupted");
      expect(state.nextAction.ctaLabel).toBe("Retry Submission");
    });
  });
});
