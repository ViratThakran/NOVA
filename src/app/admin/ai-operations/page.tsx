import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { Cpu, AlertCircle, CheckCircle2, Play, RefreshCw, ChevronRight, FileText, Zap } from "lucide-react";
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
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  assigned: "bg-sky-50 text-sky-700 border-sky-200",
  running: "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse",
  waiting_for_approval: "bg-amber-50 text-amber-700 border-amber-200",
  blocked: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

export default async function AdminAiOperationsPage() {
  const supabase = await createServerSideClient();
  const overview = await getOperationsOverview(supabase);

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Zap className="h-6 w-6 text-sky-600" />
            AI Workforce Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cross-request monitoring, autonomous task scheduling, and human-in-the-loop approvals.
          </p>
        </div>
        <Link
          href="/admin/services/requests"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <FileText className="h-4 w-4" />
          Service Requests Queue
        </Link>
      </div>

      {/* KPI METRIC STRIP WITH GLASSMORPHISM */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
    slate: "text-slate-600 bg-slate-50 border-slate-200",
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-200",
    red: "text-red-600 bg-red-50 border-red-200",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <div className={`p-2 rounded-xl border ${styles[color]}`}>
          <Icon className="h-4 w-4 shrink-0" />
        </div>
      </div>
      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
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
    <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="h-4 w-4 text-sky-600" />
          {title}
        </h2>
        {badge && (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
              badgeColor === "amber"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {!hasChildren && emptyText ? (
        <p className="text-xs text-slate-500 py-1">{emptyText}</p>
      ) : (
        children
      )}
    </div>
  );
}

function TaskTable({ tasks }: { tasks: OperationsTask[] }) {
  if (tasks.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-100/70 text-slate-400 font-medium uppercase tracking-wider text-[10px] border-b border-slate-100">
          <tr>
            <th className="py-3 px-4">Task Title</th>
            <th className="py-3 px-4">Assigned Agent</th>
            <th className="py-3 px-4">Linked Service Request</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {tasks.map((task) => {
            const style = TASK_STATUS_STYLES[task.status] ?? "bg-slate-100 text-slate-600 border-slate-200";
            return (
              <tr key={task.id} className="hover:bg-sky-50/30 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">
                  <div className="flex flex-col gap-0.5">
                    <span>{task.title}</span>
                    {task.error && <span className="text-[10px] text-red-600">{task.error}</span>}
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-600">{task.agentName ?? "Unassigned"}</td>
                <td className="py-3 px-4">
                  {task.serviceRequestId ? (
                    <Link
                      href={`/admin/services/requests/${task.serviceRequestId}`}
                      className="text-sky-600 hover:text-sky-700 underline underline-offset-2 font-medium"
                    >
                      {task.serviceName ?? "Service Request"}
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${style}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {task.serviceRequestId && (
                    <Link
                      href={`/admin/services/requests/${task.serviceRequestId}`}
                      className="inline-flex items-center gap-0.5 text-xs text-sky-600 hover:text-sky-700 font-semibold"
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
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-100/70 text-slate-400 font-medium uppercase tracking-wider text-[10px] border-b border-slate-100">
          <tr>
            <th className="py-3 px-4">Task</th>
            <th className="py-3 px-4">Approval Reason</th>
            <th className="py-3 px-4">Agent</th>
            <th className="py-3 px-4">Service Request</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {approvals.map((approval) => (
            <tr key={approval.id} className="hover:bg-amber-50/30 transition-colors">
              <td className="py-3 px-4 font-bold text-slate-900">{approval.taskTitle}</td>
              <td className="py-3 px-4 text-amber-700 font-semibold">{approval.reason}</td>
              <td className="py-3 px-4 text-slate-600">{approval.agentName ?? "Unassigned"}</td>
              <td className="py-3 px-4">
                {approval.serviceRequestId ? (
                  <Link
                    href={`/admin/services/requests/${approval.serviceRequestId}`}
                    className="text-sky-600 hover:text-sky-700 underline underline-offset-2 font-medium"
                  >
                    {approval.serviceName ?? "Service Request"}
                  </Link>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                {approval.serviceRequestId && (
                  <Link
                    href={`/admin/services/requests/${approval.serviceRequestId}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold uppercase tracking-wider"
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
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-100/70 text-slate-400 font-medium uppercase tracking-wider text-[10px] border-b border-slate-100">
          <tr>
            <th className="py-3 px-4">Task Title</th>
            <th className="py-3 px-4">Agent</th>
            <th className="py-3 px-4">Run Started</th>
            <th className="py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {runs.map((run) => (
            <tr key={run.id} className="hover:bg-sky-50/30 transition-colors">
              <td className="py-3 px-4 font-bold text-slate-900">{run.taskTitle ?? "AI Task"}</td>
              <td className="py-3 px-4 text-slate-600">{run.agentName ?? "Unassigned"}</td>
              <td className="py-3 px-4 text-slate-500 text-[11px]">{new Date(run.startedAt).toLocaleString()}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${
                    run.status === "succeeded"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : run.status === "failed"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
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
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-100/70 text-slate-400 font-medium uppercase tracking-wider text-[10px] border-b border-slate-100">
          <tr>
            <th className="py-3 px-4">Deliverable / Artifact Title</th>
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4">Agent</th>
            <th className="py-3 px-4">Service Request</th>
            <th className="py-3 px-4">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {artifacts.map((art) => (
            <tr key={art.id} className="hover:bg-sky-50/30 transition-colors">
              <td className="py-3 px-4 font-bold text-slate-900">{art.title}</td>
              <td className="py-3 px-4">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-semibold uppercase">
                  {art.type.replace(/_/g, " ")}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-600">{art.agentName ?? "Unassigned"}</td>
              <td className="py-3 px-4">
                {art.serviceRequestId ? (
                  <Link
                    href={`/admin/services/requests/${art.serviceRequestId}`}
                    className="text-sky-600 hover:text-sky-700 underline underline-offset-2 font-medium"
                  >
                    {art.serviceName ?? "Service Request"}
                  </Link>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="py-3 px-4 text-slate-500 text-[11px]">{new Date(art.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
