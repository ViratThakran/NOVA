import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireCompanyAccess } from "@/lib/auth";
import { getInternshipStatusMeta } from "@/lib/internship-status";

export const metadata: Metadata = { title: "Internships — NOVA Company" };

interface CompanyInternshipRow {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export default async function CompanyInternshipsPage() {
  const { supabase, companyId, companyRole } = await requireCompanyAccess();
  const canCreate = companyRole === "owner" || companyRole === "admin";

  const { data: internships, error } = await supabase
    .from("internships")
    .select("id, title, description, status, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Internships" description="Internships posted by your company." />
        {canCreate && (
          <Link href="/company/internships/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
            Create internship
          </Link>
        )}
      </div>

      {error ? (
        <ErrorState title="Couldn't load internships" description="Something went wrong. Please try again." />
      ) : !internships || internships.length === 0 ? (
        <EmptyState
          title="No internships yet"
          description="Internships you create will appear here."
          action={
            canCreate ? (
              <Link href="/company/internships/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Create internship
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(internships as CompanyInternshipRow[]).map((internship) => {
            const { label, variant } = getInternshipStatusMeta(internship.status);
            return (
              <Link key={internship.id} href={`/company/internships/${internship.id}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle as="h2" className="text-body">
                        {internship.title}
                      </CardTitle>
                      <Badge variant={variant}>{label}</Badge>
                    </div>
                    <CardDescription className="line-clamp-3">{internship.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
