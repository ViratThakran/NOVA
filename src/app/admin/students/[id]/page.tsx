import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Layers,
  FileText,
  CheckCircle2,
  ChevronRight,
  Calendar,
  Briefcase,
} from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";

export const metadata: Metadata = { title: "Student Profile | NOVA Admin" };

const idSchema = z.string().uuid();

interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  onboarded: boolean;
  created_at: string;
}

interface StudentProfileRow {
  id: string;
  education_info: { school?: string; degree?: string; grad_year?: number } | null;
  skills: string[] | null;
}

interface ApplicationRow {
  id: string;
  status: string;
  created_at: string;
  internship: {
    id: string;
    title: string;
    companies: { name: string } | null;
  } | null;
}

interface EnrollmentRow {
  id: string;
  status: string;
  created_at: string;
  internship: {
    id: string;
    title: string;
    companies: { name: string } | null;
  } | null;
}

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const backLink = (
    <Link
      href="/admin/students"
      className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to Candidate Registry
    </Link>
  );

  if (!idSchema.safeParse(id).success) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <NotFound />
      </div>
    );
  }

  const supabase = await createServerSideClient();

  // Verify this user is actually a student
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("user_id", id)
    .eq("role", "student")
    .maybeSingle();

  if (!roleRow) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <NotFound />
      </div>
    );
  }

  const [
    { data: profile, error: profileError },
    { data: studentProfile },
    { data: applications },
    { data: enrollments },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, first_name, last_name, onboarded, created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("student_profiles")
      .select("id, education_info, skills")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("applications")
      .select("id, status, created_at, internship:internships(id, title, companies(name))")
      .eq("student_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("enrollments")
      .select("id, status, created_at, internship:internships(id, title, companies(name))")
      .eq("student_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (profileError || !profile) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <NotFound />
      </div>
    );
  }

  const p = profile as ProfileRow;
  const sp = studentProfile as StudentProfileRow | null;
  const apps = (applications as unknown as ApplicationRow[] | null) ?? [];
  const enrolls = (enrollments as unknown as EnrollmentRow[] | null) ?? [];

  const studentName = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email;
  const education = sp?.education_info;
  const skills = sp?.skills ?? [];
  const registeredDate = new Date(p.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* NAV */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-800/80">
        {backLink}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{studentName}</h1>
              <span
                className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                  p.onboarded
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {p.onboarded ? "Onboarded" : "Not Onboarded"}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              {p.email} · Registered {registeredDate}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <Link
              href={`/admin/applications`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              {apps.length} Application{apps.length !== 1 ? "s" : ""}
            </Link>
          </div>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Profile + Skills */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Profile Block */}
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <User className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Candidate Identity
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs font-mono">
              <InfoTile label="Full Name" value={studentName} />
              <InfoTile label="Email Address" value={p.email} />
              <InfoTile
                label="Registered"
                value={new Date(p.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
              <InfoTile label="Onboarding Status" value={p.onboarded ? "Complete" : "Pending"} />
            </div>
          </div>

          {/* Education Block */}
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <GraduationCap className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Academic Background
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs font-mono">
              <InfoTile label="Institution" value={education?.school || "Not provided"} />
              <InfoTile label="Degree" value={education?.degree || "Not provided"} />
              <InfoTile label="Graduation Year" value={education?.grad_year?.toString() || "Not provided"} />
            </div>
          </div>

          {/* Skills Block */}
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <Layers className="h-4 w-4 text-violet-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Declared Skills ({skills.length})
              </h2>
            </div>

            {skills.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No skills declared yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Applications + Enrollments */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Applications */}
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Applications ({apps.length})
                </h2>
              </div>
              <Link
                href="/admin/applications"
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
              >
                Full Queue →
              </Link>
            </div>

            {apps.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-2">No applications submitted yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {apps.map((app) => {
                  const date = new Date(app.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={app.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-900/60 border border-slate-800"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-200">
                          {app.internship?.title || "Internship unavailable"}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {app.internship?.companies?.name || "Platform Direct"} · {date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ApplicationStatusBadge status={app.status} />
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                          title="Review application"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enrollments */}
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Residencies &amp; Enrollments ({enrolls.length})
                </h2>
              </div>
              <Link
                href="/admin/enrollments"
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
              >
                All Residencies →
              </Link>
            </div>

            {enrolls.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-2">No active or past residencies.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {enrolls.map((enroll) => {
                  const statusStyle =
                    enroll.status === "active"
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40"
                      : enroll.status === "completed"
                      ? "bg-cyan-950/80 text-cyan-300 border-cyan-700/40"
                      : "bg-red-950/80 text-red-300 border-red-700/40";

                  const date = new Date(enroll.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={enroll.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-900/60 border border-slate-800"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-200">
                          {enroll.internship?.title || "Residency unavailable"}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {enroll.internship?.companies?.name || "Platform Direct"} · Enrolled {date}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase shrink-0 ${statusStyle}`}>
                        {enroll.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
      <span className="text-slate-500 text-[10px] uppercase tracking-wider">{label}</span>
      <span className="text-slate-200 font-semibold leading-snug">{value}</span>
    </div>
  );
}

function NotFound() {
  return (
    <div className="p-8 rounded-xl bg-[#0E131F] border border-slate-800 text-center">
      <p className="text-sm font-mono text-slate-400">Student not found or unavailable.</p>
    </div>
  );
}
