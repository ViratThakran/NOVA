"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { reviewSchema, markUnderReviewSchema } from "@/lib/validation";
import type { AdminActionState } from "./action-state";

const ADMIN_ROLES = ["admin", "super_admin"];

// Maps the RAISE EXCEPTION messages thrown by review_application() and
// mark_application_under_review() to user-facing copy. Both RPCs share the
// same message vocabulary on purpose (see the migration), so one mapping
// covers both. Raw Postgres/RPC errors are never shown to the user, only
// logged server-side.
function friendlyRpcError(error: { message?: string } | null): string {
  const message = error?.message ?? "";

  if (message.includes("Unauthorized")) {
    return "You don't have permission to review applications.";
  }
  if (message.includes("Application not found")) {
    return "This application could not be found.";
  }
  if (message.includes("Invalid State")) {
    return "This application is no longer in a state that allows that action.";
  }
  if (message.includes("Invalid Status")) {
    return "Invalid review decision.";
  }
  return "Something went wrong. Please try again.";
}

export async function reviewApplicationAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to review applications." };
  }

  const parsed = reviewSchema.safeParse({
    application_id: formData.get("application_id"),
    status: formData.get("status"),
    feedback: formData.get("feedback") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // Wraps the existing review_application() RPC rather than duplicating its
  // state-machine/enrollment/notification/audit-log logic here.
  const { error } = await supabase.rpc("review_application", {
    app_uuid: parsed.data.application_id,
    review_status: parsed.data.status,
    feedback: parsed.data.feedback ?? null,
  });

  if (error) {
    console.error("reviewApplicationAction:", error);
    return { status: "error", message: friendlyRpcError(error) };
  }

  return {
    status: "success",
    message: parsed.data.status === "accepted" ? "Application accepted." : "Application rejected.",
  };
}

export async function markUnderReviewAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to review applications." };
  }

  const parsed = markUnderReviewSchema.safeParse({
    application_id: formData.get("application_id"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { error } = await supabase.rpc("mark_application_under_review", {
    app_uuid: parsed.data.application_id,
  });

  if (error) {
    console.error("markUnderReviewAction:", error);
    return { status: "error", message: friendlyRpcError(error) };
  }

  return { status: "success", message: "Application marked as under review." };
}
