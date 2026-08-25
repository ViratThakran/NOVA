import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Building2, Calendar, ChevronRight, Briefcase, Plus } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";

export const metadata: Metadata = { title: "My Applications | NOVA" };

interface ApplicationRow {
  id: string;
  status: string;
  created_at: string;
  internship: {
    id: string;
    title: string;
    companies: { name: string } | null;
  } | null;
}

export default async function StudentApplicationsPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return (
      <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
        <p className="text-sm font-semibold text-red-600">Your session has expired. Please log in again.</p>
      </div>
    );
  }
  const { supabase, user } = auth;

  const { data: rawApplications, error } = await supabase
    .from("applications")
    .select("id, status, created_at, internship:internships(id, title, companies(name))")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const applications = (rawApplications as unknown as ApplicationRow[] | null) ?? [];

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const reviewCount = applications.filter((a) => a.status === "under_review").length;
  const acceptedCount = applications.filter((a) => a.status === "accepted").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-sky-600" />
            My Applications Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track the review status and timeline of all your submitted residency applications.
          </p>
        </div>
        <Link
          href="/student/internships"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Briefcase className="h-4 w-4" />
          Explore Open Roles
        </Link>
      </div>

      {/* SUMMARY PIPELINE STRIP (4 COLORFUL GLASSMORPHIC STAT CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-amber-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_12px_30px_rgba(245,158,11,0.12)] transition-all">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</span>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{pendingCount}</span>
        </div>
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-sky-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_12px_30px_rgba(14,165,233,0.12)] transition-all">
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Under Review</span>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{reviewCount}</span>
        </div>
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-emerald-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_12px_30px_rgba(16,185,129,0.12)] transition-all">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Accepted</span>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{acceptedCount}</span>
        </div>
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_12px_30px_rgba(100,116,139,0.12)] transition-all">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejected</span>
          <span className="text-2xl sm:text-3xl font-bold text-slate-400 mt-2">{rejectedCount}</span>
        </div>
      </div>

      {/* APPLICATIONS LIST */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load your applications.</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <FileText className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No Applications Submitted Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            You haven&apos;t applied to any residency opportunities yet. Browse open roles to submit your first application.
          </p>
          <Link
            href="/student/internships"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Explore Open Internships →
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Internship Position</th>
                  <th className="py-4 px-5">Partner Company</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Submitted Date</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => {
                  const date = new Date(app.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-sky-50/30 transition-colors"
                    >
                      <td className="py-4 px-5 font-bold text-slate-900 text-xs sm:text-sm">
                        {app.internship?.title || "Internship Role"}
                      </td>
                      <td className="py-4 px-5 text-slate-600">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-sky-600" />
                          {app.internship?.companies?.name || "NOVA Partner"}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <ApplicationStatusBadge status={app.status} />
                      </td>
                      <td className="py-4 px-5 text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {date}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/student/applications/${app.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
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
        </div>
      )}
    </div>
  );
}
