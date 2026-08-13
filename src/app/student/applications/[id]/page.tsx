import type { Metadata } from "next";
import { z } from "zod";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Application details — NOVA" };

const idSchema = z.string().uuid();

interface ApplicationDetailRow {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  updated_at: string;
  internship: { id: string; title: string; description: string } | null;
}

export default async function StudentApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notFoundState = (
    <div className="flex flex-col gap-8">
      <PageHeader title="Application details" />
      <EmptyState
        title="Application not found"
        description="This application doesn't exist or isn't associated with your account."
      />
    </div>
  );

  // Malformed ids never reach Postgres, and — just as importantly — never
  // distinguishing "not yours" from "doesn't exist" avoids leaking whether a
  // given application id belongs to someone else.
  if (!idSchema.safeParse(id).success) {
    return notFoundState;
  }

  const auth = await getAuthenticatedUser();
  if (!auth) {
    return notFoundState;
  }
  const { supabase, user } = auth;

  // Explicit student_id scoping on top of RLS: a student can never be handed
  // another student's application by changing the URL, regardless of which
  // layer would have caught it.
  const { data: application, error } = await supabase
    .from("applications")
    .select("id, status, cover_letter, created_at, updated_at, internship:internships(id, title, description)")
    .eq("id", id)
    .eq("student_id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Application details" />
        <ErrorState title="Couldn't load this application" description="Something went wrong. Please try again." />
      </div>
    );
  }

  if (!application) {
    return notFoundState;
  }

  const app = application as unknown as ApplicationDetailRow;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={app.internship?.title ?? "Internship no longer available"}
        description={`Applied ${new Date(app.created_at).toLocaleDateString()}`}
      />

      <div className="flex flex-col gap-6 lg:max-w-2xl">
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-small font-medium text-text">Status</span>
              <ApplicationStatusBadge status={app.status} />
            </div>

            {app.internship?.description && (
              <div className="flex flex-col gap-1.5 border-t border-border pt-4">
                <h3 className="text-small font-semibold text-text">Internship</h3>
                <p className="whitespace-pre-line text-body text-text-muted">{app.internship.description}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5 border-t border-border pt-4">
              <h3 className="text-small font-semibold text-text">Your cover letter</h3>
              <p className="whitespace-pre-line text-body text-text-muted">
                {app.cover_letter || "No cover letter was submitted."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
