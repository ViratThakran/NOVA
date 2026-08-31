"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { markUnderReviewAction } from "../../actions";
import { reviewApplicationWithMentorAction } from "./mentor-review-action";
import { initialAdminActionState } from "../../action-state";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type ReviewDecision = "accepted" | "rejected";

export function ReviewActionButtons({ applicationId, canMarkUnderReview, canReview }: { applicationId: string; canMarkUnderReview: boolean; canReview: boolean }) {
  const router = useRouter();
  const [markState, markFormAction, markPending] = useActionState(markUnderReviewAction, initialAdminActionState);
  const [reviewState, reviewFormAction, reviewPending] = useActionState(reviewApplicationWithMentorAction, initialAdminActionState);
  const [confirming, setConfirming] = useState<ReviewDecision | null>(null);

  useEffect(() => { if (markState.status === "success") router.refresh(); }, [markState.status, router]);
  useEffect(() => { if (reviewState.status === "success") { setConfirming(null); router.refresh(); } }, [reviewState.status, router]);

  if (!canMarkUnderReview && !canReview) return <p className="text-small text-text-muted">This application has already been reviewed.</p>;

  return (
    <div className="flex flex-col gap-4">
      {canMarkUnderReview && <form action={markFormAction}><input type="hidden" name="application_id" value={applicationId} /><Button type="submit" variant="outline" loading={markPending} className="w-full">Mark under review</Button></form>}
      {markState.status === "error" && <p role="alert" className="text-small text-error">{markState.message}</p>}
      {canReview && <div className="flex gap-2"><Button variant="primary" className="flex-1" onClick={() => setConfirming("accepted")}>Accept</Button><Button variant="destructive" className="flex-1" onClick={() => setConfirming("rejected")}>Reject</Button></div>}
      <Modal open={confirming !== null} onClose={() => setConfirming(null)} title={confirming === "accepted" ? "Accept this application?" : "Reject this application?"} description={confirming === "accepted" ? "This creates an enrollment, starts the AI Mentor journey, and notifies the student." : "This notifies the student that their application was not selected."}>
        <form action={reviewFormAction} className="flex flex-col gap-4">
          <input type="hidden" name="application_id" value={applicationId} />
          <input type="hidden" name="status" value={confirming ?? ""} />
          <div className="flex flex-col gap-1.5"><Label htmlFor="feedback">Feedback (optional)</Label><Textarea id="feedback" name="feedback" maxLength={1000} rows={4} placeholder="Optional note about this decision..." /></div>
          {reviewState.status === "error" && <p role="alert" className="text-small text-error">{reviewState.message}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setConfirming(null)}>Cancel</Button><Button type="submit" variant={confirming === "accepted" ? "primary" : "destructive"} loading={reviewPending}>Confirm {confirming === "accepted" ? "accept" : "reject"}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
