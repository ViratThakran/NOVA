import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Briefcase, ChevronRight, FileText, Building2, Calendar } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { getInternshipStatusMeta, type InternshipStatus } from "@/lib/internship-status";

export const metadata: Metadata = { title: "Internship Opportunities | NOVA Admin" };

interface AdminInternshipRow {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  companies: { name: string } | null;
  applications: { count: number }[];
}

type StatusFilter = "all" | InternshipStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

function normalizeStatusFilter(raw: string | string[] | undefined): StatusFilter {
  if (typeof raw !== "string") return "all";
  return (["all", "draft", "open", "closed", "archived"] as const).includes(raw as StatusFilter)
    ? (raw as StatusFilter)
    : "all";
}

export default async function AdminInternshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: rawStatus, q: rawQuery } = await searchParams;
  const statusFilter = normalizeStatusFilter(rawStatus);
  const searchQuery = rawQuery ? rawQuery.trim().toLowerCase() : "";

  const supabase = await createServerSideClient();

  let query = supabase
    .from("internships")
    .select("id, title, description, status, created_at, companies(name), applications(count)")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: rawInternships, error } = await query;
  let internships = (rawInternships as unknown as AdminInternshipRow[] | null) ?? [];

  if (searchQuery && internships.length > 0) {
    internships = internships.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery) ||
        (item.companies?.name && item.companies.name.toLowerCase().includes(searchQuery))
    );
  }

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-sky-600" />
            Internship Opportunities
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage residency listings, publishing statuses, and application pipelines.
          </p>
        </div>

        <Link
          href="/admin/internships/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Internship
        </Link>
      </div>

      {/* TOOLBAR: SEARCH & STATUS FILTERS WITH GLASSMORPHISM */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((filter) => {
            const isSelected = statusFilter === filter.value;
            const href =
              filter.value === "all"
                ? "/admin/internships"
                : `/admin/internships?status=${filter.value}`;

            return (
              <Link
                key={filter.value}
                href={href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-[#0F172A] text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        {/* Search Bar */}
        <form method="GET" action="/admin/internships" className="relative sm:w-64">
          {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search title or company..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* CONTENT STAGE WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center flex flex-col items-center gap-2 shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load internships</p>
          <p className="text-xs text-red-500">Something went wrong querying the database.</p>
        </div>
      ) : internships.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Briefcase className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No internships match this view</p>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchQuery
              ? `No results for query "${searchQuery}".`
              : "Internships you create will appear here."}
          </p>
          <Link
            href="/admin/internships/new"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Internship
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Opportunity Title</th>
                  <th className="py-4 px-5">Company</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-center">Applications</th>
                  <th className="py-4 px-5">Created Date</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {internships.map((internship) => {
                  const { label } = getInternshipStatusMeta(internship.status);
                  const appCount = internship.applications?.[0]?.count ?? 0;
                  const date = new Date(internship.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  const statusStyle =
                    internship.status === "open"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : internship.status === "draft"
                      ? "bg-slate-50 text-slate-600 border-slate-200"
                      : internship.status === "closed"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-red-50 text-red-700 border-red-200";

                  return (
                    <tr key={internship.id} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-900 text-xs sm:text-sm">
                        <Link
                          href={`/admin/internships/${internship.id}`}
                          className="hover:text-sky-600 transition-colors"
                        >
                          {internship.title}
                        </Link>
                      </td>

                      <td className="py-4 px-5">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-sky-600" />
                          {internship.companies?.name || "Platform Direct"}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${statusStyle}`}>
                          {label}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <Link
                          href="/admin/applications"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition-colors"
                        >
                          <FileText className="h-3 w-3" />
                          {appCount}
                        </Link>
                      </td>

                      <td className="py-4 px-5 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {date}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/admin/internships/${internship.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 uppercase tracking-wider"
                        >
                          Edit / Manage
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
