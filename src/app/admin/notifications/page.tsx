import type { Metadata } from "next";
import { Bell, CheckCircle2, Calendar, Mail } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Notifications | NOVA Admin" };

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default async function AdminNotificationsPage() {
  const auth = await getAuthenticatedUser();
  const supabase = await createServerSideClient();

  const userId = auth?.user.id;

  const { data: notifications, error } = userId
    ? await supabase
        .from("notifications")
        .select("id, title, message, read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  const rows = (notifications as unknown as NotificationRow[] | null) ?? [];
  const unreadCount = rows.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-sky-600" />
            Admin System Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Operational system notifications, automated event alerts, and workforce updates.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
          <Bell className="h-4 w-4 text-sky-600" />
          <span>{unreadCount} Unread Alert{unreadCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* TABLE WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load notifications.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Bell className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No admin notifications yet</p>
          <p className="text-xs text-slate-500">
            System alerts, review notifications, and platform event logs will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Notification Title</th>
                  <th className="py-4 px-5">Details</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rows.map((n) => {
                  const date = new Date(n.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={n.id} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Mail className={`h-4 w-4 shrink-0 ${!n.read ? "text-sky-600" : "text-slate-400"}`} />
                          {n.title}
                        </div>
                      </td>

                      <td className="py-4 px-5 text-slate-700 leading-relaxed text-xs">
                        {n.message}
                      </td>

                      <td className="py-4 px-5">
                        {n.read ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold uppercase">
                            <CheckCircle2 className="h-3 w-3 text-slate-400" /> Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold uppercase">
                            Unread
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right text-slate-500 text-[11px]">
                        <span className="inline-flex items-center gap-1 justify-end">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {date}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
