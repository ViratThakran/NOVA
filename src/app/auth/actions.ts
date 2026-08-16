"use server";

import { redirect } from "next/navigation";
import { AuthApiError } from "@supabase/supabase-js";
import { createServerSideClient } from "@/lib/supabase";
import { getDashboardPathForRoles } from "@/lib/auth";
import type { AuthActionState } from "./action-state";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Maps Supabase's documented AuthError codes to user-facing copy. Falls back
// to a generic message for anything unrecognized — raw Postgres/GoTrue
// errors are never shown to the user, only logged server-side.
function friendlyAuthError(error: unknown): string {
  const code = error instanceof AuthApiError ? error.code : undefined;

  switch (code) {
    case "user_already_exists":
    case "email_exists":
    case "identity_already_exists":
      return "An account with this email already exists.";
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "Please confirm your email before logging in.";
    case "weak_password":
      return "Please choose a stronger password.";
    case "email_address_invalid":
    case "validation_failed":
      return "Enter a valid email address.";
    case "same_password":
      return "New password must be different from your current password.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a moment and try again.";
    case "user_banned":
    case "signup_disabled":
    case "email_provider_disabled":
      return "This action isn't available right now.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/** Only redirects to an internal, same-origin path — never an open redirect. */
function safeNextPath(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { first_name, last_name, email, password } = parsed.data;
  const supabase = await createServerSideClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Read by handle_new_user() to populate profiles.first_name/last_name.
      // No role is passed — public registration can never choose a role.
      data: { first_name, last_name },
      emailRedirectTo: `${APP_URL}/auth/callback?next=/student/onboarding`,
    },
  });

  if (error) {
    console.error("registerAction:", error);
    return { status: "error", message: friendlyAuthError(error) };
  }

  // Supabase returns an obfuscated "success" (a user with no identities) for
  // an email that's already registered, to avoid leaking which is which via
  // an explicit error — detect that case and surface it honestly here,
  // since at the *registration* step (unlike login) there's no ambiguity to
  // protect: the visitor already told us they don't have an account.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { status: "error", message: "An account with this email already exists." };
  }

  if (data.session) {
    // Local dev / auto-confirm is on — the account is already active.
    redirect("/student/onboarding");
  }

  return {
    status: "success",
    message: "Check your email to confirm your account before logging in.",
  };
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const next = safeNextPath(formData.get("next"));
  const supabase = await createServerSideClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    console.error("loginAction:", error);
    return { status: "error", message: friendlyAuthError(error) };
  }

  if (next) {
    redirect(next);
  }

  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
  const roles = (roleRows ?? []).map((row) => row.role);

  // Every signup gets `role: 'student'` by default (see handle_new_user())
  // regardless of intent — company_members membership, not user_roles, is
  // what actually makes someone a company user (see requireCompanyAccess()).
  // getDashboardPathForRoles() only ever sees the student role for these
  // users and would send them to /student/dashboard; checked here, before
  // falling back to that, so an admin's own login still isn't affected
  // (admin keeps priority, same as the existing student-vs-admin rule).
  const isAdmin = roles.some((role) => role === "admin" || role === "super_admin");
  if (!isAdmin) {
    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", data.user.id)
      .limit(1)
      .maybeSingle();
    if (membership) {
      redirect("/company");
    }
  }

  const dashboardPath = getDashboardPathForRoles(roles);

  // A student who hasn't finished onboarding lands there directly instead
  // of bouncing through /student/dashboard first (which would redirect them
  // to /student/onboarding anyway — see src/app/student/dashboard/page.tsx).
  if (dashboardPath === "/student/dashboard") {
    const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", data.user.id).single();
    redirect(profile?.onboarded ? "/student/dashboard" : "/student/onboarding");
  }

  redirect(dashboardPath);
}

export async function logoutAction() {
  const supabase = await createServerSideClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    // A malformed email is a genuine input error, not an enumeration risk.
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const genericSuccess: AuthActionState = {
    status: "success",
    message: "If an account exists for that email, we've sent a password reset link.",
  };

  const supabase = await createServerSideClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${APP_URL}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    console.error("forgotPasswordAction:", error);
    const code = error instanceof AuthApiError ? error.code : undefined;
    // Rate-limit responses still show the generic message below (revealing
    // rate-limiting itself would leak information); anything else is a real
    // failure the user should be told about, without saying why.
    if (code !== "over_email_send_rate_limit" && code !== "over_request_rate_limit") {
      return { status: "error", message: "Something went wrong. Please try again." };
    }
  }

  return genericSuccess;
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "This password reset link has expired or is invalid. Please request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    console.error("resetPasswordAction:", error);
    return { status: "error", message: friendlyAuthError(error) };
  }

  redirect("/login?reset=success");
}
