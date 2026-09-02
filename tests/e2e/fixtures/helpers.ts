/**
 * E2E Fixture Utilities
 *
 * Provides fixture helpers for:
 * - E2E test data tagging
 * - Acceptance fixture (fixture-driven, classified as FIXTURE_DRIVEN)
 * - Test data cleanup
 *
 * IMPORTANT: These helpers use the Supabase Admin client for setup/teardown.
 * They are NEVER called from browser context — only from test setup/teardown hooks.
 *
 * Classification of acceptance step: FIXTURE_DRIVEN (not reviewer-browser E2E)
 * — no reviewer browser UI was built in Stages 1–6 for acceptance.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const E2E_TAG = "[E2E]";

/**
 * Creates a Supabase admin client for fixture operations.
 * Uses the anon key since the service role key is not a JWT in this project.
 */
export function createFixtureClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Returns the E2E student's Supabase user ID by email.
 */
export async function getE2EStudentId(email: string): Promise<string | null> {
  const client = createFixtureClient();
  const { data } = await client.from("profiles").select("id").eq("email", email).maybeSingle();
  return data?.id ?? null;
}

/**
 * Returns the first available internship for E2E testing.
 * Prefers internships that don't already have an E2E application from this student.
 */
export async function getE2EInternship(studentId: string): Promise<{ id: string; title: string; company: string } | null> {
  const client = createFixtureClient();

  // Get existing applications to avoid conflicts
  const { data: existingApps } = await client
    .from("applications")
    .select("internship_id")
    .eq("student_id", studentId);

  const appliedIds = existingApps?.map((a) => a.internship_id) ?? [];

  // Find an internship not yet applied to
  const { data: internships } = await client
    .from("internships")
    .select("id, title, companies(name)")
    .not("id", "in", appliedIds.length > 0 ? `(${appliedIds.join(",")})` : "(00000000-0000-0000-0000-000000000000)")
    .eq("status", "active")
    .limit(5);

  if (!internships || internships.length === 0) return null;
  const first = internships[0] as any;
  return {
    id: first.id,
    title: first.title,
    company: first.companies?.name ?? "NOVA Company",
  };
}

/**
 * Cleans up E2E test data for a student.
 * Removes applications, enrollments, tasks, submissions, jobs, and reviews
 * tagged or belonging to the E2E student.
 */
export async function cleanupE2EData(studentId: string): Promise<void> {
  const client = createFixtureClient();

  // Get all enrollment IDs for this student
  const { data: enrollments } = await client
    .from("enrollments")
    .select("id")
    .eq("student_id", studentId);

  const enrollmentIds = enrollments?.map((e) => e.id) ?? [];

  if (enrollmentIds.length > 0) {
    // Get all task IDs
    const { data: tasks } = await client
      .from("internship_tasks")
      .select("id")
      .in("enrollment_id", enrollmentIds);
    const taskIds = tasks?.map((t) => t.id) ?? [];

    if (taskIds.length > 0) {
      // Get all submission IDs
      const { data: submissions } = await client
        .from("internship_submissions")
        .select("id")
        .in("task_id", taskIds);
      const submissionIds = submissions?.map((s) => s.id) ?? [];

      if (submissionIds.length > 0) {
        // Clean execution jobs and reviews
        await client.from("execution_jobs").delete().in("submission_id", submissionIds);
        await client.from("runtime_evidence").delete().in("submission_id", submissionIds);
        await client.from("internship_reviews").delete().in("submission_id", submissionIds);
        await client.from("internship_submissions").delete().in("id", submissionIds);
      }

      // Clean tasks and milestones
      await client.from("internship_tasks").delete().in("id", taskIds);
    }

    await client.from("student_learning_states").delete().in("enrollment_id", enrollmentIds);
    await client.from("enrollment_milestones").delete().in("enrollment_id", enrollmentIds);
    await client.from("enrollments").delete().in("id", enrollmentIds);
  }

  // Clean applications
  await client.from("applications").delete().eq("student_id", studentId);
  // Clean notifications
  await client.from("notifications").delete().eq("user_id", studentId);
}

export { E2E_TAG };
