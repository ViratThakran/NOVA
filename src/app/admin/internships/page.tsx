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
    <div className="flex flex-col gap-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            INTERNSHIP OPPORTUNITIES
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Manage residency listings, publishing statuses, and application pipelines.
          </p>
        </div>

        <Link
          href="/admin/internships/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Internship
        </Link>
      </div>

      {/* TOOLBAR: SEARCH & STATUS FILTERS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0E131F] p-4 rounded-xl border border-slate-800">
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
                className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
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
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search title or company..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </form>
      </div>

      {/* CONTENT STAGE */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center flex flex-col items-center gap-2">
          <p className="text-sm font-semibold text-red-300">Couldn&apos;t load internships</p>
          <p className="text-xs text-red-400/80">Something went wrong querying the database.</p>
        </div>
      ) : internships.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <Briefcase className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No internships match this view</p>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchQuery
              ? `No results for query "${searchQuery}".`
              : "Internships you create will appear here."}
          </p>
          <Link
            href="/admin/internships/new"
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Internship
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Opportunity Title</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Applications</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
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
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40"
                    : internship.status === "draft"
                    ? "bg-slate-800 text-slate-400 border-slate-700"
                    : internship.status === "closed"
                    ? "bg-amber-950/80 text-amber-300 border-amber-700/40"
                    : "bg-red-950/80 text-red-300 border-red-700/40";

                return (
                  <tr key={internship.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-semibold text-white">
                      <Link
                        href={`/admin/internships/${internship.id}`}
                        className="hover:text-indigo-300 transition-colors"
                      >
                        {internship.title}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        {internship.companies?.name || "Platform Direct"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${statusStyle}`}>
                        {label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/admin/applications`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 font-bold"
                      >
                        <FileText className="h-3 w-3" />
                        {appCount}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {date}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/internships/${internship.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
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
      )}
    </div>
  );
}
