import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ArrowLeft, Building2, Calendar, FileText, Briefcase, AlertCircle, Sparkles } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getEnrollmentStatusMeta } from "@/lib/enrollment-view-state";
import { getAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Residency Details | NOVA" };

const idSchema = z.string().uuid();

interface EnrollmentDetailRow {
  id: string;
  status: string;
  application_id: string;
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

export default async function StudentEnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const notFoundState = (
    <div className="flex flex-col gap-6 text-slate-800">
      <Link
        href="/student/enrollments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Residencies
      </Link>
      <div className="p-12 rounded-2xl bg-white border border-slate-100 text-center flex flex-col items-center gap-3 shadow-xs">
        <AlertCircle className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-bold text-slate-800">Residency Not Found</p>
        <p className="text-xs text-slate-500 max-w-sm">
          This residency enrollment doesn&apos;t exist or is not associated with your account.
        </p>
      </div>
    </div>
  );

  if (!idSchema.safeParse(id).success) {
    return notFoundState;
  }

  const auth = await getAuthenticatedUser();
  if (!auth) {
    return notFoundState;
  }
  const { supabase, user } = auth;

  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select(
      "id, status, application_id, created_at, updated_at, internship:internships(id, title, description, requirements, eligibility, companies(name))"
    )
    .eq("id", id)
    .eq("student_id", user.id)
    .maybeSingle();

  if (error || !enrollment) {
    return notFoundState;
  }

  const record = enrollment as unknown as EnrollmentDetailRow;
  const { label, variant } = getEnrollmentStatusMeta(record.status);
  const companyName = record.internship?.companies?.name || "NOVA Partner Company";
  const enrolledDate = new Date(record.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* BACK LINK */}
      <Link
        href="/student/enrollments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Residencies
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
            {record.internship?.title || "Residency Position"}
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Enrolled on {enrolledDate}
          </p>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
          <span className="text-xs text-slate-600 font-semibold">Residency Status:</span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              variant === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : variant === "warning"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            {label}
          </span>
        </div>
      </div>

      {/* 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: RESIDENCY SPECIFICATION */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-6">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-600" />
              Residency Position Specifications
            </h3>
            {record.internship && (
              <>
                <Section title="Description" body={record.internship.description} />
                <Section title="Requirements" body={record.internship.requirements} />
                <Section title="Eligibility" body={record.internship.eligibility} />
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LINKED APPLICATION & WORKSPACE */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* AI Mentor Learning Workspace Entry */}
          {record.status === "active" && (
            <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-card to-card border border-emerald-500/20 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-xs font-bold uppercase tracking-wider">AI Internship Workspace</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your AI mentor has configured your practical engineering tasks and milestone roadmap for this residency.
              </p>
              <Link
                href="/student/learning"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all self-start"
              >
                Open Learning Workspace →
              </Link>
            </div>
          )}

          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Linked Application Record
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This residency was created following your accepted application. You can review your original cover letter and application details.
            </p>
            <Link
              href={`/student/applications/${record.application_id}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold shadow-xs transition-colors self-start"
            >
              <FileText className="h-3.5 w-3.5" /> View Original Application
            </Link>
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
