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
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-sky-600" />
            Course Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage individual modular courses across all learning programs.
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Course
        </Link>
      </div>

      {/* TOOLBAR WITH GLASSMORPHISM */}
      <div className="flex flex-col gap-3 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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

          {/* Search */}
          <form method="GET" action="/admin/courses" className="relative sm:w-64">
            {filter !== "all" && <input type="hidden" name="status" value={filter} />}
            {rawProgramId && <input type="hidden" name="program_id" value={rawProgramId} />}
            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={rawQuery || ""}
              placeholder="Search courses..."
              className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </form>
        </div>

        {/* Program filter row */}
        {programs.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">Filter by Program:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <Link
                href={filter !== "all" ? `/admin/courses?status=${filter}` : "/admin/courses"}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  !rawProgramId
                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Programs
              </Link>
              {programs.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/courses?program_id=${p.id}${filter !== "all" ? `&status=${filter}` : ""}`}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    rawProgramId === p.id
                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                      : "bg-slate-100/80 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TABLE WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load courses.</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <BookOpen className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No courses match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "Courses you create will appear here."}
          </p>
          <Link
            href="/admin/courses/new"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Course
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Course Title</th>
                  <th className="py-4 px-5">Program</th>
                  <th className="py-4 px-5">Level</th>
                  <th className="py-4 px-5 text-center">Duration</th>
                  <th className="py-4 px-5">Publish Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {courses.map((course) => {
                  const statusStyle =
                    course.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : course.status === "archived"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200";

                  return (
                    <tr key={course.id} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="font-bold text-slate-900 hover:text-sky-600 text-xs sm:text-sm transition-colors"
                          >
                            {course.title}
                          </Link>
                          <span className="text-[11px] text-slate-500 font-mono">{course.slug}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {course.programs ? (
                          <Link
                            href={`/admin/programs/${course.programs.id}`}
                            className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-medium transition-colors"
                          >
                            <Layers className="h-3.5 w-3.5 text-sky-600" />
                            {course.programs.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-slate-700 font-medium capitalize">{course.level}</td>

                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center gap-1 justify-center text-slate-600 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {course.duration_hours}h
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${statusStyle}`}>
                          {course.status}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 uppercase tracking-wider"
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
        </div>
      )}
    </div>
  );
}
