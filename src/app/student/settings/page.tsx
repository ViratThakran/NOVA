import type { Metadata } from "next";
import Link from "next/link";
import { Settings, User, Mail, ShieldCheck, LogOut, ExternalLink, ChevronRight } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { logoutAction } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Account Settings | NOVA" };

export default async function StudentSettingsPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return (
      <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
        <p className="text-sm font-semibold text-red-600">Your session has expired. Please log in again.</p>
      </div>
    );
  }
  const { supabase, user } = auth;

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, onboarded, created_at")
    .eq("id", user.id)
    .single();

  const studentName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Student";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col gap-6 max-w-2xl text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col gap-1 pb-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-sky-600" />
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Your account identity, security, and session controls.
        </p>
      </div>

      {/* ACCOUNT IDENTITY CARD WITH GLASSMORPHISM */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <User className="h-4 w-4 text-sky-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Student Account Identity</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Full Name" value={studentName} icon={User} />
          <InfoRow label="Email Address" value={profile?.email || user.email || "—"} icon={Mail} />
          {memberSince && (
            <InfoRow label="Member Since" value={memberSince} icon={ShieldCheck} />
          )}
          <InfoRow
            label="Account Status"
            value={profile?.onboarded ? "Onboarded & Active" : "Pending Onboarding"}
            icon={ShieldCheck}
            highlight={profile?.onboarded ? "emerald" : "amber"}
          />
        </div>
      </div>

      {/* PROFILE MANAGEMENT LINKS */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-100">
          Manage Your Profile
        </h2>

        <Link
          href="/student/profile"
          className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-sky-300 hover:bg-sky-50/40 transition-all"
        >
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-sky-600" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">Career Profile &amp; Resume</span>
              <span className="text-[11px] text-slate-500">Update academic background, skills, and PDF resume</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        </Link>
      </div>

      {/* SECURITY & SESSION */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-100">
          Security &amp; Session
        </h2>

        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">Authentication</span>
              <span className="text-[11px] text-slate-500">Session secured via Supabase auth</span>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Log Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  highlight?: "emerald" | "amber";
}) {
  return (
    <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <span
        className={`text-xs font-semibold truncate ${
          highlight === "emerald"
            ? "text-emerald-700"
            : highlight === "amber"
            ? "text-amber-700"
            : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
