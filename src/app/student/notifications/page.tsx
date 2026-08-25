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
      <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
        <p className="text-sm font-semibold text-red-600">Your session has expired. Please log in again.</p>
      </div>
    );
  }
  const { supabase, user } = auth;

  const { data: rawNotifications, error } = await supabase
    .from("notifications")
    .select("id, title, message, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const notifications = (rawNotifications as NotificationRow[] | null) ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-amber-500" />
            Notifications
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold shadow-2xs">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Updates regarding your residency applications, assignments, and learning milestone reviews.
          </p>
        </div>

        {notifications.length > 0 && hasUnread(notifications) && (
          <MarkAllReadButton />
        )}
      </div>

      {/* NOTIFICATION LIST WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load your notifications.</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Bell className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No Notifications Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            You&apos;ll receive notifications here about your application status changes, residency updates, and service request progress.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 sm:p-6 rounded-3xl backdrop-blur-2xl border transition-all duration-300 ${
                notification.read
                  ? "bg-white/80 border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:bg-white/95"
                  : "bg-sky-50/75 border-sky-200 shadow-[0_8px_30px_rgba(14,165,233,0.08)] hover:bg-sky-50/90"
              }`}
            >
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {!notification.read && (
                    <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                  )}
                  <span className="text-sm font-bold text-slate-900">
                    {notification.title}
                  </span>
                  {!notification.read && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 border border-sky-200 text-[10px] font-bold text-sky-700 uppercase shrink-0">
                      New
                    </span>
                  )}
                  {notification.read && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-slate-400" /> Read
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                  {notification.message}
                </p>
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                  <Clock className="h-3 w-3 text-slate-400" />
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
                <div className="shrink-0 self-end sm:self-start">
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
