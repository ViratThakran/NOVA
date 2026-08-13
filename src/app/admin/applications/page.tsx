import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createServerSideClient } from "@/lib/supabase";
import {
  normalizeApplicationStatusFilter,
  type ApplicationStatusFilter,
} from "@/lib/admin-review-view-state";

export const metadata: Metadata = { title: "Applications — NOVA Admin" };

interface AdminApplicationListRow {
  id: string;
  status: string;
  created_at: string;
  internship: { id: string; title: string } | null;
  student: {
    id: string;
    profiles: { first_name: string | null; last_name: string | null; email: string } | null;
  } | null;
}

const FILTERS: { value: ApplicationStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

function studentDisplayName(student: AdminApplicationListRow["student"]): string {
  const profile = student?.profiles;
  if (!profile) return "Unknown student";
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return name || profile.email;
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const statusFilter = normalizeApplicationStatusFilter(rawStatus);

  const supabase = await createServerSideClient();

  // Admin sees every application — enforced by the applications SELECT
  // policy's `OR is_current_user_admin()` clause, not by this query.
  let query = supabase
    .from("applications")
    .select(
      "id, status, created_at, internship:internships(id, title), student:student_profiles(id, profiles(first_name, last_name, email))"
    )
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: applications, error } = await query;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Applications" description="Review and act on student applications." />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/admin/applications" : `/admin/applications?status=${filter.value}`}
            role="tab"
            aria-selected={statusFilter === filter.value}
            className={cn(
              buttonVariants({ variant: statusFilter === filter.value ? "primary" : "outline", size: "sm" })
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {error ? (
        <ErrorState title="Couldn't load applications" description="Something went wrong. Please try again." />
      ) : !applications || applications.length === 0 ? (
        <EmptyState
          title="No applications match this filter"
          description="Applications submitted by students will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {(applications as unknown as AdminApplicationListRow[]).map((application) => (
            <Link key={application.id} href={`/admin/applications/${application.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
                  <div className="flex flex-col gap-1">
                    <CardTitle as="h2" className="text-body">
                      {application.internship?.title ?? "Internship no longer available"}
                    </CardTitle>
                    <span className="text-caption text-text-muted">
                      {studentDisplayName(application.student)} · Applied{" "}
                      {new Date(application.created_at).toLocaleDateString()}
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
