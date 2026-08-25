import type { Metadata } from "next";
import Link from "next/link";
import {
  User,
  GraduationCap,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { StudentProfileForm } from "./profile-form";
import { ResumeForm } from "./resume-form";

export const metadata: Metadata = { title: "Student Career Profile | NOVA" };

const RESUME_SIGNED_URL_TTL_SECONDS = 300; // 5 minutes for viewing/downloading signed resume link

export default async function StudentProfilePage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return (
      <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
        <p className="text-sm font-semibold text-red-600">Your session has expired. Please log in again.</p>
      </div>
    );
  }
  const { supabase, user } = auth;

  const [{ data: profile, error: profileError }, { data: studentProfile, error: studentProfileError }] =
    await Promise.all([
      supabase.from("profiles").select("first_name, last_name, email, onboarded").eq("id", user.id).single(),
      supabase
        .from("student_profiles")
        .select("education_info, skills, resume_path, resume_size")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  if (profileError || studentProfileError) {
    return (
      <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
        <p className="text-sm font-semibold text-red-600">Couldn&apos;t load your profile details.</p>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <User className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-bold text-slate-800">Finish Onboarding First</p>
        <p className="text-xs text-slate-500 max-w-sm">
          Complete your initial onboarding sequence to set up your academic profile and resume.
        </p>
        <Link
          href="/student/onboarding"
          className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
        >
          Go to Onboarding →
        </Link>
      </div>
    );
  }

  const educationInfo = (studentProfile.education_info ?? {}) as {
    school?: string;
    degree?: string;
    grad_year?: number;
  };
  const skills = studentProfile.skills ?? [];

  let resumeUrl: string | null = null;
  if (studentProfile.resume_path) {
    const { data: signed } = await supabase.storage
      .from("resumes")
      .createSignedUrl(studentProfile.resume_path, RESUME_SIGNED_URL_TTL_SECONDS);
    resumeUrl = signed?.signedUrl ?? null;
  }

  const studentName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Student";
  const hasAcademic = Boolean(educationInfo.school && educationInfo.degree);
  const hasResume = Boolean(studentProfile.resume_path);

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{studentName}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold uppercase tracking-wider">
              Student Career Profile
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {profile?.email} · Academic background &amp; technical capabilities
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-2xs ${
              hasAcademic && hasResume && skills.length > 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {hasAcademic && hasResume && skills.length > 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Profile Complete
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Action Needed
              </>
            )}
          </span>
        </div>
      </div>

      {/* 2-COLUMN GRID WITH GLASSMORPHISM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: EDIT PROFILE FORM */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="h-4 w-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Edit Identity &amp; Capabilities
              </h2>
            </div>

            <StudentProfileForm
              firstName={profile?.first_name ?? ""}
              lastName={profile?.last_name ?? ""}
              school={educationInfo.school ?? ""}
              degree={educationInfo.degree ?? ""}
              gradYear={educationInfo.grad_year ?? new Date().getFullYear()}
              skills={skills}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: RESUME STUDIO & READINESS SUMMARY */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* RESUME STUDIO BLOCK */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Resume Studio
                </h2>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  hasResume
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {hasResume ? "READY" : "NOT UPLOADED"}
              </span>
            </div>

            {resumeUrl ? (
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-sky-600" />
                      resume.pdf
                    </span>
                    {studentProfile.resume_size && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {Math.round(studentProfile.resume_size / 1024)} KB
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> PDF On File for Employer Review
                  </span>
                </div>

                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> View / Download Current Resume <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-center flex flex-col items-center gap-2">
                <AlertCircle className="h-6 w-6 text-amber-600" />
                <span className="text-xs font-bold text-amber-800 uppercase">NO RESUME ON FILE</span>
                <p className="text-[11px] text-slate-600">
                  Upload your PDF resume to submit internship applications.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100">
              <ResumeForm />
            </div>
          </div>

          {/* PROFILE READINESS SUMMARY */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Profile Readiness Checklist
              </h2>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <CheckRow
                icon={GraduationCap}
                label="Academic Info"
                detail={
                  educationInfo.school
                    ? `${educationInfo.school} · ${educationInfo.degree || "Degree"}`
                    : "School & degree missing"
                }
                isComplete={hasAcademic}
              />
              <CheckRow
                icon={Layers}
                label="Technical Skills"
                detail={skills.length > 0 ? `${skills.length} skills listed` : "No skills added"}
                isComplete={skills.length > 0}
              />
              <CheckRow
                icon={FileText}
                label="PDF Resume"
                detail={hasResume ? "PDF uploaded to secure bucket" : "PDF resume missing"}
                isComplete={hasResume}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckRow({
  icon: Icon,
  label,
  detail,
  isComplete,
}: {
  icon: React.ElementType;
  label: string;
  detail: string;
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <Icon className={`h-4 w-4 shrink-0 ${isComplete ? "text-emerald-600" : "text-amber-600"}`} />
        <div className="flex flex-col overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase">{label}</span>
          <span className="text-xs font-semibold text-slate-800 truncate">{detail}</span>
        </div>
      </div>
      {isComplete ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
      ) : (
        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700 uppercase shrink-0">
          Action Needed
        </span>
      )}
    </div>
  );
}
