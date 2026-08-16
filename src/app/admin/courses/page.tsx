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

export const metadata: Metadata = { title: "Courses — NOVA Admin" };

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

interface AdminCourseRow {
  id: string;
  title: string;
  description: string;
  level: string;
  status: string;
  programs: { name: string } | null;
}

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: rawFilter } = await searchParams;
  const filter = normalizeFilter(rawFilter);

  const supabase = await createServerSideClient();

  // Admin sees every course regardless of status via the courses SELECT
  // policy's admin branch.
  let query = supabase
    .from("courses")
    .select("id, title, description, level, status, programs(name)")
    .order("display_order", { ascending: true });

  if (filter !== "all") query = query.eq("status", filter);

  const { data: courses, error } = await query;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Courses" description="Manage courses within the learning program catalog." />
        <Link href="/admin/courses/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
          Create course
        </Link>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/courses" : `/admin/courses?status=${f.value}`}
            role="tab"
            aria-selected={filter === f.value}
            className={cn(buttonVariants({ variant: filter === f.value ? "primary" : "outline", size: "sm" }))}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {error ? (
        <ErrorState title="Couldn't load courses" description="Something went wrong. Please try again." />
      ) : !courses || courses.length === 0 ? (
        <EmptyState
          title="No courses match this filter"
          description="Courses you create will appear here."
          action={
            <Link href="/admin/courses/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Create course
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(courses as unknown as AdminCourseRow[]).map((course) => (
            <Link key={course.id} href={`/admin/courses/${course.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="primary">{course.programs?.name ?? "Unassigned"}</Badge>
                    <div className="flex gap-1.5">
                      <Badge variant="default">{course.level}</Badge>
                      <Badge variant={course.status === "published" ? "success" : course.status === "archived" ? "default" : "warning"}>
                        {course.status}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle as="h2" className="text-body">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
