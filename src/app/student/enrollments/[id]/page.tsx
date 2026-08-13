import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth";
import { getEnrollmentStatusMeta } from "@/lib/enrollment-view-state";

export const metadata: Metadata = { title: "Enrollment details — NOVA" };

const idSchema = z.string().uuid();

interface EnrollmentDetailRow {
  id: string;
  status: string;
  application_id: string;
  created_at: string;
  updated_at: string;
  internship: { id: string; title: string; description: string; requirements: string; eligibility: string } | null;
}

export default async function StudentEnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notFoundState = (
    <div className="flex flex-col gap-8">
      <PageHeader title="Enrollment details" />
      <EmptyState
        title="Enrollment not found"
        description="This enrollment doesn't exist or isn't associated with your account."
      />
    </div>
  );

  // Malformed ids never reach Postgres, and — just as importantly — never
  // distinguishing "not yours" from "doesn't exist" avoids leaking whether a
  // given enrollment id belongs to someone else.
  if (!idSchema.safeParse(id).success) {
    return notFoundState;
  }

  const auth = await getAuthenticatedUser();
  if (!auth) {
    return notFoundState;
  }
  const { supabase, user } = auth;

  // Explicit student_id scoping on top of RLS: a student can never be handed
  // another student's enrollment by changing the URL, regardless of which
  // layer would have caught it.
  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select(
      "id, status, application_id, created_at, updated_at, internship:internships(id, title, description, requirements, eligibility)"
    )
    .eq("id", id)
    .eq("student_id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Enrollment details" />
        <ErrorState title="Couldn't load this enrollment" description="Something went wrong. Please try again." />
      </div>
    );
  }

  if (!enrollment) {
    return notFoundState;
  }

  const record = enrollment as unknown as EnrollmentDetailRow;
  const { label, variant } = getEnrollmentStatusMeta(record.status);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={record.internship?.title ?? "Internship no longer available"}
        description={`Enrolled ${new Date(record.created_at).toLocaleDateString()}`}
      />

      <div className="flex flex-col gap-6 lg:max-w-2xl">
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-small font-medium text-text">Status</span>
              <Badge variant={variant}>{label}</Badge>
            </div>

            {record.internship && (
              <>
                <Section title="Description" body={record.internship.description} />
                <Section title="Requirements" body={record.internship.requirements} />
                <Section title="Eligibility" body={record.internship.eligibility} />
              </>
            )}

            <div className="border-t border-border pt-4">
              <Link
                href={`/student/applications/${record.application_id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                View original application
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-4">
      <h3 className="text-small font-semibold text-text">{title}</h3>
      <p className="whitespace-pre-line text-body text-text-muted">{body}</p>
    </div>
  );
}
