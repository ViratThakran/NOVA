"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { requestServiceAction } from "../actions";
import { initialApplicationActionState } from "../action-state";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function RequestServiceForm({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(requestServiceAction, initialApplicationActionState);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 font-mono text-xs uppercase font-bold tracking-wider py-2"
      >
        Request this service
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Request AI Service" description="Describe your project or requirement — NOVA's AI network will handle execution.">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="service_id" value={serviceId} />
          <div className="flex flex-col gap-1.5 font-mono">
            <Label htmlFor="details" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Request Details &amp; Objectives
            </Label>
            <Textarea
              id="details"
              name="details"
              required
              rows={4}
              maxLength={5000}
              placeholder="Describe what you need done, deliverable expectations, and key context..."
              className="bg-slate-900 border-slate-800 text-slate-200 text-xs focus:border-indigo-500 font-mono leading-relaxed placeholder:text-slate-500 rounded-xl"
            />
          </div>

          {state.status === "error" && (
            <div role="alert" className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-xs font-mono text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.message}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80 font-mono">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-200 text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={pending}
              disabled={pending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-lg"
            >
              Submit Request →
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

