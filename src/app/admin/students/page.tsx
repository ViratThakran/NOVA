import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users, FileText, CheckCircle2, ChevronRight, Calendar, ShieldCheck } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Student Candidates | NOVA Admin" };

interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  onboarded: boolean;
  created_at: string;
}

const FILTERS = [
  { value: "all", label: "All Students" },
  { value: "onboarded", label: "Onboarded" },
  { value: "pending", label: "Not Onboarded" },
] as const;

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { filter: rawFilter, q: rawQuery } = await searchParams;
  const filter = rawFilter || "all";
  const searchQuery = rawQuery ? rawQuery.trim().toLowerCase() : "";

  const supabase = await createServerSideClient();

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "student");

  if (roleError) {
    return (
      <div className="flex flex-col gap-6 text-slate-800">
        <PageTitle />
        <ErrorPanel message="Couldn't load student role assignments." />
      </div>
    );
  }

  const studentIds = (roleRows ?? []).map((r) => r.user_id as string);

  if (studentIds.length === 0) {
    return (
      <div className="flex flex-col gap-6 text-slate-800">
        <PageTitle />
        <EmptyPanel message="No students have registered yet. Student accounts will appear here." />
      </div>
    );
  }

  const [
    { data: profiles, error: profilesError },
    { data: applications },
    { data: enrollments },
    { data: studentProfiles },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, first_name, last_name, onboarded, created_at")
      .in("id", studentIds)
      .order("created_at", { ascending: false }),
    supabase.from("applications").select("student_id, status").in("student_id", studentIds),
    supabase.from("enrollments").select("student_id, status").in("student_id", studentIds),
    supabase
      .from("student_profiles")
      .select("id, skills")
      .in("id", studentIds),
  ]);

  if (profilesError) {
    return (
      <div className="flex flex-col gap-6 text-slate-800">
        <PageTitle />
        <ErrorPanel message="Couldn't load student profiles." />
      </div>
    );
  }

  const applicationCounts = new Map<string, number>();
  const activeEnrollment = new Map<string, boolean>();
  const skillsMap = new Map<string, string[]>();

  for (const row of applications ?? []) {
    applicationCounts.set(row.student_id, (applicationCounts.get(row.student_id) ?? 0) + 1);
  }
  for (const row of enrollments ?? []) {
    if (row.status === "active") activeEnrollment.set(row.student_id, true);
  }
  for (const sp of studentProfiles ?? []) {
    if (sp.skills) skillsMap.set(sp.id, sp.skills as string[]);
  }

  let students = (profiles ?? []) as ProfileRow[];

  // Apply onboarded filter
  if (filter === "onboarded") {
    students = students.filter((s) => s.onboarded);
  } else if (filter === "pending") {
    students = students.filter((s) => !s.onboarded);
  }

  // Apply search
  if (searchQuery) {
    students = students.filter((s) => {
      const name = [s.first_name, s.last_name].filter(Boolean).join(" ").toLowerCase();
      return name.includes(searchQuery) || s.email.toLowerCase().includes(searchQuery);
    });
  }

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-600" />
            Student Candidate Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {studentIds.length} registered candidate{studentIds.length !== 1 ? "s" : ""} · Manage student profiles, applications, and active builder squad residencies.
          </p>
        </div>
      </div>

      {/* TOOLBAR WITH GLASSMORPHISM */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => {
            const isSelected = filter === f.value;
            return (
              <Link
                key={f.value}
                href={f.value === "all" ? "/admin/students" : `/admin/students?filter=${f.value}`}
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

        <form method="GET" action="/admin/students" className="relative sm:w-64">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* TABLE WITH GLASSMORPHISM */}
      {students.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Users className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No students match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "Students will appear here when registered."}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Candidate</th>
                  <th className="py-4 px-5">Onboarding</th>
                  <th className="py-4 px-5 text-center">Applications</th>
                  <th className="py-4 px-5">Residency</th>
                  <th className="py-4 px-5">Registered</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((student) => {
                  const name =
                    [student.first_name, student.last_name].filter(Boolean).join(" ") || student.email;
                  const appCount = applicationCounts.get(student.id) ?? 0;
                  const isActive = activeEnrollment.get(student.id) ?? false;
                  const skills = skillsMap.get(student.id) ?? [];
                  const date = new Date(student.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={student.id} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="font-bold text-slate-900 hover:text-sky-600 text-xs sm:text-sm transition-colors leading-snug"
                          >
                            {name}
                          </Link>
                          <span className="text-[11px] text-slate-500">{student.email}</span>
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {skills.slice(0, 3).map((sk) => (
                                <span
                                  key={sk}
                                  className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-medium"
                                >
                                  {sk}
                                </span>
                              ))}
                              {skills.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  +{skills.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${
                            student.onboarded
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {student.onboarded ? "Complete" : "Pending"}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <Link
                          href="/admin/applications"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition-colors"
                        >
                          <FileText className="h-3 w-3" />
                          {appCount}
                        </Link>
                      </td>

                      <td className="py-4 px-5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 uppercase">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {date}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 uppercase tracking-wider"
                        >
                          View Profile
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

function PageTitle() {
  return (
    <div className="flex flex-col gap-1 pb-1">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
        <Users className="h-6 w-6 text-sky-600" />
        Student Candidate Registry
      </h1>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
      <p className="text-sm font-semibold text-red-600">{message}</p>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <Users className="h-10 w-10 text-slate-300" />
      <p className="text-sm font-bold text-slate-800">No students yet</p>
      <p className="text-xs text-slate-500 max-w-sm">{message}</p>
    </div>
  );
}
