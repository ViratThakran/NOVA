"use client";

import { useActionState } from "react";
import { submitInternshipWork, type LearningActionState } from "./actions";

const initialState: LearningActionState = { status: "idle" };

export function SubmitWorkForm({ taskId, needsRevision }: { taskId: string; needsRevision: boolean }) {
  const [state, formAction, pending] = useActionState(submitInternshipWork, initialState);

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-surface-muted p-5">
      <div>
        <h3 className="font-medium">{needsRevision ? "Improve and resubmit" : "Submit your work"}</h3>
        <p className="mt-1 text-small text-text-muted">Your AI Mentor will review the evidence and explain what to improve.</p>
      </div>
      <input type="hidden" name="task_id" value={taskId} />
      <label className="mt-5 block text-small font-medium" htmlFor="submission_url">Work link</label>
      <input id="submission_url" name="submission_url" type="url" maxLength={2000} placeholder="https://github.com/..." className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-small outline-none" />
      <label className="mt-4 block text-small font-medium" htmlFor="submission_text">What did you build?</label>
      <textarea id="submission_text" name="submission_text" maxLength={12000} rows={6} placeholder="Explain what you completed, the decisions you made, and anything you want your mentor to know." className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-small outline-none" />
      {state.status !== "idle" && <p className={state.status === "error" ? "mt-3 text-small text-error" : "mt-3 text-small text-success"}>{state.message}</p>}
      <button type="submit" disabled={pending} className="mt-5 w-full rounded-xl bg-text-primary px-4 py-2.5 text-small font-medium text-surface disabled:opacity-50">{pending ? "Sending to your mentor…" : needsRevision ? "Resubmit for review" : "Submit for AI review"}</button>
    </form>
  );
}
