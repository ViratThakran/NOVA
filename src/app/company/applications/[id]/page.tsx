import type { Metadata } from "next";
import { z } from "zod";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireCompanyAccess } from "@/lib/auth";
import { canMarkUnderReview, canReview } from "@/lib/admin-review-view-state";
import { CompanyReviewActionButtons } from "./review-actions";

export const metadata: Metadata = { title: "Application details — NOVA Company" };

const idSchema = z.string().uuid();

interface ApplicationRow {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  internship: { id: string; title: string; description: string; requirements: string; eligibility: string; company_id: string } | null;
}

interface ApplicantProfile {
  application_id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export default async function CompanyApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFoundState = (
    <div className="flex flex-col gap-8">
      <PageHeader title="Application details" />
      <EmptyState title="Application not found" description="This application doesn't exist or isn't associated with your company." />
    </div>
  );

  if (!idSchema.safeParse(id).success) return notFoundState;

  const { supabase, companyId, companyRole } = await requireCompanyAccess();

  const [{ data: application, error }, { data: applicants }] = await Promise.all([
    supabase
      .from("applications")
      .select(
        "id, status, cover_letter, created_at, internship:internships!inner(id, title, description, requirements, eligibility, company_id)"
      )
      .eq("id", id)
      .eq("internship.company_id", companyId)
      .maybeSingle(),
    // Same company_applicant_profiles() RPC as the list page — resolving a
    // single applicant from the company's full set here (rather than a
    // dedicated single-applicant RPC) avoids a second narrowly-scoped
    // abstraction for what is otherwise the exact same relationship check.
    supabase.rpc("company_applicant_profiles", { target_company_id: companyId }),
  ]);

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Application details" />
        <ErrorState title="Couldn't load this application" description="Something went wrong. Please try again." />
      </div>
    );
  }
  if (!application) return notFoundState;

  const app = application as unknown as ApplicationRow;
  const applicant = ((applicants ?? []) as ApplicantProfile[]).find((a) => a.application_id === app.id);
  const applicantLabel = applicant
    ? [applicant.first_name, applicant.last_name].filter(Boolean).join(" ") || applicant.email
    : "Applicant details unavailable";
  const canManage = companyRole === "owner" || companyRole === "admin";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={app.internship?.title ?? "Internship"} description={`${applicantLabel} · Submitted ${new Date(app.created_at).toLocaleDateString()}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-small font-medium text-text">Status</span>
                <ApplicationStatusBadge status={app.status} />
              </div>

              {applicant && <Section title="Applicant" body={applicant.email} />}

              <Section title="Cover letter" body={app.cover_letter || "No cover letter was submitted."} />

              {app.internship && <Section title="Internship description" body={app.internship.description} />}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h3 className="text-small font-semibold text-text">Review</h3>
              {canManage ? (
                <CompanyReviewActionButtons
                  applicationId={app.id}
                  canMarkUnderReview={canMarkUnderReview(app.status)}
                  canReview={canReview(app.status)}
                />
              ) : (
                <p className="text-small text-text-muted">Only company owners and admins can review applications.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-small font-semibold text-text">{title}</h3>
      <p className="whitespace-pre-line text-body text-text-muted">{body}</p>
    </div>
  );
}
