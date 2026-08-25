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
  Sparkles,
} from "lucide-react";
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
    color: "text-sky-600 bg-sky-50 border-sky-200",
    hoverBorder: "hover:border-sky-300",
  },
  {
    key: "companies",
    label: "Partner Companies",
    table: "companies",
    href: "/admin/companies",
    filter: {},
    icon: Building2,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    hoverBorder: "hover:border-indigo-300",
  },
  {
    key: "openInternships",
    label: "Open Internships",
    table: "internships",
    href: "/admin/internships?status=open",
    filter: { status: "open" },
    icon: Briefcase,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    hoverBorder: "hover:border-emerald-300",
  },
  {
    key: "pendingApplications",
    label: "Pending Applications",
    table: "applications",
    href: "/admin/applications?status=pending",
    filter: { status: "pending" },
    icon: FileText,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    hoverBorder: "hover:border-amber-300",
  },
  {
    key: "activeEnrollments",
    label: "Active Enrollments",
    table: "enrollments",
    href: "/admin/enrollments",
    filter: { status: "active" },
    icon: CheckCircle2,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    hoverBorder: "hover:border-purple-300",
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
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER & TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5" /> NOVA System Ops
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Operations Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time platform status, review queues, and partner catalog oversight.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/internships/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Internship
          </Link>
          <Link
            href="/admin/applications?status=pending"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-800 border border-slate-200 text-xs font-semibold shadow-xs transition-colors"
          >
            Review Queue
          </Link>
        </div>
      </div>

      {hasError ? (
        <ErrorState title="Couldn't load dashboard KPIs" description="Something went wrong querying operational statistics." />
      ) : (
        /* KPI GRID WITH GLASSMORPHISM */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {KPIS.map((kpi, i) => {
            const Icon = kpi.icon;
            const count = kpiResults[i].count ?? 0;
            return (
              <Link key={kpi.key} href={kpi.href} className="group">
                <div
                  className={`flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:bg-white group-hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] ${kpi.hoverBorder} group-hover:-translate-y-0.5 transition-all duration-300 h-full`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {kpi.label}
                    </span>
                    <div className={`p-2 rounded-xl border ${kpi.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {count}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* OPERATIONS STAGE GRID WITH GLASSMORPHISM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (Col 7): PENDING APPLICATION QUEUE */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Pending Review Queue ({queueRows.length})
                </h2>
              </div>
              <Link
                href="/admin/applications?status=pending"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
              >
                <span>View Full Queue</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {queueRows.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50/80 border border-slate-100 text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 opacity-60" />
                <p className="text-xs font-bold text-slate-800">All pending applications reviewed</p>
                <p className="text-[11px] text-slate-500">No applications currently awaiting decision.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-sky-300 hover:bg-white transition-all duration-150"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">{name}</span>
                        <span className="text-[11px] text-slate-500 truncate">
                          {app.internships?.title || "Internship"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] text-amber-700 font-bold uppercase">
                          Pending
                        </span>
                        <span className="text-[11px] text-slate-400">{date}</span>
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-600 text-slate-600 hover:text-white transition-colors"
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
        </div>

        {/* RIGHT (Col 5): RECENT OPPORTUNITIES & QUICK ACTIONS */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Recent Opportunities */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recent Opportunities
                </h2>
              </div>
              <Link
                href="/admin/internships"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
              >
                <span>Catalog</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              {internshipRows.map((internship) => {
                const statusColor =
                  internship.status === "open"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : internship.status === "draft"
                    ? "bg-slate-50 text-slate-600 border-slate-200"
                    : "bg-red-50 text-red-700 border-red-200";

                return (
                  <Link
                    key={internship.id}
                    href={`/admin/internships/${internship.id}`}
                    className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-sky-300 hover:bg-white transition-all duration-150"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                        {internship.title}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate">
                        {internship.companies?.name || "Platform Direct"}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase ${statusColor}`}>
                      {internship.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Quick Operational Actions
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/admin/internships/new"
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-100 hover:border-sky-200 text-xs font-semibold text-slate-800 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-sky-600" />
                <span>Add Internship</span>
              </Link>
              <Link
                href="/admin/programs"
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-100 hover:border-sky-200 text-xs font-semibold text-slate-800 transition-colors"
              >
                <Layers className="h-3.5 w-3.5 text-sky-600" />
                <span>Programs</span>
              </Link>
              <Link
                href="/admin/ai-operations"
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-100 hover:border-sky-200 text-xs font-semibold text-slate-800 transition-colors"
              >
                <Cpu className="h-3.5 w-3.5 text-sky-600" />
                <span>AI Queue</span>
              </Link>
              <Link
                href="/admin/audit-logs"
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-100 hover:border-sky-200 text-xs font-semibold text-slate-800 transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                <span>Audit Logs</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
