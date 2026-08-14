import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Services — NOVA Admin" };

type PublishedFilter = "all" | "published" | "unpublished";

const FILTERS: { value: PublishedFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
];

function normalizeFilter(raw: string | string[] | undefined): PublishedFilter {
  if (typeof raw !== "string") return "all";
  return (["all", "published", "unpublished"] as const).includes(raw as PublishedFilter) ? (raw as PublishedFilter) : "all";
}

interface AdminServiceRow {
  id: string;
  name: string;
  short_description: string;
  automation_level: string;
  published: boolean;
  service_categories: { name: string } | null;
}

export default async function AdminServicesPage({ searchParams }: { searchParams: Promise<{ published?: string }> }) {
  const { published: rawFilter } = await searchParams;
  const filter = normalizeFilter(rawFilter);

  const supabase = await createServerSideClient();

  // Admin sees every service regardless of published state via the
  // services SELECT policy's admin branch.
  let query = supabase
    .from("services")
    .select("id, name, short_description, automation_level, published, service_categories(name)")
    .order("display_order", { ascending: true });

  if (filter === "published") query = query.eq("published", true);
  if (filter === "unpublished") query = query.eq("published", false);

  const { data: services, error } = await query;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Services" description="Manage the AI-first service catalog." />
        <Link href="/admin/services/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
          Create service
        </Link>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by published state">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/services" : `/admin/services?published=${f.value}`}
            role="tab"
            aria-selected={filter === f.value}
            className={cn(buttonVariants({ variant: filter === f.value ? "primary" : "outline", size: "sm" }))}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {error ? (
        <ErrorState title="Couldn't load services" description="Something went wrong. Please try again." />
      ) : !services || services.length === 0 ? (
        <EmptyState
          title="No services match this filter"
          description="Services you create will appear here."
          action={
            <Link href="/admin/services/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Create service
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(services as unknown as AdminServiceRow[]).map((service) => (
            <Link key={service.id} href={`/admin/services/${service.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="primary">{service.service_categories?.name ?? "Uncategorized"}</Badge>
                    <div className="flex gap-1.5">
                      <Badge variant={service.automation_level === "autonomous" ? "success" : "warning"}>
                        {service.automation_level}
                      </Badge>
                      <Badge variant={service.published ? "success" : "default"}>
                        {service.published ? "Published" : "Unpublished"}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle as="h2" className="text-body">
                    {service.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{service.short_description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
