import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Audit logs — NOVA Admin" };

export default function AdminAuditLogsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Audit logs" description="A read-only record of privileged actions." />
      <EmptyState
        title="The audit log viewer is coming soon"
        description="Entries from the immutable audit_logs table will be listed here, read-only."
      />
    </div>
  );
}
