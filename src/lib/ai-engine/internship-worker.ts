import { bootstrapInternshipJourney, reviewInternshipSubmission, type InternshipMentorResult } from "./agents/internship-mentor-agent";
import { createAiWorkerClient } from "./server-client";

export async function processInternshipEnrollment(enrollmentId: string): Promise<InternshipMentorResult> {
  const supabase = createAiWorkerClient();
  const result = await bootstrapInternshipJourney(supabase, enrollmentId);
  await sendPendingInternshipEmails(supabase, result.journeyId);
  return result;
}

export async function processInternshipSubmission(submissionId: string): Promise<InternshipMentorResult> {
  const supabase = createAiWorkerClient();
  const result = await reviewInternshipSubmission(supabase, submissionId);
  await sendPendingInternshipEmails(supabase, result.journeyId);
  return result;
}

/** Optional Resend delivery. Without credentials, the durable outbox stays pending. */
export async function sendPendingInternshipEmails(supabase: ReturnType<typeof createAiWorkerClient>, journeyId?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return;

  let query = supabase.from("internship_ai_email_outbox").select("id, user_id, template, attempts").eq("status", "pending").order("created_at", { ascending: true }).limit(10);
  if (journeyId) query = query.eq("journey_id", journeyId);
  const { data: messages } = await query;

  for (const message of messages ?? []) {
    const { data: profile } = await supabase.from("profiles").select("email, first_name, last_name").eq("id", message.user_id).maybeSingle();
    if (!profile?.email) {
      await supabase.from("internship_ai_email_outbox").update({ status: "failed", attempts: Number(message.attempts ?? 0) + 1, last_error: "Student email address is missing." }).eq("id", message.id);
      continue;
    }
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "there";
    const content = emailContent(message.template, name);
    try {
      const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [profile.email], subject: content.subject, html: content.html }) });
      if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}`);
      await supabase.from("internship_ai_email_outbox").update({ status: "sent", attempts: Number(message.attempts ?? 0) + 1, sent_at: new Date().toISOString(), last_error: null }).eq("id", message.id);
    } catch (error) {
      await supabase.from("internship_ai_email_outbox").update({ status: "failed", attempts: Number(message.attempts ?? 0) + 1, last_error: error instanceof Error ? error.message : "Email delivery failed." }).eq("id", message.id);
    }
  }
}

function emailContent(template: string, name: string): { subject: string; html: string } {
  const safe = escapeHtml(name);
  switch (template) {
    case "internship_welcome": return { subject: "Welcome to your NOVA internship", html: `<p>Hi ${safe},</p><p>Your internship registration is successful. NOVA's AI Internship Mentor is preparing your first task.</p><p>Open your NOVA Learning workspace to begin your journey.</p><p>— Team NOVA</p>` };
    case "task_ready": return { subject: "Your next NOVA internship task is ready", html: `<p>Hi ${safe},</p><p>Your next internship task is ready in NOVA. Complete it, submit your evidence, and the AI Mentor will review it.</p><p>— Team NOVA</p>` };
    case "feedback_ready": return { subject: "Your NOVA internship feedback is ready", html: `<p>Hi ${safe},</p><p>Your AI Mentor has reviewed your latest internship submission. Open NOVA Learning to see the detailed feedback and next step.</p><p>— Team NOVA</p>` };
    default: return { subject: "You completed your NOVA internship journey", html: `<p>Hi ${safe},</p><p>Congratulations — you completed your NOVA AI-guided internship journey.</p><p>Your completion details are available in your NOVA dashboard.</p><p>— Team NOVA</p>` };
  }
}

function escapeHtml(value: string): string { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;"); }
