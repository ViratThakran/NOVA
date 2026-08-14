import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createServerSideClient } from "@/lib/supabase";
import { getInternshipStatusMeta, type InternshipStatus } from "@/lib/internship-status";

export const metadata: Metadata = { title: "Internships — NOVA Admin" };

interface AdminInternshipListRow {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

type StatusFilter = "all" | InternshipStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

function normalizeStatusFilter(raw: string | string[] | undefined): StatusFilter {
  if (typeof raw !== "string") return "all";
  return (["all", "draft", "open", "closed", "archived"] as const).includes(raw as StatusFilter)
    ? (raw as StatusFilter)
    : "all";
}

export default async function AdminInternshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const statusFilter = normalizeStatusFilter(rawStatus);

  const supabase = await createServerSideClient();

  // Admin sees every internship regardless of status — enforced by the
  // internships SELECT policy's `OR is_current_user_admin()` clause.
  let query = supabase
    .from("internships")
    .select("id, title, description, status, created_at")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: internships, error } = await query;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Internships" description="Create and manage internship listings." />
        <Link href="/admin/internships/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
          Create internship
        </Link>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/admin/internships" : `/admin/internships?status=${filter.value}`}
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
        <ErrorState title="Couldn't load internships" description="Something went wrong. Please try again." />
      ) : !internships || internships.length === 0 ? (
        <EmptyState
          title="No internships match this filter"
          description="Internships you create will appear here."
          action={
            <Link href="/admin/internships/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Create internship
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(internships as AdminInternshipListRow[]).map((internship) => {
            const { label, variant } = getInternshipStatusMeta(internship.status);
            return (
              <Link key={internship.id} href={`/admin/internships/${internship.id}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle as="h2" className="text-body">
                        {internship.title}
                      </CardTitle>
                      <Badge variant={variant}>{label}</Badge>
                    </div>
                    <CardDescription className="line-clamp-3">{internship.description}</CardDescription>
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
