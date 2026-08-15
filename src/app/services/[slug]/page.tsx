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
import { getAuthenticatedUser } from "@/lib/auth";

const AUTOMATION_LABELS: Record<string, string> = {
  autonomous: "AI-executed",
  approval_required: "AI-executed, approval required",
};

interface ServiceRow {
  id: string;
  category_id: string;
  name: string;
  short_description: string;
  description: string;
  automation_level: string;
  service_categories: { slug: string; name: string } | null;
}

interface RelatedServiceRow {
  slug: string;
  name: string;
  short_description: string;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSideClient();
  const { data: service } = await supabase.from("services").select("name, short_description").eq("slug", slug).eq("published", true).maybeSingle();
  if (!service) return { title: "Service — NOVA" };
  return { title: `${service.name} — NOVA`, description: service.short_description };
}

// Customers ("What can NOVA do for me?") never need to know which internal
// agent handles the work — this page describes the deliverable only. The
// internal AI workflow lives entirely behind /admin/services/requests/[id].
export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSideClient();

  const { data: service, error } = await supabase
    .from("services")
    .select("id, category_id, name, short_description, description, automation_level, service_categories(slug, name)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    return (
      <PublicPageShell>
        <PageHeader title="Service" />
        <ErrorState title="Couldn't load this service" description="Something went wrong. Please try again." />
      </PublicPageShell>
    );
  }

  if (!service) {
    return (
      <PublicPageShell>
        <PageHeader title="Service not found" />
        <EmptyState title="This service doesn't exist" description="It may be unpublished or no longer available." />
      </PublicPageShell>
    );
  }

  const row = service as unknown as ServiceRow;

  const { data: related } = await supabase
    .from("services")
    .select("slug, name, short_description")
    .eq("published", true)
    .eq("category_id", row.category_id)
    .neq("slug", slug)
    .limit(3);

  const auth = await getAuthenticatedUser();
  const isStudent = Boolean(auth?.roles.includes("student"));
  const isCompany = Boolean(auth?.roles.includes("company_admin") || auth?.roles.includes("company_member"));

  return (
    <PublicPageShell>
      <div className="flex flex-wrap items-center gap-2">
        {row.service_categories && <Badge variant="primary">{row.service_categories.name}</Badge>}
        <Badge variant={row.automation_level === "autonomous" ? "success" : "warning"}>
          {AUTOMATION_LABELS[row.automation_level] ?? row.automation_level}
        </Badge>
      </div>
      <PageHeader title={row.name} description={row.short_description} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-small font-semibold text-text">What NOVA delivers</h3>
                <p className="whitespace-pre-line text-body text-text-muted">{row.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <p className="text-small font-medium text-text">Ready to request this?</p>
              {isStudent ? (
                <>
                  <p className="text-caption text-text-muted">Submit a request from your services dashboard.</p>
                  <Link href="/student/services" className={buttonVariants({ variant: "primary", size: "sm" })}>
                    Request this service
                  </Link>
                </>
              ) : isCompany ? (
                <>
                  <p className="text-caption text-text-muted">Submit a request from your company dashboard.</p>
                  <Link href="/company/services" className={buttonVariants({ variant: "primary", size: "sm" })}>
                    Request this service
                  </Link>
                </>
              ) : auth ? (
                <p className="text-caption text-text-muted">Requesting services isn't available for this account type yet.</p>
              ) : (
                <>
                  <p className="text-caption text-text-muted">Sign in or create a NOVA account to request this service.</p>
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

          {related && related.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-3 p-6">
                <p className="text-small font-medium text-text">Other services</p>
                {(related as RelatedServiceRow[]).map((service) => (
                  <Link key={service.slug} href={`/services/${service.slug}`} className="flex flex-col gap-0.5 hover:text-primary">
                    <span className="text-small font-medium text-text">{service.name}</span>
                    <span className="line-clamp-2 text-caption text-text-muted">{service.short_description}</span>
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
