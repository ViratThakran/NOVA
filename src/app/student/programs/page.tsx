import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Programs — NOVA" };

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
}

// Same published-programs catalog as the public /programs page — a student
// is simply an authenticated reader of the same content, not a distinct
// data source.
export default async function StudentProgramsPage() {
  const supabase = await createServerSideClient();

  const { data: programs, error } = await supabase
    .from("programs")
    .select("id, slug, name, short_description, category, difficulty, duration_weeks")
    .eq("status", "published")
    .order("display_order", { ascending: true });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Programs" description="NOVA learning programs available to you." />

      {error ? (
        <ErrorState title="Couldn't load programs" description="Something went wrong. Please try again." />
      ) : !programs || programs.length === 0 ? (
        <EmptyState title="No programs published yet" description="NOVA's learning programs will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(programs as ProgramRow[]).map((program) => (
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
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
