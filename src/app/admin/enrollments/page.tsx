import type { Metadata } from "next";
import Link from "next/link";
import { Search, CheckCircle2, Building2, Calendar, User, Info, ArrowUpRight, Briefcase } from "lucide-react";
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
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-600" />
            Active Enrollments &amp; Residencies
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor active candidate residencies, completed programs, and builder squad placements.
          </p>
        </div>
      </div>

      {/* READ-ONLY INFORMATION CALLOUT WITH GLASSMORPHISM */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-start gap-3.5 text-xs">
        <Info className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-900 uppercase tracking-wider">
            Automated Residency Entry
          </span>
          <p className="text-slate-600 leading-relaxed">
            Enrollments are automatically created when a student application is set to{" "}
            <span className="text-emerald-700 font-semibold">&quot;Accepted&quot;</span> in the{" "}
            <Link href="/admin/applications" className="text-sky-600 font-semibold underline hover:text-sky-700">
              Application Review Queue
            </Link>
            . Direct manual enrollment mutations are restricted by database RLS state boundaries.
          </p>
        </div>
      </div>

      {/* TOOLBAR WITH GLASSMORPHISM */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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
        <form method="GET" action="/admin/enrollments" className="relative sm:w-64">
          {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search student or residency..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* DATA TABLE WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center flex flex-col items-center gap-2 shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load enrollments</p>
          <p className="text-xs text-red-500">Something went wrong querying the database.</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CheckCircle2 className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No enrollments in this view</p>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchQuery
              ? `No enrollments match query "${searchQuery}".`
              : "Accepted candidate applications will automatically populate active residencies here."}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Enrolled Resident</th>
                  <th className="py-4 px-5">Residency Opportunity</th>
                  <th className="py-4 px-5">Company</th>
                  <th className="py-4 px-5">Enrolled Date</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {enrollments.map((enrollment) => {
                  const { label, variant } = getEnrollmentStatusMeta(enrollment.status);
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

                  return (
                    <tr key={enrollment.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900 leading-snug">{studentName}</span>
                          <span className="text-[11px] text-slate-500">{email}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-bold text-slate-900 text-xs sm:text-sm">
                        {enrollment.internship ? (
                          <Link
                            href={`/admin/internships/${enrollment.internship.id}`}
                            className="hover:text-emerald-600 transition-colors"
                          >
                            {enrollment.internship.title}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">Residency unavailable</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-sky-600" />
                          {enrollment.internship?.companies?.name || "Platform Direct"}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {date}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            variant === "success"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : variant === "warning"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {label}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href="/admin/students"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
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
        </div>
      )}
    </div>
  );
}
