import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Applications — NOVA" };

interface ApplicationListRow {
  id: string;
  status: string;
  created_at: string;
  internship: { id: string; title: string } | null;
}

export default async function StudentApplicationsPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Your applications" />
        <ErrorState title="Your session has expired" description="Please log in again." />
      </div>
    );
  }
  const { supabase, user } = auth;

  // RLS already scopes applications to their own student_id OR admin — the
  // explicit filter here just makes that intent visible in the query itself.
  const { data: applications, error } = await supabase
    .from("applications")
    .select("id, status, created_at, internship:internships(id, title)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Your applications" description="Track the status of internships you've applied to." />

      {error ? (
        <ErrorState title="Couldn't load your applications" description="Something went wrong. Please try again." />
      ) : !applications || applications.length === 0 ? (
        <EmptyState
          title="You haven't applied to any internships yet"
          description="Browse open internships and submit your first application."
          action={
            <Link href="/student/internships" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Browse internships
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {(applications as unknown as ApplicationListRow[]).map((application) => (
            <Link key={application.id} href={`/student/applications/${application.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
                  <div className="flex flex-col gap-1">
                    <CardTitle as="h2" className="text-body">
                      {/* The internship may have since been closed/archived by an
                          admin — RLS then hides it from this embedded join even
                          though the application itself is still the student's own. */}
                      {application.internship?.title ?? "Internship no longer available"}
                    </CardTitle>
                    <span className="text-caption text-text-muted">
                      Applied {new Date(application.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
