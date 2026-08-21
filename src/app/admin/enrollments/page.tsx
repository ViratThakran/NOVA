import type { Metadata } from "next";
import Link from "next/link";
import { Search, CheckCircle2, Building2, Calendar, User, Info, ArrowUpRight } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { getEnrollmentStatusMeta } from "@/lib/enrollment-view-state";

export const metadata: Metadata = { title: "Active Enrollments & Residencies | NOVA Admin" };

interface AdminEnrollmentRow {
  id: string;
  status: string;
  created_at: string;
  internship: { id: string; title: string; companies: { name: string } | null } | null;
  student: {
    id: string;
    profiles: { first_name: string | null; last_name: string | null; email: string } | null;
  } | null;
}

const FILTERS = [
  { value: "all", label: "All Residencies" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: rawStatus, q: rawQuery } = await searchParams;
  const statusFilter = rawStatus || "all";
  const searchQuery = rawQuery ? rawQuery.trim().toLowerCase() : "";

  const supabase = await createServerSideClient();

  let query = supabase
    .from("enrollments")
    .select(
      "id, status, created_at, internship:internships(id, title, companies(name)), student:student_profiles(id, profiles(first_name, last_name, email))"
    )
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: rawEnrollments, error } = await query;
  let enrollments = (rawEnrollments as unknown as AdminEnrollmentRow[] | null) ?? [];

  if (searchQuery && enrollments.length > 0) {
    enrollments = enrollments.filter((item) => {
      const profile = item.student?.profiles;
      const studentName = profile
        ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email
        : "";
      const email = profile?.email || "";
      const title = item.internship?.title?.toLowerCase() || "";
      const company = item.internship?.companies?.name?.toLowerCase() || "";

      return (
        studentName.toLowerCase().includes(searchQuery) ||
        email.toLowerCase().includes(searchQuery) ||
        title.includes(searchQuery) ||
        company.includes(searchQuery)
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            ACTIVE ENROLLMENTS &amp; RESIDENCIES
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Monitor active candidate residencies, completed programs, and placement statuses.
          </p>
        </div>
      </div>

      {/* READ-ONLY INFORMATION CALLOUT */}
      <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3 text-xs">
        <Info className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="font-mono font-bold text-indigo-200 uppercase">
            AUTOMATED RESIDENCY ENTRY
          </span>
          <p className="text-slate-400 leading-relaxed">
            Enrollments are automatically created when a student application is set to{" "}
            <span className="text-emerald-400 font-semibold">&quot;Accepted&quot;</span> in the{" "}
            <Link href="/admin/applications" className="text-indigo-300 underline">
              Application Review Queue
            </Link>
            . Direct manual enrollment mutations are restricted by database RLS state boundaries.
          </p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0E131F] p-4 rounded-xl border border-slate-800">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((filter) => {
            const isSelected = statusFilter === filter.value;
            const href =
              filter.value === "all"
                ? "/admin/enrollments"
                : `/admin/enrollments?status=${filter.value}`;

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

        {/* Search */}
        <form method="GET" action="/admin/enrollments" className="relative sm:w-64">
          {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search student or residency..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </form>
      </div>

      {/* DATA TABLE */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center flex flex-col items-center gap-2">
          <p className="text-sm font-semibold text-red-300">Couldn&apos;t load enrollments</p>
          <p className="text-xs text-red-400/80">Something went wrong querying the database.</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No enrollments in this view</p>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchQuery
              ? `No enrollments match query "${searchQuery}".`
              : "Accepted candidate applications will automatically populate active residencies here."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Enrolled Resident</th>
                <th className="py-3 px-4">Residency Opportunity</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Enrolled Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {enrollments.map((enrollment) => {
                const { label } = getEnrollmentStatusMeta(enrollment.status);
                const profile = enrollment.student?.profiles;
                const studentName = profile
                  ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email
                  : "Student Unavailable";
                const email = profile?.email || "";
                const date = new Date(enrollment.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                const statusStyle =
                  enrollment.status === "active"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40"
                    : enrollment.status === "completed"
                    ? "bg-cyan-950/80 text-cyan-300 border-cyan-700/40"
                    : "bg-red-950/80 text-red-300 border-red-700/40";

                return (
                  <tr key={enrollment.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white leading-snug">{studentName}</span>
                        <span className="text-[11px] font-mono text-slate-400">{email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-sans font-semibold text-slate-200">
                      {enrollment.internship ? (
                        <Link
                          href={`/admin/internships/${enrollment.internship.id}`}
                          className="hover:text-indigo-300 transition-colors"
                        >
                          {enrollment.internship.title}
                        </Link>
                      ) : (
                        <span className="text-slate-500 italic">Residency unavailable</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        {enrollment.internship?.companies?.name || "Platform Direct"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {date}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${statusStyle}`}>
                        {label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href="/admin/students"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                      >
                        Student Record
                        <ArrowUpRight className="h-3.5 w-3.5" />
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
