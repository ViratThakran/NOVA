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
      <div className="flex flex-col gap-6">
        <PageTitle />
        <ErrorPanel message="Couldn't load student role assignments." />
      </div>
    );
  }

  const studentIds = (roleRows ?? []).map((r) => r.user_id as string);

  if (studentIds.length === 0) {
    return (
      <div className="flex flex-col gap-6">
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
      <div className="flex flex-col gap-6">
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
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            STUDENT CANDIDATE REGISTRY
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {studentIds.length} registered candidate{studentIds.length !== 1 ? "s" : ""} · Manage profiles, applications, and active residencies.
          </p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0E131F] p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => {
            const isSelected = filter === f.value;
            return (
              <Link
                key={f.value}
                href={f.value === "all" ? "/admin/students" : `/admin/students?filter=${f.value}`}
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

        <form method="GET" action="/admin/students" className="relative sm:w-64">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </form>
      </div>

      {/* TABLE */}
      {students.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <Users className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No students match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "Students will appear here when registered."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Onboarding</th>
                <th className="py-3 px-4 text-center">Applications</th>
                <th className="py-3 px-4">Residency</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
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
                  <tr key={student.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="font-bold text-white hover:text-indigo-300 transition-colors leading-snug"
                        >
                          {name}
                        </Link>
                        <span className="text-[11px] font-mono text-slate-400">{student.email}</span>
                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {skills.slice(0, 3).map((sk) => (
                              <span
                                key={sk}
                                className="px-1.5 py-px rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-400"
                              >
                                {sk}
                              </span>
                            ))}
                            {skills.length > 3 && (
                              <span className="font-mono text-[10px] text-slate-500">
                                +{skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                          student.onboarded
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {student.onboarded ? "Complete" : "Pending"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/admin/applications`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 font-bold"
                      >
                        <FileText className="h-3 w-3" />
                        {appCount}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/40 text-[10px] font-bold text-emerald-300 uppercase">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px] font-mono">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {date}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
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
      )}
    </div>
  );
}

function PageTitle() {
  return (
    <div className="pb-4 border-b border-slate-800/80">
      <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
        STUDENT CANDIDATE REGISTRY
      </h1>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
      <p className="text-sm font-semibold text-red-300 font-mono">{message}</p>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
      <Users className="h-10 w-10 text-slate-600" />
      <p className="text-sm font-bold text-slate-300 font-mono">No students yet</p>
      <p className="text-xs text-slate-500 max-w-sm">{message}</p>
    </div>
  );
}
