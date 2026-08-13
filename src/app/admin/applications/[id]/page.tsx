import type { Metadata } from "next";
import { z } from "zod";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { canMarkUnderReview, canReview } from "@/lib/admin-review-view-state";
import { ReviewActionButtons } from "./review-actions";

export const metadata: Metadata = { title: "Application details — NOVA Admin" };

const idSchema = z.string().uuid();

interface AdminApplicationDetailRow {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  updated_at: string;
  internship: { id: string; title: string; description: string; requirements: string; eligibility: string } | null;
  student: {
    id: string;
    education_info: { school?: string; degree?: string; grad_year?: number } | null;
    skills: string[] | null;
    profiles: { first_name: string | null; last_name: string | null; email: string } | null;
  } | null;
}

interface ReviewAuditLogRow {
  id: string;
  action: string;
  changes: { previous_status?: string; new_status?: string; feedback?: string | null } | null;
  created_at: string;
}

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notFoundState = (
    <div className="flex flex-col gap-8">
      <PageHeader title="Application details" />
      <EmptyState title="Application not found" description="This application doesn't exist." />
    </div>
  );

  // Malformed ids never reach Postgres — an invalid UUID literal would come
  // back as a raw Postgres error (22P02) rather than a clean "not found".
  if (!idSchema.safeParse(id).success) {
    return notFoundState;
  }

  const auth = await getAuthenticatedUser();
  if (!auth) {
    return notFoundState; // layout already redirects unauthenticated/non-admin users; this is a safe fallback
  }
  const { supabase } = auth;

  // Admin sees every application via the applications SELECT policy's
  // `OR is_current_user_admin()` clause — no extra filter needed here.
  const { data: application, error } = await supabase
    .from("applications")
    .select(
      "id, status, cover_letter, created_at, updated_at, " +
        "internship:internships(id, title, description, requirements, eligibility), " +
        "student:student_profiles(id, education_info, skills, profiles(first_name, last_name, email))"
    )
    .eq("id", id)
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

  const app = application as unknown as AdminApplicationDetailRow;
  const profile = app.student?.profiles;
  const studentName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : null;
  const education = app.student?.education_info;

  // Admin-only: audit_logs' "Admins can read audit logs" RLS policy makes
  // prior review feedback readable here even though it's never a durable
  // field on applications itself (students have no read access to this
  // table at all — see the Phase 4C/4D report's "existing issues" section).
  const { data: reviewHistory } = await supabase
    .from("audit_logs")
    .select("id, action, changes, created_at")
    .eq("resource_type", "application")
    .eq("resource_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={app.internship?.title ?? "Internship no longer available"}
        description={`Submitted ${new Date(app.created_at).toLocaleDateString()}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-small font-medium text-text">Status</span>
                <ApplicationStatusBadge status={app.status} />
              </div>

              <Section title="Cover letter" body={app.cover_letter || "No cover letter was submitted."} />

              {app.internship && (
                <>
                  <Section title="Internship description" body={app.internship.description} />
                  <Section title="Requirements" body={app.internship.requirements} />
                  <Section title="Eligibility" body={app.internship.eligibility} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <h3 className="text-small font-semibold text-text">Student</h3>
              <dl className="flex flex-col gap-2 text-small">
                <Row label="Name" value={studentName || "Not provided"} />
                <Row label="Email" value={profile?.email ?? "Not available"} />
                <Row label="School" value={education?.school || "Not provided"} />
                <Row label="Degree" value={education?.degree || "Not provided"} />
                <Row label="Graduation year" value={education?.grad_year?.toString() || "Not provided"} />
                <Row label="Skills" value={app.student?.skills?.join(", ") || "Not provided"} />
              </dl>
            </CardContent>
          </Card>

          {reviewHistory && reviewHistory.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <h3 className="text-small font-semibold text-text">Review history</h3>
                <ul className="flex flex-col gap-3">
                  {(reviewHistory as ReviewAuditLogRow[]).map((entry) => (
                    <li key={entry.id} className="flex flex-col gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-small font-medium text-text">
                          {entry.changes?.previous_status ?? "?"} → {entry.changes?.new_status ?? "?"}
                        </span>
                        <span className="text-caption text-text-muted">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      {entry.changes?.feedback && (
                        <p className="text-small text-text-muted">"{entry.changes.feedback}"</p>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-6">
              <ReviewActionButtons
                applicationId={app.id}
                canMarkUnderReview={canMarkUnderReview(app.status)}
                canReview={canReview(app.status)}
              />
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-medium text-text">{value}</dd>
    </div>
  );
}
