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

export const metadata: Metadata = { title: "Programs — NOVA Admin" };

type StatusFilter = "all" | "draft" | "published" | "archived";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

function normalizeFilter(raw: string | string[] | undefined): StatusFilter {
  if (typeof raw !== "string") return "all";
  return (["all", "draft", "published", "archived"] as const).includes(raw as StatusFilter) ? (raw as StatusFilter) : "all";
}

interface AdminProgramRow {
  id: string;
  name: string;
  short_description: string;
  category: string;
  status: string;
}

export default async function AdminProgramsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: rawFilter } = await searchParams;
  const filter = normalizeFilter(rawFilter);

  const supabase = await createServerSideClient();

  // Admin sees every program regardless of status via the programs SELECT
  // policy's admin branch.
  let query = supabase
    .from("programs")
    .select("id, name, short_description, category, status")
    .order("display_order", { ascending: true });

  if (filter !== "all") query = query.eq("status", filter);

  const { data: programs, error } = await query;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Programs" description="Manage the learning program catalog." />
        <Link href="/admin/programs/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
          Create program
        </Link>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/programs" : `/admin/programs?status=${f.value}`}
            role="tab"
            aria-selected={filter === f.value}
            className={cn(buttonVariants({ variant: filter === f.value ? "primary" : "outline", size: "sm" }))}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {error ? (
        <ErrorState title="Couldn't load programs" description="Something went wrong. Please try again." />
      ) : !programs || programs.length === 0 ? (
        <EmptyState
          title="No programs match this filter"
          description="Programs you create will appear here."
          action={
            <Link href="/admin/programs/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Create program
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(programs as AdminProgramRow[]).map((program) => (
            <Link key={program.id} href={`/admin/programs/${program.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="primary">{program.category}</Badge>
                    <Badge variant={program.status === "published" ? "success" : program.status === "archived" ? "default" : "warning"}>
                      {program.status}
                    </Badge>
                  </div>
                  <CardTitle as="h2" className="text-body">
                    {program.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{program.short_description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
