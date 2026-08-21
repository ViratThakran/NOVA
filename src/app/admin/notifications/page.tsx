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
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            ADMIN SYSTEM NOTIFICATIONS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Operational system notifications, automated event alerts, and workforce updates.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E131F] border border-slate-800 font-mono text-xs text-slate-300">
          <Bell className="h-4 w-4 text-indigo-400" />
          <span>{unreadCount} Unread Alert{unreadCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* TABLE */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load notifications.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <Bell className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No admin notifications yet</p>
          <p className="text-xs text-slate-500">
            System alerts, review notifications, and platform event logs will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Notification Title</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {rows.map((n) => {
                const date = new Date(n.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr key={n.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-white">
                      <div className="flex items-center gap-2">
                        <Mail className={`h-3.5 w-3.5 shrink-0 ${!n.read ? "text-indigo-400" : "text-slate-600"}`} />
                        {n.title}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-sans leading-relaxed text-[12px]">
                      {n.message}
                    </td>

                    <td className="py-3.5 px-4">
                      {n.read ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Read
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/40 text-[10px] font-bold text-indigo-300 uppercase">
                          Unread
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500 text-[11px]">
                      <span className="inline-flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {date}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
