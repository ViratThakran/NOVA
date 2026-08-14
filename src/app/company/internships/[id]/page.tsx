import type { Metadata } from "next";
import { z } from "zod";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { requireCompanyAccess } from "@/lib/auth";
import type { InternshipStatus } from "@/lib/internship-status";
import { EditCompanyInternshipForm } from "./edit-form";
import { CompanyStatusControl } from "./status-control";

export const metadata: Metadata = { title: "Internship details — NOVA Company" };

const idSchema = z.string().uuid();

interface InternshipRow {
  id: string;
  title: string;
  description: string;
  requirements: string;
  eligibility: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default async function CompanyInternshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFoundState = (
    <div className="flex flex-col gap-8">
      <PageHeader title="Internship details" />
      <EmptyState title="Internship not found" description="This internship doesn't exist or isn't associated with your company." />
    </div>
  );

  if (!idSchema.safeParse(id).success) return notFoundState;

  const { supabase, companyId, companyRole } = await requireCompanyAccess();

  // Explicit company_id scoping on top of RLS: never shown another
  // company's internship just because the URL contains a real UUID.
  const { data: internship, error } = await supabase
    .from("internships")
    .select("id, title, description, requirements, eligibility, status, created_at, updated_at")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Internship details" />
        <ErrorState title="Couldn't load this internship" description="Something went wrong. Please try again." />
      </div>
    );
  }
  if (!internship) return notFoundState;

  const record = internship as InternshipRow;
  const canManage = companyRole === "owner" || companyRole === "admin";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={record.title}
        description={`Created ${new Date(record.created_at).toLocaleDateString()} · Last updated ${new Date(record.updated_at).toLocaleDateString()}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {canManage ? (
                <EditCompanyInternshipForm internship={record} />
              ) : (
                <div className="flex flex-col gap-4">
                  <Field label="Description" value={record.description} />
                  <Field label="Requirements" value={record.requirements} />
                  <Field label="Eligibility" value={record.eligibility} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h3 className="text-small font-semibold text-text">Status</h3>
              {canManage ? (
                <CompanyStatusControl internshipId={record.id} currentStatus={record.status as InternshipStatus} />
              ) : (
                <p className="text-small text-text-muted">{record.status}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-small font-semibold text-text">{label}</h3>
      <p className="whitespace-pre-line text-body text-text-muted">{value}</p>
    </div>
  );
}
