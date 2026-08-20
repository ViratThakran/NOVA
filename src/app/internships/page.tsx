import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { CareersSubNav } from "@/components/marketing/careers-sub-nav";
import { createServerSideClient } from "@/lib/supabase";
import { sanitizeInternshipSearchQuery } from "@/lib/internship-search";
import { Search, Clock, Building2, ArrowUpRight, Zap, AlertCircle, Inbox } from "lucide-react";

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
    <div className="min-h-screen bg-[#07070A] text-white">
      <SiteHeader transparent />
      <CareersSubNav />

      {/* HERO */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 bg-[#07070A] border-b border-white/10 overflow-hidden">
        <div className="absolute top-1/3 left-0 w-[600px] h-[400px] rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 font-mono text-[10px] font-bold text-cyan-300 uppercase tracking-[0.2em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  LIVE OPPORTUNITIES
                </span>
                <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                  DATABASE-BACKED
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-black tracking-tight text-white uppercase leading-[0.92]">
                OPEN<br />
                <span className="bg-gradient-to-r from-cyan-200 via-white to-indigo-200 bg-clip-text text-transparent">
                  INTERNSHIPS
                </span>
              </h1>

              <p className="text-base sm:text-lg text-neutral-300 font-normal leading-relaxed max-w-xl">
                Real, live residencies with NOVA and partner companies. Every listing is pulled directly from the database — no recycled postings.
              </p>

              {/* Search Form */}
              <form
                method="get"
                className="flex items-stretch gap-2 max-w-lg"
                aria-label="Search internships"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={search ?? ""}
                    placeholder="Search by title, skill, or keyword…"
                    aria-label="Search internships by title"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder:text-neutral-500 text-sm font-normal focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.08] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="h-12 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm uppercase tracking-wider transition-colors shrink-0"
                >
                  Search
                </button>
                {search && (
                  <Link
                    href="/internships"
                    className="h-12 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-sm font-semibold flex items-center transition-colors shrink-0"
                  >
                    Clear
                  </Link>
                )}
              </form>
            </div>

            <div className="hidden lg:block lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10">
              <Image
                src="/images/cards/gen_internship.jpg"
                alt="NOVA Internship"
                fill
                priority
                sizes="500px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070A] via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="py-14 sm:py-20 bg-[#09090D]">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-8">

          {/* Result meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {search ? (
                <p className="text-sm text-neutral-300">
                  <span className="font-semibold text-white">{rows.length}</span>{" "}
                  {rows.length === 1 ? "result" : "results"} for{" "}
                  <span className="font-semibold text-cyan-300">&ldquo;{search}&rdquo;</span>
                </p>
              ) : (
                <p className="text-sm text-neutral-300">
                  <span className="font-semibold text-white">{rows.length}</span> open{" "}
                  {rows.length === 1 ? "internship" : "internships"}
                </p>
              )}
            </div>

            <Link
              href="/internship-programs"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
            >
              Structured Programs instead? →
            </Link>
          </div>

          {/* States */}
          {error ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-lg font-semibold text-white">Couldn&apos;t load internships</p>
              <p className="text-sm text-neutral-400">Something went wrong. Please try again.</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Inbox className="h-10 w-10 text-neutral-500" />
              <p className="text-lg font-semibold text-white">
                {search ? `No internships match "${search}"` : "No open internships right now"}
              </p>
              <p className="text-sm text-neutral-400">
                {search ? "Try a different search term." : "Check back soon — new internships open regularly."}
              </p>
              {search && (
                <Link
                  href="/internships"
                  className="mt-2 px-4 py-2 rounded-lg bg-white/10 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                >
                  Clear search
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {rows.map((internship) => {
                const durationColor =
                  internship.duration_weeks !== null
                    ? (DURATION_COLORS[internship.duration_weeks] ?? "bg-white/5 text-neutral-300 border-white/10")
                    : null;
                const durationLabel =
                  internship.duration_weeks !== null
                    ? (DURATION_LABELS[internship.duration_weeks] ?? `${internship.duration_weeks} weeks`)
                    : null;

                return (
                  <Link
                    key={internship.id}
                    href={`/internships/${internship.id}`}
                    className="group flex flex-col justify-between gap-5 p-6 rounded-2xl bg-[#111118] border border-white/10 hover:border-cyan-500/40 hover:bg-[#12121C] transition-all"
                  >
                    {/* Top meta row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {durationLabel && durationColor && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[10px] font-bold uppercase tracking-wider ${durationColor}`}>
                            <Clock className="h-3 w-3" />
                            {durationLabel}
                          </span>
                        )}
                        {internship.companies?.name && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-[10px] font-semibold text-neutral-300 uppercase tracking-wider">
                            <Building2 className="h-3 w-3" />
                            {internship.companies.name}
                          </span>
                        )}
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-neutral-600 group-hover:text-cyan-400 transition-colors shrink-0 mt-0.5" />
                    </div>

                    {/* Title + Description */}
                    <div className="flex flex-col gap-2 flex-1">
                      <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug">
                        {internship.title}
                      </h2>
                      <p className="text-sm text-neutral-500 leading-relaxed line-clamp-3 font-normal">
                        {internship.description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.07]">
                      <span className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest">
                        Posted {new Date(internship.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-cyan-500 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
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
      <section className="py-12 bg-[#0A0A10] border-t border-white/10">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-white">Looking for a structured residency track?</p>
            <p className="text-xs text-neutral-400">Browse 1, 3, and 6-month structured internship programs.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/internship-programs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold uppercase tracking-wider transition-colors"
            >
              Internship Programs
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-sm font-bold uppercase tracking-wider transition-colors"
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
