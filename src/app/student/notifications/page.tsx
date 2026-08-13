import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasUnread } from "@/lib/notification-view-state";
import { MarkNotificationReadButton, MarkAllReadButton } from "./notification-actions";

export const metadata: Metadata = { title: "Notifications — NOVA" };

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default async function StudentNotificationsPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Notifications" />
        <ErrorState title="Your session has expired" description="Please log in again." />
      </div>
    );
  }
  const { supabase, user } = auth;

  // RLS already scopes notifications to their own user_id — the explicit
  // filter here just makes that intent visible in the query itself.
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, title, message, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Notifications" description="Updates about your applications and account." />
        {notifications && hasUnread(notifications) && <MarkAllReadButton />}
      </div>

      {error ? (
        <ErrorState title="Couldn't load notifications" description="Something went wrong. Please try again." />
      ) : !notifications || notifications.length === 0 ? (
        <EmptyState
          title="You have no notifications yet"
          description="Updates about your applications will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {(notifications as NotificationRow[]).map((notification) => (
            <Card key={notification.id} className={notification.read ? undefined : "border-primary/40"}>
              <CardContent className="flex items-start justify-between gap-4 p-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {!notification.read && <Badge variant="primary">New</Badge>}
                    <p className="text-small font-medium text-text">{notification.title}</p>
                  </div>
                  <p className="text-small text-text-muted">{notification.message}</p>
                  <span className="text-caption text-text-muted">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>
                {!notification.read && <MarkNotificationReadButton notificationId={notification.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
