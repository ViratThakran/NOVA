"use server";

import { requireCompanyAccess } from "@/lib/auth";
import { processInternshipEnrollment } from "@/lib/ai-engine/internship-worker";
import { reviewSchema } from "@/lib/validation";
import type { CompanyActionState } from "../../action-state";

export async function reviewCompanyApplicationWithMentorAction(_prevState: CompanyActionState, formData: FormData): Promise<CompanyActionState> {
  const auth = await requireCompanyAccess();
  const parsed = reviewSchema.safeParse({ application_id: formData.get("application_id"), status: formData.get("status"), feedback: formData.get("feedback") || undefined });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  const { error } = await auth.supabase.rpc("review_application", { app_uuid: parsed.data.application_id, review_status: parsed.data.status, feedback: parsed.data.feedback ?? null });
  if (error) {
    if (error.message.includes("Unauthorized")) return { status: "error", message: "You don't have permission to review this application." };
    if (error.message.includes("Invalid State")) return { status: "error", message: "This application is no longer reviewable." };
    return { status: "error", message: "We couldn't update this application. Please try again." };
  }

  if (parsed.data.status === "accepted") {
    const { data: enrollment } = await auth.supabase.from("enrollments").select("id").eq("application_id", parsed.data.application_id).maybeSingle();
    if (enrollment) {
      try { await processInternshipEnrollment(enrollment.id); } catch (workerError) { console.error("AI internship onboarding:", workerError); }
    }
  }

  return { status: "success", message: parsed.data.status === "accepted" ? "Application accepted and AI onboarding started." : "Application rejected." };
}
