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

export function RequestServiceForm({ serviceId, serviceName }: { serviceId: string; serviceName?: string }) {
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
        className="bg-slate-100 hover:bg-slate-200 border-transparent text-slate-800 text-xs font-semibold py-2 rounded-xl"
      >
        Request this service
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Request ${serviceName || "AI Service"}`}
        description="Describe your project or requirement — NOVA's AI network will handle execution."
      >
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="service_id" value={serviceId} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="details" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Request Details &amp; Objectives
            </Label>
            <Textarea
              id="details"
              name="details"
              required
              rows={4}
              maxLength={5000}
              placeholder="Describe what you need done, deliverable expectations, and key context..."
              className="bg-[#F8FAFC] border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:border-sky-400 focus:bg-white leading-relaxed rounded-xl"
            />
          </div>

          {state.status === "error" && (
            <div role="alert" className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{state.message}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-800 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={pending}
              disabled={pending}
              className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
            >
              Submit Request →
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
