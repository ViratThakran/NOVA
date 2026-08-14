import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { createServerSideClient } from "@/lib/supabase";
import { CreateServiceForm } from "./create-service-form";

export const metadata: Metadata = { title: "Create service — NOVA Admin" };

export default async function NewServicePage() {
  const supabase = await createServerSideClient();

  // Categories are fixed/seeded (Phase 8A) — this reads them for the form's
  // dropdown, not a category-management capability.
  const { data: categories, error } = await supabase
    .from("service_categories")
    .select("id, name")
    .order("display_order", { ascending: true });

  if (error || !categories) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Create service" />
        <ErrorState title="Couldn't load service categories" description="Something went wrong. Please try again." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Create service" description="New services start as unpublished, not visible on the public catalog." />
      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <CreateServiceForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
