import type { Metadata } from "next";
import { Bell, Clock, CheckCircle2 } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasUnread } from "@/lib/notification-view-state";
import { MarkNotificationReadButton, MarkAllReadButton } from "./notification-actions";

export const metadata: Metadata = { title: "Notifications | NOVA" };

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
      <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
        <p className="text-sm font-semibold text-red-300 font-mono">Your session has expired. Please log in again.</p>
      </div>
    );
  }
  const { supabase, user } = auth;

  // RLS already scopes notifications to their own user_id — explicit filter
  // makes intent visible.
  const { data: rawNotifications, error } = await supabase
    .from("notifications")
    .select("id, title, message, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const notifications = (rawNotifications as NotificationRow[] | null) ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            NOTIFICATIONS
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Updates about your applications, residencies, and service requests.
          </p>
        </div>

        {notifications.length > 0 && hasUnread(notifications) && (
          <MarkAllReadButton />
        )}
      </div>

      {/* NOTIFICATION LIST */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load your notifications.</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <Bell className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No Notifications Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            You&apos;ll receive notifications here about your application status changes, residency updates, and service request progress.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 rounded-xl border transition-all ${
                notification.read
                  ? "bg-[#0E131F] border-slate-800"
                  : "bg-[#0E1424] border-indigo-700/40"
              }`}
            >
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {!notification.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                  )}
                  <span className="text-sm font-bold text-white font-sans">
                    {notification.title}
                  </span>
                  {!notification.read && (
                    <span className="px-1.5 py-px rounded bg-indigo-950 border border-indigo-700/50 text-[9px] font-bold text-indigo-300 uppercase font-mono shrink-0">
                      New
                    </span>
                  )}
                  {notification.read && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                  )}
                </div>

                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {notification.message}
                </p>

                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-slate-600" />
                  {new Date(notification.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {!notification.read && (
                <div className="shrink-0">
                  <MarkNotificationReadButton notificationId={notification.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
