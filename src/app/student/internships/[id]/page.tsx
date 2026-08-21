import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ArrowLeft, Building2, Calendar, CheckCircle2, FileText, AlertCircle, Sparkles } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
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
    <div className="flex flex-col gap-6">
      <Link
        href="/student/internships"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Opportunities Marketplace
      </Link>
      <div className="p-12 rounded-2xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3 font-mono">
        <AlertCircle className="h-10 w-10 text-slate-600" />
        <p className="text-sm font-bold text-slate-300">Opportunity Not Found</p>
        <p className="text-xs text-slate-500 max-w-sm">
          This internship position doesn&apos;t exist or is no longer open for applications.
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
    <div className="flex flex-col gap-6">
      {/* BACK LINK */}
      <Link
        href="/student/internships"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Opportunities Marketplace
      </Link>

      {/* HEADER BANNER */}
      <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/40 text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {companyName}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/40 text-[10px] font-mono font-bold text-emerald-300 uppercase">
              OPEN POSITION
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white font-sans">{role.title}</h1>
          <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            Posted {postedDate}
          </p>
        </div>

        {existingApplication && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0 font-mono">
            <span className="text-xs text-slate-400 font-semibold">Your Application:</span>
            <ApplicationStatusBadge status={existingApplication.status} />
          </div>
        )}
      </div>

      {/* 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: ROLE SPECIFICATION */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-6 font-sans">
            <Section title="About the Role" body={role.description} />
            <Section title="Requirements &amp; Qualifications" body={role.requirements} />
            <Section title="Eligibility Criteria" body={role.eligibility} />
          </div>
        </div>

        {/* RIGHT COLUMN: APPLICATION DECISION PANEL */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80 font-mono">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Application Panel
              </h2>
            </div>

            {existingApplication ? (
              <div className="flex flex-col gap-4 font-mono">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">Application Submitted</span>
                    <ApplicationStatusBadge status={existingApplication.status} />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Your application for <strong className="text-white">{role.title}</strong> has been recorded and is currently in the selection pipeline.
                  </p>
                  <span className="text-[10px] text-slate-500">
                    Submitted {new Date(existingApplication.created_at).toLocaleDateString()}
                  </span>
                </div>

                <Link
                  href={`/student/applications/${existingApplication.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" /> View Submitted Application
                </Link>
              </div>
            ) : !isEligibleToApply ? (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 flex flex-col gap-3 font-mono">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Profile Update Required
                </div>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  You must complete your profile and upload a PDF resume before submitting internship applications.
                </p>
                <Link
                  href="/student/profile"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-700/40 text-amber-200 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
                >
                  Upload Resume in Profile →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs font-mono text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
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
      <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
      <p className="whitespace-pre-line text-xs text-slate-300 leading-relaxed font-sans">{body}</p>
    </div>
  );
}
