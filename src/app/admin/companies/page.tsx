import type { Metadata } from "next";
import Link from "next/link";
import { Search, Building2, Briefcase, Users, ChevronRight, Calendar } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Partner Companies | NOVA Admin" };

interface CompanyRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQuery } = await searchParams;
  const searchQuery = rawQuery ? rawQuery.trim().toLowerCase() : "";

  const supabase = await createServerSideClient();

  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, description, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex flex-col gap-6 text-slate-800">
        <PageTitle />
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load companies.</p>
        </div>
      </div>
    );
  }

  let rows = (companies ?? []) as CompanyRow[];

  // Apply search
  if (searchQuery) {
    rows = rows.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery) ||
        (c.description && c.description.toLowerCase().includes(searchQuery))
    );
  }

  if (rows.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col gap-6 text-slate-800">
        <PageTitle />
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Building2 className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No companies yet</p>
          <p className="text-xs text-slate-500">Partner companies will appear here when registered.</p>
        </div>
      </div>
    );
  }

  // Fetch relationship data for all companies
  const companyIds = rows.map((c) => c.id);
  const [{ data: members }, { data: internships }] = await Promise.all([
    supabase.from("company_members").select("company_id").in("company_id", companyIds),
    supabase.from("internships").select("id, company_id, status").in("company_id", companyIds),
  ]);

  const memberCounts = new Map<string, number>();
  const internshipCounts = new Map<string, number>();
  const openCounts = new Map<string, number>();

  for (const row of members ?? []) {
    memberCounts.set(row.company_id, (memberCounts.get(row.company_id) ?? 0) + 1);
  }
  for (const row of internships ?? []) {
    internshipCounts.set(row.company_id, (internshipCounts.get(row.company_id) ?? 0) + 1);
    if (row.status === "open") {
      openCounts.set(row.company_id, (openCounts.get(row.company_id) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      <PageTitle count={rows.length} />

      {/* TOOLBAR WITH GLASSMORPHISM */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-xs font-semibold text-slate-500">
          {rows.length} partner compan{rows.length !== 1 ? "ies" : "y"} on the platform.
        </p>

        <form method="GET" action="/admin/companies" className="relative sm:w-64">
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search by company name..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* TABLE WITH GLASSMORPHISM */}
      {rows.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Building2 className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No companies match this search</p>
          <p className="text-xs text-slate-500">No results for &quot;{searchQuery}&quot;.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Company Name</th>
                  <th className="py-4 px-5 text-center">Members</th>
                  <th className="py-4 px-5 text-center">Internships</th>
                  <th className="py-4 px-5 text-center">Open Roles</th>
                  <th className="py-4 px-5">Joined Platform</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rows.map((company) => {
                  const memberCount = memberCounts.get(company.id) ?? 0;
                  const internshipCount = internshipCounts.get(company.id) ?? 0;
                  const openCount = openCounts.get(company.id) ?? 0;
                  const date = new Date(company.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={company.id} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/admin/companies/${company.id}`}
                            className="font-bold text-slate-900 hover:text-sky-600 text-xs sm:text-sm transition-colors"
                          >
                            {company.name}
                          </Link>
                          {company.description && (
                            <span className="text-[11px] text-slate-500 line-clamp-1 max-w-sm">
                              {company.description}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                          <Users className="h-3 w-3 text-slate-400" />
                          {memberCount}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
                          <Briefcase className="h-3 w-3 text-indigo-500" />
                          {internshipCount}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-center">
                        {openCount > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            {openCount} Open
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {date}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/admin/companies/${company.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 uppercase tracking-wider"
                        >
                          Manage
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

function PageTitle({ count }: { count?: number }) {
  return (
    <div className="flex flex-col gap-1 pb-1">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
        <Building2 className="h-6 w-6 text-sky-600" />
        Partner Companies
        {typeof count === "number" && (
          <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold shadow-2xs">
            {count}
          </span>
        )}
      </h1>
      <p className="text-xs sm:text-sm text-slate-500">
        Directory of partner organizations hosting student internships and builder squads.
      </p>
    </div>
  );
}
