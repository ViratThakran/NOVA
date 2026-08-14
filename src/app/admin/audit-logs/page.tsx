import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Audit logs — NOVA Admin" };

const RECENT_LIMIT = 100;

interface AuditLogRow {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  actor: { first_name: string | null; last_name: string | null; email: string } | null;
}

export default async function AdminAuditLogsPage() {
  const supabase = await createServerSideClient();

  // audit_logs is read-only for admins ("Admins can read audit logs" RLS
  // policy) — this page never writes to it, matching write_audit_log()
  // being the only INSERT path (SECURITY DEFINER, no client GRANT).
  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("id, action, resource_type, resource_id, created_at, actor:profiles(first_name, last_name, email)")
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Audit logs" description={`A read-only record of the ${RECENT_LIMIT} most recent privileged actions.`} />

      {error ? (
        <ErrorState title="Couldn't load audit logs" description="Something went wrong. Please try again." />
      ) : !logs || logs.length === 0 ? (
        <EmptyState title="No audit log entries yet" description="Privileged actions will be recorded here." />
      ) : (
        <div className="flex flex-col gap-2">
          {(logs as unknown as AuditLogRow[]).map((log) => {
            const actorLabel = log.actor
              ? [log.actor.first_name, log.actor.last_name].filter(Boolean).join(" ") || log.actor.email
              : "System";
            return (
              <Card key={log.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-small font-medium text-text">{log.action}</span>
                    <span className="text-caption text-text-muted">
                      {actorLabel} · {log.resource_type} · {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <Badge variant="default">{log.resource_id.slice(0, 8)}…</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
