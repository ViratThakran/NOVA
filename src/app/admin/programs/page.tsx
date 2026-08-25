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
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="h-6 w-6 text-sky-600" />
            Learning Programs Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage career-oriented tracks, their publish state, linked courses, and curricula.
          </p>
        </div>
        <Link
          href="/admin/programs/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Program
        </Link>
      </div>

      {/* TOOLBAR WITH GLASSMORPHISM */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => {
            const isSelected = filter === f.value;
            return (
              <Link
                key={f.value}
                href={f.value === "all" ? "/admin/programs" : `/admin/programs?status=${f.value}`}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-[#0F172A] text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        <form method="GET" action="/admin/programs" className="relative sm:w-64">
          {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search programs..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* DATA TABLE WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load programs.</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Layers className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No programs match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "Learning programs you create will appear here."}
          </p>
          <Link
            href="/admin/programs/new"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Program
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Program Title</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Difficulty</th>
                  <th className="py-4 px-5 text-center">Courses</th>
                  <th className="py-4 px-5">Duration</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {programs.map((program) => {
                  const courseCount = program.courses?.[0]?.count ?? 0;
                  const statusStyle =
                    program.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : program.status === "draft"
                      ? "bg-slate-50 text-slate-600 border-slate-200"
                      : "bg-amber-50 text-amber-700 border-amber-200";

                  return (
                    <tr key={program.id} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-900 text-xs sm:text-sm">
                        <Link
                          href={`/admin/programs/${program.id}`}
                          className="hover:text-sky-600 transition-colors"
                        >
                          {program.name}
                        </Link>
                      </td>

                      <td className="py-4 px-5">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold uppercase">
                          {program.category}
                        </span>
                      </td>

                      <td className="py-4 px-5 capitalize text-slate-700 font-medium">
                        {program.difficulty}
                      </td>

                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
                          <BookOpen className="h-3 w-3" />
                          {courseCount}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-slate-600 font-medium">
                        {program.duration_weeks} weeks
                      </td>

                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${statusStyle}`}>
                          {program.status}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/admin/programs/${program.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 uppercase tracking-wider"
                        >
                          Edit
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
