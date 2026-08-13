/**
 * ENROLLMENT + NOTIFICATION TESTS (Integration) — Phase 4E
 *
 * Exercises the query/RLS behavior the student enrollment and notification
 * pages depend on, plus the two new Server Actions
 * (markNotificationReadAction, markAllNotificationsReadAction — see
 * src/app/student/actions.ts).
 *
 * These talk to Supabase directly, the same way the Server Components do —
 * matching the pattern established in application-flow.test.ts (Phase 4B),
 * student-internship-experience.test.ts (Phase 4C), and
 * admin-application-review.test.ts (Phase 4D). Every fixture is created
 * fresh per test rather than reusing seed.sql's shared rows, to stay immune
 * to the cross-file race documented in the Phase 4B report.
 *
 * REQUIRES: Local Supabase running (`npx supabase start`)
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const ADMIN_EMAIL = "admin@test.nova";
const ADMIN_PASSWORD = "TestPassword123!";

const newTestEmail = () => `enrollment-notif-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;

const clientsToSignOut: SupabaseClient[] = [];
function trackedClient(): SupabaseClient {
  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  clientsToSignOut.push(client);
  return client;
}

let admin: SupabaseClient;

beforeAll(async () => {
  admin = trackedClient();
  const { error } = await admin.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (error) {
    throw new Error(`Setup failed: could not authenticate ${ADMIN_EMAIL}: ${error.message}`);
  }
});

afterAll(async () => {
  await Promise.all(clientsToSignOut.map((client) => client.auth.signOut()));
});

async function createFreshInternship() {
  const { data, error } = await admin
    .from("internships")
    .insert({
      title: `Enrollment Notification Internship ${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      description: "Integration test fixture internship.",
      requirements: "None.",
      eligibility: "Any enrolled student.",
      status: "open",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Setup failure: could not create internship: ${error?.message}`);
  }
  return data.id as string;
}

async function createFreshStudent() {
  const email = newTestEmail();
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) {
    throw new Error(`Setup failure: could not sign up ${email}: ${error?.message}`);
  }
  const userId = data.user.id;

  const { error: profileError } = await client.from("student_profiles").upsert({
    id: userId,
    education_info: { school: "Test University", degree: "CS", grad_year: 2028 },
    skills: ["TypeScript"],
  });
  if (profileError) {
    throw new Error(`Setup failure: could not create student_profiles for ${email}: ${profileError.message}`);
  }

  return { client, userId };
}

/** Fresh student + internship, application submitted and immediately accepted — produces a real enrollment + notification. */
async function createAcceptedApplication() {
  const { client, userId } = await createFreshStudent();
  const internshipId = await createFreshInternship();

  const { data: app, error: appError } = await client
    .from("applications")
    .insert({ student_id: userId, internship_id: internshipId, cover_letter: "Enrollment/notification test fixture application." })
    .select("id")
    .single();
  if (appError || !app) {
    throw new Error(`Setup failure: could not create application: ${appError?.message}`);
  }
  const applicationId = app.id as string;

  const { error: reviewError } = await admin.rpc("review_application", {
    app_uuid: applicationId,
    review_status: "accepted",
    feedback: null,
  });
  if (reviewError) {
    throw new Error(`Setup failure: could not accept application: ${reviewError.message}`);
  }

  const { data: enrollment, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id")
    .eq("application_id", applicationId)
    .single();
  if (enrollmentError || !enrollment) {
    throw new Error(`Setup failure: expected an enrollment but found none: ${enrollmentError?.message}`);
  }

  // notifications has no admin-bypass SELECT policy (unlike every other
  // table here) — it must be read as the owning student, not as admin.
  const { data: notifs, error: notifError } = await client
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (notifError || !notifs || notifs.length === 0) {
    throw new Error(`Setup failure: expected a notification but found none: ${notifError?.message}`);
  }

  return {
    studentClient: client,
    studentId: userId,
    internshipId,
    applicationId,
    enrollmentId: enrollment.id as string,
    notificationId: notifs[0].id as string,
  };
}

describe("Enrollment access", () => {
  it("1. a student can retrieve their own enrollment", async () => {
    const { studentClient, enrollmentId } = await createAcceptedApplication();

    const { data, error } = await studentClient.from("enrollments").select("id, status").eq("id", enrollmentId).maybeSingle();

    expect(error).toBeNull();
    expect(data?.id).toBe(enrollmentId);
    expect(data?.status).toBe("active");
  });

  it("2. a student cannot retrieve another student's enrollment", async () => {
    const { enrollmentId } = await createAcceptedApplication();
    const { client: otherStudent } = await createFreshStudent();

    const { data, error } = await otherStudent.from("enrollments").select("id").eq("id", enrollmentId).maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("3. a student cannot create an enrollment directly", async () => {
    const { client, userId } = await createFreshStudent();
    const internshipId = await createFreshInternship();
    const { data: app } = await client
      .from("applications")
      .insert({ student_id: userId, internship_id: internshipId, cover_letter: "Direct enrollment insert attempt fixture." })
      .select("id")
      .single();

    const { error } = await client.from("enrollments").insert({
      student_id: userId,
      internship_id: internshipId,
      application_id: app!.id,
      status: "active",
    });

    expect(error).not.toBeNull();
  });

  it("12. an unauthenticated client cannot access enrollments", async () => {
    const anon = trackedClient(); // never signed in
    const { data, error } = await anon.from("enrollments").select("id");

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("14. a well-formed but nonexistent enrollment id returns no row, not an error", async () => {
    const { studentClient } = await createAcceptedApplication();
    const { data, error } = await studentClient
      .from("enrollments")
      .select("id")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("14b. a malformed enrollment id is rejected at the database level (why the detail page validates UUID format first)", async () => {
    const { studentClient } = await createAcceptedApplication();
    const { error } = await studentClient.from("enrollments").select("id").eq("id", "not-a-uuid").maybeSingle();

    expect(error).not.toBeNull();
  });
});

describe("Notification access", () => {
  it("4. a student can retrieve their own notifications", async () => {
    const { studentClient, studentId, notificationId } = await createAcceptedApplication();

    const { data, error } = await studentClient.from("notifications").select("id, user_id").eq("user_id", studentId);

    expect(error).toBeNull();
    expect(data?.some((n) => n.id === notificationId)).toBe(true);
  });

  it("5. a student cannot retrieve another student's notifications", async () => {
    const { notificationId } = await createAcceptedApplication();
    const { client: otherStudent } = await createFreshStudent();

    const { data, error } = await otherStudent.from("notifications").select("id").eq("id", notificationId).maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("13. an unauthenticated client cannot access notifications", async () => {
    const anon = trackedClient(); // never signed in
    const { data, error } = await anon.from("notifications").select("id");

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("15. a well-formed but nonexistent notification id returns no row, not an error", async () => {
    const { studentClient } = await createAcceptedApplication();
    const { data, error } = await studentClient
      .from("notifications")
      .select("id")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});

describe("Notification read-state (what markNotificationReadAction wraps)", () => {
  it("6. a student can mark their own notification as read", async () => {
    const { studentClient, notificationId } = await createAcceptedApplication();

    const { error } = await studentClient.from("notifications").update({ read: true }).eq("id", notificationId).eq("user_id", (await studentClient.auth.getUser()).data.user!.id);
    expect(error).toBeNull();

    // notifications has no admin-bypass SELECT policy — verify as the owning student.
    const { data } = await studentClient.from("notifications").select("read").eq("id", notificationId).single();
    expect(data?.read).toBe(true);
  });

  it("7. a student cannot mark another student's notification as read", async () => {
    const { studentClient: owner, notificationId } = await createAcceptedApplication();
    const { client: otherStudent } = await createFreshStudent();

    const { data, error } = await otherStudent
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .select();

    // RLS filters the row out of the UPDATE target entirely — zero rows
    // affected, no error (the same silent-filter behavior established
    // throughout this project's RLS test suite).
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: stillUnread } = await owner.from("notifications").select("read").eq("id", notificationId).single();
    expect(stillUnread?.read).toBe(false);
  });

  // Security hardening (post-Phase-4E): the notifications table now grants
  // UPDATE on the `read` column only (see the migration's column-level
  // GRANT). Postgres enforces this independently of RLS — an UPDATE naming
  // any other column in its SET clause is rejected with 42501 before RLS
  // even runs. These tests hit Supabase/PostgREST directly (not through
  // markNotificationReadAction) to prove a malicious direct client — not
  // just a well-behaved Server Action — cannot modify protected columns.

  it("2. a student cannot change their own notification's title via a raw direct update", async () => {
    const { studentClient, notificationId } = await createAcceptedApplication();

    const { error } = await studentClient.from("notifications").update({ title: "Tampered title" }).eq("id", notificationId);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");

    const { data } = await studentClient.from("notifications").select("title").eq("id", notificationId).single();
    expect(data?.title).not.toBe("Tampered title");
  });

  it("3. a student cannot change their own notification's message via a raw direct update", async () => {
    const { studentClient, notificationId } = await createAcceptedApplication();

    const { error } = await studentClient.from("notifications").update({ message: "Tampered message" }).eq("id", notificationId);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");

    const { data } = await studentClient.from("notifications").select("message").eq("id", notificationId).single();
    expect(data?.message).not.toBe("Tampered message");
  });

  it("4. a student cannot change their own notification's user_id via a raw direct update", async () => {
    const { studentClient, notificationId } = await createAcceptedApplication();
    const { userId: otherUserId } = await createFreshStudent();

    const { error } = await studentClient.from("notifications").update({ user_id: otherUserId }).eq("id", notificationId);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");

    const { data } = await studentClient.from("notifications").select("user_id").eq("id", notificationId).single();
    expect(data?.user_id).not.toBe(otherUserId);
  });

  it("5. a student cannot change their own notification's created_at via a raw direct update", async () => {
    const { studentClient, notificationId } = await createAcceptedApplication();
    const { data: before } = await studentClient.from("notifications").select("created_at").eq("id", notificationId).single();

    const { error } = await studentClient
      .from("notifications")
      .update({ created_at: "2000-01-01T00:00:00Z" })
      .eq("id", notificationId);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");

    const { data: after } = await studentClient.from("notifications").select("created_at").eq("id", notificationId).single();
    expect(after?.created_at).toBe(before?.created_at);
  });

  it("a mixed update naming `read` alongside a protected column is rejected in full — no partial write of the allowed field", async () => {
    const { studentClient, notificationId } = await createAcceptedApplication();

    const { error } = await studentClient
      .from("notifications")
      .update({ read: true, title: "Tampered title" })
      .eq("id", notificationId);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");

    const { data } = await studentClient.from("notifications").select("read, title").eq("id", notificationId).single();
    expect(data?.read).toBe(false);
    expect(data?.title).not.toBe("Tampered title");
  });

  it("9. marking all notifications read only affects the caller's own unread notifications", async () => {
    const fixtureA = await createAcceptedApplication();
    const fixtureB = await createAcceptedApplication();

    // Mirrors exactly what markAllNotificationsReadAction does.
    const { error } = await fixtureA.studentClient
      .from("notifications")
      .update({ read: true })
      .eq("user_id", fixtureA.studentId)
      .eq("read", false);
    expect(error).toBeNull();

    const { data: aNotif } = await fixtureA.studentClient
      .from("notifications")
      .select("read")
      .eq("id", fixtureA.notificationId)
      .single();
    expect(aNotif?.read).toBe(true);

    const { data: bNotif } = await fixtureB.studentClient
      .from("notifications")
      .select("read")
      .eq("id", fixtureB.notificationId)
      .single();
    expect(bNotif?.read).toBe(false);
  });
});

describe("Accepted-application side effects (regression guard)", () => {
  it("10. an accepted application creates the expected enrollment", async () => {
    const { studentId, internshipId, applicationId, enrollmentId } = await createAcceptedApplication();

    const { data } = await admin
      .from("enrollments")
      .select("student_id, internship_id, application_id, status")
      .eq("id", enrollmentId)
      .single();

    expect(data?.student_id).toBe(studentId);
    expect(data?.internship_id).toBe(internshipId);
    expect(data?.application_id).toBe(applicationId);
    expect(data?.status).toBe("active");
  });

  it("11. an accepted application creates the expected notification", async () => {
    const { studentClient, studentId, notificationId } = await createAcceptedApplication();

    // notifications has no admin-bypass SELECT policy — verify as the owning student.
    const { data } = await studentClient.from("notifications").select("user_id, title").eq("id", notificationId).single();

    expect(data?.user_id).toBe(studentId);
    expect(data?.title).toMatch(/Accepted/i);
  });
});
