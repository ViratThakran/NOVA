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
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-sky-600" />
            Application Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Evaluate candidate submissions, transition review status, and record decisions.
          </p>
        </div>
      </div>

      {/* TOOLBAR WITH GLASSMORPHISM */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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

        {/* Search */}
        <form method="GET" action="/admin/applications" className="relative sm:w-64">
          {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search student or internship..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* TABLE DATA STAGE WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center flex flex-col items-center gap-2 shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load applications</p>
          <p className="text-xs text-red-500">Something went wrong querying the database.</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <FileText className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No applications in this view</p>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchQuery
              ? `No applications found for query "${searchQuery}".`
              : "Applications submitted by candidates will appear here."}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Applicant Candidate</th>
                  <th className="py-4 px-5">Target Opportunity</th>
                  <th className="py-4 px-5">Company</th>
                  <th className="py-4 px-5">Submission Date</th>
                  <th className="py-4 px-5">Review Status</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => {
                  const student = studentDisplayName(app.student);
                  const date = new Date(app.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr key={app.id} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900 leading-snug">{student.name}</span>
                          <span className="text-[11px] text-slate-500">{student.email}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-bold text-slate-900 text-xs sm:text-sm">
                        {app.internship ? (
                          <Link
                            href={`/admin/internships/${app.internship.id}`}
                            className="hover:text-sky-600 transition-colors"
                          >
                            {app.internship.title}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">Internship unavailable</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-sky-600" />
                          {app.internship?.companies?.name || "Platform Direct"}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {date}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <ApplicationStatusBadge status={app.status} />
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold uppercase tracking-wider transition-all"
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
        </div>
      )}
    </div>
  );
}
