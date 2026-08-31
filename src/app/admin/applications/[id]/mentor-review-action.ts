"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { processInternshipEnrollment } from "@/lib/ai-engine/internship-worker";
import { reviewSchema } from "@/lib/validation";
import type { AdminActionState } from "../../action-state";

const ADMIN_ROLES = ["admin", "super_admin"];

function friendlyReviewError(error: { message?: string } | null): string {
  const message = error?.message ?? "";
  if (message.includes("Unauthorized")) return "You don't have permission to review applications.";
  if (message.includes("Application not found")) return "This application could not be found.";
  if (message.includes("Invalid State")) return "This application is no longer in a state that allows that action.";
  if (message.includes("Invalid Status")) return "Invalid review decision.";
  return "Something went wrong. Please try again.";
}

export async function reviewApplicationWithMentorAction(_prevState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  if (!auth.roles.some((role) => ADMIN_ROLES.includes(role))) return { status: "error", message: "You don't have permission to review applications." };

  const parsed = reviewSchema.safeParse({ application_id: formData.get("application_id"), status: formData.get("status"), feedback: formData.get("feedback") || undefined });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  const { error } = await auth.supabase.rpc("review_application", { app_uuid: parsed.data.application_id, review_status: parsed.data.status, feedback: parsed.data.feedback ?? null });
  if (error) return { status: "error", message: friendlyReviewError(error) };

  if (parsed.data.status === "accepted") {
    // The DB RPC has already committed the enrollment. If AI is unavailable,
    // acceptance still succeeds; the durable journey can be resumed later.
    const { data: enrollment } = await auth.supabase.from("enrollments").select("id").eq("application_id", parsed.data.application_id).maybeSingle();
    if (enrollment) {
      try {
        const result = await processInternshipEnrollment(enrollment.id);
        if (result.status === "error") console.error("AI internship onboarding:", result.message);
      } catch (workerError) {
        console.error("AI internship onboarding:", workerError);
      }
    }
  }

  return { status: "success", message: parsed.data.status === "accepted" ? "Application accepted and AI onboarding started." : "Application rejected." };
}
