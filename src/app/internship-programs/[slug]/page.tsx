import Link from "next/link";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createServerSideClient } from "@/lib/supabase";

interface InternshipProgramRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  long_description: string;
  program_id: string;
  programs: { slug: string; name: string; program_skills: { skills: { name: string } | null }[] } | null;
}

interface InternshipRow {
  id: string;
  title: string;
  description: string;
  duration_weeks: number | null;
  created_at: string;
}

const DURATION_LABELS: Record<number, string> = { 4: "1-month", 12: "3-month", 24: "6-month" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSideClient();
  const { data: internshipProgram } = await supabase
    .from("internship_programs")
    .select("name, short_description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!internshipProgram) return { title: "Internship Program — NOVA" };
  return { title: `${internshipProgram.name} — NOVA`, description: internshipProgram.short_description };
}

export default async function InternshipProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSideClient();

  const { data: internshipProgram, error } = await supabase
    .from("internship_programs")
    .select("id, slug, name, short_description, long_description, program_id, programs(slug, name, program_skills(skills(name)))")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    return (
      <PublicPageShell>
        <PageHeader title="Internship Program" />
        <ErrorState title="Couldn't load this internship program" description="Something went wrong. Please try again." />
      </PublicPageShell>
    );
  }

  if (!internshipProgram) {
    return (
      <PublicPageShell>
        <PageHeader title="Internship program not found" />
        <EmptyState title="This internship program doesn't exist" description="It may be unpublished or no longer available." />
      </PublicPageShell>
    );
  }

  const row = internshipProgram as unknown as InternshipProgramRow;
  const skills = row.programs?.program_skills.map((ps) => ps.skills?.name).filter(Boolean) as string[] | undefined;

  const { data: internships } = await supabase
    .from("internships")
    .select("id, title, description, duration_weeks, created_at")
    .eq("internship_program_id", row.id)
    .eq("status", "open")
    .order("duration_weeks", { ascending: true });

  return (
    <PublicPageShell>
      <div className="flex flex-wrap items-center gap-2">
        {row.programs && <Badge variant="primary">{row.programs.name}</Badge>}
      </div>
      <PageHeader title={row.name} description={row.short_description} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-small font-semibold text-text">About this internship program</h3>
                <p className="whitespace-pre-line text-body text-text-muted">{row.long_description}</p>
              </div>
              {skills && skills.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-small font-semibold text-text">Skills you'll use</h3>
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

          <div className="flex flex-col gap-4">
            <h2 className="text-h3 text-text">Open internship opportunities</h2>
            {!internships || internships.length === 0 ? (
              <EmptyState title="No open opportunities right now" description="Check back soon — new openings will appear here." />
            ) : (
              <div className="flex flex-col gap-3">
                {(internships as InternshipRow[]).map((internship) => (
                  <Link key={internship.id} href={`/internships/${internship.id}`}>
                    <Card className="transition-colors hover:border-primary/40">
                      <CardContent className="flex flex-col gap-2 p-6">
                        <div className="flex items-center justify-between gap-4">
                          {internship.duration_weeks && (
                            <Badge variant="default">{DURATION_LABELS[internship.duration_weeks] ?? `${internship.duration_weeks} weeks`}</Badge>
                          )}
                        </div>
                        <p className="text-body font-medium text-text">{internship.title}</p>
                        <p className="line-clamp-2 text-small text-text-muted">{internship.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <p className="text-small font-medium text-text">Ready to apply?</p>
              <p className="text-caption text-text-muted">Create a NOVA student account to apply to any open opportunity above.</p>
              <Link href="/get-started" className={buttonVariants({ variant: "primary", size: "sm" })}>
                Get started
              </Link>
            </CardContent>
          </Card>

          {row.programs && (
            <Card>
              <CardContent className="flex flex-col gap-3 p-6">
                <p className="text-small font-medium text-text">Built on {row.programs.name}</p>
                <p className="text-caption text-text-muted">This internship program follows the {row.programs.name} learning program.</p>
                <Link href={`/programs/${row.programs.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  View the learning program
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicPageShell>
  );
}
