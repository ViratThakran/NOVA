import Link from "next/link";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Programs — NOVA",
  description: "NOVA's flagship learning programs, from AI & Machine Learning to Cybersecurity and Cloud & DevOps.",
};

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
  category: string;
  difficulty: string;
  duration_weeks: number;
  career_outcomes: string[];
  program_skills: { skills: { name: string } | null }[];
}

// Public page — the `anon` role reads this directly, scoped by the
// "published only" RLS policy on programs/program_skills (Phase 7). No
// authentication required to browse the catalog.
export default async function ProgramsPage() {
  const supabase = await createServerSideClient();

  const { data: programs, error } = await supabase
    .from("programs")
    .select(
      "id, slug, name, short_description, category, difficulty, duration_weeks, career_outcomes, program_skills(skills(name))"
    )
    .eq("status", "published")
    .order("display_order", { ascending: true });

  return (
    <PublicPageShell>
      <PageHeader
        title="Programs"
        description="Flagship, career-oriented programs that take you from fundamentals to a real, demonstrable skill set."
      />

      {error ? (
        <ErrorState title="Couldn't load programs" description="Something went wrong. Please try again." />
      ) : !programs || programs.length === 0 ? (
        <EmptyState title="No programs published yet" description="NOVA's learning programs will appear here." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {(programs as unknown as ProgramRow[]).map((program) => {
            const skills = program.program_skills.map((ps) => ps.skills?.name).filter(Boolean) as string[];
            return (
              <Link key={program.id} href={`/programs/${program.slug}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="primary">{CATEGORY_LABELS[program.category] ?? program.category}</Badge>
                      <Badge variant="default">{program.difficulty}</Badge>
                      <Badge variant="default">{program.duration_weeks} weeks</Badge>
                    </div>
                    <CardTitle as="h2" className="text-body">
                      {program.name}
                    </CardTitle>
                    <CardDescription>{program.short_description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 pt-0">
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((skill) => (
                          <Badge key={skill} variant="info">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {program.career_outcomes.length > 0 && (
                      <p className="text-caption text-text-muted">Career outcomes: {program.career_outcomes.join(", ")}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </PublicPageShell>
  );
}
