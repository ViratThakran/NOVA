import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Students — NOVA Admin" };

interface StudentProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  onboarded: boolean;
  created_at: string;
}

export default async function AdminStudentsPage() {
  const supabase = await createServerSideClient();

  // user_roles is the source of truth for "who is a student" — profiles has
  // no role column of its own. Both tables are admin-readable via each
  // table's own `OR is_current_user_admin()` RLS branch.
  const { data: roleRows, error: roleError } = await supabase.from("user_roles").select("user_id").eq("role", "student");

  if (roleError) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Students" description="Manage registered students." />
        <ErrorState title="Couldn't load students" description="Something went wrong. Please try again." />
      </div>
    );
  }

  const studentIds = (roleRows ?? []).map((r) => r.user_id as string);

  if (studentIds.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Students" description="Manage registered students." />
        <EmptyState title="No students yet" description="Registered students will appear here." />
      </div>
    );
  }

  const [{ data: profiles, error: profilesError }, { data: applications }, { data: enrollments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, first_name, last_name, onboarded, created_at")
      .in("id", studentIds)
      .order("created_at", { ascending: false }),
    supabase.from("applications").select("student_id").in("student_id", studentIds),
    supabase.from("enrollments").select("student_id").in("student_id", studentIds),
  ]);

  if (profilesError) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Students" description="Manage registered students." />
        <ErrorState title="Couldn't load students" description="Something went wrong. Please try again." />
      </div>
    );
  }

  const applicationCounts = new Map<string, number>();
  for (const row of applications ?? []) applicationCounts.set(row.student_id, (applicationCounts.get(row.student_id) ?? 0) + 1);
  const enrollmentCounts = new Map<string, number>();
  for (const row of enrollments ?? []) enrollmentCounts.set(row.student_id, (enrollmentCounts.get(row.student_id) ?? 0) + 1);

  const students = (profiles ?? []) as StudentProfileRow[];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Students" description={`${students.length} registered student${students.length === 1 ? "" : "s"}.`} />

      {students.length === 0 ? (
        <EmptyState title="No students yet" description="Registered students will appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {students.map((student) => {
            const name = [student.first_name, student.last_name].filter(Boolean).join(" ") || student.email;
            return (
              <Card key={student.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-small font-medium text-text">{name}</span>
                    <span className="text-caption text-text-muted">{student.email}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={student.onboarded ? "success" : "default"}>
                      {student.onboarded ? "Onboarded" : "Not onboarded"}
                    </Badge>
                    <Badge variant="default">{applicationCounts.get(student.id) ?? 0} applications</Badge>
                    <Badge variant="default">{enrollmentCounts.get(student.id) ?? 0} enrollments</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
