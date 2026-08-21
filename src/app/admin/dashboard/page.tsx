import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  Clock,
  ChevronRight,
  Cpu,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Operations Console — NOVA Admin" };

const KPIS = [
  {
    key: "students",
    label: "Registered Students",
    table: "user_roles",
    href: "/admin/students",
    filter: { role: "student" },
    icon: Users,
    color: "text-cyan-400 bg-cyan-950/40 border-cyan-800/40",
  },
  {
    key: "companies",
    label: "Partner Companies",
    table: "companies",
    href: "/admin/companies",
    filter: {},
    icon: Building2,
    color: "text-indigo-400 bg-indigo-950/40 border-indigo-800/40",
  },
  {
    key: "openInternships",
    label: "Open Internships",
    table: "internships",
    href: "/admin/internships?status=open",
    filter: { status: "open" },
    icon: Briefcase,
    color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40",
  },
  {
    key: "pendingApplications",
    label: "Pending Applications",
    table: "applications",
    href: "/admin/applications?status=pending",
    filter: { status: "pending" },
    icon: FileText,
    color: "text-amber-400 bg-amber-950/40 border-amber-800/40",
  },
  {
    key: "activeEnrollments",
    label: "Active Enrollments",
    table: "enrollments",
    href: "/admin/enrollments",
    filter: { status: "active" },
    icon: CheckCircle2,
    color: "text-violet-400 bg-violet-950/40 border-violet-800/40",
  },
] as const;

interface ApplicationQueueRow {
  id: string;
  status: string;
  created_at: string;
  profiles: { first_name: string | null; last_name: string | null; email: string } | null;
  internships: { title: string } | null;
}

interface RecentInternshipRow {
  id: string;
  title: string;
  status: string;
  created_at: string;
  companies: { name: string } | null;
}

export default async function AdminDashboardPage() {
  const supabase = await createServerSideClient();

  // 1. KPI Counts
  const kpiResults = await Promise.all(
    KPIS.map((kpi) => {
      let query = supabase.from(kpi.table).select("*", { count: "exact", head: true });
      for (const [column, value] of Object.entries(kpi.filter)) {
        query = query.eq(column, value);
      }
      return query;
    })
  );

  // 2. Pending Application Queue
  const { data: pendingApps } = await supabase
    .from("applications")
    .select("id, status, created_at, profiles(first_name, last_name, email), internships(title)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  // 3. Recent Opportunities
  const { data: recentInternships } = await supabase
    .from("internships")
    .select("id, title, status, created_at, companies(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  const hasError = kpiResults.some((r) => r.error);

  const queueRows = (pendingApps as unknown as ApplicationQueueRow[] | null) ?? [];
  const internshipRows = (recentInternships as unknown as RecentInternshipRow[] | null) ?? [];

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER & TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono uppercase">
            OPERATIONS CONSOLE
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time platform status, active review queues, and catalog oversight.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/internships"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Internship
          </Link>
          <Link
            href="/admin/applications?status=pending"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Review Queue
          </Link>
        </div>
      </div>

      {hasError ? (
        <ErrorState title="Couldn't load dashboard KPIs" description="Something went wrong querying operational statistics." />
      ) : (
        /* KPI GRID */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {KPIS.map((kpi, i) => {
            const Icon = kpi.icon;
            const count = kpiResults[i].count ?? 0;
            return (
              <Link key={kpi.key} href={kpi.href} className="group">
                <div className="flex flex-col justify-between p-5 rounded-xl bg-[#0E131F] border border-slate-800 group-hover:border-slate-700 group-hover:bg-[#111827] transition-all h-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {kpi.label}
                    </span>
                    <div className={`p-1.5 rounded-md border ${kpi.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                      {count}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* OPERATIONS STAGE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT (Col 7): PENDING APPLICATION QUEUE */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Pending Review Queue ({queueRows.length})
              </h2>
            </div>
            <Link
              href="/admin/applications?status=pending"
              className="text-xs font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
            >
              View All Queue →
            </Link>
          </div>

          {queueRows.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 opacity-60" />
              <p className="text-xs font-mono text-slate-300">All pending applications reviewed</p>
              <p className="text-[11px] text-slate-500">No applications currently awaiting decision.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {queueRows.map((app) => {
                const name =
                  [app.profiles?.first_name, app.profiles?.last_name].filter(Boolean).join(" ") ||
                  app.profiles?.email ||
                  "Unknown Student";
                const date = new Date(app.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0E131F] border border-slate-800/90 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold text-white truncate">{name}</span>
                      <span className="text-[11px] text-slate-400 font-mono truncate">
                        {app.internships?.title || "Internship"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-700/40 font-mono text-[10px] text-amber-300 font-bold uppercase">
                        Pending
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{date}</span>
                      <Link
                        href="/admin/applications"
                        className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                        title="Review application"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT (Col 5): RECENT OPPORTUNITIES & QUICK ACTIONS */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Recent Opportunities */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Recent Opportunities
                </h2>
              </div>
              <Link
                href="/admin/internships"
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
              >
                Catalog →
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              {internshipRows.map((internship) => {
                const statusColor =
                  internship.status === "open"
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/40"
                    : internship.status === "draft"
                    ? "bg-slate-800 text-slate-400 border-slate-700"
                    : "bg-red-950/60 text-red-300 border-red-700/40";

                return (
                  <Link
                    key={internship.id}
                    href={`/admin/internships/${internship.id}`}
                    className="group flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0E131F] border border-slate-800/90 hover:border-indigo-500/40 transition-all"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                        {internship.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono truncate">
                        {internship.companies?.name || "Platform Direct"}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded border font-mono text-[10px] font-bold uppercase ${statusColor}`}>
                      {internship.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="p-5 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em]">
              QUICK OPERATIONAL ACTIONS
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/internships"
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-indigo-400" />
                <span>Add Internship</span>
              </Link>
              <Link
                href="/admin/programs"
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
              >
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>Programs</span>
              </Link>
              <Link
                href="/admin/ai-operations"
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
              >
                <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                <span>AI Queue</span>
              </Link>
              <Link
                href="/admin/audit-logs"
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                <span>Audit Logs</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
