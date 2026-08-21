import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, BookOpen, ChevronRight, Layers, Clock } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Course Catalog | NOVA Admin" };

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

interface AdminCourseRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  duration_hours: number;
  status: string;
  display_order: number;
  programs: { id: string; name: string } | null;
}

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; program_id?: string }>;
}) {
  const { status: rawFilter, q: rawQuery, program_id: rawProgramId } = await searchParams;
  const filter = normalizeFilter(rawFilter);
  const searchQuery = rawQuery ? rawQuery.trim().toLowerCase() : "";

  const supabase = await createServerSideClient();

  // Fetch programs for the filter dropdown
  const { data: programsList } = await supabase
    .from("programs")
    .select("id, name")
    .order("display_order", { ascending: true });

  let query = supabase
    .from("courses")
    .select("id, title, slug, description, level, duration_hours, status, display_order, programs(id, name)")
    .order("display_order", { ascending: true });

  if (filter !== "all") query = query.eq("status", filter);
  if (rawProgramId) query = query.eq("program_id", rawProgramId);

  const { data: rawCourses, error } = await query;
  let courses = (rawCourses as unknown as AdminCourseRow[] | null) ?? [];

  if (searchQuery) {
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery) ||
        (c.programs?.name && c.programs.name.toLowerCase().includes(searchQuery)) ||
        c.level.toLowerCase().includes(searchQuery)
    );
  }

  const programs = (programsList ?? []) as { id: string; name: string }[];

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            COURSE CATALOG
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Manage individual courses across all learning programs.
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Course
        </Link>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 bg-[#0E131F] p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {FILTERS.map((f) => {
              const isSelected = filter === f.value;
              const href = new URLSearchParams({
                ...(f.value !== "all" && { status: f.value }),
                ...(rawProgramId && { program_id: rawProgramId }),
                ...(rawQuery && { q: rawQuery }),
              });
              return (
                <Link
                  key={f.value}
                  href={`/admin/courses${href.toString() ? `?${href}` : ""}`}
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

          {/* Search */}
          <form method="GET" action="/admin/courses" className="relative sm:w-64">
            {filter !== "all" && <input type="hidden" name="status" value={filter} />}
            {rawProgramId && <input type="hidden" name="program_id" value={rawProgramId} />}
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              name="q"
              defaultValue={rawQuery || ""}
              placeholder="Search courses..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </form>
        </div>

        {/* Program filter row */}
        {programs.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider shrink-0">Filter by Program:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <Link
                href={filter !== "all" ? `/admin/courses?status=${filter}` : "/admin/courses"}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase whitespace-nowrap transition-colors ${
                  !rawProgramId
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                All Programs
              </Link>
              {programs.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/courses?program_id=${p.id}${filter !== "all" ? `&status=${filter}` : ""}`}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase whitespace-nowrap transition-colors ${
                    rawProgramId === p.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TABLE */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300">Couldn&apos;t load courses.</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <BookOpen className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No courses match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "Courses you create will appear here."}
          </p>
          <Link
            href="/admin/courses/new"
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Course
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Course Title</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4 text-center">Duration</th>
                <th className="py-3 px-4">Publish Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {courses.map((course) => {
                const statusStyle =
                  course.status === "published"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40"
                    : course.status === "archived"
                    ? "bg-red-950/80 text-red-300 border-red-700/40"
                    : "bg-amber-950/80 text-amber-300 border-amber-700/40";

                return (
                  <tr key={course.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="font-bold text-white hover:text-indigo-300 transition-colors"
                        >
                          {course.title}
                        </Link>
                        <span className="text-[10px] font-mono text-slate-500">{course.slug}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {course.programs ? (
                        <Link
                          href={`/admin/programs/${course.programs.id}`}
                          className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <Layers className="h-3 w-3 text-slate-500" />
                          {course.programs.name}
                        </Link>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 capitalize">{course.level}</td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="flex items-center gap-1 justify-center text-slate-400">
                        <Clock className="h-3 w-3 text-slate-600" />
                        {course.duration_hours}h
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${statusStyle}`}>
                        {course.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/courses/${course.id}`}
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
