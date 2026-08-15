import Link from "next/link";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createServerSideClient } from "@/lib/supabase";

const CATEGORY_LABELS: Record<string, string> = {
  ai_ml: "AI & Machine Learning",
  data_analytics: "Data Analytics",
  software_development: "Software Development",
  cybersecurity: "Cybersecurity",
  cloud_devops: "Cloud & DevOps",
  design: "Design",
  emerging_tech: "Emerging Tech",
};

interface ProgramRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  long_description: string;
  category: string;
  difficulty: string;
  duration_weeks: number;
  career_outcomes: string[];
  program_skills: { skills: { name: string } | null }[];
}

interface CourseRow {
  id: string;
  title: string;
  description: string;
  level: string;
  duration_hours: number;
  course_skills: { skills: { name: string } | null }[];
}

interface RelatedProgramRow {
  slug: string;
  name: string;
  short_description: string;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSideClient();
  const { data: program } = await supabase.from("programs").select("name, short_description").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!program) return { title: "Program — NOVA" };
  return { title: `${program.name} — NOVA`, description: program.short_description };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSideClient();

  const { data: program, error: programError } = await supabase
    .from("programs")
    .select(
      "id, slug, name, short_description, long_description, category, difficulty, duration_weeks, career_outcomes, program_skills(skills(name))"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (programError) {
    return (
      <PublicPageShell>
        <PageHeader title="Program" />
        <ErrorState title="Couldn't load this program" description="Something went wrong. Please try again." />
      </PublicPageShell>
    );
  }

  if (!program) {
    return (
      <PublicPageShell>
        <PageHeader title="Program not found" />
        <EmptyState title="This program doesn't exist" description="It may be unpublished or no longer available." />
      </PublicPageShell>
    );
  }

  const row = program as unknown as ProgramRow;
  const skills = row.program_skills.map((ps) => ps.skills?.name).filter(Boolean) as string[];

  const [{ data: courses }, { data: relatedPrograms }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, description, level, duration_hours, course_skills(skills(name))")
      .eq("program_id", row.id)
      .eq("status", "published")
      .order("display_order", { ascending: true }),
    supabase
      .from("programs")
      .select("slug, name, short_description")
      .eq("status", "published")
      .eq("category", row.category)
      .neq("id", row.id)
      .limit(3),
  ]);

  return (
    <PublicPageShell>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="primary">{CATEGORY_LABELS[row.category] ?? row.category}</Badge>
        <Badge variant="default">{row.difficulty}</Badge>
        <Badge variant="default">{row.duration_weeks} weeks</Badge>
      </div>
      <PageHeader title={row.name} description={row.short_description} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <Section title="About this program" body={row.long_description} />
              {row.career_outcomes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-small font-semibold text-text">Career outcomes</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {row.career_outcomes.map((outcome) => (
                      <Badge key={outcome} variant="info">
                        {outcome}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {skills.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-small font-semibold text-text">Skills you'll build</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="default">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <h2 className="text-h3 text-text">Courses in this program</h2>
            {!courses || courses.length === 0 ? (
              <EmptyState title="Courses coming soon" description="This program's course lineup hasn't been published yet." />
            ) : (
              <div className="flex flex-col gap-3">
                {(courses as unknown as CourseRow[]).map((course, index) => {
                  const courseSkills = course.course_skills.map((cs) => cs.skills?.name).filter(Boolean) as string[];
                  return (
                    <Link key={course.id} href={`/courses/${course.id}`}>
                      <Card className="transition-colors hover:border-primary/40">
                        <CardContent className="flex flex-col gap-2 p-6">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-caption font-medium uppercase tracking-wide text-text-muted">
                              Course {index + 1}
                            </span>
                            <div className="flex gap-2">
                              <Badge variant="default">{course.level}</Badge>
                              <Badge variant="default">{course.duration_hours}h</Badge>
                            </div>
                          </div>
                          <p className="text-body font-medium text-text">{course.title}</p>
                          <p className="line-clamp-2 text-small text-text-muted">{course.description}</p>
                          {courseSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {courseSkills.map((skill) => (
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
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <p className="text-small font-medium text-text">Ready to start?</p>
              <p className="text-caption text-text-muted">Create a NOVA account to begin this program.</p>
              <Link href="/get-started" className={buttonVariants({ variant: "primary", size: "sm" })}>
                Get started
              </Link>
            </CardContent>
          </Card>

          {relatedPrograms && relatedPrograms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle as="h3" className="text-small">
                  Related programs
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0">
                {(relatedPrograms as unknown as RelatedProgramRow[]).map((related) => (
                  <Link key={related.slug} href={`/programs/${related.slug}`} className="flex flex-col gap-0.5 hover:text-primary">
                    <span className="text-small font-medium text-text">{related.name}</span>
                    <CardDescription className="line-clamp-2">{related.short_description}</CardDescription>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicPageShell>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-small font-semibold text-text">{title}</h3>
      <p className="whitespace-pre-line text-body text-text-muted">{body}</p>
    </div>
  );
}
