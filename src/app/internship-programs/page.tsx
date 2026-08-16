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
  title: "Internship Programs — NOVA",
  description: "NOVA's internship programs, offered across 1, 3, and 6-month tracks in every subject area.",
};

interface InternshipProgramRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  programs: { name: string } | null;
  internships: { id: string; duration_weeks: number | null }[];
}

const DURATION_LABELS: Record<number, string> = { 4: "1-month", 12: "3-month", 24: "6-month" };

// Public page — the `anon` role reads this directly, scoped by the
// "published only" RLS policy on internship_programs (Phase 10B), matching
// the existing programs/courses/services discovery pattern.
export default async function InternshipProgramsPage() {
  const supabase = await createServerSideClient();

  const { data: internshipPrograms, error } = await supabase
    .from("internship_programs")
    .select("id, slug, name, short_description, programs(name), internships(id, duration_weeks)")
    .eq("status", "published")
    .order("display_order", { ascending: true });

  return (
    <PublicPageShell>
      <PageHeader
        title="Internship Programs"
        description="Real, hands-on internship tracks in every NOVA subject area — choose a 1, 3, or 6-month commitment."
      />

      {error ? (
        <ErrorState title="Couldn't load internship programs" description="Something went wrong. Please try again." />
      ) : !internshipPrograms || internshipPrograms.length === 0 ? (
        <EmptyState title="No internship programs published yet" description="NOVA's internship programs will appear here." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {(internshipPrograms as unknown as InternshipProgramRow[]).map((ip) => {
            const openInternships = ip.internships.filter(Boolean);
            const availableTracks = Array.from(
              new Set(openInternships.map((i) => i.duration_weeks).filter((w): w is number => w !== null))
            ).sort((a, b) => a - b);
            return (
              <Link key={ip.id} href={`/internship-programs/${ip.slug}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {ip.programs && <Badge variant="primary">{ip.programs.name}</Badge>}
                      {availableTracks.map((weeks) => (
                        <Badge key={weeks} variant="default">
                          {DURATION_LABELS[weeks] ?? `${weeks} weeks`}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle as="h2" className="text-body">
                      {ip.name}
                    </CardTitle>
                    <CardDescription>{ip.short_description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-caption text-text-muted">
                      {openInternships.length} open {openInternships.length === 1 ? "opportunity" : "opportunities"}
                    </p>
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
