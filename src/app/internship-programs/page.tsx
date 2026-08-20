import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { CareersSubNav } from "@/components/marketing/careers-sub-nav";
import { createServerSideClient } from "@/lib/supabase";
import { ArrowUpRight, Clock, Layers, AlertCircle, Inbox, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Internship Programs — NOVA",
  description: "NOVA's structured internship programs across 1, 3, and 6-month tracks in every subject area.",
};

interface InternshipProgramRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  programs: { name: string } | null;
  internships: { id: string; duration_weeks: number | null }[];
}

const DURATION_LABELS: Record<number, string> = { 4: "1 month", 12: "3 months", 24: "6 months" };

const TRACK_COLORS: Record<number, { pill: string; border: string; glow: string }> = {
  4: { pill: "bg-cyan-950/60 text-cyan-300 border-cyan-700/40", border: "hover:border-cyan-500/40", glow: "group-hover:text-cyan-200" },
  12: { pill: "bg-indigo-950/60 text-indigo-300 border-indigo-700/40", border: "hover:border-indigo-500/40", glow: "group-hover:text-indigo-200" },
  24: { pill: "bg-violet-950/60 text-violet-300 border-violet-700/40", border: "hover:border-violet-500/40", glow: "group-hover:text-violet-200" },
};

export default async function InternshipProgramsPage() {
  const supabase = await createServerSideClient();

  const { data: internshipPrograms, error } = await supabase
    .from("internship_programs")
    .select("id, slug, name, short_description, programs(name), internships(id, duration_weeks)")
    .eq("status", "published")
    .order("display_order", { ascending: true });

  const rows = (internshipPrograms as unknown as InternshipProgramRow[] | null) ?? [];

  return (
    <div className="min-h-screen bg-[#07070A] text-white">
      <SiteHeader transparent />
      <CareersSubNav />

      {/* HERO */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 bg-[#07070A] border-b border-white/10 overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 font-mono text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em]">
                  <Layers className="h-3 w-3" />
                  STRUCTURED TRACKS
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-black tracking-tight text-white uppercase leading-[0.92]">
                INTERNSHIP<br />
                <span className="bg-gradient-to-r from-indigo-200 via-violet-200 to-white bg-clip-text text-transparent">
                  PROGRAMS
                </span>
              </h1>

              <p className="text-base sm:text-lg text-neutral-300 font-normal leading-relaxed max-w-xl">
                Structured 1, 3, and 6-month commitment tracks across every NOVA domain. Not just a job posting — a defined residency with a learning path and a mentor structure.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/internships"
                  className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider"
                >
                  ← Browse Live Internships Instead
                </Link>
              </div>
            </div>

            <div className="hidden lg:block lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10">
              <Image
                src="/images/cards/gen_residency.jpg"
                alt="NOVA Internship Programs"
                fill
                priority
                sizes="500px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070A] via-transparent to-transparent" />

              {/* Distinguishing callout */}
              <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-1.5">
                <div className="flex gap-2 flex-wrap">
                  {[4, 12, 24].map((w) => (
                    <span key={w} className={`px-2.5 py-1 rounded-md border font-mono text-[10px] font-bold uppercase ${TRACK_COLORS[w].pill}`}>
                      <Clock className="inline h-3 w-3 mr-1" />
                      {DURATION_LABELS[w]}
                    </span>
                  ))}
                </div>
                <p className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">TRACKS AVAILABLE</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAM LISTING */}
      <section className="py-14 sm:py-20 bg-[#09090D]">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-8">

          {/* Count bar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-300">
              <span className="font-semibold text-white">{rows.length}</span>{" "}
              {rows.length === 1 ? "program" : "programs"} available
            </p>
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
              ORDERED BY PROGRAM TRACK
            </span>
          </div>

          {error ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-lg font-semibold text-white">Couldn&apos;t load internship programs</p>
              <p className="text-sm text-neutral-400">Something went wrong. Please try again.</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Inbox className="h-10 w-10 text-neutral-500" />
              <p className="text-lg font-semibold text-white">No internship programs published yet</p>
              <p className="text-sm text-neutral-400">NOVA&apos;s internship programs will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rows.map((ip) => {
                const openInternships = ip.internships.filter(Boolean);
                const availableTracks = Array.from(
                  new Set(
                    openInternships
                      .map((i) => i.duration_weeks)
                      .filter((w): w is number => w !== null)
                  )
                ).sort((a, b) => a - b);

                const primaryTrack = availableTracks[0];
                const colors = primaryTrack ? TRACK_COLORS[primaryTrack] : null;

                return (
                  <Link
                    key={ip.id}
                    href={`/internship-programs/${ip.slug}`}
                    className={`group flex flex-col justify-between gap-6 p-8 rounded-2xl bg-[#111118] border border-white/10 ${colors?.border ?? "hover:border-white/25"} transition-all`}
                  >
                    {/* Header */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {ip.programs?.name && (
                            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-[10px] font-semibold text-neutral-300 uppercase tracking-wider">
                              {ip.programs.name}
                            </span>
                          )}
                          {availableTracks.map((weeks) => {
                            const c = TRACK_COLORS[weeks];
                            return (
                              <span
                                key={weeks}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-mono text-[10px] font-bold uppercase tracking-wider ${c?.pill ?? "bg-white/5 text-white border-white/10"}`}
                              >
                                <Clock className="h-3 w-3" />
                                {DURATION_LABELS[weeks] ?? `${weeks}w`}
                              </span>
                            );
                          })}
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-neutral-600 group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5" />
                      </div>

                      <h2 className={`text-xl font-bold text-white ${colors?.glow ?? "group-hover:text-neutral-200"} transition-colors leading-snug`}>
                        {ip.name}
                      </h2>
                      <p className="text-sm text-neutral-500 leading-relaxed line-clamp-3 font-normal">
                        {ip.short_description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-5 border-t border-white/[0.07]">
                      <span className="font-mono text-[10px] text-neutral-500">
                        {openInternships.length}{" "}
                        {openInternships.length === 1 ? "opening" : "open opportunities"}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-indigo-400 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                        EXPLORE TRACK →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CROSS-LINK */}
      <section className="py-12 bg-[#0A0A10] border-t border-white/10">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-white">Ready to browse live openings?</p>
            <p className="text-xs text-neutral-400">View all individual open internship roles.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/internships"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold uppercase tracking-wider transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Browse Open Internships
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
