import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth";
import { RequestServiceForm } from "./request-service-form";

export const metadata: Metadata = { title: "Services — NOVA" };

const AUTOMATION_LABELS: Record<string, string> = {
  autonomous: "AI-executed",
  approval_required: "AI-executed, approval required",
};

interface ServiceRow {
  id: string;
  name: string;
  short_description: string;
  automation_level: string;
  service_categories: { name: string } | null;
}

export default async function StudentServicesPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Services" />
        <ErrorState title="Your session has expired" description="Please log in again." />
      </div>
    );
  }
  const { supabase } = auth;

  // Discovery only — "what can I request" — kept structurally separate
  // from "what have I already requested" (see /student/services/requests),
  // which used to live at the bottom of this same page below all ~64
  // service cards. See docs/ui-structural-foundation.md, Student
  // Information Architecture, for why these are two destinations now.
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, name, short_description, automation_level, service_categories(name)")
    .eq("published", true)
    .order("display_order", { ascending: true });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Services" description="Request AI-executed work from NOVA's service catalog." />
        <Link href="/student/services/requests" className={buttonVariants({ variant: "outline", size: "sm" })}>
          My requests
        </Link>
      </div>

      {servicesError ? (
        <ErrorState title="Couldn't load services" description="Something went wrong. Please try again." />
      ) : !services || services.length === 0 ? (
        <EmptyState title="No services available yet" description="NOVA's service catalog will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(services as unknown as ServiceRow[]).map((service) => (
            <Card key={service.id} className="h-full">
              <CardHeader className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {service.service_categories && <Badge variant="primary">{service.service_categories.name}</Badge>}
                  <Badge variant={service.automation_level === "autonomous" ? "success" : "warning"}>
                    {AUTOMATION_LABELS[service.automation_level] ?? service.automation_level}
                  </Badge>
                </div>
                <CardTitle as="h2" className="text-body">
                  {service.name}
                </CardTitle>
                <CardDescription>{service.short_description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <RequestServiceForm serviceId={service.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
