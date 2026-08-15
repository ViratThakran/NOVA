import Link from "next/link";
import { z } from "zod";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { createServerSideClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/auth";

const idSchema = z.string().uuid();

interface InternshipRow {
  title: string;
  description: string;
  requirements: string;
  eligibility: string;
  created_at: string;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return { title: "Internship — NOVA" };
  const supabase = await createServerSideClient();
  const { data: internship } = await supabase.from("internships").select("title, description").eq("id", id).eq("status", "open").maybeSingle();
  if (!internship) return { title: "Internship — NOVA" };
  return { title: `${internship.title} — NOVA`, description: internship.description };
}

// Public discovery + detail — anon can read (Phase 9 RLS). Actually
// applying still requires the tested, secure student flow at
// /student/internships/[id]; this page never duplicates the application
// mutation, it only routes there once someone is authenticated as a
// student.
export default async function InternshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFoundState = (
    <PublicPageShell>
      <PageHeader title="Internship not found" />
      <EmptyState title="This internship doesn't exist" description="It may not be open right now, or may have been closed." />
    </PublicPageShell>
  );

  if (!idSchema.safeParse(id).success) {
    return notFoundState;
  }

  const supabase = await createServerSideClient();

  const { data: internship, error } = await supabase
    .from("internships")
    .select("title, description, requirements, eligibility, created_at")
    .eq("id", id)
    .eq("status", "open")
    .maybeSingle();

  if (error) {
    return (
      <PublicPageShell>
        <PageHeader title="Internship" />
        <ErrorState title="Couldn't load this internship" description="Something went wrong. Please try again." />
      </PublicPageShell>
    );
  }

  if (!internship) {
    return notFoundState;
  }

  const row = internship as InternshipRow;
  const auth = await getAuthenticatedUser();
  const isStudent = Boolean(auth?.roles.includes("student"));

  return (
    <PublicPageShell>
      <PageHeader title={row.title} description={`Posted ${new Date(row.created_at).toLocaleDateString()}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <Section title="Description" body={row.description} />
              <Section title="Requirements" body={row.requirements} />
              <Section title="Eligibility" body={row.eligibility} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              {isStudent ? (
                <>
                  <p className="text-small font-medium text-text">Ready to apply?</p>
                  <Link href={`/student/internships/${id}`} className={buttonVariants({ variant: "primary", size: "sm" })}>
                    Apply from your dashboard
                  </Link>
                </>
              ) : auth ? (
                <>
                  <p className="text-small font-medium text-text">Applications are open to NOVA students</p>
                  <p className="text-caption text-text-muted">Sign in with a student account to apply.</p>
                </>
              ) : (
                <>
                  <p className="text-small font-medium text-text">Interested?</p>
                  <p className="text-caption text-text-muted">Create a free NOVA student account to apply.</p>
                  <Link href="/get-started" className={buttonVariants({ variant: "primary", size: "sm" })}>
                    Get started
                  </Link>
                  <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Sign in
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
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
