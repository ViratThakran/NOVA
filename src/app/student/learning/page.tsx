import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { SubmitWorkForm } from "./submit-work-form";

export const metadata: Metadata = { title: "Learning — NOVA" };

export default async function StudentLearningPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) return null;

  const { data: journey } = await auth.supabase
    .from("internship_ai_journeys")
    .select("id, status, current_sequence, target_task_count, last_error, internships(title)")
    .eq("student_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!journey) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Learning" description="Your learning activity and progress." />
        <EmptyState title="Your AI internship journey will appear here" description="Once an internship application is accepted, NOVA's AI Mentor will build your first task." />
      </div>
    );
  }

  const { data: tasks } = await auth.supabase
    .from("internship_ai_tasks")
    .select("id, sequence_no, title, objective, instructions, deliverables, acceptance_criteria, estimated_hours, status, attempt_count")
    .eq("journey_id", journey.id)
    .order("sequence_no", { ascending: true });

  const { data: reviews } = await auth.supabase
    .from("internship_ai_reviews")
    .select("id, task_id, verdict, score, summary, strengths, improvements, next_step, created_at")
    .eq("student_id", auth.user.id)
    .order("created_at", { ascending: false });

  const currentTask = (tasks ?? []).find((task) => ["assigned", "needs_revision"].includes(task.status));
  const completed = (tasks ?? []).filter((task) => task.status === "completed").length;
  const internship = Array.isArray(journey.internships) ? journey.internships[0] : journey.internships;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="AI Mentor" description={internship?.title ? `${internship.title} · Your work, feedback and next steps.` : "Your AI-guided internship journey."} />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5"><p className="text-small text-text-muted">Progress</p><p className="mt-2 text-3xl font-semibold">{completed}/{journey.target_task_count}</p><p className="mt-1 text-small text-text-muted">tasks completed</p></div>
        <div className="rounded-2xl border border-border bg-surface p-5"><p className="text-small text-text-muted">Current step</p><p className="mt-2 text-xl font-semibold">{currentTask ? `Task ${currentTask.sequence_no}` : journey.status}</p><p className="mt-1 text-small text-text-muted">{currentTask?.title ?? "Waiting for your next task"}</p></div>
        <div className="rounded-2xl border border-border bg-surface p-5"><p className="text-small text-text-muted">Mentor reviews</p><p className="mt-2 text-3xl font-semibold">{reviews?.length ?? 0}</p><p className="mt-1 text-small text-text-muted">feedback reports</p></div>
      </section>

      {journey.last_error && journey.status === "failed" && <div className="rounded-2xl border border-error/30 bg-error/5 p-5 text-small">Your mentor hit a temporary processing issue. Your internship state is محفوظ and can be retried by the NOVA team.</div>}

      {currentTask ? (
        <section className="rounded-2xl border border-border bg-surface p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-small text-text-muted">Task {currentTask.sequence_no}</p><h2 className="mt-1 text-2xl font-semibold">{currentTask.title}</h2><p className="mt-3 max-w-3xl text-text-muted">{currentTask.objective}</p></div>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-small">~{currentTask.estimated_hours}h</span>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div><h3 className="font-medium">What to do</h3><p className="mt-3 whitespace-pre-wrap text-small leading-6 text-text-muted">{currentTask.instructions}</p><h3 className="mt-7 font-medium">Deliverables</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-small text-text-muted">{(Array.isArray(currentTask.deliverables) ? currentTask.deliverables : []).map((item: unknown) => <li key={String(item)}>{String(item)}</li>)}</ul></div>
            <SubmitWorkForm taskId={currentTask.id} needsRevision={currentTask.status === "needs_revision"} />
          </div>
        </section>
      ) : (
        <EmptyState title="Your mentor is preparing the next step" description="There is no action required from you right now. Check back after your current review is complete." />
      )}

      {(reviews ?? []).length > 0 && <section><h2 className="text-xl font-semibold">Recent mentor feedback</h2><div className="mt-4 space-y-4">{(reviews ?? []).slice(0, 5).map((review) => <article key={review.id} className="rounded-2xl border border-border bg-surface p-6"><div className="flex items-center justify-between gap-4"><h3 className="font-medium">{review.verdict === "passed" ? "Task approved" : "Revision requested"}</h3><span className="text-small font-medium">{review.score}/100</span></div><p className="mt-3 text-small text-text-muted">{review.summary}</p><p className="mt-4 text-small"><span className="font-medium">Next:</span> {review.next_step}</p></article>)}</div></section>}
    </div>
  );
}
