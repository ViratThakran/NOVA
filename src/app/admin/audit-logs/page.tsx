import type { Metadata } from "next";
import { Search, ShieldAlert, User, Calendar, Database } from "lucide-react";
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
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            IMMUTABLE AUDIT LOGS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Read-only audit record of the {RECENT_LIMIT} most recent privileged platform actions.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
          <ShieldAlert className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>RLS Protected • Write-only via RPC</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0E131F] p-4 rounded-xl border border-slate-800">
        <p className="text-xs font-mono text-slate-400">
          Showing {rows.length} audit entry{rows.length !== 1 ? "ies" : ""}.
        </p>

        <form method="GET" action="/admin/audit-logs" className="relative sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search audit action, resource, actor..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </form>
      </div>

      {/* TABLE */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load audit logs.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <ShieldAlert className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No audit logs match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "Privileged platform actions will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B0F19] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Action Executed</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Resource Identifier</th>
                <th className="py-3 px-4 text-right">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
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
                  <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-indigo-300">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-200 flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-500" />
                          {actorLabel}
                        </span>
                        {log.actor?.email && (
                          <span className="text-[10px] font-mono text-slate-500">{log.actor.email}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 uppercase">
                        <Database className="h-3 w-3 text-slate-500" />
                        {log.resource_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                        {log.resource_id}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500 text-[11px]">
                      <span className="inline-flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {timestamp}
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
