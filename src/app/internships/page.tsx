import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { createServerSideClient } from "@/lib/supabase";
import { sanitizeInternshipSearchQuery } from "@/lib/internship-search";
import { Search, Clock, Building2, ArrowUpRight, Zap, AlertCircle, Inbox } from "lucide-react";
import { CareerHero } from "@/components/marketing/careers/career-hero";

export const metadata: Metadata = {
  title: "Open Internships — NOVA",
  description: "Browse live, open internships with NOVA and NOVA's partner companies. Real opportunities, database-backed.",
};

const DURATION_LABELS: Record<number, string> = { 4: "1 month", 12: "3 months", 24: "6 months" };
const DURATION_COLORS: Record<number, string> = {
  4: "bg-cyan-950/60 text-cyan-300 border-cyan-700/40",
  12: "bg-indigo-950/60 text-indigo-300 border-indigo-700/40",
  24: "bg-violet-950/60 text-violet-300 border-violet-700/40",
};

interface InternshipListRow {
  id: string;
  title: string;
  description: string;
  duration_weeks: number | null;
  created_at: string;
  companies: { name: string } | null;
}

export default async function InternshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const search = sanitizeInternshipSearchQuery(q);

  const supabase = await createServerSideClient();

  let query = supabase
    .from("internships")
    .select("id, title, description, duration_weeks, created_at, companies(name)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data: internships, error } = await query;
  const rows = (internships as unknown as InternshipListRow[] | null) ?? [];

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white selection:text-black">
      <SiteHeader transparent />

      {/* HERO */}
      <CareerHero
        headline="Engineering Internships"
        description="Database-backed production roles with live code reviews and real team deliverables."
      >
        {/* Search Form */}
        <form
          method="get"
          className="flex items-stretch gap-2.5 max-w-xl w-full"
          aria-label="Search internships"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              type="search"
              name="q"
              defaultValue={search ?? ""}
              placeholder="Search by role, framework, or keyword…"
              aria-label="Search internships by title"
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder:text-neutral-500 text-sm font-normal focus:outline-none focus:border-white focus:bg-white/[0.08] transition-all"
            />
          </div>
          <button
            type="submit"
            className="h-12 px-7 rounded-xl bg-[#EDEDED] hover:bg-white text-black font-medium text-sm transition-all shrink-0"
          >
            Search
          </button>
          {search && (
            <Link
              href="/internships"
              className="h-12 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-sm font-medium flex items-center transition-colors shrink-0"
            >
              Clear
            </Link>
          )}
        </form>
      </CareerHero>

      {/* RESULTS */}
      <section className="py-14 sm:py-20 bg-[#000000]">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-8">

          {/* Result meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {search ? (
                <p className="text-sm text-[#8E8E93]">
                  <span className="font-medium text-white">{rows.length}</span>{" "}
                  {rows.length === 1 ? "result" : "results"} for{" "}
                  <span className="font-medium text-white">&ldquo;{search}&rdquo;</span>
                </p>
              ) : (
                <p className="text-sm text-[#8E8E93]">
                  <span className="font-medium text-white">{rows.length}</span> open{" "}
                  {rows.length === 1 ? "internship" : "internships"}
                </p>
              )}
            </div>

            <Link
              href="/internship-programs"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors uppercase tracking-wider"
            >
              Structured Programs instead? →
            </Link>
          </div>

          {/* States */}
          {error ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-lg font-medium text-white">Couldn&apos;t load internships</p>
              <p className="text-sm text-[#8E8E93]">Something went wrong. Please try again.</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Inbox className="h-10 w-10 text-neutral-600" />
              <p className="text-lg font-medium text-white">
                {search ? `No internships match "${search}"` : "No open internships right now"}
              </p>
              <p className="text-sm text-[#8E8E93]">
                {search ? "Try a different search term." : "Check back soon — new internships open regularly."}
              </p>
              {search && (
                <Link
                  href="/internships"
                  className="mt-2 px-5 py-2.5 rounded-xl bg-white/[0.08] text-sm font-medium text-white hover:bg-white/[0.12] transition-colors border border-white/10"
                >
                  Clear search
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {rows.map((internship) => {
                const durationLabel =
                  internship.duration_weeks !== null
                    ? (DURATION_LABELS[internship.duration_weeks] ?? `${internship.duration_weeks} weeks`)
                    : null;

                return (
                  <Link
                    key={internship.id}
                    href={`/internships/${internship.id}`}
                    className="group flex flex-col justify-between gap-5 p-6 rounded-2xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all"
                  >
                    {/* Top meta row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {durationLabel && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-[11px] font-medium text-neutral-300">
                            <Clock className="h-3 w-3 text-neutral-400" />
                            {durationLabel}
                          </span>
                        )}
                        {internship.companies?.name && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-[11px] font-medium text-neutral-300">
                            <Building2 className="h-3 w-3 text-neutral-400" />
                            {internship.companies.name}
                          </span>
                        )}
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition-colors shrink-0 mt-0.5" />
                    </div>

                    {/* Title + Description */}
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-base sm:text-lg font-medium text-white group-hover:text-white transition-colors leading-snug">
                        {internship.title}
                      </h2>
                      <p className="text-sm text-[#8E8E93] leading-relaxed line-clamp-3 font-normal">
                        {internship.description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                      <span className="font-mono text-[11px] text-neutral-500">
                        Posted {new Date(internship.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        VIEW ROLE →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CROSS-LINK TO PROGRAMS */}
      <section className="py-14 bg-[#050508] border-t border-white/[0.08]">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-white">Looking for a structured residency track?</p>
            <p className="text-sm text-[#8E8E93]">Browse 1, 3, and 6-month structured internship programs.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/internship-programs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EDEDED] hover:bg-white text-black text-sm font-medium transition-all"
            >
              Internship Programs
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white border border-white/15 text-sm font-medium transition-all"
            >
              Careers Hub
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
