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
      <div className="flex flex-col gap-6">
        <PageTitle />
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load companies.</p>
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
      <div className="flex flex-col gap-6">
        <PageTitle />
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <Building2 className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No companies yet</p>
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
    <div className="flex flex-col gap-6">
      <PageTitle count={rows.length} />

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0E131F] p-4 rounded-xl border border-slate-800">
        <p className="text-xs font-mono text-slate-400">
          {rows.length} partner compan{rows.length !== 1 ? "ies" : "y"} on the platform.
        </p>

        <form method="GET" action="/admin/companies" className="relative sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search by company name..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </form>
      </div>

      {/* TABLE */}
      {rows.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <Building2 className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No companies match this search</p>
          <p className="text-xs text-slate-500">No results for &quot;{searchQuery}&quot;.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4 text-center">Members</th>
                <th className="py-3 px-4 text-center">Internships</th>
                <th className="py-3 px-4 text-center">Open Now</th>
                <th className="py-3 px-4">Joined Platform</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
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
                  <tr key={company.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/admin/companies/${company.id}`}
                          className="font-bold text-white hover:text-indigo-300 transition-colors"
                        >
                          {company.name}
                        </Link>
                        {company.description && (
                          <span className="text-[11px] font-mono text-slate-500 line-clamp-1">
                            {company.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-slate-300 font-mono">
                        <Users className="h-3 w-3 text-slate-500" />
                        {memberCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-slate-300 font-mono">
                        <Briefcase className="h-3 w-3 text-slate-500" />
                        {internshipCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {openCount > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/40 text-emerald-300 text-[10px] font-bold">
                          {openCount} OPEN
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px] font-mono">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {date}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/companies/${company.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                      >
                        View Company
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

function PageTitle({ count }: { count?: number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
          PARTNER COMPANIES
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          {count !== undefined
            ? `${count} compan${count !== 1 ? "ies" : "y"} partnered · Manage hiring orgs and internship pipelines.`
            : "Manage partner companies and their internship pipelines."}
        </p>
      </div>
    </div>
  );
}
