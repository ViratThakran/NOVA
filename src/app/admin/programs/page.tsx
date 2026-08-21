import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Layers, ChevronRight, BookOpen, Calendar, Star } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Learning Programs | NOVA Admin" };

type StatusFilter = "all" | "draft" | "published" | "archived";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

function normalizeFilter(raw: string | string[] | undefined): StatusFilter {
  if (typeof raw !== "string") return "all";
  return (["all", "draft", "published", "archived"] as const).includes(raw as StatusFilter)
    ? (raw as StatusFilter)
    : "all";
}

interface AdminProgramRow {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  category: string;
  difficulty: string;
  duration_weeks: number;
  status: string;
  display_order: number;
  courses: { count: number }[];
}

export default async function AdminProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: rawFilter, q: rawQuery } = await searchParams;
  const filter = normalizeFilter(rawFilter);
  const searchQuery = rawQuery ? rawQuery.trim().toLowerCase() : "";

  const supabase = await createServerSideClient();

  let query = supabase
    .from("programs")
    .select("id, name, slug, short_description, category, difficulty, duration_weeks, status, display_order, courses(count)")
    .order("display_order", { ascending: true });

  if (filter !== "all") query = query.eq("status", filter);

  const { data: rawPrograms, error } = await query;
  let programs = (rawPrograms as unknown as AdminProgramRow[] | null) ?? [];

  if (searchQuery) {
    programs = programs.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery) ||
        p.slug.toLowerCase().includes(searchQuery)
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            LEARNING PROGRAMS CATALOG
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Manage career-oriented programs, their publish state, courses, and skills.
          </p>
        </div>
        <Link
          href="/admin/programs/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Program
        </Link>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0E131F] p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => {
            const isSelected = filter === f.value;
            return (
              <Link
                key={f.value}
                href={f.value === "all" ? "/admin/programs" : `/admin/programs?status=${f.value}`}
                className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        <form method="GET" action="/admin/programs" className="relative sm:w-64">
          {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search programs..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </form>
      </div>

      {/* DATA TABLE */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300">Couldn&apos;t load programs.</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <Layers className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No programs match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "Learning programs you create will appear here."}
          </p>
          <Link
            href="/admin/programs/new"
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Program
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Program Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4 text-center">Courses</th>
                <th className="py-3 px-4 text-center">Duration</th>
                <th className="py-3 px-4">Publish Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {programs.map((program) => {
                const courseCount = program.courses?.[0]?.count ?? 0;
                const statusStyle =
                  program.status === "published"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40"
                    : program.status === "archived"
                    ? "bg-red-950/80 text-red-300 border-red-700/40"
                    : "bg-amber-950/80 text-amber-300 border-amber-700/40";

                return (
                  <tr key={program.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/admin/programs/${program.id}`}
                          className="font-bold text-white hover:text-indigo-300 transition-colors"
                        >
                          {program.name}
                        </Link>
                        <span className="text-[10px] font-mono text-slate-500">{program.slug}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40 text-[10px] font-bold text-indigo-300 uppercase">
                        {program.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Star className="h-3 w-3 text-slate-500" />
                        {program.difficulty}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/admin/programs/${program.id}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 font-bold"
                      >
                        <BookOpen className="h-3 w-3" />
                        {courseCount}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-400">
                      <span className="flex items-center gap-1 justify-center">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {program.duration_weeks}w
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${statusStyle}`}>
                        {program.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/programs/${program.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                      >
                        Edit / Manage
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
