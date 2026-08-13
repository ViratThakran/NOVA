import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createServerSideClient } from "@/lib/supabase";
import { sanitizeInternshipSearchQuery } from "@/lib/internship-search";

export const metadata: Metadata = { title: "Internships — NOVA" };

interface InternshipListRow {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export default async function StudentInternshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const search = sanitizeInternshipSearchQuery(q);

  const supabase = await createServerSideClient();

  // Only 'open' internships are ever discoverable here — the internships
  // SELECT policy already hides draft/closed/archived rows from non-admins,
  // this explicit filter just makes the intent visible in the query itself.
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
    <div className="flex flex-col gap-8">
      <PageHeader title="Internships" description="Browse open internships and apply directly." />

      <form method="get" className="flex max-w-md gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search by title..."
          aria-label="Search internships by title"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {error ? (
        <ErrorState title="Couldn't load internships" description="Something went wrong. Please try again." />
      ) : !internships || internships.length === 0 ? (
        <EmptyState
          title={search ? `No internships match "${search}"` : "No open internships right now"}
          description={
            search
              ? "Try a different search term."
              : "Check back soon — new internships will appear here as they open up."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(internships as InternshipListRow[]).map((internship) => (
            <Link key={internship.id} href={`/student/internships/${internship.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader>
                  <CardTitle as="h2">{internship.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{internship.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-caption text-text-muted">
                    Posted {new Date(internship.created_at).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
