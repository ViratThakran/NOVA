import { describe, it, expect, vi } from "vitest";
import { resolveAuthoritativeStudentJourney } from "@/lib/ai-engine/internship-mentor/journey";

describe("STAGE 6: Application → Enrollment → AI Internship Journey Suite", () => {
  const studentA = "student-uuid-aaa";
  const studentB = "student-uuid-bbb";
  const internshipId = "internship-ai-101";
  const appIdA = "app-uuid-aaa";
  const appIdB = "app-uuid-bbb";
  const enrollmentIdA = "enrollment-uuid-aaa";
  const taskId1 = "task-uuid-001";

  function createMockSupabase(overrides?: {
    profiles?: Record<string, any>;
    applications?: any[];
    enrollments?: any[];
    tasks?: any[];
    milestones?: any[];
    learningStates?: any[];
    submissions?: any[];
  }) {
    const profiles = overrides?.profiles ?? {
      [studentA]: { id: studentA, first_name: "Alex", last_name: "Chen", email: "alex@nova.test", onboarded: true },
      [studentB]: { id: studentB, first_name: "Bob", last_name: "Smith", email: "bob@nova.test", onboarded: true },
    };

    const applications = overrides?.applications ?? [
      {
        id: appIdA,
        student_id: studentA,
        internship_id: internshipId,
        status: "pending",
        created_at: "2026-09-01T00:00:00Z",
        internship: {
          id: internshipId,
          title: "AI Systems Engineering Residency",
          companies: { name: "Nova Research" },
        },
      },
    ];

    const enrollments = overrides?.enrollments ?? [];
    const tasks = overrides?.tasks ?? [];
    const milestones = overrides?.milestones ?? [];
    const learningStates = overrides?.learningStates ?? [];
    const submissions = overrides?.submissions ?? [];

    const mockClient = {
      from: vi.fn((table: string) => {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: any) => {
              if (table === "profiles") {
                return { maybeSingle: vi.fn().mockResolvedValue({ data: profiles[val] || null, error: null }) };
              }
              if (table === "enrollments") {
                return {
                  eq: vi.fn((c2: string, v2: any) => ({
                    order: vi.fn().mockResolvedValue({
                      data: enrollments.filter((e) => e.student_id === val && e.status === v2),
                      error: null,
                    }),
                  })),
                };
              }
              if (table === "applications") {
                return {
                  order: vi.fn().mockResolvedValue({
                    data: applications.filter((a) => a.student_id === val),
                    error: null,
                  }),
                };
              }
              if (table === "student_learning_states") {
                return {
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: learningStates.find((ls) => ls.enrollment_id === val) || null,
                    error: null,
                  }),
                };
              }
              if (table === "enrollment_milestones") {
                return {
                  order: vi.fn().mockResolvedValue({
                    data: milestones.filter((m) => m.enrollment_id === val),
                    error: null,
                  }),
                };
              }
              if (table === "internship_tasks") {
                return {
                  order: vi.fn().mockResolvedValue({
                    data: tasks.filter((t) => t.enrollment_id === val),
                    error: null,
                  }),
                };
              }
              if (table === "internship_submissions") {
                return {
                  order: vi.fn().mockResolvedValue({
                    data: submissions.filter((s) => s.enrollment_id === val),
                    error: null,
                  }),
                };
              }
              return { order: vi.fn().mockResolvedValue({ data: [], error: null }) };
            }),
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      }),
    };

    return mockClient as any;
  }

  // 1 & 3: Pending application displays waiting state on dashboard
  it("Requirement 3: Pending application displays waiting state and points to application tracker", async () => {
    const supabase = createMockSupabase();
    const journey = await resolveAuthoritativeStudentJourney(supabase, studentA);

    expect(journey.status).toBe("no_enrollment");
    expect(journey.enrollment).toBeUndefined();
    expect(journey.activeTask).toBeFalsy();
    expect(journey.applications).toHaveLength(1);
    expect(journey.applications![0].status).toBe("pending");
    expect(journey.nextAction.title).toBe("Application Under Review");
    expect(journey.nextAction.ctaHref).toContain(appIdA);
  });

  // 4 & 12: Cross-Student Application Isolation
  it("Requirement 4 & 12: Applications of Student A are not visible to Student B", async () => {
    const supabase = createMockSupabase({
      applications: [
        {
          id: appIdA,
          student_id: studentA,
          internship_id: internshipId,
          status: "pending",
          internship: { title: "AI Residency A", companies: { name: "Company A" } },
        },
        {
          id: appIdB,
          student_id: studentB,
          internship_id: "internship-b",
          status: "pending",
          internship: { title: "AI Residency B", companies: { name: "Company B" } },
        },
      ],
    });

    const journeyA = await resolveAuthoritativeStudentJourney(supabase, studentA);
    const journeyB = await resolveAuthoritativeStudentJourney(supabase, studentB);

    expect(journeyA.applications).toHaveLength(1);
    expect(journeyA.applications![0].id).toBe(appIdA);

    expect(journeyB.applications).toHaveLength(1);
    expect(journeyB.applications![0].id).toBe(appIdB);
  });

  // 6 & 8: Rejected application does NOT create active enrollment or mentor journey
  it("Requirement 6 & 8: Rejected application does NOT create active enrollment or mentor task", async () => {
    const supabase = createMockSupabase({
      applications: [
        {
          id: appIdA,
          student_id: studentA,
          internship_id: internshipId,
          status: "rejected",
          internship: { title: "AI Systems Engineering Residency", companies: { name: "Nova" } },
        },
      ],
    });

    const journey = await resolveAuthoritativeStudentJourney(supabase, studentA);

    expect(journey.status).toBe("no_enrollment");
    expect(journey.activeTask).toBeFalsy();
    expect(journey.nextAction.badgeText).toBe("No Active Track");
    expect(journey.nextAction.ctaHref).toBe("/student/internships");
  });

  // 5 & 7 & 13: Accepted Application with Active Enrollment unlocks AI Mentor Journey
  it("Requirement 5 & 7 & 13: Accepted application with active enrollment unlocks full AI mentor journey", async () => {
    const supabase = createMockSupabase({
      applications: [
        {
          id: appIdA,
          student_id: studentA,
          internship_id: internshipId,
          status: "accepted",
          internship: { title: "AI Systems Engineering Residency", companies: { name: "Nova Research" } },
        },
      ],
      enrollments: [
        {
          id: enrollmentIdA,
          student_id: studentA,
          internship_id: internshipId,
          status: "active",
          created_at: "2026-09-02T00:00:00Z",
          internship: {
            id: internshipId,
            title: "AI Systems Engineering Residency",
            description: "Distributed AI systems",
            duration_weeks: 12,
            companies: { name: "Nova Research" },
          },
        },
      ],
      milestones: [
        {
          id: "m-0",
          enrollment_id: enrollmentIdA,
          milestone_index: 0,
          title: "Stream Processing Architecture",
          status: "in_progress",
        },
      ],
      tasks: [
        {
          id: taskId1,
          enrollment_id: enrollmentIdA,
          student_id: studentA,
          internship_id: internshipId,
          milestone_index: 0,
          title: "Build Distributed Event Stream Consumer",
          objective: "High-throughput stream reader",
          status: "assigned",
        },
      ],
      learningStates: [
        {
          enrollment_id: enrollmentIdA,
          student_id: studentA,
          active_task_id: taskId1,
          current_milestone_index: 0,
          current_difficulty: "intermediate",
        },
      ],
    });

    const journey = await resolveAuthoritativeStudentJourney(supabase, studentA);

    expect(journey.status).toBe("active");
    expect(journey.enrollment?.id).toBe(enrollmentIdA);
    expect(journey.enrollment?.internshipTitle).toBe("AI Systems Engineering Residency");
    expect(journey.activeTask?.id).toBe(taskId1);
    expect(journey.activeTask?.title).toBe("Build Distributed Event Stream Consumer");
    expect(journey.nextAction.title).toBe("Start your current task");
    expect(journey.nextAction.ctaHref).toContain(taskId1);
  });

  // 9 & 11: Idempotent resolution does not regenerate or duplicate tasks
  it("Requirement 9 & 11: Repeated resolution for active enrollment is idempotent", async () => {
    const supabase = createMockSupabase({
      enrollments: [
        {
          id: enrollmentIdA,
          student_id: studentA,
          internship_id: internshipId,
          status: "active",
          internship: { title: "AI Residency", companies: { name: "Nova" } },
        },
      ],
      tasks: [
        {
          id: taskId1,
          enrollment_id: enrollmentIdA,
          student_id: studentA,
          internship_id: internshipId,
          milestone_index: 0,
          title: "Task 1",
          status: "assigned",
        },
      ],
      learningStates: [
        {
          enrollment_id: enrollmentIdA,
          student_id: studentA,
          active_task_id: taskId1,
        },
      ],
    });

    const journey1 = await resolveAuthoritativeStudentJourney(supabase, studentA);
    const journey2 = await resolveAuthoritativeStudentJourney(supabase, studentA);

    expect(journey1.activeTask?.id).toBe(taskId1);
    expect(journey2.activeTask?.id).toBe(taskId1);
    expect(journey1.allTasks).toHaveLength(1);
    expect(journey2.allTasks).toHaveLength(1);
  });

  // 17 & 18: No mock source of truth, authoritative DB state preserved
  it("Requirement 17 & 18: Source of truth strictly reflects database records without client tampering", async () => {
    const supabase = createMockSupabase();
    // Foreign user ID lookup produces empty enrollment and no tasks
    const journeyUnauthorized = await resolveAuthoritativeStudentJourney(supabase, "attacker-fake-uuid");

    expect(journeyUnauthorized.status).toBe("no_enrollment");
    expect(journeyUnauthorized.allTasks).toHaveLength(0);
    expect(journeyUnauthorized.activeTask).toBeFalsy();
  });
});
