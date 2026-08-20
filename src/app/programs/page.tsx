import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { CareersSubNav } from "@/components/marketing/careers-sub-nav";
import { createServerSideClient } from "@/lib/supabase";
import { ArrowUpRight, Clock, Award, AlertCircle, Inbox, BookOpen, Target } from "lucide-react";

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
    <div className="min-h-screen bg-[#07070A] text-white">
      <SiteHeader transparent />
      <CareersSubNav />

      {/* HERO */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 bg-[#07070A] border-b border-white/10 overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 font-mono text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em]">
                  <Award className="h-3 w-3" />
                  FLAGSHIP PROGRAMS
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-black tracking-tight text-white uppercase leading-[0.92]">
                LEARNING<br />
                <span className="bg-gradient-to-r from-indigo-200 via-emerald-200 to-white bg-clip-text text-transparent">
                  PROGRAMS
                </span>
              </h1>

              <p className="text-base sm:text-lg text-neutral-300 font-normal leading-relaxed max-w-xl">
                Career-oriented programs that take you from fundamentals to a demonstrable, production-tested skill set. Not a course list — a defined outcome.
              </p>

              {/* Distinction from Courses */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3">
                <Target className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">Programs vs. Courses</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Programs are structured career paths with defined outcomes. Courses are the individual modules within each program.{" "}
                    <Link href="/courses" className="text-emerald-400 hover:underline">Browse course catalog →</Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10">
              <Image
                src="/images/cards/grow.jpg"
                alt="NOVA Learning Programs"
                fill
                priority
                sizes="500px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070A] via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 font-mono text-xs font-bold text-indigo-300 uppercase tracking-wider">
                {rows.length} FLAGSHIP PROGRAMS · DEFINED OUTCOMES
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAM LISTING */}
      <section className="py-14 sm:py-20 bg-[#09090D]">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-8">

          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-300">
              <span className="font-semibold text-white">{rows.length}</span>{" "}
              {rows.length === 1 ? "program" : "programs"} available
            </p>
            <Link
              href="/courses"
              className="text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
            >
              Browse Individual Courses →
            </Link>
          </div>

          {error ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-lg font-semibold text-white">Couldn&apos;t load programs</p>
              <p className="text-sm text-neutral-400">Something went wrong. Please try again.</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Inbox className="h-10 w-10 text-neutral-500" />
              <p className="text-lg font-semibold text-white">No programs published yet</p>
              <p className="text-sm text-neutral-400">NOVA&apos;s learning programs will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rows.map((program) => {
                const skills = program.program_skills
                  .map((ps) => ps.skills?.name)
                  .filter(Boolean) as string[];
                const catColor =
                  CATEGORY_COLORS[program.category] ??
                  "bg-white/5 text-neutral-300 border-white/10";
                const diffColor =
                  DIFFICULTY_COLORS[program.difficulty.toLowerCase()] ?? "text-neutral-300";

                return (
                  <Link
                    key={program.id}
                    href={`/programs/${program.slug}`}
                    className="group flex flex-col justify-between gap-6 p-8 rounded-2xl bg-[#111118] border border-white/10 hover:border-indigo-500/40 hover:bg-[#12121C] transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2.5 py-1 rounded-md border font-mono text-[10px] font-bold uppercase tracking-wider ${catColor}`}>
                            {CATEGORY_LABELS[program.category] ?? program.category}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-white/10 bg-white/5 font-mono text-[10px] text-neutral-400">
                            <Clock className="h-3 w-3" />
                            {program.duration_weeks}w
                          </span>
                          <span className={`font-mono text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-white/10 bg-white/5 ${diffColor}`}>
                            {program.difficulty}
                          </span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-neutral-600 group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5" />
                      </div>

                      <h2 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors leading-snug">
                        {program.name}
                      </h2>
                      <p className="text-sm text-neutral-500 leading-relaxed line-clamp-3 font-normal">
                        {program.short_description}
                      </p>
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-[10px] text-neutral-400 font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                        {skills.length > 5 && (
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-[10px] text-neutral-600 font-mono">
                            +{skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Career Outcomes */}
                    {program.career_outcomes.length > 0 && (
                      <div className="pt-4 border-t border-white/[0.07] flex flex-col gap-1.5">
                        <span className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest">CAREER OUTCOMES</span>
                        <p className="text-xs text-neutral-400 leading-relaxed">
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
      <section className="py-12 bg-[#0A0A10] border-t border-white/10">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-white">Ready to put it into practice?</p>
            <p className="text-xs text-neutral-400">Browse live internship residencies and open roles.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/internships"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold uppercase tracking-wider transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Browse Internships
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
