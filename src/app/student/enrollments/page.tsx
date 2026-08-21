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
      <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
        <p className="text-sm font-semibold text-red-300 font-mono">Your session has expired. Please log in again.</p>
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
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-400" />
            MY RESIDENCIES &amp; PLACEMENTS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Active and past internship residencies resulting from accepted applications.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/40 text-emerald-300 font-mono text-xs font-bold uppercase shrink-0">
          <span>{activeCount} Active {activeCount === 1 ? "Residency" : "Residencies"}</span>
        </div>
      </div>

      {/* ENROLLMENTS LIST */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load your residencies.</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <Briefcase className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No Active Residencies Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Once an internship application is accepted by the partner selection team, the resulting residency enrollment will appear here.
          </p>
          <Link
            href="/student/applications"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <FileText className="h-3.5 w-3.5" /> View Applications Tracker →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Residency Position</th>
                <th className="py-3 px-4">Partner Company</th>
                <th className="py-3 px-4">Residency Status</th>
                <th className="py-3 px-4">Enrolled Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {enrollments.map((enrollment) => {
                const { label, variant } = getEnrollmentStatusMeta(enrollment.status);
                const date = new Date(enrollment.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const companyName = enrollment.internship?.companies?.name || "NOVA Partner";

                return (
                  <tr key={enrollment.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-white">
                      <Link
                        href={`/student/enrollments/${enrollment.id}`}
                        className="hover:text-indigo-300 transition-colors"
                      >
                        {enrollment.internship?.title || "Internship Position"}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <span className="flex items-center gap-1 text-slate-300 font-semibold">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        {companyName}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={variant}>{label}</Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {date}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/student/enrollments/${enrollment.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                      >
                        Open Details
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
