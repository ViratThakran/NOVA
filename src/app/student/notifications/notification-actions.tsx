"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
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
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="notification_id" value={notificationId} />
      <Button type="submit" variant="ghost" size="sm" loading={pending}>
        Mark as read
      </Button>
      {state.status === "error" && (
        <p role="alert" className="text-caption text-error">
          {state.message}
        </p>
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
    <form action={formAction} className="flex flex-col items-start gap-1">
      <Button type="submit" variant="outline" size="sm" loading={pending}>
        Mark all as read
      </Button>
      {state.status === "error" && (
        <p role="alert" className="text-caption text-error">
          {state.message}
        </p>
      )}
    </form>
  );
}
