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
  title: "Services — NOVA",
  description: "NOVA's AI-first service catalog — websites, automation, marketing, design, data, software, and infrastructure work.",
};

const AUTOMATION_LABELS: Record<string, string> = {
  autonomous: "AI-executed",
  approval_required: "AI-executed, approval required",
};

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  display_order: number;
}

interface ServiceRow {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  short_description: string;
  automation_level: string;
  display_order: number;
}

// Public page — the `anon` role reads this directly, scoped by the
// "published only" RLS policy on service_categories/services (Phase 8A).
export default async function ServicesPage() {
  const supabase = await createServerSideClient();

  const [{ data: categories, error: categoriesError }, { data: services, error: servicesError }] = await Promise.all([
    supabase
      .from("service_categories")
      .select("id, slug, name, description, display_order")
      .eq("published", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("services")
      .select("id, category_id, slug, name, short_description, automation_level, display_order")
      .eq("published", true)
      .order("display_order", { ascending: true }),
  ]);

  const error = categoriesError || servicesError;

  const servicesByCategory = new Map<string, ServiceRow[]>();
  for (const service of (services as ServiceRow[] | null) ?? []) {
    const existing = servicesByCategory.get(service.category_id) ?? [];
    existing.push(service);
    servicesByCategory.set(service.category_id, existing);
  }

  const categoryRows = (categories as CategoryRow[] | null) ?? [];

  return (
    <PublicPageShell>
      <PageHeader
        title="Services"
        description="AI-first digital work — websites, automation, marketing, design, data, and software, executed by NOVA AI."
      />

      {error ? (
        <ErrorState title="Couldn't load services" description="Something went wrong. Please try again." />
      ) : categoryRows.length === 0 ? (
        <EmptyState title="No services available yet" description="NOVA's service catalog will appear here." />
      ) : (
        <div className="flex flex-col gap-12">
          {categoryRows.map((category) => {
            const categoryServices = servicesByCategory.get(category.id) ?? [];
            if (categoryServices.length === 0) return null;
            return (
              <section key={category.id} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-h3 text-text">{category.name}</h2>
                  {category.description && <p className="text-small text-text-muted">{category.description}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryServices.map((service) => (
                    <Link key={service.id} href={`/services/${service.slug}`}>
                      <Card className="h-full transition-colors hover:border-primary/40">
                        <CardHeader className="flex flex-col gap-2">
                          <Badge variant={service.automation_level === "autonomous" ? "success" : "warning"}>
                            {AUTOMATION_LABELS[service.automation_level] ?? service.automation_level}
                          </Badge>
                          <CardTitle as="h3" className="text-body">
                            {service.name}
                          </CardTitle>
                          <CardDescription>{service.short_description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PublicPageShell>
  );
}
