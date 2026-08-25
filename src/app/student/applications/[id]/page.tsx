import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ArrowLeft, Building2, Calendar, FileText, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";

export const metadata: Metadata = { title: "Application Details | NOVA" };

const idSchema = z.string().uuid();

interface ApplicationDetailRow {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  updated_at: string;
  internship: {
    id: string;
    title: string;
    description: string;
    requirements: string;
    eligibility: string;
    companies: { name: string } | null;
  } | null;
}

export default async function StudentApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const notFoundState = (
    <div className="flex flex-col gap-6 text-slate-800">
      <Link
        href="/student/applications"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Applications Tracker
      </Link>
      <div className="p-12 rounded-2xl bg-white border border-slate-100 text-center flex flex-col items-center gap-3 shadow-xs">
        <AlertCircle className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-bold text-slate-800">Application Not Found</p>
        <p className="text-xs text-slate-500 max-w-sm">
          This application doesn&apos;t exist or is not associated with your account.
        </p>
      </div>
    </div>
  );

  if (!idSchema.safeParse(id).success) {
    return notFoundState;
  }

  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFoundState;
  }

  // Explicit student_id scoping on top of RLS
  const { data: application, error } = await supabase
    .from("applications")
    .select(
      "id, status, cover_letter, created_at, updated_at, internship:internships(id, title, description, requirements, eligibility, companies(name))"
    )
    .eq("id", id)
    .eq("student_id", user.id)
    .maybeSingle();

  if (error || !application) {
    return notFoundState;
  }

  const app = application as unknown as ApplicationDetailRow;
  const companyName = app.internship?.companies?.name || "NOVA Partner Company";
  const appliedDate = new Date(app.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let enrollmentId: string | null = null;
  if (app.status === "accepted") {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("application_id", app.id)
      .maybeSingle();
    enrollmentId = enrollment?.id ?? null;
  }

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* BACK LINK */}
      <Link
        href="/student/applications"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Applications Tracker
      </Link>

      {/* HEADER BANNER */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-sky-600" /> {companyName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {app.internship?.title || "Internship Position"}
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Submitted on {appliedDate}
          </p>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
          <span className="text-xs text-slate-600 font-semibold">Review Status:</span>
          <ApplicationStatusBadge status={app.status} />
        </div>
      </div>

      {/* ACCEPTED BANNER HAND-OFF */}
      {app.status === "accepted" && (
        <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Application Accepted — Residency Created
              </span>
              <p className="text-xs text-slate-600">
                Congratulations! Your application has been accepted by the selection team. Your active residency profile is ready.
              </p>
            </div>
          </div>

          <Link
            href={enrollmentId ? `/student/enrollments/${enrollmentId}` : "/student/enrollments"}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            Open My Residency Details <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SUBMITTED COVER LETTER */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-600" />
              Your Submitted Cover Letter / Statement
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
              {app.cover_letter || "No cover letter was submitted with this application."}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: POSITION SPECIFICATION SUMMARY */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Position Details
            </h3>
            {app.internship && (
              <div className="flex flex-col gap-4">
                <Section title="Description" body={app.internship.description} />
                <Section title="Requirements" body={app.internship.requirements} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
      <p className="whitespace-pre-line text-xs sm:text-[13px] text-slate-600 leading-relaxed">{body}</p>
    </div>
  );
}
