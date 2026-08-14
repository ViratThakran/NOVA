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

export const metadata: Metadata = { title: "Service requests — NOVA Admin" };

type StatusFilter = "all" | "pending" | "accepted" | "rejected" | "in_progress" | "delivered" | "completed" | "cancelled";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In progress" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "error" | "info"> = {
  pending: "warning",
  accepted: "info",
  rejected: "error",
  in_progress: "primary",
  delivered: "success",
  completed: "success",
  cancelled: "default",
};

function normalizeFilter(raw: string | string[] | undefined): StatusFilter {
  if (typeof raw !== "string") return "all";
  return (FILTERS.map((f) => f.value) as string[]).includes(raw) ? (raw as StatusFilter) : "all";
}

interface RequestRow {
  id: string;
  status: string;
  details: string;
  created_at: string;
  services: { name: string } | null;
  requester: { first_name: string | null; last_name: string | null; email: string } | null;
  companies: { name: string } | null;
}

export default async function AdminServiceRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: rawStatus } = await searchParams;
  const statusFilter = normalizeFilter(rawStatus);

  const supabase = await createServerSideClient();

  // Admin sees every request via the service_requests SELECT policy's
  // is_current_user_admin() branch.
  let query = supabase
    .from("service_requests")
    .select("id, status, details, created_at, services(name), requester:profiles(first_name, last_name, email), companies(name)")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") query = query.eq("status", statusFilter);

  const { data: requests, error } = await query;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Service requests" description="Review and manage requests for NOVA's AI-executed services." />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/services/requests" : `/admin/services/requests?status=${f.value}`}
            role="tab"
            aria-selected={statusFilter === f.value}
            className={cn(buttonVariants({ variant: statusFilter === f.value ? "primary" : "outline", size: "sm" }))}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {error ? (
        <ErrorState title="Couldn't load requests" description="Something went wrong. Please try again." />
      ) : !requests || requests.length === 0 ? (
        <EmptyState title="No requests match this filter" description="Service requests will appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {(requests as unknown as RequestRow[]).map((request) => {
            const requesterLabel = request.requester
              ? [request.requester.first_name, request.requester.last_name].filter(Boolean).join(" ") || request.requester.email
              : "Unknown requester";
            return (
              <Link key={request.id} href={`/admin/services/requests/${request.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
                    <div className="flex flex-col gap-1">
                      <CardTitle as="h2" className="text-body">
                        {request.services?.name ?? "Service"}
                      </CardTitle>
                      <CardDescription>
                        {requesterLabel}
                        {request.companies?.name ? ` · ${request.companies.name}` : ""} ·{" "}
                        {new Date(request.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={STATUS_VARIANTS[request.status] ?? "default"}>{request.status}</Badge>
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
