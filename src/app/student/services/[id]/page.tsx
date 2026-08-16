import type { Metadata } from "next";
import { z } from "zod";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthenticatedUser } from "@/lib/auth";
import { customerDeliverableLabel } from "@/lib/deliverable-labels";
import { CancelRequestButton } from "../cancel-request-button";

export const metadata: Metadata = { title: "Service request — NOVA" };

const idSchema = z.string().uuid();

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
  details: string;
  deliverable_notes: string | null;
  created_at: string;
  services: { name: string; short_description: string } | null;
}

interface ArtifactRow {
  id: string;
  type: string;
  title: string;
  created_at: string;
}

// Customer-facing tracking view — deliberately does NOT show any internal
// AI workforce mechanics (agents, tasks, approvals). A customer sees
// Service Request -> status -> deliverables, matching the Phase 9
// "customers should not need to know which internal agent handles their
// request" boundary. The full operational view lives only at
// /admin/services/requests/[id].
export default async function StudentServiceRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFoundState = (
    <div className="flex flex-col gap-8">
      <PageHeader title="Service request" />
      <EmptyState title="Request not found" description="This request doesn't exist." />
    </div>
  );

  if (!idSchema.safeParse(id).success) return notFoundState;

  const auth = await getAuthenticatedUser();
  if (!auth) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Service request" />
        <ErrorState title="Your session has expired" description="Please log in again." />
      </div>
    );
  }
  const { supabase, user } = auth;

  const { data: request, error } = await supabase
    .from("service_requests")
    .select("id, status, details, deliverable_notes, created_at, services(name, short_description)")
    .eq("id", id)
    .eq("requester_id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Service request" />
        <ErrorState title="Couldn't load this request" description="Something went wrong. Please try again." />
      </div>
    );
  }

  if (!request) return notFoundState;

  const row = request as unknown as RequestRow;

  const { data: artifacts } = await supabase
    .from("ai_artifacts")
    .select("id, type, title, created_at")
    .eq("service_request_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={row.services?.name ?? "Service request"} description={`Requested ${new Date(row.created_at).toLocaleDateString()}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-small font-medium text-text">Status</span>
                <Badge variant={STATUS_VARIANTS[row.status] ?? "default"}>{row.status}</Badge>
              </div>
              <Section title="What you asked for" body={row.details} />
              {row.deliverable_notes && <Section title="Delivery notes" body={row.deliverable_notes} />}
            </CardContent>
          </Card>

          {artifacts && artifacts.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-3 p-6">
                <h3 className="text-small font-semibold text-text">Deliverables</h3>
                {/* Customer-facing: rendered purely from artifact.type through
                    customerDeliverableLabel(), never artifact.title or the raw
                    type — both are AI-Engine-authored and can contain internal
                    workflow-stage language. See src/lib/deliverable-labels.ts. */}
                <ul className="flex flex-col gap-2">
                  {(artifacts as ArtifactRow[]).map((artifact) => (
                    <li key={artifact.id} className="flex items-center justify-between gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0">
                      <span className="text-small text-text">{customerDeliverableLabel(artifact.type)}</span>
                      <span className="text-caption text-text-muted">{new Date(artifact.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {row.status === "pending" && (
            <Card>
              <CardContent className="flex flex-col gap-3 p-6">
                <p className="text-small font-medium text-text">Manage request</p>
                <CancelRequestButton requestId={row.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-small font-semibold text-text">{title}</h3>
      <p className="whitespace-pre-line text-body text-text-muted">{body}</p>
    </div>
  );
}
