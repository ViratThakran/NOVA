import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Companies — NOVA Admin" };

interface CompanyRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default async function AdminCompaniesPage() {
  const supabase = await createServerSideClient();

  // companies/company_members/internships are all admin-readable via each
  // table's own `OR is_current_user_admin()` RLS branch (Phase 5B-1).
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, description, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Companies" description="Manage company accounts and opportunities." />
        <ErrorState title="Couldn't load companies" description="Something went wrong. Please try again." />
      </div>
    );
  }

  const rows = (companies ?? []) as CompanyRow[];

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Companies" description="Manage company accounts and opportunities." />
        <EmptyState title="No companies yet" description="Companies created via the company platform will appear here." />
      </div>
    );
  }

  const companyIds = rows.map((c) => c.id);
  const [{ data: members }, { data: internships }] = await Promise.all([
    supabase.from("company_members").select("company_id").in("company_id", companyIds),
    supabase.from("internships").select("company_id, status").in("company_id", companyIds),
  ]);

  const memberCounts = new Map<string, number>();
  for (const row of members ?? []) memberCounts.set(row.company_id, (memberCounts.get(row.company_id) ?? 0) + 1);
  const internshipCounts = new Map<string, number>();
  const openCounts = new Map<string, number>();
  for (const row of internships ?? []) {
    internshipCounts.set(row.company_id, (internshipCounts.get(row.company_id) ?? 0) + 1);
    if (row.status === "open") openCounts.set(row.company_id, (openCounts.get(row.company_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Companies" description={`${rows.length} compan${rows.length === 1 ? "y" : "ies"} on the platform.`} />

      <div className="flex flex-col gap-3">
        {rows.map((company) => (
          <Card key={company.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div className="flex flex-col gap-1">
                <span className="text-small font-medium text-text">{company.name}</span>
                {company.description && (
                  <span className="line-clamp-2 text-caption text-text-muted">{company.description}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">{memberCounts.get(company.id) ?? 0} members</Badge>
                <Badge variant="default">{internshipCounts.get(company.id) ?? 0} internships</Badge>
                <Badge variant="primary">{openCounts.get(company.id) ?? 0} open</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
