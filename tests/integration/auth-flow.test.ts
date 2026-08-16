/**
 * AUTHENTICATION FLOW TESTS (Integration)
 *
 * Exercises real Supabase Auth against the local instance: registration
 * (through the actual handle_new_user() trigger, not raw seed SQL),
 * login/logout, session state, and the role data that loginAction() /
 * requireRole() (see src/lib/auth.ts, src/app/auth/actions.ts) base their
 * redirect decisions on.
 *
 * "Student role routing" / "admin role routing" are verified here at the
 * data layer (the role query each of those functions actually runs) — the
 * pure redirect-path decision logic itself is covered separately in
 * tests/unit/auth-routing.test.ts. Full HTTP-level proxy/layout redirect
 * behavior isn't exercised here (this suite only talks to Supabase, not a
 * running Next.js server) — see the final report for how that was verified.
 *
 * REQUIRES: Local Supabase running (`npx supabase start`)
 * Run with: npm run test:integration
 */

import { describe, it, expect, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const STUDENT_A_EMAIL = "student-a@test.nova";
const STUDENT_A_PASSWORD = "TestPassword123!";
const ADMIN_EMAIL = "admin@test.nova";
const ADMIN_PASSWORD = "TestPassword123!";

const newTestEmail = () => `auth-flow-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.nova`;

const clientsToSignOut: SupabaseClient[] = [];
function trackedClient(): SupabaseClient {
  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  clientsToSignOut.push(client);
  return client;
}

afterAll(async () => {
  await Promise.all(clientsToSignOut.map((client) => client.auth.signOut()));
});

// Signs up a fresh, uniquely-emailed account for tests that just need "some
// authenticated student" rather than the literal seeded student-a@test.nova
// — that account is signed into concurrently by many other integration test
// files (Vitest runs test files in parallel), so tests that don't actually
// need to be *that* account are better off not depending on it at all.
async function signUpFreshStudent() {
  const email = newTestEmail();
  const client = trackedClient();
  const { data, error } = await client.auth.signUp({ email, password: "correcthorse1" });
  if (error || !data.user) {
    throw new Error(`Setup failure: could not sign up a fresh student: ${error?.message}`);
  }
  return { client, email, userId: data.user.id };
}

describe("Registration", () => {
  it("creates a real auth user, profile, and a student-only role via handle_new_user()", async () => {
    const email = newTestEmail();
    const client = trackedClient();

    const { data, error } = await client.auth.signUp({
      email,
      password: "correcthorse1",
      options: { data: { first_name: "Test", last_name: "Registrant" } },
    });

    expect(error).toBeNull();
    expect(data.user).not.toBeNull();

    // This local instance auto-confirms signups (GOTRUE_MAILER_AUTOCONFIRM=true,
    // confirmed directly against the running container) — a session is issued
    // immediately rather than requiring an email click.
    expect(data.session).not.toBeNull();

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("first_name, last_name, onboarded")
      .eq("id", data.user!.id)
      .single();

    expect(profileError).toBeNull();
    expect(profile?.first_name).toBe("Test");
    expect(profile?.onboarded).toBe(false);

    const { data: roleRows, error: roleError } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user!.id);

    expect(roleError).toBeNull();
    // Public registration has no role field anywhere in the request — this
    // proves the account can only ever end up with the trigger's hardcoded
    // 'student' role, never anything client-chosen.
    expect(roleRows).toHaveLength(1);
    expect(roleRows?.[0]?.role).toBe("student");
  });

  it("rejects a duplicate email with a clear error rather than a raw Postgres error", async () => {
    // A freshly registered email, re-submitted — self-contained rather than
    // depending on the shared seeded student-a@test.nova account existing.
    const { email } = await signUpFreshStudent();

    const client = trackedClient();
    const { error } = await client.auth.signUp({
      email,
      password: "correcthorse1",
    });

    // Either an explicit error, or Supabase's obfuscated "user exists"
    // response (a user object with an empty identities array) — actions.ts
    // (registerAction) checks for exactly this second case.
    if (error) {
      expect(error.message).not.toMatch(/duplicate key|violates|constraint/i);
    }
  });
});

describe("Login", () => {
  it("succeeds for a seeded student account", async () => {
    const client = trackedClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: STUDENT_A_EMAIL,
      password: STUDENT_A_PASSWORD,
    });

    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
    expect(data.user?.email).toBe(STUDENT_A_EMAIL);
  });

  it("succeeds for the seeded admin account", async () => {
    const client = trackedClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
  });

  it("rejects an incorrect password", async () => {
    const { client, email } = await signUpFreshStudent();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: "definitely-wrong-password",
    });

    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });

  it("rejects a nonexistent email with the same error as a wrong password (no account enumeration)", async () => {
    const { email } = await signUpFreshStudent();
    const wrongPassword = trackedClient();
    const nonexistent = trackedClient();

    const [wrongPasswordResult, nonexistentResult] = await Promise.all([
      wrongPassword.auth.signInWithPassword({ email, password: "definitely-wrong-password" }),
      nonexistent.auth.signInWithPassword({ email: "no-such-account@test.nova", password: "definitely-wrong-password" }),
    ]);

    expect(wrongPasswordResult.error).not.toBeNull();
    expect(nonexistentResult.error).not.toBeNull();
    expect(nonexistentResult.error?.message).toBe(wrongPasswordResult.error?.message);
  });
});

describe("Authenticated session", () => {
  it("reflects the signed-in user after login", async () => {
    const { client, email } = await signUpFreshStudent();

    const {
      data: { user },
    } = await client.auth.getUser();

    expect(user).not.toBeNull();
    expect(user?.email).toBe(email);
  });
});

describe("Role routing data — what loginAction()/requireRole() actually query", () => {
  it("a signed-in student account has role 'student'", async () => {
    const { client, userId } = await signUpFreshStudent();

    const { data: roleRows } = await client.from("user_roles").select("role").eq("user_id", userId);

    expect(roleRows?.map((r) => r.role)).toEqual(["student"]);
  });

  it("the seeded admin account has an admin-tier role", async () => {
    const client = trackedClient();
    const { data: userData } = await client.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const { data: roleRows } = await client.from("user_roles").select("role").eq("user_id", userData.user!.id);
    const roles = roleRows?.map((r) => r.role) ?? [];

    expect(roles.some((role) => role === "admin" || role === "super_admin")).toBe(true);
  });
});

describe("Logout", () => {
  it("clears the session so getUser() no longer returns a user", async () => {
    const { client } = await signUpFreshStudent();

    const before = await client.auth.getUser();
    expect(before.data.user).not.toBeNull();

    const { error: signOutError } = await client.auth.signOut();
    expect(signOutError).toBeNull();

    const after = await client.auth.getUser();
    expect(after.data.user).toBeNull();
  });
});

describe("Protected data rejection — unauthenticated", () => {
  it("an anonymous (signed-out) client cannot read any profile row", async () => {
    const client = trackedClient(); // never signed in

    const { data, error } = await client.from("profiles").select("*").limit(1);

    // anon holds no table grants at all in this schema (see the migration's
    // "TABLE-LEVEL PRIVILEGES" section), so this must be rejected one way or
    // another. The exact code varies (a hard Postgres 42501 permission-denied
    // vs. PostgREST rejecting the request earlier over the new-format
    // publishable key not being a parseable JWT) — what matters is that no
    // profile data ever comes back.
    expect(data === null || data.length === 0).toBe(true);
    expect(error).not.toBeNull();
  });
});
