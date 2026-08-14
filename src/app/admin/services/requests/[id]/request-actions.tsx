"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { reviewServiceRequestAction, advanceServiceRequestAction } from "../../../actions";
import { initialAdminActionState } from "../../../action-state";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Mirrors the exact forward path advance_service_request() enforces —
// this is display-only; the RPC re-validates the transition regardless.
const NEXT_STATUS: Record<string, string | undefined> = {
  accepted: "in_progress",
  in_progress: "delivered",
  delivered: "completed",
};

const NEXT_LABEL: Record<string, string> = {
  in_progress: "Start work",
  delivered: "Mark delivered",
  completed: "Mark completed",
};

export function RequestActions({ requestId, status }: { requestId: string; status: string }) {
  const router = useRouter();
  const [reviewState, reviewFormAction, reviewPending] = useActionState(reviewServiceRequestAction, initialAdminActionState);
  const [advanceState, advanceFormAction, advancePending] = useActionState(advanceServiceRequestAction, initialAdminActionState);
  const [confirmingDecision, setConfirmingDecision] = useState<"accepted" | "rejected" | null>(null);
  const [confirmingAdvance, setConfirmingAdvance] = useState(false);

  useEffect(() => {
    if (reviewState.status === "success" || advanceState.status === "success") {
      setConfirmingDecision(null);
      setConfirmingAdvance(false);
      router.refresh();
    }
  }, [reviewState.status, advanceState.status, router]);

  const nextStatus = NEXT_STATUS[status];

  if (status === "pending") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Button variant="primary" className="flex-1" onClick={() => setConfirmingDecision("accepted")}>
            Accept
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => setConfirmingDecision("rejected")}>
            Reject
          </Button>
        </div>
        {reviewState.status === "error" && (
          <p role="alert" className="text-small text-error">
            {reviewState.message}
          </p>
        )}

        <Modal
          open={confirmingDecision !== null}
          onClose={() => setConfirmingDecision(null)}
          title={confirmingDecision === "accepted" ? "Accept this request?" : "Reject this request?"}
          description={
            confirmingDecision === "accepted"
              ? "The request moves into progress. This cannot be undone."
              : "The requester will see this request as rejected. This cannot be undone."
          }
        >
          <form action={reviewFormAction} className="flex flex-col gap-4">
            <input type="hidden" name="request_id" value={requestId} />
            <input type="hidden" name="decision" value={confirmingDecision ?? ""} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setConfirmingDecision(null)}>
                Cancel
              </Button>
              <Button type="submit" variant={confirmingDecision === "accepted" ? "primary" : "destructive"} loading={reviewPending}>
                Confirm {confirmingDecision === "accepted" ? "accept" : "reject"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  if (nextStatus) {
    return (
      <div className="flex flex-col gap-3">
        <Button variant="primary" onClick={() => setConfirmingAdvance(true)}>
          {NEXT_LABEL[nextStatus]}
        </Button>
        {advanceState.status === "error" && (
          <p role="alert" className="text-small text-error">
            {advanceState.message}
          </p>
        )}

        <Modal
          open={confirmingAdvance}
          onClose={() => setConfirmingAdvance(false)}
          title={`${NEXT_LABEL[nextStatus]}?`}
          description={nextStatus === "delivered" ? "Add delivery notes describing what was completed." : "This moves the request to the next stage."}
        >
          <form action={advanceFormAction} className="flex flex-col gap-4">
            <input type="hidden" name="request_id" value={requestId} />
            <input type="hidden" name="new_status" value={nextStatus} />
            {nextStatus === "delivered" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Delivery notes</Label>
                <Textarea id="notes" name="notes" required rows={4} maxLength={5000} placeholder="What was delivered..." />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setConfirmingAdvance(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={advancePending}>
                Confirm
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return <p className="text-small text-text-muted">This request is {status} — no further action available.</p>;
}
