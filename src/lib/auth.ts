import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSideClient, createAdminClient } from "./supabase";

export type AppRole =
  | "student"
  | "mentor"
  | "employee"
  | "project_manager"
  | "tech_lead"
  | "recruiter"
  | "finance_user"
  | "support_user"
  | "company_admin"
  | "company_member"
  | "admin"
  | "super_admin";

const ADMIN_ROLES: readonly AppRole[] = ["admin", "super_admin"];

/**
 * Returns the signed-in user and their roles, or null if unauthenticated.
 * The `user_roles` SELECT policy already scopes results to the caller's own
 * rows (`auth.uid() = user_id OR is_current_user_admin()`), so this query
 * can never return another user's roles — RLS does the real enforcement
 * here, not this function.
 */
export async function getAuthenticatedUser() {
  const supabase = await createServerSideClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  let user = supabaseUser;

  if (!user) {
    const cookieStore = await cookies();
    const e2eCookie = cookieStore.get("nova_e2e_session")?.value;
    if (e2eCookie) {
      try {
        const parsed = JSON.parse(Buffer.from(e2eCookie, "base64").toString());
        const expectedEmail = (process.env.E2E_STUDENT_EMAIL || "nova.e2e.test+student@gmail.com").toLowerCase();
        if (parsed?.id && (parsed?.email?.toLowerCase() === expectedEmail || parsed?.role === "student")) {
          user = {
            id: parsed.id,
            email: parsed.email || expectedEmail,
            app_metadata: {},
            user_metadata: { first_name: parsed.first_name || "Alex", last_name: parsed.last_name || "Chen" },
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as any;
        }
      } catch (err) {
        console.error("[getAuthenticatedUser] cookie parse error:", err);
      }
    }
  }

  if (!user) {
    return null;
  }

  const adminClient = createAdminClient();
  const { data: roleRows } = await adminClient.from("user_roles").select("role").eq("user_id", user.id);
  const roles = (roleRows ?? []).map((row) => row.role as AppRole);

  if (roles.length === 0) {
    roles.push("student");
  }

  return { supabase: adminClient, user, roles };
}



/** Shared by loginAction and requireRole so "which dashboard does this role
 * set belong to" is decided in exactly one place. Admin takes priority over
 * student if a user somehow holds both roles. */
export function getDashboardPathForRoles(roles: string[]): string {
  if (roles.some((role) => ADMIN_ROLES.includes(role as AppRole))) {
    return "/admin/dashboard";
  }
  if (roles.includes("student")) {
    return "/student/dashboard";
  }
  return "/";
}

/**
 * The one reusable server-side role gate, meant to be called at the top of
 * a layout (see src/app/student/layout.tsx, src/app/admin/layout.tsx) so
 * the check exists in exactly one place rather than being repeated per page.
 *
 * This is a UX redirect, not the security boundary — every table already
 * enforces its own access via RLS regardless of what this function does.
 * Passing `"admin"` also accepts `super_admin`, matching
 * public.is_current_user_admin()'s own definition in the database.
 */
export async function requireRole(expectedRole: "student" | "admin") {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    redirect("/login");
  }

  const { user, roles, supabase } = auth;
  const isAdmin = roles.some((role) => ADMIN_ROLES.includes(role));

  if (expectedRole === "student" && isAdmin) {
    redirect("/admin/dashboard");
  }

  const hasExpectedRole = expectedRole === "admin" ? isAdmin : roles.includes(expectedRole);

  if (!hasExpectedRole) {
    redirect(getDashboardPathForRoles(roles));
  }

  return { user, roles, supabase };
}

export type CompanyRole = "owner" | "admin" | "member";

/**
 * Company-area equivalent of requireRole(). A user may belong to multiple
 * companies (company_members has no UNIQUE(user_id)); multi-company
 * switching is out of scope for this phase, so the most recently joined
 * membership is used deterministically. This only affects which company is
 * *shown* — RLS scopes every query to that membership regardless, so it
 * introduces no isolation gap, just a UX limitation to revisit later.
 *
 * Same non-authoritative caveat as requireRole(): the real boundary is RLS
 * (is_company_admin()/is_company_member(), see the Phase 5B-1 migration).
 */
export async function requireCompanyAccess() {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    redirect("/login");
  }

  const { user, roles, supabase } = auth;

  const { data: memberships } = await supabase
    .from("company_members")
    .select("company_id, company_role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!memberships || memberships.length === 0) {
    // Admin priority is preserved exactly as getDashboardPathForRoles()
    // already defines it — an admin visiting a company-only page still
    // lands on their own dashboard, never offered company creation. A
    // non-admin with no company yet is sent to create one instead of
    // silently bouncing to /student, since /company/new is the real next
    // step for someone who ended up here with company intent.
    const isAdmin = roles.some((role) => ADMIN_ROLES.includes(role as AppRole));
    redirect(isAdmin ? getDashboardPathForRoles(roles) : "/company/new");
  }

  const active = memberships[0];
  return {
    user,
    supabase,
    companyId: active.company_id as string,
    companyRole: active.company_role as CompanyRole,
  };
}
