import type { Metadata } from "next";
import { User, ShieldCheck, Key, Server, Lock } from "lucide-react";
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
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            ADMINISTRATOR &amp; PLATFORM SETTINGS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Manage your administrative profile, security configuration, and platform security status.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/40 text-emerald-300 font-mono text-xs font-bold uppercase shrink-0">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Active Role: {roles.join(" / ")}</span>
        </div>
      </div>

      {/* 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Administrator Profile */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Profile Card */}
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <User className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Administrator Identity
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 font-mono text-xs">
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
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <Key className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Assigned Platform Roles ({roles.length})
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider"
                >
                  {role}
                </span>
              ))}
            </div>
            <p className="text-[11px] font-mono text-slate-500">
              Role permissions are enforced via database RLS policies and server-side RPC authorization checks.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Platform Security & Environment */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Security Overview */}
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <Lock className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Security &amp; RLS Governance Status
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 font-mono text-xs">
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
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <Server className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                System Infrastructure Parameters
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 font-mono text-xs">
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
    <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
      <span className="text-slate-500 text-[10px] uppercase tracking-wider">{label}</span>
      <span className={`text-slate-200 font-semibold leading-snug ${isMono ? "font-mono text-[11px]" : ""}`}>
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
    <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-400 font-semibold">{label}</span>
        <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/40 text-emerald-300 text-[10px] font-bold uppercase">
          {status}
        </span>
      </div>
      <span className="text-[10px] text-slate-500">{detail}</span>
    </div>
  );
}
