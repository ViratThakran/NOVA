import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerSideClient } from "@/lib/supabase";
import { getEnrollmentStatusMeta } from "@/lib/enrollment-view-state";

export const metadata: Metadata = { title: "Enrollments — NOVA Admin" };

interface AdminEnrollmentRow {
  id: string;
  status: string;
  created_at: string;
  internship: { id: string; title: string } | null;
  student: { id: string; profiles: { first_name: string | null; last_name: string | null; email: string } | null } | null;
}

export default async function AdminEnrollmentsPage() {
  const supabase = await createServerSideClient();

  // Admin sees every enrollment via the existing `OR is_current_user_admin()`
  // branch on the enrollments SELECT policy — same embed shape already
  // exercised by admin-application-review's applicant lookup.
  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select(
      "id, status, created_at, internship:internships(id, title), student:student_profiles(id, profiles(first_name, last_name, email))"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Enrollments" description="Manage active and completed enrollments." />

      {error ? (
        <ErrorState title="Couldn't load enrollments" description="Something went wrong. Please try again." />
      ) : !enrollments || enrollments.length === 0 ? (
        <EmptyState title="No enrollments yet" description="Enrollments created via accepted applications will be listed here." />
      ) : (
        <div className="flex flex-col gap-3">
          {(enrollments as unknown as AdminEnrollmentRow[]).map((enrollment) => {
            const { label, variant } = getEnrollmentStatusMeta(enrollment.status);
            const profile = enrollment.student?.profiles;
            const studentLabel = profile
              ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email
              : "Student unavailable";
            return (
              <Card key={enrollment.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-small font-medium text-text">
                      {enrollment.internship?.title ?? "Internship no longer available"}
                    </span>
                    <span className="text-caption text-text-muted">
                      {studentLabel} · Enrolled {new Date(enrollment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant={variant}>{label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
