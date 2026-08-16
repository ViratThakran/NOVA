import Link from "next/link";
import { z } from "zod";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createServerSideClient } from "@/lib/supabase";

// courses.slug is only unique per-program (UNIQUE(program_id, slug)), not
// globally — this routes by id instead, the same convention already used
// for internships, service requests, and admin service detail pages.
const idSchema = z.string().uuid();

interface CourseRow {
  id: string;
  title: string;
  description: string;
  overview: string;
  prerequisites: string;
  learning_outcomes: string[];
  level: string;
  duration_hours: number;
  display_order: number;
  program_id: string;
  programs: { slug: string; name: string; short_description: string } | null;
  course_skills: { skills: { name: string } | null }[];
}

interface RelatedCourseRow {
  id: string;
  title: string;
  description: string;
  level: string;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return { title: "Course — NOVA" };
  const supabase = await createServerSideClient();
  const { data: course } = await supabase.from("courses").select("title, description").eq("id", id).eq("status", "published").maybeSingle();
  if (!course) return { title: "Course — NOVA" };
  return { title: `${course.title} — NOVA`, description: course.description };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFoundState = (
    <PublicPageShell>
      <PageHeader title="Course not found" />
      <EmptyState title="This course doesn't exist" description="It may be unpublished or no longer available." />
    </PublicPageShell>
  );

  if (!idSchema.safeParse(id).success) {
    return notFoundState;
  }

  const supabase = await createServerSideClient();

  const { data: course, error } = await supabase
    .from("courses")
    .select(
      "id, title, description, overview, prerequisites, learning_outcomes, level, duration_hours, display_order, program_id, programs(slug, name, short_description), course_skills(skills(name))"
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    return (
      <PublicPageShell>
        <PageHeader title="Course" />
        <ErrorState title="Couldn't load this course" description="Something went wrong. Please try again." />
      </PublicPageShell>
    );
  }

  if (!course) {
    return notFoundState;
  }

  const row = course as unknown as CourseRow;
  const skills = row.course_skills.map((cs) => cs.skills?.name).filter(Boolean) as string[];

  const { data: relatedCourses } = await supabase
    .from("courses")
    .select("id, title, description, level")
    .eq("program_id", row.program_id)
    .eq("status", "published")
    .neq("id", row.id)
    .order("display_order", { ascending: true })
    .limit(4);

  return (
    <PublicPageShell>
      <div className="flex flex-wrap items-center gap-2">
        {row.programs && <Badge variant="primary">{row.programs.name}</Badge>}
        <Badge variant="default">{row.level}</Badge>
        <Badge variant="default">{row.duration_hours} hours</Badge>
      </div>
      <PageHeader title={row.title} description={row.description} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              {row.overview && (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-small font-semibold text-text">Overview</h3>
                  <p className="whitespace-pre-line text-body text-text-muted">{row.overview}</p>
                </div>
              )}
              {row.prerequisites && (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-small font-semibold text-text">Prerequisites</h3>
                  <p className="whitespace-pre-line text-body text-text-muted">{row.prerequisites}</p>
                </div>
              )}
              {row.learning_outcomes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-small font-semibold text-text">What you'll learn</h3>
                  <ul className="flex flex-col gap-1 text-body text-text-muted">
                    {row.learning_outcomes.map((outcome) => (
                      <li key={outcome} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {skills.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-small font-semibold text-text">Skills covered</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="info">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {relatedCourses && relatedCourses.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-h3 text-text">More in this program</h2>
              <div className="flex flex-col gap-3">
                {(relatedCourses as RelatedCourseRow[]).map((related) => (
                  <Link key={related.id} href={`/courses/${related.id}`}>
                    <Card className="transition-colors hover:border-primary/40">
                      <CardContent className="flex items-center justify-between gap-4 p-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-small font-medium text-text">{related.title}</span>
                          <span className="line-clamp-1 text-caption text-text-muted">{related.description}</span>
                        </div>
                        <Badge variant="default">{related.level}</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {row.programs && (
            <Card>
              <CardContent className="flex flex-col gap-3 p-6">
                <p className="text-small font-medium text-text">Part of {row.programs.name}</p>
                <p className="text-caption text-text-muted">{row.programs.short_description}</p>
                <Link href={`/programs/${row.programs.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  View full program
                </Link>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <p className="text-small font-medium text-text">Ready to start?</p>
              <p className="text-caption text-text-muted">Create a NOVA account to begin learning.</p>
              <Link href="/get-started" className={buttonVariants({ variant: "primary", size: "sm" })}>
                Get started
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicPageShell>
  );
}
