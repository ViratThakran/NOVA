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
  beginner: "bg-emerald-950/80 text-emerald-300 border-emerald-700/40",
  intermediate: "bg-cyan-950/80 text-cyan-300 border-cyan-700/40",
  advanced: "bg-indigo-950/80 text-indigo-300 border-indigo-700/40",
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
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col gap-2 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-700/40 font-mono text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> LEARNING TRACK
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-400" />
          LEARNING PROGRAMS CATALOG
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Explore NOVA&apos;s structured career-oriented programs to build your technical capabilities.
        </p>
      </div>

      {/* PROGRAMS GRID */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load programs. Please try again.</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <BookOpen className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No Programs Published Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            NOVA&apos;s learning programs will appear here as they become available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((program) => {
            const difficultyClass = DIFFICULTY_COLORS[program.difficulty] ?? "bg-slate-900 text-slate-400 border-slate-700";
            const categoryLabel = CATEGORY_LABELS[program.category] ?? program.category;

            return (
              <div
                key={program.id}
                className="group flex flex-col justify-between gap-4 p-5 rounded-2xl bg-[#0E131F] border border-slate-800 hover:border-indigo-500/40 transition-all"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <span className="px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-slate-400 border-slate-700 flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5" />
                      {categoryLabel}
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${difficultyClass}`}>
                      <BarChart2 className="h-2.5 w-2.5 inline mr-0.5" />
                      {program.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-slate-400 border-slate-700 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {program.duration_weeks}w
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                    {program.name}
                  </h2>

                  <p className="text-xs text-slate-400 font-sans line-clamp-3 leading-relaxed">
                    {program.short_description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <Link
                    href={`/programs/${program.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                  >
                    View Program Details <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
