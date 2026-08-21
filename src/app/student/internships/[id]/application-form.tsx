"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { submitApplicationAction } from "../../actions";
import { initialApplicationActionState } from "../../action-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ApplicationForm({ internshipId }: { internshipId: string }) {
  const [state, formAction, pending] = useActionState(submitApplicationAction, initialApplicationActionState);
  const router = useRouter();

  // On success the student now has an application against this internship —
  // refresh the server component so it re-queries and swaps this form out
  // for the application-status view, rather than duplicating that logic here.
  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="internship_id" value={internshipId} />

      <div className="flex flex-col gap-1.5 font-mono">
        <Label htmlFor="cover_letter" className="text-xs text-slate-300 uppercase tracking-wider font-bold">
          Cover Letter / Statement of Interest
        </Label>
        <Textarea
          id="cover_letter"
          name="cover_letter"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder="Tell us why you're a good fit for this internship role..."
          className="bg-slate-900 border-slate-800 text-slate-200 text-xs focus:border-indigo-500 font-mono leading-relaxed placeholder:text-slate-500 rounded-xl"
        />
      </div>

      {state.status === "error" && (
        <div role="alert" className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-xs font-mono text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {state.status === "success" ? (
        <div role="status" className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs font-mono text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{state.message}</span>
        </div>
      ) : (
        <Button
          type="submit"
          loading={pending}
          disabled={pending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs uppercase font-bold tracking-wider px-5 py-2.5 rounded-lg shadow-lg shadow-indigo-600/20 self-start"
        >
          Submit Application →
        </Button>
      )}
    </form>
  );
}

