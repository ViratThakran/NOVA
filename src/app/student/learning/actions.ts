"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth";
import { processInternshipSubmission } from "@/lib/ai-engine/internship-worker";

export type LearningActionState = { status: "idle" | "success" | "error"; message?: string };

export async function submitInternshipWork(_prev: LearningActionState, formData: FormData): Promise<LearningActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };

  const taskId = String(formData.get("task_id") ?? "").trim();
  const submissionUrl = String(formData.get("submission_url") ?? "").trim();
  const submissionText = String(formData.get("submission_text") ?? "").trim();
  if (!taskId) return { status: "error", message: "Task not found." };
  if (!submissionUrl && !submissionText) return { status: "error", message: "Add a work link or explain what you completed." };
  if (submissionUrl.length > 2000 || submissionText.length > 12000) return { status: "error", message: "Your submission is too long." };

  // RLS verifies that this student owns the task and that the task is
  // actionable. We intentionally do not accept student_id from the browser.
  const { data: submission, error } = await auth.supabase
    .from("internship_ai_submissions")
    .insert({ task_id: taskId, student_id: auth.user.id, submission_url: submissionUrl || null, submission_text: submissionText || null })
    .select("id")
    .single();
  if (error || !submission) return { status: "error", message: "We couldn't submit your work. Make sure the task is still active." };

  try {
    const result = await processInternshipSubmission(submission.id);
    if (result.status === "error") console.error("processInternshipSubmission:", result.message);
  } catch (error) {
    // The submission itself is already durable. A worker/provider failure must
    // not tell the student that their work disappeared; it can be retried.
    console.error("processInternshipSubmission:", error);
  }

  revalidatePath("/student/learning");
  return { status: "success", message: "Work submitted. NOVA's AI Mentor is reviewing it." };
}
