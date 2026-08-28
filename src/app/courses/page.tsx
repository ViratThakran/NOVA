import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { createServerSideClient } from "@/lib/supabase";
import { BookOpen, Clock, ArrowUpRight, Layers, AlertCircle, Inbox } from "lucide-react";
import { CareerHero } from "@/components/marketing/careers/career-hero";

export const metadata: Metadata = {
  title: "Courses — NOVA",
  description: "Browse NOVA's full course catalog, organized by learning program and subject area.",
};

interface CourseRow {
  id: string;
  title: string;
  description: string;
  level: string;
  duration_hours: number;
  display_order: number;
  programs: { slug: string; name: string } | null;
  course_skills: { skills: { name: string } | null }[];
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-emerald-950/60 text-emerald-300 border-emerald-700/40",
  intermediate: "bg-cyan-950/60 text-cyan-300 border-cyan-700/40",
  advanced: "bg-violet-950/60 text-violet-300 border-violet-700/40",
};

export default async function CoursesPage() {
  const supabase = await createServerSideClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, description, level, duration_hours, display_order, programs(slug, name), course_skills(skills(name))")
    .eq("status", "published");

  const rows = (courses as unknown as CourseRow[] | null) ?? [];

  // Group by program — same logic as before
  const byProgram = new Map<string, { name: string; slug: string; courses: CourseRow[] }>();
  for (const course of rows) {
    if (!course.programs) continue;
    const key = course.programs.slug;
    const group = byProgram.get(key) ?? { name: course.programs.name, slug: course.programs.slug, courses: [] };
    group.courses.push(course);
    byProgram.set(key, group);
  }
  for (const group of byProgram.values()) {
    group.courses.sort((a, b) => a.display_order - b.display_order);
  }
  const groups = [...byProgram.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white selection:text-black">
      <SiteHeader transparent />

      {/* HERO */}
      <CareerHero
        headline="Engineering Courses"
        description="Hands-on modular curriculum mapped to real skills required in production squads."
        primaryCtaLabel="Browse courses"
        primaryCtaHref="#catalog"
      >
        <Link
          href="/programs"
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-sm font-medium transition-all"
        >
          <span>Career programs</span>
          <ArrowUpRight className="h-4 w-4 text-neutral-400" />
        </Link>
      </CareerHero>

      {/* COURSE GROUPS */}
      <section id="catalog" className="py-14 sm:py-20 bg-[#000000]">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-16">

          {error ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-lg font-medium text-white">Couldn&apos;t load courses</p>
              <p className="text-sm text-[#8E8E93]">Something went wrong. Please try again.</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Inbox className="h-10 w-10 text-neutral-600" />
              <p className="text-lg font-medium text-white">No courses published yet</p>
              <p className="text-sm text-[#8E8E93]">NOVA&apos;s course catalog will appear here.</p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.slug} className="flex flex-col gap-6">
                {/* Program Header */}
                <div className="flex items-end justify-between gap-6 pb-4 border-b border-white/[0.08]">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-neutral-400" />
                      <span className="font-mono text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                        LEARNING PROGRAM
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
                      {group.name}
                    </h2>
                    <p className="text-xs text-[#8E8E93] font-mono">
                      {group.courses.length} {group.courses.length === 1 ? "course" : "courses"}
                    </p>
                  </div>
                  <Link
                    href={`/programs/${group.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors uppercase tracking-wider shrink-0"
                  >
                    View Program
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.courses.map((course) => {
                    const skills = course.course_skills
                      .map((cs) => cs.skills?.name)
                      .filter(Boolean) as string[];

                    return (
                      <Link
                        key={course.id}
                        href={`/courses/${course.id}`}
                        className="group flex flex-col justify-between gap-4 p-5 rounded-2xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all"
                      >
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-[11px] font-medium text-neutral-300">
                            {course.level}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border border-white/10 bg-white/[0.04] font-mono text-[11px] font-medium text-neutral-400">
                            <Clock className="h-3 w-3" />
                            {course.duration_hours}h
                          </span>
                        </div>

                        {/* Title + Description */}
                        <div className="flex flex-col gap-1.5 flex-1">
                          <p className="text-sm font-medium text-white group-hover:text-white transition-colors leading-snug">
                            {course.title}
                          </p>
                          <p className="text-xs text-[#8E8E93] leading-relaxed line-clamp-2 font-normal">
                            {course.description}
                          </p>
                        </div>

                        {/* Skills */}
                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.06]">
                            {skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/8 text-[10px] text-neutral-400 font-mono"
                              >
                                {skill}
                              </span>
                            ))}
                            {skills.length > 3 && (
                              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/8 text-[10px] text-neutral-500 font-mono">
                                +{skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </section>

      {/* CROSS-LINK */}
      <section className="py-14 bg-[#050508] border-t border-white/[0.08]">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-white">Want the full program perspective?</p>
            <p className="text-sm text-[#8E8E93]">Browse flagship learning programs with defined career outcomes.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EDEDED] hover:bg-white text-black text-sm font-medium transition-all"
            >
              Learning Programs
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
