import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth";
import { getEnrollmentStatusMeta } from "@/lib/enrollment-view-state";

export const metadata: Metadata = { title: "Enrollments — NOVA" };

interface EnrollmentListRow {
  id: string;
  status: string;
  created_at: string;
  internship: { id: string; title: string } | null;
}

export default async function StudentEnrollmentsPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Your enrollments" />
        <ErrorState title="Your session has expired" description="Please log in again." />
      </div>
    );
  }
  const { supabase, user } = auth;

  // RLS already scopes enrollments to their own student_id OR admin — the
  // explicit filter here just makes that intent visible in the query itself.
  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select("id, status, created_at, internship:internships(id, title)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Your enrollments" description="Internships you've been accepted into." />

      {error ? (
        <ErrorState title="Couldn't load your enrollments" description="Something went wrong. Please try again." />
      ) : !enrollments || enrollments.length === 0 ? (
        <EmptyState
          title="You have no enrollments yet"
          description="Once an application is accepted, the resulting enrollment will appear here."
          action={
            <Link href="/student/applications" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View your applications
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {(enrollments as unknown as EnrollmentListRow[]).map((enrollment) => {
            const { label, variant } = getEnrollmentStatusMeta(enrollment.status);
            return (
              <Link key={enrollment.id} href={`/student/enrollments/${enrollment.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
                    <div className="flex flex-col gap-1">
                      <CardTitle as="h2" className="text-body">
                        {enrollment.internship?.title ?? "Internship no longer available"}
                      </CardTitle>
                      <span className="text-caption text-text-muted">
                        Enrolled {new Date(enrollment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge variant={variant}>{label}</Badge>
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
