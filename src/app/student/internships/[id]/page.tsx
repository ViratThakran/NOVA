import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ArrowLeft, Building2, Calendar, CheckCircle2, FileText, AlertCircle, Sparkles } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";
import { ApplicationForm } from "./application-form";

export const metadata: Metadata = { title: "Opportunity Details | NOVA" };

const idSchema = z.string().uuid();

interface InternshipDetailRow {
  id: string;
  title: string;
  description: string;
  requirements: string;
  eligibility: string;
  created_at: string;
  companies: { name: string } | null;
}

export default async function StudentInternshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const notFoundState = (
    <div className="flex flex-col gap-6 text-slate-800">
      <Link
        href="/student/internships"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Opportunities Marketplace
      </Link>
      <div className="p-12 rounded-2xl bg-white border border-slate-100 text-center flex flex-col items-center gap-3 shadow-xs">
        <AlertCircle className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-bold text-slate-800">Opportunity Not Found</p>
        <p className="text-xs text-slate-500 max-w-sm">
          This internship position doesn&apos;t exist or is no longer open for applications.
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


  // Parallel server fetching
  const [
    { data: internship, error: internshipError },
    { data: existingApplication },
    { data: profile },
    { data: studentProfile },
  ] = await Promise.all([
    supabase
      .from("internships")
      .select("id, title, description, requirements, eligibility, created_at, companies(name)")
      .eq("id", id)
      .eq("status", "open")
      .maybeSingle(),
    supabase
      .from("applications")
      .select("id, status, cover_letter, created_at")
      .eq("internship_id", id)
      .eq("student_id", user.id)
      .maybeSingle(),
    supabase.from("profiles").select("onboarded").eq("id", user.id).single(),
    supabase.from("student_profiles").select("resume_path").eq("id", user.id).maybeSingle(),
  ]);

  if (internshipError || !internship) {
    return notFoundState;
  }

  const role = internship as unknown as InternshipDetailRow;
  const companyName = role.companies?.name || "NOVA Partner Company";
  const postedDate = new Date(role.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const isOnboarded = Boolean(profile?.onboarded);
  const hasResume = Boolean(studentProfile?.resume_path);
  const isEligibleToApply = isOnboarded && hasResume;

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* BACK LINK */}
      <Link
        href="/student/internships"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Opportunities Marketplace
      </Link>

      {/* HEADER BANNER */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-sky-600" /> {companyName}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 uppercase">
              Open Position
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{role.title}</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Posted {postedDate}
          </p>
        </div>

        {existingApplication && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
            <span className="text-xs text-slate-600 font-semibold">Your Application:</span>
            <ApplicationStatusBadge status={existingApplication.status} />
          </div>
        )}
      </div>

      {/* 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ROLE SPECIFICATION */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-6">
            <Section title="About the Role" body={role.description} />
            <Section title="Requirements &amp; Qualifications" body={role.requirements} />
            <Section title="Eligibility Criteria" body={role.eligibility} />
          </div>
        </div>

        {/* RIGHT COLUMN: APPLICATION DECISION PANEL */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="h-4 w-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Application Panel
              </h2>
            </div>

            {existingApplication ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">Application Submitted</span>
                    <ApplicationStatusBadge status={existingApplication.status} />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your application for <strong className="text-slate-900">{role.title}</strong> has been recorded and is currently in the selection pipeline.
                  </p>
                  <span className="text-[11px] text-slate-400">
                    Submitted {new Date(existingApplication.created_at).toLocaleDateString()}
                  </span>
                </div>

                <Link
                  href={`/student/applications/${existingApplication.id}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <FileText className="h-4 w-4" /> View Submitted Application
                </Link>
              </div>
            ) : !isEligibleToApply ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  Profile Update Required
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You must complete your profile and upload a PDF resume before submitting internship applications.
                </p>
                <Link
                  href="/student/profile"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Upload Resume in Profile →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Profile &amp; Resume Ready — You are eligible to apply.</span>
                </div>
                <ApplicationForm internshipId={id} />
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
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
      <p className="whitespace-pre-line text-xs sm:text-[13px] text-slate-600 leading-relaxed">{body}</p>
    </div>
  );
}
