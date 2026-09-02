import { describe, it, expect, vi } from "vitest";
import {
  resolveAuthoritativeStudentJourney,
  type AuthoritativeJourneyState,
} from "@/lib/ai-engine/internship-mentor/journey";

describe("STAGE 5: Complete Student Internship Journey Suite", () => {
  const mockStudentId = "student-auth-id-555";
  const mockEnrollmentId = "enrollment-uuid-777";
  const mockTaskId1 = "task-uuid-111";
  const mockTaskId2 = "task-uuid-222";

  function createMockSupabase(overrides?: {
    profile?: any;
    enrollments?: any[];
    learningState?: any;
    milestones?: any[];
    tasks?: any[];
    submissions?: any[];
    jobs?: any[];
    reviews?: any[];
    evidences?: any[];
    notifications?: any[];
  }) {
    const profileData = overrides?.profile ?? {
      id: mockStudentId,
      first_name: "Sarah",
      last_name: "Connor",
      email: "sarah@cyberdyne.io",
      onboarded: true,
    };

    const enrollmentsData = overrides?.enrollments ?? [
      {
        id: mockEnrollmentId,
        student_id: mockStudentId,
        internship_id: "internship-ai-001",
        status: "active",
        created_at: "2026-09-01T00:00:00Z",
        internship: {
          id: "internship-ai-001",
          title: "AI Systems Engineering Residency",
          description: "Build robust AI inference pipelines and evaluators.",
          duration_weeks: 12,
          companies: { name: "Anthropic Partner Lab" },
        },
      },
    ];

    const milestonesData = overrides?.milestones ?? [
      {
        id: "m-0",
        enrollment_id: mockEnrollmentId,
        milestone_index: 0,
        title: "Distributed Pipeline Architecture",
        status: "in_progress",
        completed_task_count: 0,
        average_score: null,
      },
      {
        id: "m-1",
        enrollment_id: mockEnrollmentId,
        milestone_index: 1,
        title: "Model Evaluation & Sandbox Hardening",
        status: "locked",
        completed_task_count: 0,
        average_score: null,
      },
    ];

    const tasksData = overrides?.tasks ?? [
      {
        id: mockTaskId1,
        enrollment_id: mockEnrollmentId,
        student_id: mockStudentId,
        internship_id: "internship-ai-001",
        milestone_index: 0,
        title: "Build Distributed Event Stream Consumer",
        objective: "Develop a fault-tolerant Kafka consumer with exponential backoff.",
        business_context: "High-throughput stream reader for payment telemetry.",
        reason_for_assignment: "Assigned because your background demonstrates strong TypeScript fundamentals.",
        capstone_connection: "Prepares you for the end-to-end multi-agent event broker capstone.",
        instructions: ["Implement consumer.ts", "Add unit tests in consumer.test.ts"],
        deliverables: ["src/consumer.ts", "tests/consumer.test.ts"],
        acceptance_criteria: ["Consumer handles 1000 events/sec"],
        skills_practiced: ["Kafka", "TypeScript", "Resilience"],
        difficulty: "intermediate",
        estimated_hours: 6,
        status: "assigned",
      },
    ];

    const learningStateData = overrides?.learningState ?? {
      id: "ls-1",
      student_id: mockStudentId,
      enrollment_id: mockEnrollmentId,
      internship_id: "internship-ai-001",
      current_milestone_index: 0,
      completed_milestones: [],
      active_task_id: mockTaskId1,
      total_submissions: 0,
      passed_submissions: 0,
      average_score: 0,
      learning_velocity: 1.0,
      current_difficulty: "intermediate",
      difficulty_recommendation: "MAINTAIN",
      skill_ratings: [],
      observed_strengths: [],
      observed_weaknesses: [],
      repeated_errors: [],
      next_recommended_focus: null,
      capstone_progress_percentage: 0,
    };

    const submissionsData = overrides?.submissions ?? [];
    const jobsData = overrides?.jobs ?? [];
    const reviewsData = overrides?.reviews ?? [];
    const evidencesData = overrides?.evidences ?? [];
    const insertedNotifications: any[] = [];

    const mockClient = {
      from: vi.fn((table: string) => {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: any) => {
              if (table === "profiles") {
                return { maybeSingle: vi.fn().mockResolvedValue({ data: profileData, error: null }) };
              }
              if (table === "enrollments") {
                return {
                  eq: vi.fn(() => ({
                    order: vi.fn().mockResolvedValue({ data: enrollmentsData, error: null }),
                  })),
                };
              }
              if (table === "student_learning_states") {
                return { maybeSingle: vi.fn().mockResolvedValue({ data: learningStateData, error: null }) };
              }
              if (table === "enrollment_milestones") {
                return { order: vi.fn().mockResolvedValue({ data: milestonesData, error: null }) };
              }
              if (table === "internship_tasks") {
                return {
                  order: vi.fn().mockResolvedValue({
                    data: tasksData.filter((t) => t.enrollment_id === val),
                    error: null,
                  }),
                };
              }
              if (table === "internship_submissions") {
                return {
                  order: vi.fn().mockResolvedValue({
                    data: submissionsData.filter((s) => s.enrollment_id === val || s.task_id === val),
                    error: null,
                  }),
                };
              }
              return { order: vi.fn().mockResolvedValue({ data: [], error: null }) };
            }),
            in: vi.fn((col: string, vals: any[]) => {
              if (table === "execution_jobs") {
                return Promise.resolve({
                  data: jobsData.filter((j) => vals.includes(j.submission_id)),
                  error: null,
                });
              }
              if (table === "internship_reviews") {
                return Promise.resolve({
                  data: reviewsData.filter((r) => vals.includes(r.submission_id)),
                  error: null,
                });
              }
              if (table === "runtime_evidences") {
                return Promise.resolve({
                  data: evidencesData.filter((e) => vals.includes(e.submission_id)),
                  error: null,
                });
              }
              return Promise.resolve({ data: [], error: null });
            }),
          })),
          insert: vi.fn((payload: any) => {
            if (table === "notifications") {
              insertedNotifications.push(payload);
            }
            return Promise.resolve({ data: payload, error: null });
          }),
        };
      }),
      _insertedNotifications: insertedNotifications,
    };

    return mockClient as any;
  }

  // 1. Dashboard and workspace agree on current task
  it("Requirement 1 & 5: Dashboard and Workspace agree on authoritative active task", async () => {
    const supabase = createMockSupabase();
    const journey = await resolveAuthoritativeStudentJourney(supabase, mockStudentId);

    expect(journey.status).toBe("active");
    expect(journey.activeTask?.id).toBe(mockTaskId1);
    expect(journey.currentTask?.id).toBe(mockTaskId1);
    expect(journey.activeTask?.title).toBe("Build Distributed Event Stream Consumer");
    expect(journey.nextAction.ctaHref).toContain(mockTaskId1);
  });

  // 2. Milestone roadmap reflects real database state
  it("Requirement 2: Milestone roadmap reflects real database progression", async () => {
    const supabase = createMockSupabase();
    const journey = await resolveAuthoritativeStudentJourney(supabase, mockStudentId);

    expect(journey.milestones).toHaveLength(2);
    expect(journey.milestones[0].status).toBe("in_progress");
    expect(journey.milestones[1].status).toBe("locked");
    expect(journey.currentMilestone?.title).toBe("Distributed Pipeline Architecture");
  });

  // 3 & 4. Completed task vs Actionable task
  it("Requirement 3 & 4: Completed task is marked completed and active task is actionable", async () => {
    const supabase = createMockSupabase({
      tasks: [
        {
          id: mockTaskId1,
          enrollment_id: mockEnrollmentId,
          student_id: mockStudentId,
          internship_id: "internship-ai-001",
          milestone_index: 0,
          title: "Build Distributed Event Stream Consumer",
          status: "completed",
        },
        {
          id: mockTaskId2,
          enrollment_id: mockEnrollmentId,
          student_id: mockStudentId,
          internship_id: "internship-ai-001",
          milestone_index: 1,
          title: "Fault-Tolerant Dead Letter Queue",
          status: "assigned",
        },
      ],
      learningState: {
        current_milestone_index: 1,
        active_task_id: mockTaskId2,
        completed_milestones: [0],
        average_score: 95,
      },
    });

    const journey = await resolveAuthoritativeStudentJourney(supabase, mockStudentId);

    expect(journey.activeTask?.id).toBe(mockTaskId2);
    expect(journey.activeTask?.status).toBe("assigned");
    expect(journey.allTasks[0].status).toBe("completed");
    expect(journey.performanceMetrics.tasksCompleted).toBe(1);
  });

  // 6. Submission processing state
  it("Requirement 6: In-flight submission processing displays real execution job status", async () => {
    const subId = "sub-in-flight-999";
    const supabase = createMockSupabase({
      submissions: [
        {
          id: subId,
          task_id: mockTaskId1,
          student_id: mockStudentId,
          enrollment_id: mockEnrollmentId,
          commit_sha: "f1a2b3c4d5e6f7",
          attempt_number: 1,
          status: "running_verification",
          submitted_at: "2026-09-02T10:00:00Z",
        },
      ],
      jobs: [
        {
          id: "job-888",
          submission_id: subId,
          status: "running",
          execution_profile: "node_typescript",
        },
      ],
    });

    const journey = await resolveAuthoritativeStudentJourney(supabase, mockStudentId);

    expect(journey.nextAction.type).toBe("processing");
    expect(journey.nextAction.badgeText).toBe("Review in Progress");
    expect(journey.nextAction.currentStageLabel).toBe("Running test sandbox & AI evaluation");
  });

  // 7 & 8. Needs Revision Flow
  it("Requirement 7 & 8: Needs Revision flow delivers actionable mentor feedback and revision CTA", async () => {
    const subId = "sub-rev-111";
    const supabase = createMockSupabase({
      submissions: [
        {
          id: subId,
          task_id: mockTaskId1,
          student_id: mockStudentId,
          enrollment_id: mockEnrollmentId,
          commit_sha: "a1b2c3d",
          attempt_number: 1,
          status: "needs_revision",
          submitted_at: "2026-09-02T09:00:00Z",
        },
      ],
      reviews: [
        {
          id: "rev-111",
          submission_id: subId,
          task_id: mockTaskId1,
          attempt_number: 1,
          verdict: "needs_revision",
          score: 64,
          summary: "Missing backpressure handling on stream buffer full.",
          strengths: ["Clean interfaces"],
          improvements: ["Add backpressure buffer"],
          criteria_results: [
            { criterion: "1000 events/sec", status: "met" },
            { criterion: "Backpressure recovery", status: "not_met" },
          ],
        },
      ],
    });

    const journey = await resolveAuthoritativeStudentJourney(supabase, mockStudentId);

    expect(journey.nextAction.type).toBe("needs_revision");
    expect(journey.nextAction.badgeText).toBe("Revision Required");
    expect(journey.nextAction.ctaLabel).toBe("Revise Submission");
    expect(journey.latestReview?.score).toBe(64);
    expect(journey.latestReview?.verdict).toBe("needs_revision");
  });

  // 9. Immutable Attempt History
  it("Requirement 9: Immutable multi-attempt history preserves all past revisions", async () => {
    const sub1 = "sub-att-1";
    const sub2 = "sub-att-2";
    const supabase = createMockSupabase({
      submissions: [
        {
          id: sub1,
          task_id: mockTaskId1,
          student_id: mockStudentId,
          enrollment_id: mockEnrollmentId,
          commit_sha: "1111111",
          attempt_number: 1,
          status: "needs_revision",
          submitted_at: "2026-09-02T08:00:00Z",
        },
        {
          id: sub2,
          task_id: mockTaskId1,
          student_id: mockStudentId,
          enrollment_id: mockEnrollmentId,
          commit_sha: "2222222",
          attempt_number: 2,
          status: "passed",
          submitted_at: "2026-09-02T09:00:00Z",
        },
      ],
      reviews: [
        {
          id: "rev-1",
          submission_id: sub1,
          task_id: mockTaskId1,
          attempt_number: 1,
          verdict: "needs_revision",
          score: 65,
          summary: "Need retry logic",
        },
        {
          id: "rev-2",
          submission_id: sub2,
          task_id: mockTaskId1,
          attempt_number: 2,
          verdict: "passed",
          score: 98,
          summary: "Perfect retry implementation",
        },
      ],
    });

    const journey = await resolveAuthoritativeStudentJourney(supabase, mockStudentId);

    expect(journey.taskSubmissions).toHaveLength(2);
    expect(journey.taskSubmissions[0].attemptNumber).toBe(1);
    expect(journey.taskSubmissions[0].review?.score).toBe(65);
    expect(journey.taskSubmissions[1].attemptNumber).toBe(2);
    expect(journey.taskSubmissions[1].review?.score).toBe(98);
    expect(journey.performanceMetrics.totalRevisions).toBe(1);
  });

  // 10 & 11. Passed Flow and Next Task Navigation
  it("Requirement 10 & 11: Passed flow discovers pre-existing Task 2 without regeneration", async () => {
    const subId = "sub-pass-222";
    const supabase = createMockSupabase({
      tasks: [
        {
          id: mockTaskId1,
          enrollment_id: mockEnrollmentId,
          student_id: mockStudentId,
          internship_id: "internship-ai-001",
          milestone_index: 0,
          title: "Build Distributed Event Stream Consumer",
          status: "completed",
        },
        {
          id: mockTaskId2,
          enrollment_id: mockEnrollmentId,
          student_id: mockStudentId,
          internship_id: "internship-ai-001",
          milestone_index: 1,
          title: "Fault-Tolerant Dead Letter Queue",
          status: "assigned",
        },
      ],
      submissions: [
        {
          id: subId,
          task_id: mockTaskId1,
          student_id: mockStudentId,
          enrollment_id: mockEnrollmentId,
          commit_sha: "3333333",
          attempt_number: 1,
          status: "passed",
          submitted_at: "2026-09-02T10:00:00Z",
        },
      ],
      reviews: [
        {
          id: "rev-pass",
          submission_id: subId,
          task_id: mockTaskId1,
          attempt_number: 1,
          verdict: "passed",
          score: 95,
          summary: "All benchmarks passed.",
        },
      ],
    });

    const journey = await resolveAuthoritativeStudentJourney(supabase, mockStudentId, { targetTaskId: mockTaskId1 });

    expect(journey.nextAction.type).toBe("passed");
    expect(journey.nextAction.ctaLabel).toBe("Continue to Next Task");
    expect(journey.nextAction.ctaHref).toBe(`/student/learning?taskId=${mockTaskId2}`);
    expect(journey.nextTask?.id).toBe(mockTaskId2);
  });

  // 12. Manual Review Handling
  it("Requirement 12: Manual review verdict is not treated as failure or pass", async () => {
    const subId = "sub-manual-333";
    const supabase = createMockSupabase({
      submissions: [
        {
          id: subId,
          task_id: mockTaskId1,
          student_id: mockStudentId,
          enrollment_id: mockEnrollmentId,
          commit_sha: "4444444",
          attempt_number: 1,
          status: "in_review",
          submitted_at: "2026-09-02T10:00:00Z",
        },
      ],
      reviews: [
        {
          id: "rev-manual",
          submission_id: subId,
          task_id: mockTaskId1,
          attempt_number: 1,
          verdict: "manual_review",
          score: 82,
          summary: "Automated checks passed. Pending instructor verification.",
        },
      ],
    });

    const journey = await resolveAuthoritativeStudentJourney(supabase, mockStudentId);

    expect(journey.nextAction.type).toBe("manual_review");
    expect(journey.nextAction.badgeText).toBe("Manual Review Required");
    expect(journey.latestReview?.verdict).toBe("manual_review");
  });

  // 13. Infrastructure Failure Handling
  it("Requirement 13: Infrastructure execution failure provides retry CTA without quality penalty", async () => {
    const subId = "sub-fail-444";
    const supabase = createMockSupabase({
      submissions: [
        {
          id: subId,
          task_id: mockTaskId1,
          student_id: mockStudentId,
          enrollment_id: mockEnrollmentId,
          commit_sha: "5555555",
          attempt_number: 1,
          status: "failed",
          submitted_at: "2026-09-02T10:00:00Z",
        },
      ],
      jobs: [
        {
          id: "job-fail",
          submission_id: subId,
          status: "timed_out",
          exit_code: 124,
        },
      ],
    });

    const journey = await resolveAuthoritativeStudentJourney(supabase, mockStudentId);

    expect(journey.nextAction.type).toBe("failed");
    expect(journey.nextAction.badgeText).toBe("Verification Interrupted");
    expect(journey.nextAction.ctaLabel).toBe("Retry Submission");
  });

  // 14 & 15. Adaptive Mentor & Next Task Explanations
  it("Requirement 14 & 15: Surfaces adaptive reason and capstone connection from persisted data", async () => {
    const supabase = createMockSupabase();
    const journey = await resolveAuthoritativeStudentJourney(supabase, mockStudentId);

    expect(journey.activeTask?.reason_for_assignment).toBe(
      "Assigned because your background demonstrates strong TypeScript fundamentals."
    );
    expect(journey.activeTask?.capstone_connection).toBe(
      "Prepares you for the end-to-end multi-agent event broker capstone."
    );
  });

  // 17. Unauthorized Target TaskId rejected
  it("Requirement 17: Unauthorized or foreign taskId safely falls back to student's active task", async () => {
    const supabase = createMockSupabase();
    const foreignTaskId = "alien-task-from-another-user-999";
    const journey = await resolveAuthoritativeStudentJourney(supabase, mockStudentId, {
      targetTaskId: foreignTaskId,
    });

    // Should not select foreign task; falls back to authorized active task
    expect(journey.activeTask?.id).toBe(mockTaskId1);
    expect(journey.activeTask?.enrollment_id).toBe(mockEnrollmentId);
  });
});
