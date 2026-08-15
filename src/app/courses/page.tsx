import Link from "next/link";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Courses — NOVA",
  description: "Browse NOVA's course catalog, organized by learning program.",
};

interface CourseRow {
  id: string;
  title: string;
  description: string;
  level: string;
  duration_hours: number;
  display_order: number;
  programs: { slug: string; name: string } | null;
  course_skills: { skills: { name: string } | null }[];
}

// Public page — anon reads this directly under the same "published only"
// RLS policy courses already carries (Phase 7).
export default async function CoursesPage() {
  const supabase = await createServerSideClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, description, level, duration_hours, display_order, programs(slug, name), course_skills(skills(name))")
    .eq("status", "published");

  const rows = (courses as unknown as CourseRow[] | null) ?? [];

  // Grouped by program (name, then within-program display_order) rather than
  // a single flat sort — a catalog reads better organized by learning path
  // than as one undifferentiated list.
  const byProgram = new Map<string, { name: string; slug: string; courses: CourseRow[] }>();
  for (const course of rows) {
    if (!course.programs) continue;
    const key = course.programs.slug;
    const group = byProgram.get(key) ?? { name: course.programs.name, slug: course.programs.slug, courses: [] };
    group.courses.push(course);
    byProgram.set(key, group);
  }
  for (const group of byProgram.values()) {
    group.courses.sort((a, b) => a.display_order - b.display_order);
  }
  const groups = [...byProgram.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PublicPageShell>
      <PageHeader title="Courses" description="The course catalog behind every NOVA learning program." />

      {error ? (
        <ErrorState title="Couldn't load courses" description="Something went wrong. Please try again." />
      ) : groups.length === 0 ? (
        <EmptyState title="No courses published yet" description="NOVA's course catalog will appear here." />
      ) : (
        <div className="flex flex-col gap-10">
          {groups.map((group) => (
            <section key={group.slug} className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-h3 text-text">{group.name}</h2>
                <Link href={`/programs/${group.slug}`} className="text-caption font-medium text-primary hover:underline">
                  View program
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.courses.map((course) => {
                  const skills = course.course_skills.map((cs) => cs.skills?.name).filter(Boolean) as string[];
                  return (
                    <Link key={course.id} href={`/courses/${course.id}`}>
                      <Card className="h-full transition-colors hover:border-primary/40">
                        <CardContent className="flex flex-col gap-2 p-6">
                          <div className="flex gap-2">
                            <Badge variant="default">{course.level}</Badge>
                            <Badge variant="default">{course.duration_hours}h</Badge>
                          </div>
                          <p className="text-body font-medium text-text">{course.title}</p>
                          <p className="line-clamp-2 text-small text-text-muted">{course.description}</p>
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {skills.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="info">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </PublicPageShell>
  );
}
