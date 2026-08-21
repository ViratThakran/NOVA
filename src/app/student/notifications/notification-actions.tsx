"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { markNotificationReadAction, markAllNotificationsReadAction } from "../actions";
import { initialNotificationActionState } from "../action-state";
import { Button } from "@/components/ui/button";

export function MarkNotificationReadButton({ notificationId }: { notificationId: string }) {
  const [state, formAction, pending] = useActionState(markNotificationReadAction, initialNotificationActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1 font-mono">
      <input type="hidden" name="notification_id" value={notificationId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        loading={pending}
        disabled={pending}
        className="text-slate-400 hover:text-white text-xs"
      >
        Mark as read
      </Button>
      {state.status === "error" && (
        <div role="alert" className="flex items-center gap-1.5 p-2 rounded-lg bg-red-950/40 border border-red-800/40 text-[11px] text-red-300">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}
    </form>
  );
}

export function MarkAllReadButton() {
  const [state, formAction, pending] = useActionState(markAllNotificationsReadAction, initialNotificationActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1 font-mono">
      <Button
        type="submit"
        variant="outline"
        size="sm"
        loading={pending}
        disabled={pending}
        className="bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider"
      >
        Mark all as read
      </Button>
      {state.status === "error" && (
        <div role="alert" className="flex items-center gap-1.5 p-2 rounded-lg bg-red-950/40 border border-red-800/40 text-[11px] text-red-300">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}
    </form>
  );
}

