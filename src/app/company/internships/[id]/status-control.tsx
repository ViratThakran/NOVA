"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateCompanyInternshipStatusAction } from "../../actions";
import { initialCompanyActionState } from "../../action-state";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { INTERNSHIP_STATUSES, getInternshipStatusMeta, type InternshipStatus } from "@/lib/internship-status";

export function CompanyStatusControl({ internshipId, currentStatus }: { internshipId: string; currentStatus: InternshipStatus }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateCompanyInternshipStatusAction, initialCompanyActionState);
  const [pendingStatus, setPendingStatus] = useState<InternshipStatus>(currentStatus);
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
      <Select aria-label="Internship status" value={pendingStatus} onChange={(event) => setPendingStatus(event.target.value as InternshipStatus)}>
        {INTERNSHIP_STATUSES.map((status) => (
          <option key={status} value={status}>
            {getInternshipStatusMeta(status).label}
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
        title="Change internship status?"
        description={`This changes the status from "${getInternshipStatusMeta(currentStatus).label}" to "${getInternshipStatusMeta(pendingStatus).label}". Students only ever see internships with status "Open".`}
      >
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="internship_id" value={internshipId} />
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
