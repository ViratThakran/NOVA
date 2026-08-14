"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { requestCompanyServiceAction } from "../actions";
import { initialCompanyActionState } from "../action-state";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function RequestServiceForm({ serviceId, companyId }: { serviceId: string; companyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(requestCompanyServiceAction, initialCompanyActionState);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full">
        Request this service
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Request this service" description="Describe what your company needs — an admin will review the request.">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="service_id" value={serviceId} />
          <input type="hidden" name="company_id" value={companyId} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="details">Details</Label>
            <Textarea id="details" name="details" required rows={4} maxLength={5000} placeholder="What do you need done, and any relevant context..." />
          </div>

          {state.status === "error" && (
            <p role="alert" className="text-small text-error">
              {state.message}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={pending}>
              Submit request
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
