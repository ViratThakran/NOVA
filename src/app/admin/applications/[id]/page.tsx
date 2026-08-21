import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ArrowLeft, User, GraduationCap, FileText, Building2, Calendar, CheckCircle2, History, Briefcase } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";
import { getAuthenticatedUser } from "@/lib/auth";
import { canMarkUnderReview, canReview } from "@/lib/admin-review-view-state";
import { ReviewActionButtons } from "./review-actions";

export const metadata: Metadata = { title: "Application Review Workspace | NOVA Admin" };

const idSchema = z.string().uuid();

interface AdminApplicationDetailRow {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  updated_at: string;
  internship: { id: string; title: string; description: string; requirements: string; eligibility: string; companies: { name: string } | null } | null;
  student: {
    id: string;
    education_info: { school?: string; degree?: string; grad_year?: number } | null;
    skills: string[] | null;
    profiles: { first_name: string | null; last_name: string | null; email: string } | null;
  } | null;
}

interface ReviewAuditLogRow {
  id: string;
  action: string;
  changes: { previous_status?: string; new_status?: string; feedback?: string | null } | null;
  created_at: string;
}

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!idSchema.safeParse(id).success) {
    return (
      <div className="flex flex-col gap-6">
        <Link href="/admin/applications" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Queue
        </Link>
        <div className="p-8 rounded-xl bg-[#0E131F] border border-slate-800 text-center text-slate-400 font-mono text-sm">
          Application not found (Invalid ID)
        </div>
      </div>
    );
  }

  const auth = await getAuthenticatedUser();
  if (!auth) {
    return null;
  }
  const { supabase } = auth;

  const { data: application, error } = await supabase
    .from("applications")
    .select(
      "id, status, cover_letter, created_at, updated_at, " +
        "internship:internships(id, title, description, requirements, eligibility, companies(name)), " +
        "student:student_profiles(id, education_info, skills, profiles(first_name, last_name, email))"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !application) {
    return (
      <div className="flex flex-col gap-6">
        <Link href="/admin/applications" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Queue
        </Link>
        <div className="p-8 rounded-xl bg-[#0E131F] border border-slate-800 text-center text-slate-400 font-mono text-sm">
          Application not found or unavailable
        </div>
      </div>
    );
  }

  const app = application as unknown as AdminApplicationDetailRow;
  const profile = app.student?.profiles;
  const studentName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email
    : "Unknown Student";
  const education = app.student?.education_info;
  const dateSubmitted = new Date(app.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { data: reviewHistory } = await supabase
    .from("audit_logs")
    .select("id, action, changes, created_at")
    .eq("resource_type", "application")
    .eq("resource_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      {/* NAVIGATION & TOP HEADER */}
      <div className="flex flex-col gap-2 pb-4 border-b border-slate-800/80">
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Applications Queue
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-white">
                {studentName}
              </h1>
              <ApplicationStatusBadge status={app.status} />
            </div>
            <p className="text-xs font-mono text-slate-400">
              Applied for{" "}
              <span className="text-indigo-300 font-semibold">{app.internship?.title || "Opportunity"}</span> · Submitted {dateSubmitted}
            </p>
          </div>

          {app.status === "accepted" && (
            <Link
              href="/admin/enrollments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider hover:bg-emerald-900 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              View Active Residency
            </Link>
          )}
        </div>
      </div>

      {/* 2-COLUMN REVIEW STAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (Col 8): Candidate Info & Cover Letter */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Candidate Profile Details */}
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Candidate Profile &amp; Background
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-500">ID: {app.student?.id.slice(0, 8)}...</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Email Contact</span>
                <span className="text-slate-200 font-semibold">{profile?.email || "N/A"}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Academic Institution</span>
                <span className="text-slate-200 font-semibold">{education?.school || "Not provided"}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Degree Program</span>
                <span className="text-slate-200 font-semibold">{education?.degree || "Not provided"}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Graduation Year</span>
                <span className="text-slate-200 font-semibold">{education?.grad_year || "Not provided"}</span>
              </div>
            </div>

            {/* Skills */}
            {app.student?.skills && app.student.skills.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  VERIFIED CANDIDATE SKILLS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {app.student.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submission Cover Letter */}
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <FileText className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Submitted Statement / Cover Letter
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-lg border border-slate-800">
              {app.cover_letter || "No statement or cover letter submitted."}
            </p>
          </div>

          {/* Target Opportunity Details */}
          {app.internship && (
            <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Target Residency Details
                  </h2>
                </div>
                <Link
                  href={`/admin/internships/${app.internship.id}`}
                  className="text-xs font-mono text-indigo-400 hover:underline uppercase tracking-wider"
                >
                  Manage Internship →
                </Link>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase">Hiring Company</span>
                  <p className="font-semibold text-slate-200">{app.internship.companies?.name || "Platform Direct"}</p>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase">Description</span>
                  <p className="text-slate-400 leading-relaxed mt-0.5">{app.internship.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Review Audit Trail */}
          {reviewHistory && reviewHistory.length > 0 && (
            <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <History className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Review Audit History
                </h2>
              </div>
              <div className="flex flex-col divide-y divide-slate-800/60 font-mono text-xs">
                {(reviewHistory as ReviewAuditLogRow[]).map((entry) => (
                  <div key={entry.id} className="py-3 flex flex-col gap-1 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold text-indigo-300">
                        {entry.changes?.previous_status || "?"} → {entry.changes?.new_status || "?"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                    {entry.changes?.feedback && (
                      <p className="text-slate-400 font-sans italic text-[11px] bg-slate-900/40 p-2 rounded border border-slate-800">
                        &quot;{entry.changes.feedback}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (Col 4): Review Actions Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-20">
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em] pb-2 border-b border-slate-800/80">
              OPERATIONAL DECISION PANEL
            </span>

            <ReviewActionButtons
              applicationId={app.id}
              canMarkUnderReview={canMarkUnderReview(app.status)}
              canReview={canReview(app.status)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
