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

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="internship_id" value={internshipId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cover_letter" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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
          className="bg-[#F8FAFC] border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:border-sky-400 focus:bg-white leading-relaxed rounded-xl"
        />
      </div>

      {state.status === "error" && (
        <div role="alert" className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{state.message}</span>
        </div>
      )}

      {state.status === "success" ? (
        <div role="status" className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{state.message}</span>
        </div>
      ) : (
        <Button
          type="submit"
          loading={pending}
          disabled={pending}
          className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs self-start transition-colors"
        >
          Submit Application →
        </Button>
      )}
    </form>
  );
}
