"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { cancelCompanyServiceRequestAction } from "../actions";
import { initialCompanyActionState } from "../action-state";
import { Button } from "@/components/ui/button";

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(cancelCompanyServiceRequestAction, initialCompanyActionState);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="request_id" value={requestId} />
      <Button type="submit" variant="destructive" size="sm" loading={pending}>
        Cancel
      </Button>
      {state.status === "error" && <p role="alert" className="text-caption text-error">{state.message}</p>}
    </form>
  );
}
