"use client";

import { useState } from "react";
import { useActionState } from "react";
import { deleteServiceAction } from "../../actions";
import { initialAdminActionState } from "../../action-state";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function DeleteServiceButton({ serviceId }: { serviceId: string }) {
  const [state, formAction, pending] = useActionState(deleteServiceAction, initialAdminActionState);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="destructive" size="sm" onClick={() => setConfirming(true)} className="self-start">
        Delete service
      </Button>

      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete this service?"
        description="This permanently removes the service from the catalog. This cannot be undone."
      >
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="service_id" value={serviceId} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" loading={pending}>
              Confirm delete
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
