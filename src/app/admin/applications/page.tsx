import type { Metadata } from "next";
import Link from "next/link";
import { Search, FileText, ChevronRight, User, Building2, Calendar, CheckCircle2 } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";
import {
  normalizeApplicationStatusFilter,
  type ApplicationStatusFilter,
} from "@/lib/admin-review-view-state";

export const metadata: Metadata = { title: "Application Review Queue | NOVA Admin" };

interface AdminApplicationRow {
  id: string;
  status: string;
  created_at: string;
  internship: { id: string; title: string; company_id: string | null; companies: { name: string } | null } | null;
  student: {
    id: string;
    profiles: { first_name: string | null; last_name: string | null; email: string } | null;
  } | null;
}

const FILTERS: { value: ApplicationStatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending Review" },
  { value: "under_review", label: "Under Review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

function studentDisplayName(student: AdminApplicationRow["student"]): { name: string; email: string } {
  const profile = student?.profiles;
  if (!profile) return { name: "Unknown Student", email: "" };
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return { name: name || profile.email, email: profile.email };
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: rawStatus, q: rawQuery } = await searchParams;
  const statusFilter = normalizeApplicationStatusFilter(rawStatus);
  const searchQuery = rawQuery ? rawQuery.trim().toLowerCase() : "";

  const supabase = await createServerSideClient();

  let query = supabase
    .from("applications")
    .select(
      "id, status, created_at, internship:internships(id, title, company_id, companies(name)), student:student_profiles(id, profiles(first_name, last_name, email))"
    )
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: rawApps, error } = await query;
  let applications = (rawApps as unknown as AdminApplicationRow[] | null) ?? [];

  if (searchQuery && applications.length > 0) {
    applications = applications.filter((app) => {
      const studentInfo = studentDisplayName(app.student);
      const internshipTitle = app.internship?.title?.toLowerCase() || "";
      const companyName = app.internship?.companies?.name?.toLowerCase() || "";
      return (
        studentInfo.name.toLowerCase().includes(searchQuery) ||
        studentInfo.email.toLowerCase().includes(searchQuery) ||
        internshipTitle.includes(searchQuery) ||
        companyName.includes(searchQuery)
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            APPLICATION REVIEW QUEUE
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Evaluate candidate submissions, transition status, and record review decisions.
          </p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0E131F] p-4 rounded-xl border border-slate-800">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((filter) => {
            const isSelected = statusFilter === filter.value;
            const href =
              filter.value === "all"
                ? "/admin/applications"
                : `/admin/applications?status=${filter.value}`;

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
        <form method="GET" action="/admin/applications" className="relative sm:w-64">
          {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search student or internship..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </form>
      </div>

      {/* TABLE DATA STAGE */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center flex flex-col items-center gap-2">
          <p className="text-sm font-semibold text-red-300">Couldn&apos;t load applications</p>
          <p className="text-xs text-red-400/80">Something went wrong querying the database.</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <FileText className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No applications in this view</p>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchQuery
              ? `No applications found for query "${searchQuery}".`
              : "Applications submitted by candidates will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Applicant Candidate</th>
                <th className="py-3 px-4">Target Opportunity</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {applications.map((app) => {
                const student = studentDisplayName(app.student);
                const date = new Date(app.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <tr key={app.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white leading-snug">{student.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">{student.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-sans font-semibold text-slate-200">
                      {app.internship ? (
                        <Link
                          href={`/admin/internships/${app.internship.id}`}
                          className="hover:text-indigo-300 transition-colors"
                        >
                          {app.internship.title}
                        </Link>
                      ) : (
                        <span className="text-slate-500 italic">Internship unavailable</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        {app.internship?.companies?.name || "Platform Direct"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {date}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <ApplicationStatusBadge status={app.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider transition-all"
                      >
                        Review
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
