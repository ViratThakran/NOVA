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
      <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
        <p className="text-sm font-semibold text-red-300 font-mono">Your session has expired. Please log in again.</p>
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
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* HEADER */}
      <div className="flex flex-col gap-2 pb-4 border-b border-slate-800/80">
        <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-400" />
          ACCOUNT SETTINGS
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Your account identity and session controls.
        </p>
      </div>

      {/* ACCOUNT IDENTITY CARD */}
      <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-5 font-mono">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <User className="h-4 w-4 text-indigo-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Student Account Identity</h2>
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
      <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4 font-mono">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-800/80">
          Manage Your Profile
        </h2>

        <Link
          href="/student/profile"
          className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Career Profile &amp; Resume</span>
              <span className="text-[11px] text-slate-500">Update academic info, skills, and PDF resume</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
        </Link>
      </div>

      {/* SECURITY & SESSION */}
      <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4 font-mono">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-800/80">
          Security &amp; Session
        </h2>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Authentication</span>
              <span className="text-[11px] text-slate-500">
                Managed securely via NOVA&apos;s authentication system. Password changes are handled through your email provider.
              </span>
            </div>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-950/30 hover:bg-red-950/60 border border-red-900/50 hover:border-red-800 text-red-400 hover:text-red-300 text-xs font-mono font-bold uppercase tracking-wider transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out of Student Portal
          </button>
        </form>
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
    <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <Icon className="h-3 w-3 text-slate-600" />
        {label}
      </span>
      <span
        className={`text-xs font-bold font-sans ${
          highlight === "emerald"
            ? "text-emerald-300"
            : highlight === "amber"
            ? "text-amber-300"
            : "text-slate-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
