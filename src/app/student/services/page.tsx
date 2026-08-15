import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthenticatedUser } from "@/lib/auth";
import { RequestServiceForm } from "./request-service-form";
import { CancelRequestButton } from "./cancel-request-button";

export const metadata: Metadata = { title: "Services — NOVA" };

const AUTOMATION_LABELS: Record<string, string> = {
  autonomous: "AI-executed",
  approval_required: "AI-executed, approval required",
};

const STATUS_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "error" | "info"> = {
  pending: "warning",
  accepted: "info",
  rejected: "error",
  in_progress: "primary",
  delivered: "success",
  completed: "success",
  cancelled: "default",
};

interface ServiceRow {
  id: string;
  name: string;
  short_description: string;
  automation_level: string;
  service_categories: { name: string } | null;
}

interface RequestRow {
  id: string;
  status: string;
  details: string;
  deliverable_notes: string | null;
  created_at: string;
  services: { name: string } | null;
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
  const { supabase, user } = auth;

  const [{ data: services, error: servicesError }, { data: requests, error: requestsError }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, short_description, automation_level, service_categories(name)")
      .eq("published", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("service_requests")
      .select("id, status, details, deliverable_notes, created_at, services(name)")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Services" description="Request AI-executed work from NOVA's service catalog." />

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

      <div className="flex flex-col gap-4">
        <h2 className="text-h3 text-text">My requests</h2>
        {requestsError ? (
          <ErrorState title="Couldn't load your requests" description="Something went wrong. Please try again." />
        ) : !requests || requests.length === 0 ? (
          <EmptyState title="No requests yet" description="Services you request will appear here." />
        ) : (
          <div className="flex flex-col gap-3">
            {(requests as unknown as RequestRow[]).map((request) => (
              <Card key={request.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex flex-col gap-1">
                    <Link href={`/student/services/${request.id}`} className="text-small font-medium text-text hover:text-primary">
                      {request.services?.name ?? "Service"}
                    </Link>
                    <span className="text-caption text-text-muted">
                      Requested {new Date(request.created_at).toLocaleDateString()}
                    </span>
                    {request.deliverable_notes && (
                      <span className="text-caption text-text-muted">Delivery notes: {request.deliverable_notes}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANTS[request.status] ?? "default"}>{request.status}</Badge>
                    {request.status === "pending" && <CancelRequestButton requestId={request.id} />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
