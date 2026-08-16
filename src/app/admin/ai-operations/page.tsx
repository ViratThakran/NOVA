import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerSideClient } from "@/lib/supabase";
import { getOperationsOverview, type OperationsApproval, type OperationsTask, type OperationsRun, type OperationsArtifact } from "@/lib/ai-engine/engine";

export const metadata: Metadata = { title: "AI Operations — NOVA Admin" };

// Internal-only cross-request visibility into the AI workforce — who's
// running what, what failed, what's waiting on a human. This page never
// queries ai_tasks/agent_runs/ai_approvals/ai_artifacts directly; all of
// that lives behind getOperationsOverview() in the AI Engine facade, the
// same UI -> Engine -> DB boundary every other AI-aware surface uses. The
// admin-only gate is the parent layout's requireRole("admin") plus the
// underlying RLS "OR is_current_user_admin()" branch on every one of
// those tables — both already exist, nothing new is loosened here.

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

export default async function AdminAiOperationsPage() {
  const supabase = await createServerSideClient();
  const overview = await getOperationsOverview(supabase);

  const nothingToShow =
    overview.waitingForInterventionTasks.length === 0 &&
    overview.pendingApprovals.length === 0 &&
    overview.runningTasks.length === 0 &&
    overview.failedTasks.length === 0 &&
    overview.recentlyCompletedTasks.length === 0 &&
    overview.recentAgentRuns.length === 0 &&
    overview.recentArtifacts.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="AI Operations" description="Cross-request visibility into NOVA's internal AI workforce." />

      {nothingToShow ? (
        <EmptyState title="No AI activity yet" description="Task, approval, and artifact activity across service requests will appear here." />
      ) : (
        <>
          {overview.waitingForInterventionTasks.length > 0 && (
            <Section title="Needs your attention">
              <TaskList tasks={overview.waitingForInterventionTasks} />
            </Section>
          )}

          <Section title="Pending approvals" count={overview.pendingApprovals.length} empty="No approvals waiting.">
            <ApprovalList approvals={overview.pendingApprovals} />
          </Section>

          <Section title="Running tasks" count={overview.runningTasks.length} empty="Nothing is running right now.">
            <TaskList tasks={overview.runningTasks} />
          </Section>

          <Section title="Failed tasks" count={overview.failedTasks.length} empty="No failed tasks.">
            <TaskList tasks={overview.failedTasks} />
          </Section>

          <Section title="Recently completed" count={overview.recentlyCompletedTasks.length} empty="Nothing completed yet.">
            <TaskList tasks={overview.recentlyCompletedTasks} />
          </Section>

          <Section title="Recent agent runs" count={overview.recentAgentRuns.length} empty="No agent runs yet.">
            <RunList runs={overview.recentAgentRuns} />
          </Section>

          <Section title="Recent artifacts" count={overview.recentArtifacts.length} empty="No artifacts generated yet.">
            <ArtifactList artifacts={overview.recentArtifacts} />
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, count, empty, children }: { title: string; count?: number; empty?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-h3 text-text">{title}</h2>
      {count === 0 ? <p className="text-caption text-text-muted">{empty}</p> : children}
    </div>
  );
}

function RequestLink({ serviceRequestId, serviceName }: { serviceRequestId: string | null; serviceName: string | null }) {
  if (!serviceRequestId) return <span className="text-caption text-text-muted">No linked request</span>;
  return (
    <Link href={`/admin/services/requests/${serviceRequestId}`} className="text-caption text-primary hover:underline">
      {serviceName ?? "Service request"}
    </Link>
  );
}

function TaskList({ tasks }: { tasks: OperationsTask[] }) {
  if (tasks.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-small font-medium text-text">{task.title}</span>
              <span className="text-caption text-text-muted">
                {task.agentName ?? "Unassigned"} · <RequestLink serviceRequestId={task.serviceRequestId} serviceName={task.serviceName} />
              </span>
              {task.error && <span className="text-caption text-error">{task.error}</span>}
            </div>
            <div className="flex items-center gap-2">
              {task.status === "failed" && (
                <span className="text-caption text-text-muted">
                  {task.retryCount}/{task.maxRetries} retries
                </span>
              )}
              <Badge variant={TASK_STATUS_VARIANTS[task.status] ?? "default"}>{task.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ApprovalList({ approvals }: { approvals: OperationsApproval[] }) {
  if (approvals.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {approvals.map((approval) => (
        <Card key={approval.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-small font-medium text-text">{approval.taskTitle}</span>
              <span className="text-caption text-text-muted">{approval.reason}</span>
              <span className="text-caption text-text-muted">
                {approval.agentName ?? "Unassigned"} · <RequestLink serviceRequestId={approval.serviceRequestId} serviceName={approval.serviceName} />
              </span>
            </div>
            <Badge variant="warning">pending</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RunList({ runs }: { runs: OperationsRun[] }) {
  if (runs.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {runs.map((run) => (
        <Card key={run.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-small font-medium text-text">{run.taskTitle ?? "AI task"}</span>
              <span className="text-caption text-text-muted">
                {run.agentName ?? "Unassigned"} · {new Date(run.startedAt).toLocaleString()}
              </span>
              {run.summary && <span className="text-caption text-text-muted">{run.summary}</span>}
            </div>
            <Badge variant={run.status === "succeeded" ? "success" : run.status === "failed" ? "error" : "primary"}>{run.status}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ArtifactList({ artifacts }: { artifacts: OperationsArtifact[] }) {
  if (artifacts.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {artifacts.map((artifact) => (
        <Card key={artifact.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-small font-medium text-text">{artifact.title}</span>
              <span className="text-caption text-text-muted">
                {artifact.agentName ?? "Unassigned"} · <RequestLink serviceRequestId={artifact.serviceRequestId} serviceName={artifact.serviceName} /> ·{" "}
                {new Date(artifact.createdAt).toLocaleDateString()}
              </span>
            </div>
            <Badge variant="default">{artifact.type.replace(/_/g, " ")}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
