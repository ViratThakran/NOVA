import Link from "next/link";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createServerSideClient } from "@/lib/supabase";
import { sanitizeInternshipSearchQuery } from "@/lib/internship-search";

export const metadata: Metadata = {
  title: "Internships — NOVA",
  description: "Browse open internships with NOVA and NOVA's partner companies.",
};

interface InternshipListRow {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

// Public page — anon reads this directly under the new "open internships"
// anon-scoped RLS policy (Phase 9). Same discovery pattern as the
// authenticated student internship list, just without a login requirement.
export default async function InternshipsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const search = sanitizeInternshipSearchQuery(q);

  const supabase = await createServerSideClient();

  let query = supabase
    .from("internships")
    .select("id, title, description, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data: internships, error } = await query;

  return (
    <PublicPageShell>
      <PageHeader title="Internships" description="Real, open internships — with NOVA and NOVA's partner companies." />

      <form method="get" className="flex max-w-md gap-2">
        <Input type="search" name="q" defaultValue={search ?? ""} placeholder="Search by title..." aria-label="Search internships by title" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {error ? (
        <ErrorState title="Couldn't load internships" description="Something went wrong. Please try again." />
      ) : !internships || internships.length === 0 ? (
        <EmptyState
          title={search ? `No internships match "${search}"` : "No open internships right now"}
          description={search ? "Try a different search term." : "Check back soon — new internships will appear here as they open up."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(internships as InternshipListRow[]).map((internship) => (
            <Link key={internship.id} href={`/internships/${internship.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader>
                  <CardTitle as="h2">{internship.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{internship.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-caption text-text-muted">Posted {new Date(internship.created_at).toLocaleDateString()}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PublicPageShell>
  );
}
