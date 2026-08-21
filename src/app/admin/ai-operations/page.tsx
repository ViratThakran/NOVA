import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { Cpu, AlertCircle, CheckCircle2, Play, RefreshCw, ChevronRight, FileText } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import {
  getOperationsOverview,
  type OperationsApproval,
  type OperationsTask,
  type OperationsRun,
  type OperationsArtifact,
} from "@/lib/ai-engine/engine";

export const metadata: Metadata = { title: "AI Workforce Operations | NOVA Admin" };

const TASK_STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-800 text-slate-400 border-slate-700",
  assigned: "bg-cyan-950/80 text-cyan-300 border-cyan-700/40",
  running: "bg-indigo-950/80 text-indigo-300 border-indigo-700/40 animate-pulse",
  waiting_for_approval: "bg-amber-950/80 text-amber-300 border-amber-700/40",
  blocked: "bg-amber-950/80 text-amber-300 border-amber-700/40",
  failed: "bg-red-950/80 text-red-300 border-red-700/40",
  completed: "bg-emerald-950/80 text-emerald-300 border-emerald-700/40",
  cancelled: "bg-slate-800 text-slate-400 border-slate-700",
};

export default async function AdminAiOperationsPage() {
  const supabase = await createServerSideClient();
  const overview = await getOperationsOverview(supabase);

  const totalTasks =
    overview.runningTasks.length +
    overview.waitingForInterventionTasks.length +
    overview.failedTasks.length +
    overview.recentlyCompletedTasks.length;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            AI WORKFORCE OPERATIONS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Cross-request monitoring and orchestration of NOVA&apos;s internal AI agents.
          </p>
        </div>
        <Link
          href="/admin/services/requests"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
        >
          <FileText className="h-4 w-4" />
          Service Requests Queue
        </Link>
      </div>

      {/* KPI METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Pending Approvals"
          value={overview.pendingApprovals.length}
          icon={AlertCircle}
          color={overview.pendingApprovals.length > 0 ? "amber" : "slate"}
        />
        <KpiCard
          label="Running Tasks"
          value={overview.runningTasks.length}
          icon={Play}
          color={overview.runningTasks.length > 0 ? "indigo" : "slate"}
        />
        <KpiCard
          label="Failed Tasks"
          value={overview.failedTasks.length}
          icon={RefreshCw}
          color={overview.failedTasks.length > 0 ? "red" : "slate"}
        />
        <KpiCard
          label="Completed Tasks"
          value={overview.recentlyCompletedTasks.length}
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* SECTIONS */}
      <div className="flex flex-col gap-6">
        {/* NEEDS ATTENTION */}
        {overview.waitingForInterventionTasks.length > 0 && (
          <SectionBlock
            title="Needs Immediate Attention"
            badge="ACTION REQUIRED"
            badgeColor="amber"
          >
            <TaskTable tasks={overview.waitingForInterventionTasks} />
          </SectionBlock>
        )}

        {/* PENDING APPROVALS */}
        <SectionBlock
          title={`Pending Human Approvals (${overview.pendingApprovals.length})`}
          emptyText="No approvals waiting."
        >
          <ApprovalTable approvals={overview.pendingApprovals} />
        </SectionBlock>

        {/* RUNNING TASKS */}
        <SectionBlock
          title={`Currently Running Tasks (${overview.runningTasks.length})`}
          emptyText="No AI tasks running right now."
        >
          <TaskTable tasks={overview.runningTasks} />
        </SectionBlock>

        {/* FAILED TASKS */}
        <SectionBlock
          title={`Failed Tasks (${overview.failedTasks.length})`}
          emptyText="No failed AI tasks."
        >
          <TaskTable tasks={overview.failedTasks} />
        </SectionBlock>

        {/* RECENTLY COMPLETED */}
        <SectionBlock
          title={`Recently Completed Tasks (${overview.recentlyCompletedTasks.length})`}
          emptyText="No recently completed tasks."
        >
          <TaskTable tasks={overview.recentlyCompletedTasks} />
        </SectionBlock>

        {/* RECENT AGENT RUNS */}
        <SectionBlock
          title={`Agent Execution History (${overview.recentAgentRuns.length})`}
          emptyText="No recent agent runs."
        >
          <RunTable runs={overview.recentAgentRuns} />
        </SectionBlock>

        {/* RECENT ARTIFACTS */}
        <SectionBlock
          title={`Generated Deliverables & Artifacts (${overview.recentArtifacts.length})`}
          emptyText="No generated artifacts yet."
        >
          <ArtifactTable artifacts={overview.recentArtifacts} />
        </SectionBlock>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color = "slate",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color?: "amber" | "indigo" | "red" | "emerald" | "slate";
}) {
  const styles = {
    slate: "bg-[#0E131F] border-slate-800 text-slate-400",
    amber: "bg-amber-950/20 border-amber-800/40 text-amber-300",
    indigo: "bg-indigo-950/20 border-indigo-800/40 text-indigo-300",
    red: "bg-red-950/20 border-red-800/40 text-red-300",
    emerald: "bg-emerald-950/20 border-emerald-800/40 text-emerald-300",
  };

  return (
    <div className={`p-4 rounded-xl border flex flex-col justify-between gap-2 font-mono ${styles[color]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
        <Icon className="h-4 w-4 shrink-0 opacity-80" />
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  );
}

function SectionBlock({
  title,
  badge,
  badgeColor = "indigo",
  emptyText,
  children,
}: {
  title: string;
  badge?: string;
  badgeColor?: "amber" | "indigo";
  emptyText?: string;
  children: React.ReactNode;
}) {
  const hasChildren = React.Children.count(children) > 0 && children !== null;

  return (
    <div className="p-5 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
          <Cpu className="h-4 w-4 text-indigo-400" />
          {title}
        </h2>
        {badge && (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${
              badgeColor === "amber"
                ? "bg-amber-950/80 text-amber-300 border-amber-700/40"
                : "bg-indigo-950/80 text-indigo-300 border-indigo-700/40"
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {!hasChildren && emptyText ? (
        <p className="text-xs font-mono text-slate-500 py-1">{emptyText}</p>
      ) : (
        children
      )}
    </div>
  );
}

function TaskTable({ tasks }: { tasks: OperationsTask[] }) {
  if (tasks.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-900/40">
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-[#0B0F19] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
          <tr>
            <th className="py-2.5 px-3">Task Title</th>
            <th className="py-2.5 px-3">Assigned Agent</th>
            <th className="py-2.5 px-3">Linked Service Request</th>
            <th className="py-2.5 px-3">Status</th>
            <th className="py-2.5 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-300">
          {tasks.map((task) => {
            const style = TASK_STATUS_STYLES[task.status] ?? "bg-slate-800 text-slate-400 border-slate-700";
            return (
              <tr key={task.id} className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 font-sans font-bold text-white">
                  <div className="flex flex-col gap-0.5">
                    <span>{task.title}</span>
                    {task.error && <span className="text-[10px] font-mono text-red-400">{task.error}</span>}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-slate-400">{task.agentName ?? "Unassigned"}</td>
                <td className="py-2.5 px-3">
                  {task.serviceRequestId ? (
                    <Link
                      href={`/admin/services/requests/${task.serviceRequestId}`}
                      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                    >
                      {task.serviceName ?? "Service Request"}
                    </Link>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${style}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {task.serviceRequestId && (
                    <Link
                      href={`/admin/services/requests/${task.serviceRequestId}`}
                      className="inline-flex items-center gap-0.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Inspect <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ApprovalTable({ approvals }: { approvals: OperationsApproval[] }) {
  if (approvals.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-900/40">
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-[#0B0F19] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
          <tr>
            <th className="py-2.5 px-3">Task</th>
            <th className="py-2.5 px-3">Approval Reason</th>
            <th className="py-2.5 px-3">Agent</th>
            <th className="py-2.5 px-3">Service Request</th>
            <th className="py-2.5 px-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-300">
          {approvals.map((approval) => (
            <tr key={approval.id} className="hover:bg-slate-900/60 transition-colors">
              <td className="py-2.5 px-3 font-sans font-bold text-white">{approval.taskTitle}</td>
              <td className="py-2.5 px-3 text-amber-300 font-semibold">{approval.reason}</td>
              <td className="py-2.5 px-3 text-slate-400">{approval.agentName ?? "Unassigned"}</td>
              <td className="py-2.5 px-3">
                {approval.serviceRequestId ? (
                  <Link
                    href={`/admin/services/requests/${approval.serviceRequestId}`}
                    className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                  >
                    {approval.serviceName ?? "Service Request"}
                  </Link>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right">
                {approval.serviceRequestId && (
                  <Link
                    href={`/admin/services/requests/${approval.serviceRequestId}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-700/40 text-amber-200 text-[10px] font-bold uppercase"
                  >
                    Review Approval
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RunTable({ runs }: { runs: OperationsRun[] }) {
  if (runs.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-900/40">
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-[#0B0F19] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
          <tr>
            <th className="py-2.5 px-3">Task Title</th>
            <th className="py-2.5 px-3">Agent</th>
            <th className="py-2.5 px-3">Run Started</th>
            <th className="py-2.5 px-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-300">
          {runs.map((run) => (
            <tr key={run.id} className="hover:bg-slate-900/60 transition-colors">
              <td className="py-2.5 px-3 font-sans font-bold text-white">{run.taskTitle ?? "AI Task"}</td>
              <td className="py-2.5 px-3 text-slate-400">{run.agentName ?? "Unassigned"}</td>
              <td className="py-2.5 px-3 text-slate-500">{new Date(run.startedAt).toLocaleString()}</td>
              <td className="py-2.5 px-3">
                <span
                  className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                    run.status === "succeeded"
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40"
                      : run.status === "failed"
                      ? "bg-red-950/80 text-red-300 border-red-700/40"
                      : "bg-indigo-950/80 text-indigo-300 border-indigo-700/40"
                  }`}
                >
                  {run.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArtifactTable({ artifacts }: { artifacts: OperationsArtifact[] }) {
  if (artifacts.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-900/40">
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-[#0B0F19] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
          <tr>
            <th className="py-2.5 px-3">Deliverable / Artifact Title</th>
            <th className="py-2.5 px-3">Type</th>
            <th className="py-2.5 px-3">Agent</th>
            <th className="py-2.5 px-3">Service Request</th>
            <th className="py-2.5 px-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-300">
          {artifacts.map((art) => (
            <tr key={art.id} className="hover:bg-slate-900/60 transition-colors">
              <td className="py-2.5 px-3 font-sans font-bold text-white">{art.title}</td>
              <td className="py-2.5 px-3">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 uppercase">
                  {art.type.replace(/_/g, " ")}
                </span>
              </td>
              <td className="py-2.5 px-3 text-slate-400">{art.agentName ?? "Unassigned"}</td>
              <td className="py-2.5 px-3">
                {art.serviceRequestId ? (
                  <Link
                    href={`/admin/services/requests/${art.serviceRequestId}`}
                    className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                  >
                    {art.serviceName ?? "Service Request"}
                  </Link>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-slate-500">{new Date(art.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
