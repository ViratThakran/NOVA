import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { requireCompanyAccess } from "@/lib/auth";
import { CompanyProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Company — NOVA Company" };

export default async function CompanyProfilePage() {
  const { supabase, companyId, companyRole } = await requireCompanyAccess();

  const { data: company, error } = await supabase.from("companies").select("id, name, description").eq("id", companyId).maybeSingle();

  if (error || !company) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Company" />
        <ErrorState title="Couldn't load company details" description="Something went wrong. Please try again." />
      </div>
    );
  }

  const canEdit = companyRole === "owner" || companyRole === "admin";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Company" description="Company profile details." />
      <Card className="max-w-2xl">
        <CardContent className="p-6">
          {canEdit ? (
            <CompanyProfileForm companyId={company.id} name={company.name} description={company.description} />
          ) : (
            <div className="flex flex-col gap-4">
              <Field label="Company name" value={company.name} />
              <Field label="Description" value={company.description || "—"} />
              <p className="text-caption text-text-muted">Only company owners/admins can edit these details.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption text-text-muted">{label}</span>
      <span className="text-body text-text">{value}</span>
    </div>
  );
}
