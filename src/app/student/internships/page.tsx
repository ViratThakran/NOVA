import type { Metadata } from "next";
import Link from "next/link";
import { Search, Briefcase, Building2, Calendar, ChevronRight, CheckCircle2 } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { sanitizeInternshipSearchQuery } from "@/lib/internship-search";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";

export const metadata: Metadata = { title: "Explore Internships | NOVA" };

interface InternshipListRow {
  id: string;
  title: string;
  description: string;
  created_at: string;
  companies: { name: string } | null;
}

interface ApplicationMapItem {
  internship_id: string;
  id: string;
  status: string;
}

export default async function StudentInternshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const search = sanitizeInternshipSearchQuery(q);

  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Query open internships and existing student applications in parallel
  let internshipsQuery = supabase
    .from("internships")
    .select("id, title, description, created_at, companies(name)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (search) {
    internshipsQuery = internshipsQuery.ilike("title", `%${search}%`);
  }

  const [{ data: rawInternships, error }, { data: myApps }] = await Promise.all([
    internshipsQuery,
    user
      ? supabase.from("applications").select("id, internship_id, status").eq("student_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const internships = (rawInternships as unknown as InternshipListRow[] | null) ?? [];
  const appMap = new Map<string, ApplicationMapItem>();
  (myApps as ApplicationMapItem[] | null)?.forEach((app) => {
    appMap.set(app.internship_id, app);
  });

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-400" />
            INTERNSHIP OPPORTUNITY MARKETPLACE
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Explore open residency positions, review requirements, and submit your application.
          </p>
        </div>
        <Link
          href="/student/applications"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-semibold uppercase tracking-wider transition-colors shrink-0"
        >
          Track My Applications ({appMap.size})
        </Link>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0E131F] p-4 rounded-xl border border-slate-800">
        <p className="text-xs font-mono text-slate-400">
          Showing {internships.length} open role{internships.length !== 1 ? "s" : ""}.
        </p>

        <form method="GET" action="/student/internships" className="relative sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={search || ""}
            placeholder="Search by role title..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </form>
      </div>

      {/* OPPORTUNITY CARDS GRID */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load internships.</p>
        </div>
      ) : internships.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <Briefcase className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">
            {search ? `No open roles match "${search}"` : "No open internships right now"}
          </p>
          <p className="text-xs text-slate-500">
            {search ? "Try searching with a different term." : "Check back soon — new positions will appear here as they open."}
          </p>
          <Link
            href="/student/programs"
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-300"
          >
            Explore Learning Programs →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="group flex flex-col justify-between gap-4 p-5 rounded-xl bg-[#0E131F] border border-slate-800 hover:border-indigo-500/40 transition-all"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {companyName}
                      </span>
                      <h2 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                        {internship.title}
                      </h2>
                    </div>

                    {existingApp ? (
                      <ApplicationStatusBadge status={existingApp.status} />
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/40 text-[10px] font-mono font-bold text-emerald-300 uppercase shrink-0">
                        Open Role
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 font-sans line-clamp-3 leading-relaxed">
                    {internship.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 font-mono text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-600" />
                    Posted {postedDate}
                  </span>

                  <Link
                    href={`/student/internships/${internship.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                  >
                    {existingApp ? "View Application" : "View & Apply"}
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
