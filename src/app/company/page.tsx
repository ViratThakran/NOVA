import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireCompanyAccess } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard — NOVA Company" };

export default async function CompanyDashboardPage() {
  const { supabase, companyId, companyRole } = await requireCompanyAccess();

  const [{ data: company }, { data: internships }, { count: memberCount }] = await Promise.all([
    supabase.from("companies").select("name, description").eq("id", companyId).single(),
    supabase.from("internships").select("id, status").eq("company_id", companyId),
    supabase.from("company_members").select("*", { count: "exact", head: true }).eq("company_id", companyId),
  ]);

  const internshipIds = (internships ?? []).map((i) => i.id);
  const openInternshipCount = (internships ?? []).filter((i) => i.status === "open").length;

  let applicationsByStatus: Record<string, number> = {};
  if (internshipIds.length > 0) {
    const { data: applications } = await supabase.from("applications").select("status").in("internship_id", internshipIds);
    for (const row of applications ?? []) {
      applicationsByStatus[row.status] = (applicationsByStatus[row.status] ?? 0) + 1;
    }
  }
  const totalApplications = Object.values(applicationsByStatus).reduce((sum, n) => sum + n, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={company?.name ?? "Company dashboard"} description={company?.description || "Your NOVA company workspace."} />

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <Row label="Your role" value={<Badge variant="primary">{companyRole}</Badge>} />
          <Row label="Members" value={(memberCount ?? 0).toString()} />
          <Row label="Internships" value={internshipIds.length.toString()} />
          <Row label="Open internships" value={openInternshipCount.toString()} />
          <Row label="Applications received" value={totalApplications.toString()} />
          <Row label="Pending review" value={((applicationsByStatus.pending ?? 0) + (applicationsByStatus.under_review ?? 0)).toString()} />
          <Row label="Accepted" value={(applicationsByStatus.accepted ?? 0).toString()} />
          <Row label="Rejected" value={(applicationsByStatus.rejected ?? 0).toString()} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0">
      <span className="text-small text-text-muted">{label}</span>
      <span className="text-small font-medium text-text">{value}</span>
    </div>
  );
}
