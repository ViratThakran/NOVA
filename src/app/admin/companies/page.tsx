import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Companies — NOVA Admin" };

export default function AdminCompaniesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Companies" description="Manage company accounts and opportunities." />
      <EmptyState
        title="Company management isn't available yet"
        description="The database doesn't yet have companies, company profiles, or company-linked internships — this needs a schema addition before it can be built (see the Phase 3A architecture audit)."
      />
    </div>
  );
}
