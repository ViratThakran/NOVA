import { redirect } from "next/navigation";
import { createServerSideClient } from "./supabase";

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
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roles = (roleRows ?? []).map((row) => row.role as AppRole);

  return { supabase, user, roles };
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
  const hasExpectedRole =
    expectedRole === "admin" ? roles.some((role) => ADMIN_ROLES.includes(role)) : roles.includes(expectedRole);

  if (!hasExpectedRole) {
    redirect(getDashboardPathForRoles(roles));
  }

  return { user, roles, supabase };
}
