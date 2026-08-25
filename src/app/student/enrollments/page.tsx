import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Building2, Calendar, ChevronRight, FileText } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { getEnrollmentStatusMeta } from "@/lib/enrollment-view-state";

export const metadata: Metadata = { title: "My Residencies | NOVA" };

interface EnrollmentListRow {
  id: string;
  status: string;
  created_at: string;
  internship: { id: string; title: string; companies: { name: string } | null } | null;
}

export default async function StudentEnrollmentsPage() {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
        <p className="text-sm font-semibold text-red-600">Your session has expired. Please log in again.</p>
      </div>
    );
  }

  const { data: rawEnrollments, error } = await supabase
    .from("enrollments")
    .select("id, status, created_at, internship:internships(id, title, companies(name))")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const enrollments = (rawEnrollments as unknown as EnrollmentListRow[] | null) ?? [];
  const activeCount = enrollments.filter((e) => e.status === "active").length;

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-600" />
            My Residencies &amp; Placements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Active and completed internship residencies resulting from accepted builder squad applications.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200 text-emerald-700 text-xs font-bold shrink-0 shadow-2xs">
          <span>{activeCount} Active {activeCount === 1 ? "Residency" : "Residencies"}</span>
        </div>
      </div>

      {/* ENROLLMENTS LIST WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load your residencies.</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Briefcase className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No Active Residencies Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Once an internship application is accepted by the partner selection team, your active residency enrollment will appear here.
          </p>
          <Link
            href="/student/applications"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileText className="h-4 w-4" /> View Applications Tracker →
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Residency Position</th>
                  <th className="py-4 px-5">Partner Company</th>
                  <th className="py-4 px-5">Residency Status</th>
                  <th className="py-4 px-5">Enrolled Date</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {enrollments.map((enrollment) => {
                  const { label, variant } = getEnrollmentStatusMeta(enrollment.status);
                  const date = new Date(enrollment.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const companyName = enrollment.internship?.companies?.name || "NOVA Partner";

                  return (
                    <tr key={enrollment.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-900 text-xs sm:text-sm">
                        <Link
                          href={`/student/enrollments/${enrollment.id}`}
                          className="hover:text-emerald-600 transition-colors"
                        >
                          {enrollment.internship?.title || "Residency Position"}
                        </Link>
                      </td>

                      <td className="py-4 px-5">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-sky-600" />
                          {companyName}
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

                      <td className="py-4 px-5 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {date}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/student/enrollments/${enrollment.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          Residency Workspace
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
