import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOrInitializeStudentJourney,
  resolveInternshipDefinition,
} from "../../src/lib/ai-engine/internship-mentor/journey";
import {
  AI_ML_INTERNSHIP_DEFINITION,
  FULLSTACK_INTERNSHIP_DEFINITION,
  CLOUD_DEVOPS_INTERNSHIP_DEFINITION,
  DATA_ENGINEERING_INTERNSHIP_DEFINITION,
} from "../../src/lib/ai-engine/internship-mentor/definitions";
import {
  setAiProvider,
  resetAiProvider,
  MockProvider,
} from "../../src/lib/ai-engine/providers";

// Create a typed in-memory mock Supabase client to test database interactions,
// authorization gates, and idempotency guarantees in unit test isolation.
function createMockSupabaseClient() {
  const store = {
    enrollments: new Map<string, any>(),
    student_profiles: new Map<string, any>(),
    student_learning_states: new Map<string, any>(),
    enrollment_milestones: new Map<string, any>(),
    internship_tasks: new Map<string, any>(),
    internship_submissions: new Map<string, any>(),
    internship_reviews: new Map<string, any>(),
    notifications: [] as any[],
  };

  const client: any = {
    _store: store,
    from: (table: string) => {
      return {
        select: (cols?: string) => {
          let currentTable = store[table as keyof typeof store];
          let queryFilter: Record<string, any> = {};

          const builder: any = {
            eq: (col: string, val: any) => {
              queryFilter[col] = val;
              return builder;
            },
            in: (col: string, vals: any[]) => {
              return builder;
            },
            order: (col: string, opts?: any) => {
              return builder;
            },
            maybeSingle: async () => {
              if (table === "enrollments") {
                const enr = store.enrollments.get(queryFilter.id);
                if (enr && (!queryFilter.student_id || enr.student_id === queryFilter.student_id)) {
                  return { data: enr, error: null };
                }
                return { data: null, error: null };
              }
              if (table === "student_profiles") {
                const prof = store.student_profiles.get(queryFilter.id);
                return { data: prof || null, error: null };
              }
              if (table === "student_learning_states") {
                const state = store.student_learning_states.get(queryFilter.enrollment_id);
                return { data: state || null, error: null };
              }
              if (table === "internship_tasks") {
                const task = store.internship_tasks.get(queryFilter.id);
                return { data: task || null, error: null };
              }
              return { data: null, error: null };
            },
            single: async () => {
              return builder.maybeSingle();
            },
            then: async (resolve: any) => {
              if (table === "enrollment_milestones") {
                const rows = Array.from(store.enrollment_milestones.values()).filter(
                  (m) => m.enrollment_id === queryFilter.enrollment_id
                );
                return resolve({ data: rows, error: null });
              }
              if (table === "internship_submissions") {
                const rows = Array.from(store.internship_submissions.values()).filter(
                  (s) => s.task_id === queryFilter.task_id
                );
                return resolve({ data: rows, error: null });
              }
              if (table === "internship_reviews") {
                return resolve({ data: [], error: null });
              }
              return resolve({ data: [], error: null });
            },
          };
          return builder;
        },
        upsert: (payload: any, options?: any) => {
          return {
            select: () => ({
              single: async () => {
                if (table === "student_learning_states") {
                  const id = payload.id || `ls_${Date.now()}_${Math.random()}`;
                  const record = { id, ...payload };
                  store.student_learning_states.set(payload.enrollment_id, record);
                  return { data: record, error: null };
                }
                if (table === "enrollment_milestones") {
                  const key = `${payload.enrollment_id}_${payload.milestone_index}`;
                  const id = payload.id || `ms_${key}`;
                  const record = { id, ...payload };
                  store.enrollment_milestones.set(key, record);
                  return { data: record, error: null };
                }
                return { data: payload, error: null };
              },
            }),
          };
        },
        insert: (payload: any) => {
          return {
            select: () => ({
              single: async () => {
                if (table === "internship_tasks") {
                  const id = payload.id || `task_${Date.now()}_${Math.random()}`;
                  const record = { id, ...payload };
                  store.internship_tasks.set(id, record);
                  return { data: record, error: null };
                }
                return { data: payload, error: null };
              },
            }),
            then: async (resolve: any) => {
              if (table === "notifications") {
                store.notifications.push(payload);
              }
              return resolve({ data: payload, error: null });
            },
          };
        },
      };
    },
  };

  return client;
}

describe("STAGE 1: Student Journey Orchestration & Authorization Suite", () => {
  let mockSupabase: any;
  const validStudentId = "student_auth_123";
  const otherStudentId = "student_other_456";
  const validEnrollmentId = "enrollment_active_789";

  beforeEach(() => {
    resetAiProvider();
    mockSupabase = createMockSupabaseClient();

    // Populate active enrollment owned by validStudentId
    mockSupabase._store.enrollments.set(validEnrollmentId, {
      id: validEnrollmentId,
      student_id: validStudentId,
      internship_id: "internship_fullstack_01",
      application_id: "app_123",
      status: "active",
      created_at: new Date().toISOString(),
      internship: {
        id: "internship_fullstack_01",
        title: "Full-Stack Web Development Intern",
        description: "Develop production web apps with TypeScript, React, and PostgreSQL.",
        requirements: "TypeScript, React",
        eligibility: "Enrolled student",
        duration_weeks: 8,
        companies: { name: "NOVA Tech Ventures" },
      },
    });

    mockSupabase._store.student_profiles.set(validStudentId, {
      id: validStudentId,
      skills: ["TypeScript", "React", "Next.js"],
      education_info: { school: "Stanford University", degree: "B.S. CS", grad_year: 2026 },
    });
  });

  describe("1. Track Definition Resolution", () => {
    it("correctly resolves Full-Stack definition by default", () => {
      const def = resolveInternshipDefinition("Full-Stack Web Development Intern");
      expect(def.title).toBe(FULLSTACK_INTERNSHIP_DEFINITION.title);
    });

    it("correctly resolves AI/ML definition when title or description contains AI/ML keywords", () => {
      const def = resolveInternshipDefinition("Applied Machine Learning Engineer", "Build NLP models");
      expect(def.title).toBe(AI_ML_INTERNSHIP_DEFINITION.title);
    });

    it("correctly resolves Cloud DevOps definition", () => {
      const def = resolveInternshipDefinition("Cloud Infrastructure & DevOps Intern");
      expect(def.title).toBe(CLOUD_DEVOPS_INTERNSHIP_DEFINITION.title);
    });

    it("correctly resolves Data Engineering definition", () => {
      const def = resolveInternshipDefinition("Data Engineering & ETL Pipeline Intern");
      expect(def.title).toBe(DATA_ENGINEERING_INTERNSHIP_DEFINITION.title);
    });
  });

  describe("2. Server-Authoritative Authorization & Security", () => {
    it("rejects unauthorized student trying to access another student's enrollment", async () => {
      await expect(
        getOrInitializeStudentJourney({
          enrollmentId: validEnrollmentId,
          studentId: otherStudentId, // Mismatched student ID
          supabaseClient: mockSupabase,
        })
      ).rejects.toThrow(/Unauthorized/i);
    });

    it("rejects non-existent enrollment IDs", async () => {
      await expect(
        getOrInitializeStudentJourney({
          enrollmentId: "non_existent_enrollment",
          studentId: validStudentId,
          supabaseClient: mockSupabase,
        })
      ).rejects.toThrow(/Unauthorized/i);
    });

    it("rejects inactive enrollments (e.g. pending, paused, cancelled)", async () => {
      mockSupabase._store.enrollments.set("enrollment_paused_01", {
        id: "enrollment_paused_01",
        student_id: validStudentId,
        internship_id: "internship_fullstack_01",
        status: "paused",
        internship: { title: "Fullstack" },
      });

      await expect(
        getOrInitializeStudentJourney({
          enrollmentId: "enrollment_paused_01",
          studentId: validStudentId,
          supabaseClient: mockSupabase,
        })
      ).rejects.toThrow(/Invalid enrollment state/i);
    });
  });

  describe("3. Idempotency & Concurrency Safety", () => {
    it("generates Task 1 and initializes learning state on first call", async () => {
      // In isolated unit tests, we test the journey orchestrator with a mock provider
      setAiProvider(new MockProvider());

      const journey = await getOrInitializeStudentJourney({
        enrollmentId: validEnrollmentId,
        studentId: validStudentId,
        supabaseClient: mockSupabase,
        disableAiFallback: false,
      });

      expect(journey.enrollment.id).toBe(validEnrollmentId);
      expect(journey.learningState.current_milestone_index).toBe(0);
      expect(journey.learningState.active_task_id).toBeTruthy();
      expect(journey.activeTask).toBeTruthy();
      expect(journey.activeTask.title).toBeTruthy();
      expect(journey.milestones.length).toBeGreaterThan(0);
      expect(journey.milestones[0].status).toBe("in_progress");

      // Verify persistence in mock database
      expect(mockSupabase._store.student_learning_states.has(validEnrollmentId)).toBe(true);
      expect(mockSupabase._store.internship_tasks.size).toBe(1);
    });

    it("idempotently returns existing journey state on second call without regenerating Task 1", async () => {
      setAiProvider(new MockProvider());

      const journey1 = await getOrInitializeStudentJourney({
        enrollmentId: validEnrollmentId,
        studentId: validStudentId,
        supabaseClient: mockSupabase,
        disableAiFallback: false,
      });

      const initialTaskId = journey1.activeTask.id;
      const initialTaskTitle = journey1.activeTask.title;

      // Second call (simulating page refresh / double click)
      const journey2 = await getOrInitializeStudentJourney({
        enrollmentId: validEnrollmentId,
        studentId: validStudentId,
        supabaseClient: mockSupabase,
        disableAiFallback: false,
      });

      expect(journey2.activeTask.id).toBe(initialTaskId);
      expect(journey2.activeTask.title).toBe(initialTaskTitle);
      expect(mockSupabase._store.internship_tasks.size).toBe(1); // No duplicate tasks created!
    });
  });

  describe("4. Error Handling & No Silent Fallback Policy", () => {
    it("throws clear retryable error if AI provider fails and disableAiFallback is true", async () => {
      // Mock an AI provider that fails
      const failingProvider = {
        name: "FailingProvider",
        generateTask: vi.fn().mockRejectedValue(new Error("Upstream API 503 Service Unavailable")),
        generateReview: vi.fn(),
      };
      setAiProvider(failingProvider as any);

      await expect(
        getOrInitializeStudentJourney({
          enrollmentId: validEnrollmentId,
          studentId: validStudentId,
          supabaseClient: mockSupabase,
          disableAiFallback: true, // Strict production rule
        })
      ).rejects.toThrow(/AI generation threw error/i);

      // Verify that NO fake task was inserted into the database
      expect(mockSupabase._store.internship_tasks.size).toBe(0);
      expect(mockSupabase._store.student_learning_states.has(validEnrollmentId)).toBe(false);
    });

    it("throws error if generated task fails deterministic validation", async () => {
      // Mock an AI provider that returns malformed JSON missing deliverables
      const invalidTaskProvider = {
        name: "InvalidTaskProvider",
        generateTask: vi.fn().mockResolvedValue({
          title: "Bad Task",
          objective: "Short",
          business_context: "Missing info",
          instructions: ["Step 1"],
          deliverables: [], // Missing required deliverables!
          acceptance_criteria: [], // Missing criteria!
          skills_practiced: ["TypeScript"],
          difficulty: "beginner",
          estimated_hours: 4,
          reason_for_assignment: "Starting",
          milestone_index: 0,
        }),
        generateReview: vi.fn(),
      };
      setAiProvider(invalidTaskProvider as any);

      await expect(
        getOrInitializeStudentJourney({
          enrollmentId: validEnrollmentId,
          studentId: validStudentId,
          supabaseClient: mockSupabase,
          disableAiFallback: true,
        })
      ).rejects.toThrow(/AI Task Generation failed validation/i);

      expect(mockSupabase._store.internship_tasks.size).toBe(0);
    });
  });
});
