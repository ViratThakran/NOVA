import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerSideClient } from "@/lib/supabase";
import { RequestActions } from "./request-actions";
import { PlanButton, RunTaskButton, RetryTaskButton, ApprovalDecisionButtons } from "./ai-actions";

export const metadata: Metadata = { title: "Service request details — NOVA Admin" };

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
  updated_at: string;
  services: { name: string; automation_level: string } | null;
  requester: { first_name: string | null; last_name: string | null; email: string } | null;
  companies: { name: string } | null;
}

interface AiTaskRow {
  id: string;
  title: string;
  status: string;
  retry_count: number;
  max_retries: number;
  agent_definitions: { name: string; slug: string } | null;
  ai_approvals: { id: string; status: string; reason: string }[];
}

interface AiArtifactRow {
  id: string;
  type: string;
  title: string;
  created_at: string;
}

const TASK_STATUS_VARIANTS: Record<string, "default" | "primary" | "success" | "warning" | "error" | "info"> = {
  pending: "default",
  assigned: "info",
  running: "primary",
  waiting_for_approval: "warning",
  blocked: "warning",
  failed: "error",
  completed: "success",
  cancelled: "default",
};

const PLANNABLE_REQUEST_STATUSES = ["accepted", "in_progress"];

export default async function AdminServiceRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFoundState = (
    <div className="flex flex-col gap-8">
      <PageHeader title="Service request" />
      <EmptyState title="Request not found" description="This request doesn't exist." />
    </div>
  );

  if (!idSchema.safeParse(id).success) return notFoundState;

  const supabase = await createServerSideClient();

  const { data: request, error } = await supabase
    .from("service_requests")
    .select(
      "id, status, details, deliverable_notes, created_at, updated_at, services(name, automation_level), requester:profiles(first_name, last_name, email), companies(name)"
    )
    .eq("id", id)
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

  const record = request as unknown as RequestRow;
  const requesterLabel = record.requester
    ? [record.requester.first_name, record.requester.last_name].filter(Boolean).join(" ") || record.requester.email
    : "Unknown requester";

  // AI orchestration (Phase 8D) — read-only listing plus the two entry
  // points (plan / run research) and approval decisions. ai_tasks RLS
  // already scopes this to tasks belonging to this same service_request.
  const { data: aiTasks } = await supabase
    .from("ai_tasks")
    .select("id, title, status, retry_count, max_retries, agent_definitions(name, slug), ai_approvals(id, status, reason)")
    .eq("service_request_id", id)
    .order("created_at", { ascending: true });
  const tasks = (aiTasks ?? []) as unknown as AiTaskRow[];
  const hasPlan = tasks.length > 0;

  const { data: aiArtifacts } = await supabase
    .from("ai_artifacts")
    .select("id, type, title, created_at")
    .eq("service_request_id", id)
    .order("created_at", { ascending: true });
  const artifacts = (aiArtifacts ?? []) as unknown as AiArtifactRow[];

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/services/requests"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Service Requests Queue
      </Link>

      <PageHeader
        title={record.services?.name ?? "Service request"}
        description={`Requested ${new Date(record.created_at).toLocaleDateString()} · Last updated ${new Date(record.updated_at).toLocaleDateString()}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-small font-medium text-text">Status</span>
                <Badge variant={STATUS_VARIANTS[record.status] ?? "default"}>{record.status}</Badge>
              </div>

              <Section label="Requested by" value={requesterLabel} />
              {record.companies?.name && <Section label="Company" value={record.companies.name} />}
              {record.services && <Section label="Automation level" value={record.services.automation_level} />}
              <Section label="Details" value={record.details} />
              {record.deliverable_notes && <Section label="Delivery notes" value={record.deliverable_notes} />}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h3 className="text-small font-semibold text-text">Manage request</h3>
              <RequestActions requestId={record.id} status={record.status} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h3 className="text-small font-semibold text-text">AI workforce</h3>

              {!hasPlan && PLANNABLE_REQUEST_STATUSES.includes(record.status) && <PlanButton requestId={record.id} />}
              {!hasPlan && !PLANNABLE_REQUEST_STATUSES.includes(record.status) && (
                <p className="text-caption text-text-muted">Accept this request before planning AI work.</p>
              )}

              {tasks.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {tasks.map((task) => {
                    const pendingApproval = task.ai_approvals.find((a) => a.status === "pending");
                    return (
                      <li key={task.id} className="flex flex-col gap-1.5 border-t border-border pt-3 first:border-t-0 first:pt-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-small text-text">{task.title}</span>
                          <Badge variant={TASK_STATUS_VARIANTS[task.status] ?? "default"}>{task.status}</Badge>
                        </div>
                        <span className="text-caption text-text-muted">{task.agent_definitions?.name ?? "Unassigned"}</span>
                        {(task.status === "assigned" || task.status === "running") && <RunTaskButton taskId={task.id} />}
                        {task.status === "failed" && task.retry_count < task.max_retries && <RetryTaskButton taskId={task.id} />}
                        {task.status === "failed" && task.retry_count >= task.max_retries && (
                          <p className="text-caption text-text-muted">Retry limit reached ({task.retry_count}/{task.max_retries}).</p>
                        )}
                        {pendingApproval && (
                          <div className="flex flex-col gap-1.5">
                            <p className="text-caption text-text-muted">Approval needed: {pendingApproval.reason}</p>
                            <ApprovalDecisionButtons approvalId={pendingApproval.id} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {artifacts.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-3 p-6">
                <h3 className="text-small font-semibold text-text">Deliverables</h3>
                <ul className="flex flex-col gap-2">
                  {artifacts.map((artifact) => (
                    <li key={artifact.id} className="flex items-center justify-between gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0">
                      <span className="text-small text-text">{artifact.title}</span>
                      <Badge variant="default">{artifact.type.replace(/_/g, " ")}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-small font-semibold text-text">{label}</h3>
      <p className="whitespace-pre-line text-body text-text-muted">{value}</p>
    </div>
  );
}
