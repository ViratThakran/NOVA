import type { Metadata } from "next";
import { Search, ShieldAlert, User, Calendar, Database, ShieldCheck } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Audit Logs | NOVA Admin" };

const RECENT_LIMIT = 100;

interface AuditLogRow {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  actor: { first_name: string | null; last_name: string | null; email: string } | null;
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQuery } = await searchParams;
  const searchQuery = rawQuery ? rawQuery.trim().toLowerCase() : "";

  const supabase = await createServerSideClient();

  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("id, action, resource_type, resource_id, created_at, actor:profiles(first_name, last_name, email)")
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);

  let rows = (logs as unknown as AuditLogRow[] | null) ?? [];

  if (searchQuery) {
    rows = rows.filter((log) => {
      const actorName = log.actor
        ? [log.actor.first_name, log.actor.last_name].filter(Boolean).join(" ").toLowerCase()
        : "";
      const actorEmail = log.actor?.email?.toLowerCase() ?? "";
      return (
        log.action.toLowerCase().includes(searchQuery) ||
        log.resource_type.toLowerCase().includes(searchQuery) ||
        log.resource_id.toLowerCase().includes(searchQuery) ||
        actorName.includes(searchQuery) ||
        actorEmail.includes(searchQuery)
      );
    });
  }

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-sky-600" />
            Immutable Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Read-only audit record of the {RECENT_LIMIT} most recent privileged platform actions.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
          <ShieldAlert className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>RLS Protected • Write-only via RPC</span>
        </div>
      </div>

      {/* TOOLBAR WITH GLASSMORPHISM */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-xs font-semibold text-slate-500">
          Showing {rows.length} audit entry{rows.length !== 1 ? "ies" : ""}.
        </p>

        <form method="GET" action="/admin/audit-logs" className="relative sm:w-64">
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search audit action, resource, actor..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* TABLE WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load audit logs.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <ShieldAlert className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No audit logs match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "Privileged platform actions will appear here."}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Action Executed</th>
                  <th className="py-4 px-5">Actor</th>
                  <th className="py-4 px-5">Target Resource</th>
                  <th className="py-4 px-5">Resource Identifier</th>
                  <th className="py-4 px-5 text-right">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rows.map((log) => {
                  const actorLabel = log.actor
                    ? [log.actor.first_name, log.actor.last_name].filter(Boolean).join(" ") || log.actor.email
                    : "System / RPC";

                  const timestamp = new Date(log.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZoneName: "short",
                  });

                  return (
                    <tr key={log.id} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-mono text-[11px] font-bold text-slate-800">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-sky-600" />
                            {actorLabel}
                          </span>
                          {log.actor?.email && log.actor.email !== actorLabel && (
                            <span className="text-[11px] text-slate-500 font-mono">{log.actor.email}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold uppercase text-[10px]">
                          {log.resource_type}
                        </span>
                      </td>

                      <td className="py-4 px-5 font-mono text-[11px] text-slate-500">
                        {log.resource_id}
                      </td>

                      <td className="py-4 px-5 text-right text-slate-500 font-mono text-[11px]">
                        {timestamp}
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
