"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { markContactSubmissionReviewedAction } from "../actions";
import { initialAdminActionState } from "../action-state";
import { Button } from "@/components/ui/button";

export function MarkReviewedButton({ submissionId }: { submissionId: string }) {
  const [state, formAction, pending] = useActionState(markContactSubmissionReviewedAction, initialAdminActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="status" value="reviewed" />
      <Button type="submit" variant="outline" size="sm" loading={pending}>
        Mark reviewed
      </Button>
    </form>
  );
}
