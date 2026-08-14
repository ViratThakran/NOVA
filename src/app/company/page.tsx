import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireCompanyAccess } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard — NOVA Company" };

export default async function CompanyDashboardPage() {
  const { supabase, companyId, companyRole } = await requireCompanyAccess();

  const { data: company } = await supabase.from("companies").select("name, description").eq("id", companyId).single();
  const { data: internships } = await supabase.from("internships").select("id").eq("company_id", companyId);
  const internshipIds = (internships ?? []).map((i) => i.id);
  const { count: applicationCount } =
    internshipIds.length > 0
      ? await supabase.from("applications").select("id", { count: "exact", head: true }).in("internship_id", internshipIds)
      : { count: 0 };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={company?.name ?? "Company dashboard"} description={company?.description || "Your NOVA company workspace."} />

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <Row label="Your role" value={<Badge variant="primary">{companyRole}</Badge>} />
          <Row label="Internships" value={internshipIds.length.toString()} />
          <Row label="Applications received" value={(applicationCount ?? 0).toString()} />
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
