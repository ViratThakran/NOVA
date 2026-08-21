"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { cancelServiceRequestAction } from "../actions";
import { initialApplicationActionState } from "../action-state";
import { Button } from "@/components/ui/button";

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(cancelServiceRequestAction, initialApplicationActionState);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="request_id" value={requestId} />
      <Button type="submit" variant="destructive" size="sm" loading={pending} disabled={pending}>
        Cancel Request
      </Button>
      {state.status === "error" && (
        <div role="alert" className="flex items-center gap-1.5 p-2 rounded-lg bg-red-950/40 border border-red-800/40 text-xs font-mono text-red-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}
    </form>
  );
}

