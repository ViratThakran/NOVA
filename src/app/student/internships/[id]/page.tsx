import type { Metadata } from "next";
import { z } from "zod";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { getInternshipApplyViewState } from "@/lib/application-view-state";
import { ApplicationForm } from "./application-form";

export const metadata: Metadata = { title: "Internship details — NOVA" };

const idSchema = z.string().uuid();

export default async function StudentInternshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notFoundState = (
    <div className="flex flex-col gap-8">
      <PageHeader title="Internship details" />
      <EmptyState
        title="Internship not found"
        description="This internship doesn't exist, isn't open, or may have been closed."
      />
    </div>
  );

  // Malformed ids never reach Postgres — an invalid UUID literal would come
  // back as a raw Postgres error (22P02) rather than a clean "not found".
  if (!idSchema.safeParse(id).success) {
    return notFoundState;
  }

  const auth = await getAuthenticatedUser();
  if (!auth) {
    return notFoundState; // layout already redirects unauthenticated users; this is just a safe fallback
  }
  const { supabase, user } = auth;

  // Only 'open' internships are visible here — RLS already enforces this,
  // the explicit filter keeps the query's intent unambiguous.
  const { data: internship, error: internshipError } = await supabase
    .from("internships")
    .select("id, title, description, requirements, eligibility, created_at")
    .eq("id", id)
    .eq("status", "open")
    .maybeSingle();

  if (internshipError) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Internship details" />
        <ErrorState title="Couldn't load this internship" description="Something went wrong. Please try again." />
      </div>
    );
  }

  // A student's own application against this internship, if one exists —
  // scoped explicitly to their own id even though RLS already guarantees it.
  const { data: existingApplication } = await supabase
    .from("applications")
    .select("id, status")
    .eq("internship_id", id)
    .eq("student_id", user.id)
    .maybeSingle();

  const viewState = getInternshipApplyViewState({
    internshipAvailable: Boolean(internship),
    hasExistingApplication: Boolean(existingApplication),
  });

  if (viewState === "unavailable") {
    return notFoundState;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={internship!.title} description={`Posted ${new Date(internship!.created_at).toLocaleDateString()}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <Section title="Description" body={internship!.description} />
              <Section title="Requirements" body={internship!.requirements} />
              <Section title="Eligibility" body={internship!.eligibility} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              {viewState === "already_applied" ? (
                <>
                  <p className="text-small font-medium text-text">Your application</p>
                  <ApplicationStatusBadge status={existingApplication!.status} />
                  <p className="text-caption text-text-muted">
                    You've already applied to this internship. Track its progress from your applications list.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-small font-medium text-text">Apply to this internship</p>
                  <ApplicationForm internshipId={id} />
                </>
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
    <div className="flex flex-col gap-1.5">
      <h3 className="text-small font-semibold text-text">{title}</h3>
      <p className="whitespace-pre-line text-body text-text-muted">{body}</p>
    </div>
  );
}
