import type { Metadata } from "next";
import { z } from "zod";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { EditServiceForm } from "./edit-service-form";
import { PublishToggle } from "./publish-toggle";
import { DeleteServiceButton } from "./delete-service-button";

export const metadata: Metadata = { title: "Service details — NOVA Admin" };

const idSchema = z.string().uuid();

interface ServiceRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  automation_level: string;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default async function AdminServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFoundState = (
    <div className="flex flex-col gap-8">
      <PageHeader title="Service details" />
      <EmptyState title="Service not found" description="This service doesn't exist." />
    </div>
  );

  if (!idSchema.safeParse(id).success) return notFoundState;

  const auth = await getAuthenticatedUser();
  if (!auth) return notFoundState; // layout already redirects unauthenticated/non-admin users; safe fallback
  const { supabase } = auth;

  const [{ data: service, error }, { data: categories, error: categoriesError }] = await Promise.all([
    supabase
      .from("services")
      .select("id, category_id, name, slug, short_description, description, automation_level, published, display_order, created_at, updated_at")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("service_categories").select("id, name").order("display_order", { ascending: true }),
  ]);

  if (error || categoriesError) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Service details" />
        <ErrorState title="Couldn't load this service" description="Something went wrong. Please try again." />
      </div>
    );
  }

  if (!service) return notFoundState;

  const record = service as ServiceRow;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={record.name}
        description={`Created ${new Date(record.created_at).toLocaleDateString()} · Last updated ${new Date(record.updated_at).toLocaleDateString()}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <EditServiceForm service={record} categories={categories ?? []} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h3 className="text-small font-semibold text-text">Publish state</h3>
              <PublishToggle serviceId={record.id} published={record.published} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h3 className="text-small font-semibold text-text">Delete service</h3>
              <p className="text-caption text-text-muted">This permanently removes the service from the catalog.</p>
              <DeleteServiceButton serviceId={record.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
