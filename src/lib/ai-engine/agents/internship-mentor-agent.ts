import type { SupabaseClient } from "@supabase/supabase-js";
import { getAiProvider } from "../providers";

export interface InternshipMentorResult {
  status: "success" | "error";
  message?: string;
  journeyId?: string;
  taskId?: string;
  submissionId?: string;
  reviewId?: string;
}

type InternshipContext = {
  journeyId: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  internshipTitle: string;
  internshipDescription: string;
  internshipRequirements: string;
  internshipEligibility: string;
  skills: string[];
  education: Record<string, unknown>;
};

type GeneratedTask = {
  title: string;
  objective: string;
  instructions: string;
  deliverables: string[];
  acceptance_criteria: string[];
  estimated_hours: number;
};

type ReviewResult = {
  verdict: "passed" | "needs_revision";
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  next_step: string;
};

/**
 * Starts or resumes one internship journey. It performs one bounded unit of
 * work and returns; the database holds the state while the student works.
 */
export async function bootstrapInternshipJourney(supabase: SupabaseClient, enrollmentId: string): Promise<InternshipMentorResult> {
  const context = await loadContext(supabase, enrollmentId);
  if (!context) return { status: "error", message: "Internship enrollment not found." };

  const { data: journey, error: journeyError } = await supabase
    .from("internship_ai_journeys")
    .select("id, status, current_sequence, target_task_count")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();
  if (journeyError || !journey) return { status: "error", message: "AI internship journey has not been initialized." };
  if (journey.status === "completed") return { status: "success", journeyId: journey.id };
  if (journey.status === "paused") return { status: "error", journeyId: journey.id, message: "This internship journey is paused." };

  // Idempotency: retries never create a second actionable task.
  const { data: existingTask } = await supabase
    .from("internship_ai_tasks")
    .select("id, status, sequence_no")
    .eq("journey_id", journey.id)
    .in("status", ["assigned", "needs_revision", "submitted"])
    .order("sequence_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingTask) return { status: "success", journeyId: journey.id, taskId: existingTask.id };

  const nextSequence = Number(journey.current_sequence) + 1;
  if (nextSequence > Number(journey.target_task_count)) {
    await supabase.from("internship_ai_journeys").update({ status: "completed", last_error: null }).eq("id", journey.id);
    await queueNotification(supabase, context.studentId, "Internship completed", "You have completed your AI-guided internship journey.");
    await queueEmail(supabase, journey.id, context.studentId, "internship_completed", `internship-complete:${journey.id}`);
    return { status: "success", journeyId: journey.id };
  }

  try {
    const task = await generateTask(context, nextSequence);
    const { data: inserted, error } = await supabase
      .from("internship_ai_tasks")
      .insert({ journey_id: journey.id, sequence_no: nextSequence, title: task.title, objective: task.objective, instructions: task.instructions, deliverables: task.deliverables, acceptance_criteria: task.acceptance_criteria, estimated_hours: task.estimated_hours, status: "assigned" })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Could not create internship task.");

    await supabase.from("internship_ai_journeys").update({ status: "active", current_sequence: nextSequence, last_error: null }).eq("id", journey.id);
    await queueNotification(supabase, context.studentId, `New internship task: ${task.title}`, `${task.objective} Open your Learning workspace to see the instructions and submit your work.`);
    await queueEmail(supabase, journey.id, context.studentId, "task_ready", `task-ready:${inserted.id}`);
    return { status: "success", journeyId: journey.id, taskId: inserted.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI task generation failed.";
    await supabase.from("internship_ai_journeys").update({ status: "failed", last_error: message }).eq("id", journey.id);
    return { status: "error", journeyId: journey.id, message };
  }
}

/** Reviews one submission and, when passed, advances the same journey. */
export async function reviewInternshipSubmission(supabase: SupabaseClient, submissionId: string): Promise<InternshipMentorResult> {
  const { data: submission, error: submissionError } = await supabase
    .from("internship_ai_submissions")
    .select("id, task_id, student_id, submission_url, submission_text, status")
    .eq("id", submissionId)
    .maybeSingle();
  if (submissionError || !submission) return { status: "error", message: "Submission not found." };
  if (submission.status === "reviewed") return { status: "success", submissionId, taskId: submission.task_id };

  const { data: task } = await supabase
    .from("internship_ai_tasks")
    .select("id, journey_id, sequence_no, title, objective, instructions, acceptance_criteria, attempt_count")
    .eq("id", submission.task_id)
    .maybeSingle();
  if (!task) return { status: "error", message: "Submission task not found." };

  const { data: journey } = await supabase
    .from("internship_ai_journeys")
    .select("id, enrollment_id, status")
    .eq("id", task.journey_id)
    .maybeSingle();
  if (!journey) return { status: "error", message: "Internship journey not found." };

  try {
    const evidence = await resolveSubmissionEvidence(submission.submission_url, submission.submission_text);
    const review = await generateReview({
      taskTitle: task.title,
      objective: task.objective,
      instructions: task.instructions,
      acceptanceCriteria: asStringArray(task.acceptance_criteria),
      evidence,
    });

    const { data: reviewRow, error: reviewError } = await supabase
      .from("internship_ai_reviews")
      .insert({ submission_id: submission.id, task_id: task.id, student_id: submission.student_id, verdict: review.verdict, score: review.score, summary: review.summary, strengths: review.strengths, improvements: review.improvements, next_step: review.next_step })
      .select("id")
      .single();
    if (reviewError || !reviewRow) throw new Error(reviewError?.message ?? "Could not save AI review.");

    await supabase.from("internship_ai_submissions").update({ status: "reviewed" }).eq("id", submission.id);

    if (review.verdict === "passed") {
      await supabase.from("internship_ai_tasks").update({ status: "completed" }).eq("id", task.id);
      await queueNotification(supabase, submission.student_id, `Task ${task.sequence_no} approved`, `${review.summary} Next step: ${review.next_step}`);
      await queueEmail(supabase, journey.id, submission.student_id, "feedback_ready", `feedback:${submission.id}`);
      await bootstrapInternshipJourney(supabase, journey.enrollment_id);
    } else {
      await supabase.from("internship_ai_tasks").update({ status: "needs_revision", attempt_count: Number(task.attempt_count ?? 0) + 1 }).eq("id", task.id);
      await queueNotification(supabase, submission.student_id, `Feedback for task ${task.sequence_no}`, `${review.summary} ${review.next_step}`);
      await queueEmail(supabase, journey.id, submission.student_id, "feedback_ready", `feedback:${submission.id}`);
    }

    return { status: "success", journeyId: journey.id, taskId: task.id, submissionId: submission.id, reviewId: reviewRow.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI review failed.";
    await supabase.from("internship_ai_journeys").update({ status: "active", last_error: message }).eq("id", journey.id);
    return { status: "error", journeyId: journey.id, taskId: task.id, submissionId: submission.id, message };
  }
}

async function loadContext(supabase: SupabaseClient, enrollmentId: string): Promise<InternshipContext | null> {
  const { data: enrollment, error } = await supabase.from("enrollments").select("id, student_id, internship_id").eq("id", enrollmentId).maybeSingle();
  if (error || !enrollment) return null;

  const [{ data: internship }, { data: student }, { data: profile }, { data: journey }] = await Promise.all([
    supabase.from("internships").select("title, description, requirements, eligibility").eq("id", enrollment.internship_id).maybeSingle(),
    supabase.from("student_profiles").select("skills, education_info").eq("id", enrollment.student_id).maybeSingle(),
    supabase.from("profiles").select("first_name, last_name").eq("id", enrollment.student_id).maybeSingle(),
    supabase.from("internship_ai_journeys").select("id").eq("enrollment_id", enrollmentId).maybeSingle(),
  ]);
  if (!internship || !student || !journey) return null;

  return {
    journeyId: journey.id,
    enrollmentId,
    studentId: enrollment.student_id,
    studentName: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Student",
    internshipTitle: internship.title,
    internshipDescription: internship.description,
    internshipRequirements: internship.requirements,
    internshipEligibility: internship.eligibility,
    skills: student.skills ?? [],
    education: (student.education_info ?? {}) as Record<string, unknown>,
  };
}

async function generateTask(context: InternshipContext, sequence: number): Promise<GeneratedTask> {
  const raw = await getAiProvider().complete({
    responseFormat: "internship_task",
    systemPrompt: "You are NOVA's AI Internship Mentor. Create practical, progressive internship work. Return JSON only. The task must be achievable in 2-8 hours, aligned with the internship, and appropriate to the student's known skills. Never invent personal facts.",
    userPrompt: `Task ${sequence}. Student: ${context.studentName}. Internship: ${context.internshipTitle}. Description: ${context.internshipDescription}. Requirements: ${context.internshipRequirements}. Eligibility: ${context.internshipEligibility}. Skills: ${context.skills.join(", ") || "not provided"}. Education: ${JSON.stringify(context.education)}. Create a real-world task that builds toward employable skill.`,
  });
  const candidate = parseJsonObject(raw) as Partial<GeneratedTask>;
  if (typeof candidate.title !== "string" || typeof candidate.objective !== "string" || typeof candidate.instructions !== "string" || !Array.isArray(candidate.deliverables) || !Array.isArray(candidate.acceptance_criteria)) return fallbackTask(context, sequence);
  return {
    title: candidate.title.slice(0, 200),
    objective: candidate.objective.slice(0, 2000),
    instructions: candidate.instructions.slice(0, 6000),
    deliverables: candidate.deliverables.filter((v): v is string => typeof v === "string").slice(0, 10),
    acceptance_criteria: candidate.acceptance_criteria.filter((v): v is string => typeof v === "string").slice(0, 10),
    estimated_hours: clampInt(candidate.estimated_hours, 4, 1, 80),
  };
}

async function generateReview(input: { taskTitle: string; objective: string; instructions: string; acceptanceCriteria: string[]; evidence: string }): Promise<ReviewResult> {
  const raw = await getAiProvider().complete({
    responseFormat: "internship_review",
    systemPrompt: "You are NOVA's AI Internship Reviewer. Review only the supplied evidence. Do not claim to have inspected anything not included in the evidence. Be fair, specific and educational. Return JSON only with verdict, score, summary, strengths, improvements, next_step.",
    userPrompt: `Task: ${input.taskTitle}\nObjective: ${input.objective}\nInstructions: ${input.instructions}\nAcceptance criteria: ${JSON.stringify(input.acceptanceCriteria)}\nEvidence:\n${input.evidence}`,
  });
  const parsed = parseJsonObject(raw) as Partial<ReviewResult>;
  if (parsed.verdict === "passed" || parsed.verdict === "needs_revision") {
    return {
      verdict: parsed.verdict,
      score: clampInt(parsed.score, parsed.verdict === "passed" ? 80 : 60, 0, 100),
      summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 5000) : "Your submission was reviewed against the task requirements.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((v): v is string => typeof v === "string").slice(0, 10) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.filter((v): v is string => typeof v === "string").slice(0, 10) : [],
      next_step: typeof parsed.next_step === "string" ? parsed.next_step.slice(0, 2000) : "Review the feedback and continue.",
    };
  }
  return { verdict: "needs_revision", score: 60, summary: "The submission needs stronger evidence before it can be marked complete.", strengths: ["Work was submitted for review."], improvements: ["Add clearer evidence of the completed deliverable and explain the important implementation decisions."], next_step: "Update the submission with stronger evidence and submit it again." };
}

async function resolveSubmissionEvidence(url: string | null, text: string | null): Promise<string> {
  const parts: string[] = [];
  if (text) parts.push(`Student notes:\n${text.slice(0, 12000)}`);
  if (url) {
    const github = parseGithubUrl(url);
    if (github) {
      const response = await fetch(`https://api.github.com/repos/${github.owner}/${github.repo}`, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
      if (response.ok) {
        const repo = (await response.json()) as { name?: string; description?: string; html_url?: string; language?: string; default_branch?: string; topics?: string[] };
        parts.push(`GitHub repository metadata:\n${JSON.stringify(repo)}`);
        const treeResponse = await fetch(`https://api.github.com/repos/${github.owner}/${github.repo}/git/trees/${repo.default_branch ?? "main"}?recursive=1`, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
        if (treeResponse.ok) {
          const tree = (await treeResponse.json()) as { tree?: { path: string; type: string; size?: number }[] };
          parts.push(`Repository file tree:\n${JSON.stringify((tree.tree ?? []).slice(0, 300))}`);
        }
      } else parts.push(`GitHub repository metadata could not be fetched (HTTP ${response.status}).`);
    } else parts.push(`Submission URL: ${url}`);
  }
  return parts.join("\n\n").slice(0, 30000) || "No submission evidence was supplied.";
}

function parseGithubUrl(value: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(value);
    if (url.hostname !== "github.com") return null;
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    if (!owner || !repo || owner.length > 100 || repo.length > 100) return null;
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

async function queueNotification(supabase: SupabaseClient, userId: string, title: string, message: string) {
  await supabase.from("notifications").insert({ user_id: userId, title, message });
}

async function queueEmail(supabase: SupabaseClient, journeyId: string, userId: string, template: "internship_welcome" | "task_ready" | "feedback_ready" | "internship_completed", dedupeKey: string) {
  await supabase.from("internship_ai_email_outbox").insert({ journey_id: journeyId, user_id: userId, dedupe_key: dedupeKey, template });
}

function fallbackTask(context: InternshipContext, sequence: number): GeneratedTask {
  const focus = context.skills[0] ?? "the core skill for this internship";
  return {
    title: `Task ${sequence}: Build a practical ${focus} deliverable`,
    objective: `Apply your current ${focus} knowledge to a real-world deliverable related to ${context.internshipTitle}.`,
    instructions: "Create a working deliverable, document your approach and submit the work link with a short explanation of your decisions.",
    deliverables: ["Working deliverable", "Short implementation note", "Link or evidence of the work"],
    acceptance_criteria: ["The requested deliverable is present", "The work is understandable and reproducible", "The student explains key decisions"],
    estimated_hours: 4,
  };
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(trimmed) as Record<string, unknown>; }
  catch { const start = trimmed.indexOf("{"); const end = trimmed.lastIndexOf("}"); if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>; throw new Error("AI returned invalid JSON."); }
}

function asStringArray(value: unknown): string[] { return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []; }
function clampInt(value: unknown, fallback: number, min: number, max: number): number { const parsed = typeof value === "number" ? Math.round(value) : Number(value); return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback; }
