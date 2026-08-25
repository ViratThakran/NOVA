import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, ChevronRight, Clock, BarChart2, Tag, Sparkles } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Learning Programs | NOVA" };

const CATEGORY_LABELS: Record<string, string> = {
  ai_ml: "AI & Machine Learning",
  data_analytics: "Data Analytics",
  software_development: "Software Development",
  cybersecurity: "Cybersecurity",
  cloud_devops: "Cloud & DevOps",
  design: "Design",
  emerging_tech: "Emerging Technologies",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  intermediate: "bg-sky-50 text-sky-700 border-sky-200",
  advanced: "bg-purple-50 text-purple-700 border-purple-200",
};

interface ProgramRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  category: string;
  difficulty: string;
  duration_weeks: number;
}

export default async function StudentProgramsPage() {
  const supabase = await createServerSideClient();

  const { data: rawPrograms, error } = await supabase
    .from("programs")
    .select("id, slug, name, short_description, category, difficulty, duration_weeks")
    .eq("status", "published")
    .order("display_order", { ascending: true });

  const programs = (rawPrograms as ProgramRow[] | null) ?? [];

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col gap-2 pb-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" /> Learning Tracks &amp; Curricula
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-sky-600" />
          Learning Programs Catalog
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Explore NOVA&apos;s structured career-oriented tracks to build your technical capabilities.
        </p>
      </div>

      {/* PROGRAMS GRID WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load programs. Please try again.</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <BookOpen className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No Programs Published Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            NOVA&apos;s learning programs will appear here as they become available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {programs.map((program) => {
            const difficultyClass = DIFFICULTY_COLORS[program.difficulty] ?? "bg-slate-50 text-slate-600 border-slate-200";
            const categoryLabel = CATEGORY_LABELS[program.category] ?? program.category;

            return (
              <div
                key={program.id}
                className="group flex flex-col justify-between gap-4 p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/95 hover:border-sky-300/80 hover:shadow-[0_14px_35px_rgba(14,165,233,0.12)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-slate-50/80 text-slate-600 border-slate-200 flex items-center gap-1">
                      <Tag className="h-3 w-3 text-slate-400" />
                      {categoryLabel}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${difficultyClass}`}>
                      <BarChart2 className="h-3 w-3 inline mr-0.5" />
                      {program.difficulty}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-slate-50/80 text-slate-600 border-slate-200 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {program.duration_weeks}w
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {program.name}
                  </h2>

                  <p className="text-xs sm:text-[13px] text-slate-600 line-clamp-2 leading-relaxed">
                    {program.short_description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 group-hover:text-sky-700">
                    Explore Program Syllabus
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
