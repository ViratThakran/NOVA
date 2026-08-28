import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { createServerSideClient } from "@/lib/supabase";
import { ArrowUpRight, Clock, Layers, AlertCircle, Inbox, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Internship Programs — NOVA",
  description: "NOVA's structured internship programs across 1, 3, and 6-month tracks in every subject area.",
};

import { CareerHero } from "@/components/marketing/careers/career-hero";

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
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white selection:text-black">
      <SiteHeader transparent />

      {/* HERO */}
      <CareerHero
        headline="Internship Programs"
        description="Structured 1, 3, and 6-month tracks with verified sprint milestones and paired mentorship."
        primaryCtaLabel="View available tracks"
        primaryCtaHref="#tracks"
      >
        <Link
          href="/internships"
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-sm font-medium transition-all"
        >
          <span>Browse live internships</span>
          <ArrowUpRight className="h-4 w-4 text-neutral-400" />
        </Link>
      </CareerHero>

      {/* PROGRAM LISTING */}
      <section id="tracks" className="py-14 sm:py-20 bg-[#000000]">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-8">

          {/* Count bar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#8E8E93]">
              <span className="font-medium text-white">{rows.length}</span>{" "}
              {rows.length === 1 ? "program" : "programs"} available
            </p>
            <span className="font-mono text-[11px] text-neutral-500 uppercase tracking-widest">
              ORDERED BY PROGRAM TRACK
            </span>
          </div>

          {error ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-lg font-medium text-white">Couldn&apos;t load internship programs</p>
              <p className="text-sm text-[#8E8E93]">Something went wrong. Please try again.</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Inbox className="h-10 w-10 text-neutral-600" />
              <p className="text-lg font-medium text-white">No internship programs published yet</p>
              <p className="text-sm text-[#8E8E93]">NOVA&apos;s internship programs will appear here.</p>
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

                return (
                  <Link
                    key={ip.id}
                    href={`/internship-programs/${ip.slug}`}
                    className="group flex flex-col justify-between gap-6 p-8 rounded-2xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {ip.programs?.name && (
                            <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-[11px] font-medium text-neutral-300">
                              {ip.programs.name}
                            </span>
                          )}
                          {availableTracks.map((weeks) => (
                            <span
                              key={weeks}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-[11px] font-medium text-neutral-300"
                            >
                              <Clock className="h-3 w-3 text-neutral-400" />
                              {DURATION_LABELS[weeks] ?? `${weeks}w`}
                            </span>
                          ))}
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition-colors shrink-0 mt-0.5" />
                      </div>

                      <h2 className="text-xl font-medium text-white group-hover:text-[#EDEDED] transition-colors leading-snug">
                        {ip.name}
                      </h2>
                      <p className="text-sm text-[#8E8E93] leading-relaxed line-clamp-3 font-normal">
                        {ip.short_description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-5 border-t border-white/[0.06]">
                      <span className="font-mono text-[11px] text-neutral-500">
                        {openInternships.length}{" "}
                        {openInternships.length === 1 ? "opening" : "open opportunities"}
                      </span>
                      <span className="font-mono text-[11px] font-medium text-white uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
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
      <section className="py-14 bg-[#050508] border-t border-white/[0.08]">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-white">Ready to browse live openings?</p>
            <p className="text-sm text-[#8E8E93]">View all individual open internship roles.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/internships"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EDEDED] hover:bg-white text-black text-sm font-medium transition-all"
            >
              <BookOpen className="h-4 w-4" />
              Browse Open Internships
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
