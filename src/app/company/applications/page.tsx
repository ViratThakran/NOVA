import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCompanyAccess } from "@/lib/auth";

export const metadata: Metadata = { title: "Applications — NOVA Company" };

interface CompanyApplicationRow {
  id: string;
  status: string;
  created_at: string;
  internship: { id: string; title: string } | null;
}

interface ApplicantProfile {
  application_id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export default async function CompanyApplicationsPage() {
  const { supabase, companyId } = await requireCompanyAccess();

  // Company users can read applications for their own company's internships
  // via the Phase 5B-1 RLS policy; scoping through the internship join here
  // just makes that intent explicit in the query itself.
  const [{ data: applications, error }, { data: applicants }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, status, created_at, internship:internships!inner(id, title, company_id)")
      .eq("internship.company_id", companyId)
      .order("created_at", { ascending: false }),
    // Applicant names have no RLS path through `profiles` directly for a
    // company viewer — resolved via the company_applicant_profiles() RPC
    // (Phase 5B-3), scoped server-side to this exact company.
    supabase.rpc("company_applicant_profiles", { target_company_id: companyId }),
  ]);
  const applicantByApplicationId = new Map(((applicants ?? []) as ApplicantProfile[]).map((a) => [a.application_id, a]));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Applications" description="Applications submitted to your company's internships." />

      {error ? (
        <ErrorState title="Couldn't load applications" description="Something went wrong. Please try again." />
      ) : !applications || applications.length === 0 ? (
        <EmptyState title="No applications yet" description="Applications submitted to your internships will appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {(applications as unknown as CompanyApplicationRow[]).map((application) => {
            const applicant = applicantByApplicationId.get(application.id);
            const applicantLabel = applicant
              ? [applicant.first_name, applicant.last_name].filter(Boolean).join(" ") || applicant.email
              : "Applicant";
            return (
            <Link key={application.id} href={`/company/applications/${application.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
                  <div className="flex flex-col gap-1">
                    <CardTitle as="h2" className="text-body">
                      {application.internship?.title ?? "Internship no longer available"}
                    </CardTitle>
                    <span className="text-caption text-text-muted">
                      {applicantLabel} · Applied {new Date(application.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </CardHeader>
              </Card>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
