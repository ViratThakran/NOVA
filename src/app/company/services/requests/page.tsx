import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireCompanyAccess } from "@/lib/auth";
import { CancelRequestButton } from "../cancel-request-button";

export const metadata: Metadata = { title: "My Requests — NOVA Company" };

// See src/app/student/services/requests/page.tsx for the same customer-
// facing status vocabulary rationale — no AI workflow internals here.
const STATUS_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "error" | "info"> = {
  pending: "warning",
  accepted: "info",
  rejected: "error",
  in_progress: "primary",
  delivered: "success",
  completed: "success",
  cancelled: "default",
};

interface RequestRow {
  id: string;
  status: string;
  deliverable_notes: string | null;
  created_at: string;
  services: { name: string } | null;
}

export default async function CompanyServiceRequestsPage() {
  const { supabase, companyId, companyRole } = await requireCompanyAccess();

  const { data: requests, error } = await supabase
    .from("service_requests")
    .select("id, status, deliverable_notes, created_at, services(name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="My Requests" description="Track the services your company has requested from NOVA." />
        <Link href="/company/services" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Browse services
        </Link>
      </div>

      {error ? (
        <ErrorState title="Couldn't load requests" description="Something went wrong. Please try again." />
      ) : !requests || requests.length === 0 ? (
        <EmptyState
          title="No requests yet"
          description="Services your company requests will appear here."
          action={
            <Link href="/company/services" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Browse services
            </Link>
          }
        />
      ) : (
        // MOTION OPPORTUNITY: staggered row entrance on data load — see
        // docs/ui-structural-foundation.md, Motion Preparation.
        <div className="flex flex-col gap-3">
          {(requests as unknown as RequestRow[]).map((request) => (
            <Card key={request.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="flex flex-col gap-1">
                  <Link href={`/company/services/${request.id}`} className="text-small font-medium text-text hover:text-primary">
                    {request.services?.name ?? "Service"}
                  </Link>
                  <span className="text-caption text-text-muted">Requested {new Date(request.created_at).toLocaleDateString()}</span>
                  {request.deliverable_notes && (
                    <span className="text-caption text-text-muted">Delivery notes: {request.deliverable_notes}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANTS[request.status] ?? "default"}>{request.status}</Badge>
                  {request.status === "pending" && (companyRole === "owner" || companyRole === "admin") && (
                    <CancelRequestButton requestId={request.id} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
