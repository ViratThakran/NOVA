import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Building2, Calendar, ChevronRight, Briefcase } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";

export const metadata: Metadata = { title: "My Applications | NOVA" };

interface ApplicationListRow {
  id: string;
  status: string;
  created_at: string;
  internship: { id: string; title: string; companies: { name: string } | null } | null;
}

export default async function StudentApplicationsPage() {
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

  const { data: rawApplications, error } = await supabase
    .from("applications")
    .select("id, status, created_at, internship:internships(id, title, companies(name))")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const applications = (rawApplications as unknown as ApplicationListRow[] | null) ?? [];

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const reviewCount = applications.filter((a) => a.status === "under_review").length;
  const acceptedCount = applications.filter((a) => a.status === "accepted").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            MY APPLICATIONS TRACKER
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Track the status of all internship applications you&apos;ve submitted to NOVA partner companies.
          </p>
        </div>
        <Link
          href="/student/internships"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
        >
          <Briefcase className="h-4 w-4" />
          Explore Open Roles
        </Link>
      </div>

      {/* SUMMARY PIPELINE STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Pending Review</span>
          <span className="text-2xl font-bold text-white mt-1">{pendingCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">Under Review</span>
          <span className="text-2xl font-bold text-white mt-1">{reviewCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Accepted</span>
          <span className="text-2xl font-bold text-white mt-1">{acceptedCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Rejected</span>
          <span className="text-2xl font-bold text-slate-400 mt-1">{rejectedCount}</span>
        </div>
      </div>

      {/* APPLICATIONS LIST */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load your applications.</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <FileText className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No Applications Submitted Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            You haven&apos;t applied to any internship opportunities yet. Browse open roles to submit your first application.
          </p>
          <Link
            href="/student/internships"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Explore Open Internships →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Internship Position</th>
                <th className="py-3 px-4">Partner Company</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {applications.map((app) => {
                const date = new Date(app.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const companyName = app.internship?.companies?.name || "NOVA Partner";

                return (
                  <tr key={app.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-white">
                      <Link
                        href={`/student/applications/${app.id}`}
                        className="hover:text-indigo-300 transition-colors"
                      >
                        {app.internship?.title || "Internship Position"}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <span className="flex items-center gap-1 text-slate-300 font-semibold">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        {companyName}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <ApplicationStatusBadge status={app.status} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {date}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/student/applications/${app.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                      >
                        View Details
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
