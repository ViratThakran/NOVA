import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  FileText,
  CheckCircle2,
  ChevronRight,
  Calendar,
  Users,
} from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";
import { getInternshipStatusMeta } from "@/lib/internship-status";

export const metadata: Metadata = { title: "Company Profile | NOVA Admin" };

const idSchema = z.string().uuid();

interface CompanyRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface MemberRow {
  role: string;
  profiles: { first_name: string | null; last_name: string | null; email: string } | null;
}

interface InternshipRow {
  id: string;
  title: string;
  status: string;
  created_at: string;
  applications: { count: number }[];
}

interface ApplicationRow {
  id: string;
  status: string;
  created_at: string;
  student: {
    profiles: { first_name: string | null; last_name: string | null; email: string } | null;
  } | null;
  internship: { id: string; title: string } | null;
}

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const backLink = (
    <Link
      href="/admin/companies"
      className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to Partner Companies
    </Link>
  );

  if (!idSchema.safeParse(id).success) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <NotFound />
      </div>
    );
  }

  const supabase = await createServerSideClient();

  const [
    { data: company, error: companyError },
    { data: members },
    { data: internships },
  ] = await Promise.all([
    supabase.from("companies").select("id, name, description, created_at").eq("id", id).maybeSingle(),
    supabase
      .from("company_members")
      .select("role, profiles(first_name, last_name, email)")
      .eq("company_id", id),
    supabase
      .from("internships")
      .select("id, title, status, created_at, applications(count)")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (companyError || !company) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <NotFound />
      </div>
    );
  }

  const c = company as CompanyRow;
  const memberRows = (members as unknown as MemberRow[] | null) ?? [];
  const internshipRows = (internships as unknown as InternshipRow[] | null) ?? [];
  const internshipIds = internshipRows.map((i) => i.id);

  // Fetch applications for this company's internships
  const { data: applications } =
    internshipIds.length > 0
      ? await supabase
          .from("applications")
          .select(
            "id, status, created_at, student:student_profiles(profiles(first_name, last_name, email)), internship:internships(id, title)"
          )
          .in("internship_id", internshipIds)
          .order("created_at", { ascending: false })
          .limit(10)
      : { data: [] };

  const appRows = (applications as unknown as ApplicationRow[] | null) ?? [];
  const openCount = internshipRows.filter((i) => i.status === "open").length;
  const totalApps = appRows.length;

  const joinedDate = new Date(c.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-800/80">
        {backLink}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{c.name}</h1>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Partner company · Joined {joinedDate}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <StatPill icon={Briefcase} label="Internships" value={internshipRows.length} />
            <StatPill icon={FileText} label="Open" value={openCount} color="emerald" />
            <StatPill icon={CheckCircle2} label="Applications" value={totalApps} color="indigo" />
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Company Info + Members */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Company Info */}
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <Building2 className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Company Profile
              </h2>
            </div>

            <div className="flex flex-col gap-3 text-xs font-mono">
              <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Company Name</span>
                <span className="text-slate-200 font-semibold">{c.name}</span>
              </div>

              {c.description && (
                <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase">Description</span>
                  <span className="text-slate-300 leading-relaxed font-sans text-[12px]">{c.description}</span>
                </div>
              )}

              <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Platform Since</span>
                <span className="text-slate-200 font-semibold">{joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <Users className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Company Members ({memberRows.length})
              </h2>
            </div>

            {memberRows.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No team members linked yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {memberRows.map((member, i) => {
                  const prof = member.profiles;
                  const name = prof
                    ? [prof.first_name, prof.last_name].filter(Boolean).join(" ") || prof.email
                    : "Unknown";
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-200">{name}</span>
                        {prof?.email && (
                          <span className="text-[10px] font-mono text-slate-500">{prof.email}</span>
                        )}
                      </div>
                      <span className="px-1.5 py-px rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-400 uppercase">
                        {member.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Internships + Recent Applications */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Internships */}
          <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Internship Opportunities ({internshipRows.length})
                </h2>
              </div>
              <Link
                href="/admin/internships"
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
              >
                All Opportunities →
              </Link>
            </div>

            {internshipRows.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-2">No internships posted by this company.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="pb-2 pr-4">Opportunity</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4 text-center">Applications</th>
                      <th className="pb-2 pr-4">Created</th>
                      <th className="pb-2 text-right">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {internshipRows.map((internship) => {
                      const { label } = getInternshipStatusMeta(internship.status);
                      const appCount = internship.applications?.[0]?.count ?? 0;
                      const date = new Date(internship.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });

                      const statusStyle =
                        internship.status === "open"
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40"
                          : internship.status === "draft"
                          ? "bg-slate-800 text-slate-400 border-slate-700"
                          : "bg-amber-950/80 text-amber-300 border-amber-700/40";

                      return (
                        <tr key={internship.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-2.5 pr-4 font-sans font-semibold text-slate-200">
                            {internship.title}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={`px-1.5 py-px rounded border text-[10px] font-bold uppercase ${statusStyle}`}>
                              {label}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-center font-bold text-indigo-400">{appCount}</td>
                          <td className="py-2.5 pr-4 text-slate-500 text-[11px]">{date}</td>
                          <td className="py-2.5 text-right">
                            <Link
                              href={`/admin/internships/${internship.id}`}
                              className="inline-flex items-center gap-0.5 text-indigo-400 hover:text-indigo-300"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Applications */}
          {appRows.length > 0 && (
            <div className="p-6 rounded-xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Recent Applications ({appRows.length})
                  </h2>
                </div>
                <Link
                  href="/admin/applications"
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                >
                  Full Queue →
                </Link>
              </div>

              <div className="flex flex-col gap-2">
                {appRows.map((app) => {
                  const prof = app.student?.profiles;
                  const name = prof
                    ? [prof.first_name, prof.last_name].filter(Boolean).join(" ") || prof.email
                    : "Unknown Applicant";
                  const date = new Date(app.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div
                      key={app.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-900/60 border border-slate-800"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-200">{name}</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {app.internship?.title || "Internship"} · {date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ApplicationStatusBadge status={app.status} />
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                          title="Review application"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  color = "slate",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color?: "emerald" | "indigo" | "slate";
}) {
  const colorMap = {
    slate: "bg-slate-900 border-slate-800 text-slate-300",
    emerald: "bg-emerald-950/60 border-emerald-700/40 text-emerald-300",
    indigo: "bg-indigo-950/60 border-indigo-700/40 text-indigo-300",
  };

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold ${colorMap[color]}`}>
      <Icon className="h-3.5 w-3.5" />
      {value} {label}
    </div>
  );
}

function NotFound() {
  return (
    <div className="p-8 rounded-xl bg-[#0E131F] border border-slate-800 text-center">
      <p className="text-sm font-mono text-slate-400">Company not found or unavailable.</p>
    </div>
  );
}
