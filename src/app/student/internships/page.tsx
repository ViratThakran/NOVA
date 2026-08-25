import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Building2, Calendar, ChevronRight, Search, CheckCircle2 } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";

export const metadata: Metadata = { title: "Internship Marketplace | NOVA" };

interface InternshipRow {
  id: string;
  title: string;
  description: string;
  requirements: string;
  created_at: string;
  companies: { name: string } | null;
}

interface ApplicationRow {
  id: string;
  internship_id: string;
  status: string;
}

export default async function StudentInternshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: search } = await searchParams;
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return (
      <div className="p-8 rounded-2xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
        <p className="text-sm font-semibold text-red-600">Your session has expired. Please log in again.</p>
      </div>
    );
  }
  const { supabase, user } = auth;

  let query = supabase
    .from("internships")
    .select("id, title, description, requirements, created_at, companies(name)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (search && search.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }

  const [{ data: rawInternships, error }, { data: rawApplications }] = await Promise.all([
    query,
    supabase.from("applications").select("id, internship_id, status").eq("student_id", user.id),
  ]);

  const internships = (rawInternships as unknown as InternshipRow[] | null) ?? [];
  const applications = (rawApplications as ApplicationRow[] | null) ?? [];
  const appMap = new Map<string, ApplicationRow>(applications.map((a) => [a.internship_id, a]));

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-sky-600" />
            Internship Opportunity Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explore open residency positions, review requirements, and submit your application.
          </p>
        </div>
        <Link
          href="/student/applications"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          Track My Applications ({appMap.size})
        </Link>
      </div>

      {/* SEARCH TOOLBAR WITH GLASSMORPHISM */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-xs font-semibold text-slate-500">
          Showing <span className="font-bold text-slate-900">{internships.length}</span> open role{internships.length !== 1 ? "s" : ""}.
        </p>

        <form method="GET" action="/student/internships" className="relative sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={search || ""}
            placeholder="Search by role title..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* OPPORTUNITY CARDS GRID WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load internships.</p>
        </div>
      ) : internships.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Briefcase className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">
            {search ? `No open roles match "${search}"` : "No open internships right now"}
          </p>
          <p className="text-xs text-slate-500">
            {search ? "Try searching with a different term." : "Check back soon — new positions will appear here as they open."}
          </p>
          <Link
            href="/student/programs"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            Explore Learning Programs →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {internships.map((internship) => {
            const existingApp = appMap.get(internship.id);
            const companyName = internship.companies?.name || "NOVA Partner";
            const postedDate = new Date(internship.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={internship.id}
                className="group flex flex-col justify-between gap-4 p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/95 hover:border-sky-300/80 hover:shadow-[0_14px_35px_rgba(14,165,233,0.12)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-sky-600" /> {companyName}
                      </span>
                      <h2 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                        {internship.title}
                      </h2>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 uppercase shrink-0">
                      Open Role
                    </span>
                  </div>

                  <p className="text-xs sm:text-[13px] text-slate-600 line-clamp-2 leading-relaxed font-normal">
                    {internship.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      Posted {postedDate}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {existingApp ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-[11px] font-semibold text-slate-500">Applied:</span>
                      <ApplicationStatusBadge status={existingApp.status} />
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">Not yet applied</span>
                  )}

                  <Link
                    href={`/student/internships/${internship.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 group-hover:text-sky-700"
                  >
                    View Details &amp; Apply
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
