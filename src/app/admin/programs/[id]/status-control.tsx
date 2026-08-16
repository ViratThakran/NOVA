"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateProgramStatusAction } from "../../actions";
import { initialAdminActionState } from "../../action-state";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CATALOG_STATUSES } from "@/lib/catalog-options";

type CatalogStatus = (typeof CATALOG_STATUSES)[number];

export function StatusControl({ programId, currentStatus }: { programId: string; currentStatus: CatalogStatus }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProgramStatusAction, initialAdminActionState);
  const [pendingStatus, setPendingStatus] = useState<CatalogStatus>(currentStatus);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (state.status === "success") {
      setConfirming(false);
      router.refresh();
    }
  }, [state.status, router]);

  const isUnchanged = pendingStatus === currentStatus;

  return (
    <div className="flex flex-col gap-2">
      <Select aria-label="Program status" value={pendingStatus} onChange={(event) => setPendingStatus(event.target.value as CatalogStatus)}>
        {CATALOG_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </Select>

      <Button type="button" variant="outline" size="sm" disabled={isUnchanged} onClick={() => setConfirming(true)}>
        Update status
      </Button>

      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Change program status?"
        description={`This changes the status from "${currentStatus}" to "${pendingStatus}". Only "published" programs are visible to the public.`}
      >
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="program_id" value={programId} />
          <input type="hidden" name="status" value={pendingStatus} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={pending}>
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
