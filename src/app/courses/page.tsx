import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { CareersSubNav } from "@/components/marketing/careers-sub-nav";
import { createServerSideClient } from "@/lib/supabase";
import { BookOpen, Clock, ArrowUpRight, Layers, AlertCircle, Inbox } from "lucide-react";

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
    <div className="min-h-screen bg-[#07070A] text-white">
      <SiteHeader transparent />
      <CareersSubNav />

      {/* HERO */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 bg-[#07070A] border-b border-white/10 overflow-hidden">
        <div className="absolute top-1/3 left-0 w-[500px] h-[400px] rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 font-mono text-[10px] font-bold text-emerald-300 uppercase tracking-[0.2em]">
                  <BookOpen className="h-3 w-3" />
                  LEARNING &amp; GROWTH
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-black tracking-tight text-white uppercase leading-[0.92]">
                COURSE<br />
                <span className="bg-gradient-to-r from-emerald-200 via-cyan-200 to-white bg-clip-text text-transparent">
                  CATALOG
                </span>
              </h1>

              <p className="text-base sm:text-lg text-neutral-300 font-normal leading-relaxed max-w-xl">
                Hands-on technical modules organized by learning program. Every course maps directly to the skills you build in NOVA squads.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Beginner
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> Intermediate
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-400" /> Advanced
                </span>
              </div>
            </div>

            <div className="hidden lg:block lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10">
              <Image
                src="/images/cards/learn.jpg"
                alt="NOVA Course Catalog"
                fill
                priority
                sizes="500px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070A] via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 font-mono text-xs font-bold text-emerald-300 uppercase tracking-wider">
                {rows.length} PUBLISHED COURSES · {groups.length} PROGRAMS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COURSE GROUPS */}
      <section className="py-14 sm:py-20 bg-[#09090D]">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-16">

          {error ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-lg font-semibold text-white">Couldn&apos;t load courses</p>
              <p className="text-sm text-neutral-400">Something went wrong. Please try again.</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Inbox className="h-10 w-10 text-neutral-500" />
              <p className="text-lg font-semibold text-white">No courses published yet</p>
              <p className="text-sm text-neutral-400">NOVA&apos;s course catalog will appear here.</p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.slug} className="flex flex-col gap-6">
                {/* Program Header */}
                <div className="flex items-end justify-between gap-6 pb-4 border-b border-white/10">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald-400" />
                      <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-[0.22em]">
                        LEARNING PROGRAM
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                      {group.name}
                    </h2>
                    <p className="text-xs text-neutral-500 font-mono">
                      {group.courses.length} {group.courses.length === 1 ? "course" : "courses"}
                    </p>
                  </div>
                  <Link
                    href={`/programs/${group.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider shrink-0"
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
                    const levelColor =
                      LEVEL_COLORS[course.level.toLowerCase()] ??
                      "bg-white/5 text-neutral-300 border-white/10";

                    return (
                      <Link
                        key={course.id}
                        href={`/courses/${course.id}`}
                        className="group flex flex-col justify-between gap-4 p-5 rounded-xl bg-[#111118] border border-white/[0.08] hover:border-emerald-500/40 hover:bg-[#12121C] transition-all"
                      >
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`px-2 py-0.5 rounded border font-mono text-[10px] font-bold uppercase tracking-wider ${levelColor}`}
                          >
                            {course.level}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[10px] text-neutral-400">
                            <Clock className="h-3 w-3" />
                            {course.duration_hours}h
                          </span>
                        </div>

                        {/* Title + Description */}
                        <div className="flex flex-col gap-1.5 flex-1">
                          <p className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors leading-snug">
                            {course.title}
                          </p>
                          <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2 font-normal">
                            {course.description}
                          </p>
                        </div>

                        {/* Skills */}
                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.06]">
                            {skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-[10px] text-neutral-400 font-mono"
                              >
                                {skill}
                              </span>
                            ))}
                            {skills.length > 3 && (
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-[10px] text-neutral-600 font-mono">
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
      <section className="py-12 bg-[#0A0A10] border-t border-white/10">
        <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-white">Want the full program perspective?</p>
            <p className="text-xs text-neutral-400">Browse flagship learning programs with defined career outcomes.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold uppercase tracking-wider transition-colors"
            >
              Learning Programs
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
