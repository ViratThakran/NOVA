"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { planServiceRequestAction, runAiTaskAction, retryAiTaskAction, decideAiApprovalAction } from "../../../actions";
import { initialAdminActionState } from "../../../action-state";
import { Button } from "@/components/ui/button";

function useRefreshOnSuccess(status: string) {
  const router = useRouter();
  useEffect(() => {
    if (status === "success") router.refresh();
  }, [status, router]);
}

export function PlanButton({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(planServiceRequestAction, initialAdminActionState);
  useRefreshOnSuccess(state.status);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="request_id" value={requestId} />
      <Button type="submit" variant="primary" size="sm" loading={pending}>
        Plan with AI
      </Button>
      {state.status === "error" && <p role="alert" className="text-caption text-error">{state.message}</p>}
      {state.status === "success" && <p role="status" className="text-caption text-success">{state.message}</p>}
    </form>
  );
}

export function RunTaskButton({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(runAiTaskAction, initialAdminActionState);
  useRefreshOnSuccess(state.status);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="task_id" value={taskId} />
      <Button type="submit" variant="outline" size="sm" loading={pending}>
        Run
      </Button>
      {state.status === "error" && <p role="alert" className="text-caption text-error">{state.message}</p>}
    </form>
  );
}

export function RetryTaskButton({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(retryAiTaskAction, initialAdminActionState);
  useRefreshOnSuccess(state.status);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="task_id" value={taskId} />
      <Button type="submit" variant="outline" size="sm" loading={pending}>
        Retry
      </Button>
      {state.status === "error" && <p role="alert" className="text-caption text-error">{state.message}</p>}
    </form>
  );
}

export function ApprovalDecisionButtons({ approvalId }: { approvalId: string }) {
  const [state, formAction, pending] = useActionState(decideAiApprovalAction, initialAdminActionState);
  useRefreshOnSuccess(state.status);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="approval_id" value={approvalId} />
      <div className="flex gap-2">
        <Button type="submit" name="decision" value="approved" variant="primary" size="sm" loading={pending}>
          Approve
        </Button>
        <Button type="submit" name="decision" value="rejected" variant="destructive" size="sm" loading={pending}>
          Reject
        </Button>
      </div>
      {state.status === "error" && <p role="alert" className="text-caption text-error">{state.message}</p>}
    </form>
  );
}
