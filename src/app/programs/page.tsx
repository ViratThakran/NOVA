import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { createServerSideClient } from "@/lib/supabase";
import { ArrowUpRight, Clock, Award, AlertCircle, Inbox, BookOpen, Target } from "lucide-react";
import { CareerHero } from "@/components/marketing/careers/career-hero";

export const metadata: Metadata = {
  title: "Learning Programs — NOVA",
  description: "NOVA's flagship career-oriented programs, from AI & Machine Learning to Cloud & DevOps. Defined outcomes, structured tracks.",
};

const CATEGORY_LABELS: Record<string, string> = {
  ai_ml: "AI & ML",
  data_analytics: "Data Analytics",
  software_development: "Software Dev",
  cybersecurity: "Cybersecurity",
  cloud_devops: "Cloud & DevOps",
  design: "Design",
  emerging_tech: "Emerging Tech",
};

const CATEGORY_COLORS: Record<string, string> = {
  ai_ml: "bg-violet-950/60 text-violet-300 border-violet-700/40",
  data_analytics: "bg-cyan-950/60 text-cyan-300 border-cyan-700/40",
  software_development: "bg-indigo-950/60 text-indigo-300 border-indigo-700/40",
  cybersecurity: "bg-red-950/60 text-red-300 border-red-700/40",
  cloud_devops: "bg-sky-950/60 text-sky-300 border-sky-700/40",
  design: "bg-pink-950/60 text-pink-300 border-pink-700/40",
  emerging_tech: "bg-amber-950/60 text-amber-300 border-amber-700/40",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-emerald-400",
  intermediate: "text-cyan-400",
  advanced: "text-violet-400",
};

interface ProgramRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  category: string;
  difficulty: string;
  duration_weeks: number;
  career_outcomes: string[];
  program_skills: { skills: { name: string } | null }[];
}

export default async function ProgramsPage() {
  const supabase = await createServerSideClient();

  const { data: programs, error } = await supabase
    .from("programs")
    .select("id, slug, name, short_description, category, difficulty, duration_weeks, career_outcomes, program_skills(skills(name))")
    .eq("status", "published")
    .order("display_order", { ascending: true });

  const rows = (programs as unknown as ProgramRow[] | null) ?? [];

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white selection:text-black">
      <SiteHeader transparent />

      {/* HERO */}
      <CareerHero
        headline="Career Programs"
        description="Flagship tracks engineered for production mastery and verified hiring outcomes."
        primaryCtaLabel="Explore programs"
        primaryCtaHref="#programs"
      >
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-sm font-medium transition-all"
        >
          <span>Browse courses</span>
          <ArrowUpRight className="h-4 w-4 text-neutral-400" />
        </Link>
      </CareerHero>

      {/* PROGRAM LISTING */}
      <section id="programs" className="py-14 sm:py-20 bg-[#000000]">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-8">

          <div className="flex items-center justify-between">
            <p className="text-sm text-[#8E8E93]">
              <span className="font-medium text-white">{rows.length}</span>{" "}
              {rows.length === 1 ? "program" : "programs"} available
            </p>
            <Link
              href="/courses"
              className="text-xs font-mono text-neutral-400 hover:text-white transition-colors uppercase tracking-wider"
            >
              Browse Individual Courses →
            </Link>
          </div>

          {error ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-lg font-medium text-white">Couldn&apos;t load programs</p>
              <p className="text-sm text-[#8E8E93]">Something went wrong. Please try again.</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Inbox className="h-10 w-10 text-neutral-600" />
              <p className="text-lg font-medium text-white">No programs published yet</p>
              <p className="text-sm text-[#8E8E93]">NOVA&apos;s learning programs will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rows.map((program) => {
                const skills = program.program_skills
                  .map((ps) => ps.skills?.name)
                  .filter(Boolean) as string[];

                return (
                  <Link
                    key={program.id}
                    href={`/programs/${program.slug}`}
                    className="group flex flex-col justify-between gap-6 p-8 rounded-2xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-[11px] font-medium text-neutral-300">
                            {CATEGORY_LABELS[program.category] ?? program.category}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-[11px] font-medium text-neutral-300">
                            <Clock className="h-3 w-3 text-neutral-400" />
                            {program.duration_weeks}w
                          </span>
                          <span className="font-mono text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-neutral-300">
                            {program.difficulty}
                          </span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition-colors shrink-0 mt-0.5" />
                      </div>

                      <h2 className="text-xl font-medium text-white group-hover:text-[#EDEDED] transition-colors leading-snug">
                        {program.name}
                      </h2>
                      <p className="text-sm text-[#8E8E93] leading-relaxed line-clamp-3 font-normal">
                        {program.short_description}
                      </p>
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/8 text-[11px] text-neutral-400 font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                        {skills.length > 5 && (
                          <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/8 text-[11px] text-neutral-500 font-mono">
                            +{skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Career Outcomes */}
                    {program.career_outcomes.length > 0 && (
                      <div className="pt-4 border-t border-white/[0.06] flex flex-col gap-1.5">
                        <span className="font-mono text-[11px] text-neutral-500 uppercase tracking-widest">CAREER OUTCOMES</span>
                        <p className="text-xs text-[#8E8E93] leading-relaxed">
                          {program.career_outcomes.slice(0, 3).join(" · ")}
                          {program.career_outcomes.length > 3 && " · …"}
                        </p>
                      </div>
                    )}
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
            <p className="text-base font-medium text-white">Ready to put it into practice?</p>
            <p className="text-sm text-[#8E8E93]">Browse live internship residencies and open roles.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/internships"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EDEDED] hover:bg-white text-black text-sm font-medium transition-all"
            >
              <BookOpen className="h-4 w-4" />
              Browse Internships
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
