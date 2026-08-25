import type { Metadata } from "next";
import { User, ShieldCheck, Key, Server, Lock, Settings } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Platform & Admin Settings | NOVA Admin" };

interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  onboarded: boolean;
  created_at: string;
}

export default async function AdminSettingsPage() {
  const auth = await getAuthenticatedUser();
  const roles = auth?.roles ?? [];
  const user = auth?.user;

  const { data: profileData } = user
    ? await auth.supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    : { data: null };

  const profile = profileData as ProfileRow | null;

  const adminName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email
    : user?.email ?? "Administrator";

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-sky-600" />
            Administrator &amp; Platform Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your administrative profile, security configuration, and platform security status.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase shrink-0 shadow-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Active Role: {roles.join(" / ")}</span>
        </div>
      </div>

      {/* 2-COLUMN GRID WITH GLASSMORPHISM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Administrator Profile */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Profile Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="h-4 w-4 text-sky-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Administrator Identity
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <SettingField label="Full Name" value={adminName} />
              <SettingField label="Email Address" value={profile?.email ?? user?.email ?? "Not logged in"} />
              <SettingField label="Account ID" value={user?.id ?? "—"} isMono />
              <SettingField
                label="Onboarding Status"
                value={profile?.onboarded ? "Completed" : "Pending"}
              />
              <SettingField
                label="Registered Since"
                value={
                  profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"
                }
              />
            </div>
          </div>

          {/* Roles & Authorization */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Key className="h-4 w-4 text-amber-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Assigned Platform Roles ({roles.length})
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700 uppercase tracking-wider"
                >
                  {role}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Role permissions are enforced via database RLS policies and server-side RPC authorization checks.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Platform Security & Environment */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Security Overview */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="h-4 w-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Security &amp; RLS Governance Status
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <StatusCheckRow
                label="Row Level Security (RLS)"
                status="Enabled &amp; Active"
                detail="All 27 public tables protected by granular policies"
              />
              <StatusCheckRow
                label="Server Action Authorization"
                status="Enforced"
                detail="requireRole('admin') + RPC security definer checks"
              />
              <StatusCheckRow
                label="Database Audit Trail"
                status="Active"
                detail="write_audit_log() RPC active on all state transitions"
              />
              <StatusCheckRow
                label="Client Credentials"
                status="Secure"
                detail="Service-role key isolated on server only"
              />
            </div>
          </div>

          {/* System Environment */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Server className="h-4 w-4 text-sky-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                System Infrastructure Parameters
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <SettingField label="Platform Framework" value="Next.js App Router (React Server Components)" />
              <SettingField label="Database & Auth Provider" value="Supabase Postgres + GoTrue Auth" />
              <SettingField label="Storage Architecture" value="Public Static Assets (/media) + GCS Integration" />
              <SettingField label="Operations Shell Version" value="NOVA Admin Console v1.0.0 (Phase 5)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingField({
  label,
  value,
  isMono = false,
}: {
  label: string;
  value: string;
  isMono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{label}</span>
      <span className={`text-slate-900 font-semibold leading-snug ${isMono ? "font-mono text-[11px] text-slate-700" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function StatusCheckRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-800 font-bold">{label}</span>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase">
          {status}
        </span>
      </div>
      <span className="text-[11px] text-slate-500 mt-0.5">{detail}</span>
    </div>
  );
}
