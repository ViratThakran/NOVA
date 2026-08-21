import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  Bell,
  Sparkles,
  User,
  GraduationCap,
  Layers,
  ChevronRight,
} from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { ApplicationStatusBadge } from "@/components/app/application-status-badge";
import { countUnread } from "@/lib/notification-view-state";

export const metadata: Metadata = { title: "Student Dashboard | NOVA" };

interface EducationInfo {
  school?: string;
  degree?: string;
  grad_year?: number;
}

interface ApplicationRow {
  id: string;
  status: string;
  created_at: string;
  internship: { id: string; title: string; companies: { name: string } | null } | null;
}

interface EnrollmentRow {
  id: string;
  status: string;
  created_at: string;
  internship: { id: string; title: string; companies: { name: string } | null } | null;
}

interface OpenInternshipRow {
  id: string;
  title: string;
  description: string;
  created_at: string;
  companies: { name: string } | null;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default async function StudentDashboardPage() {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Parallel server-side fetching of student data
  const [
    { data: profile },
    { data: studentProfile },
    { data: applications },
    { data: enrollments },
    { data: notifications },
    { data: openInternships },
  ] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, email, onboarded").eq("id", user.id).single(),
    supabase.from("student_profiles").select("education_info, skills, resume_path").eq("id", user.id).maybeSingle(),
    supabase
      .from("applications")
      .select("id, status, created_at, internship:internships(id, title, companies(name))")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("enrollments")
      .select("id, status, created_at, internship:internships(id, title, companies(name))")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, title, message, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("internships")
      .select("id, title, description, created_at, companies(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  if (!profile?.onboarded) {
    redirect("/student/onboarding");
  }

  const studentName = profile.first_name || profile.email.split("@")[0];
  const educationInfo = (studentProfile?.education_info as EducationInfo | null) ?? null;
  const hasAcademic = Boolean(educationInfo?.school && educationInfo?.degree);
  const hasResume = Boolean(studentProfile?.resume_path);
  const skillsCount = studentProfile?.skills?.length ?? 0;

  const appRows = (applications as unknown as ApplicationRow[] | null) ?? [];
  const enrollRows = (enrollments as unknown as EnrollmentRow[] | null) ?? [];
  const notifRows = (notifications as unknown as NotificationRow[] | null) ?? [];
  const oppRows = (openInternships as unknown as OpenInternshipRow[] | null) ?? [];

  // Application Pipeline counts
  const pendingCount = appRows.filter((a) => a.status === "pending").length;
  const reviewCount = appRows.filter((a) => a.status === "under_review").length;
  const acceptedCount = appRows.filter((a) => a.status === "accepted").length;
  const rejectedCount = appRows.filter((a) => a.status === "rejected").length;

  // Active Residency
  const activeEnrollment = enrollRows.find((e) => e.status === "active");

  // Determine Student Status Badge
  let statusBadgeLabel = "Profile Complete";
  let statusBadgeColor = "emerald";

  if (activeEnrollment) {
    statusBadgeLabel = "Active Residency";
    statusBadgeColor = "indigo";
  } else if (acceptedCount > 0) {
    statusBadgeLabel = "Accepted Candidate";
    statusBadgeColor = "emerald";
  } else if (reviewCount > 0) {
    statusBadgeLabel = "Under Review";
    statusBadgeColor = "cyan";
  } else if (pendingCount > 0) {
    statusBadgeLabel = "Applications Pending";
    statusBadgeColor = "amber";
  } else if (!hasResume || !hasAcademic) {
    statusBadgeLabel = "Profile Incomplete";
    statusBadgeColor = "amber";
  }

  // Determine ONE dominant primary action
  let primaryCtaHref = "/student/internships";
  let primaryCtaText = "Explore Internships";
  let primaryCtaDescription = "Discover open residency roles and apply directly.";

  if (!hasResume || !hasAcademic) {
    primaryCtaHref = "/student/profile";
    primaryCtaText = "Complete Profile & Upload Resume";
    primaryCtaDescription = "Make sure your academic background and resume are up to date for employers.";
  } else if (activeEnrollment) {
    primaryCtaHref = `/student/enrollments/${activeEnrollment.id}`;
    primaryCtaText = "View Active Residency";
    primaryCtaDescription = "Access details and requirements for your ongoing residency.";
  } else if (acceptedCount > 0) {
    primaryCtaHref = "/student/enrollments";
    primaryCtaText = "View Your Residencies";
    primaryCtaDescription = "You have an accepted application! View your residency placement details.";
  } else if (appRows.length > 0) {
    primaryCtaHref = "/student/applications";
    primaryCtaText = "Track My Applications";
    primaryCtaDescription = `You have ${appRows.length} application${appRows.length !== 1 ? "s" : ""} in progress. Track their review status.`;
  }

  const unreadNotifCount = countUnread(notifRows);

  return (
    <div className="flex flex-col gap-8">
      {/* HERO SECTION */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#0E1424] via-[#0B0F19] to-[#0E1424] border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-700/40 font-mono text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> STUDENT COMMAND CENTER
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider border ${
                statusBadgeColor === "emerald"
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40"
                  : statusBadgeColor === "indigo"
                  ? "bg-indigo-950/80 text-indigo-300 border-indigo-700/40"
                  : statusBadgeColor === "cyan"
                  ? "bg-cyan-950/80 text-cyan-300 border-cyan-700/40"
                  : "bg-amber-950/80 text-amber-300 border-amber-700/40"
              }`}
            >
              {statusBadgeLabel}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-sans">
            Welcome back, {studentName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl font-mono leading-relaxed">
            Your next career opportunity starts with what you build today. Track your applications, residencies, and learning tracks.
          </p>
        </div>

        {/* DOMINANT PRIMARY NEXT ACTION */}
        <div className="flex flex-col gap-2 shrink-0 relative z-10 max-w-xs w-full bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
            RECOMMENDED NEXT STEP
          </span>
          <p className="text-xs text-slate-300 leading-snug">{primaryCtaDescription}</p>
          <Link
            href={primaryCtaHref}
            className="mt-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/20"
          >
            {primaryCtaText}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ACTIVE RESIDENCY SECTION */}
      <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              ACTIVE RESIDENCY
            </h2>
          </div>
          <Link
            href="/student/enrollments"
            className="text-xs font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1"
          >
            All Residencies <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activeEnrollment ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {activeEnrollment.internship?.title || "Residency Position"}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/40 text-emerald-300 font-mono text-[10px] font-bold uppercase">
                  Active
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                {activeEnrollment.internship?.companies?.name || "NOVA Partner"} · Enrolled{" "}
                {new Date(activeEnrollment.created_at).toLocaleDateString()}
              </p>
            </div>
            <Link
              href={`/student/enrollments/${activeEnrollment.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider transition-colors shrink-0"
            >
              Open Residency Details <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
                NO ACTIVE RESIDENCY
              </span>
              <p className="text-xs text-slate-400 font-mono">
                Your next residency starts with an opportunity. Browse open roles to apply.
              </p>
            </div>
            <Link
              href="/student/internships"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider transition-colors shrink-0"
            >
              Explore Open Internships <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* 2-COLUMN GRID: PIPELINE & PROFILE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: APPLICATION PIPELINE & OPEN ROLES */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* APPLICATION PIPELINE */}
          <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  APPLICATION PIPELINE ({appRows.length})
                </h2>
              </div>
              <Link
                href="/student/applications"
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1"
              >
                View All Applications <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Pipeline State Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 flex flex-col">
                <span className="text-[10px] text-amber-400 uppercase font-bold">Pending</span>
                <span className="text-xl font-bold text-white mt-1">{pendingCount}</span>
              </div>
              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/30 flex flex-col">
                <span className="text-[10px] text-cyan-400 uppercase font-bold">Under Review</span>
                <span className="text-xl font-bold text-white mt-1">{reviewCount}</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30 flex flex-col">
                <span className="text-[10px] text-emerald-400 uppercase font-bold">Accepted</span>
                <span className="text-xl font-bold text-white mt-1">{acceptedCount}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Rejected</span>
                <span className="text-xl font-bold text-slate-400 mt-1">{rejectedCount}</span>
              </div>
            </div>

            {/* Recent Submissions */}
            {appRows.length > 0 && (
              <div className="flex flex-col gap-2 pt-2">
                {appRows.slice(0, 3).map((app) => (
                  <Link
                    key={app.id}
                    href={`/student/applications/${app.id}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white font-sans">
                        {app.internship?.title || "Internship Role"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {app.internship?.companies?.name || "NOVA Partner"} · Applied{" "}
                        {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <ApplicationStatusBadge status={app.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* EXPLORE OPEN ROLES */}
          <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  EXPLORE OPEN ROLES
                </h2>
              </div>
              <Link
                href="/student/internships"
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1"
              >
                Full Catalog <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {oppRows.length === 0 ? (
              <p className="text-xs font-mono text-slate-500">No open roles posted right now.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {oppRows.map((opp) => (
                  <div
                    key={opp.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-white font-sans">{opp.title}</span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        {opp.companies?.name || "NOVA Partner"} · Posted{" "}
                        {new Date(opp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Link
                      href={`/student/internships/${opp.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-mono font-semibold uppercase tracking-wider transition-colors shrink-0"
                    >
                      View Role <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: NOTIFICATIONS & PROFILE READINESS */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          {/* RECENT NOTIFICATIONS */}
          <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  NOTIFICATIONS ({unreadNotifCount} UNREAD)
                </h2>
              </div>
              <Link
                href="/student/notifications"
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1"
              >
                All Notifications <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {notifRows.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 py-1">You have no notifications yet.</p>
            ) : (
              <div className="flex flex-col gap-2 font-mono">
                {notifRows.map((n) => (
                  <div
                    key={n.id}
                    className="flex flex-col gap-1 p-3 rounded-lg bg-slate-900/60 border border-slate-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-200 font-sans">{n.title}</span>
                      {!n.read && (
                        <span className="px-1.5 py-px rounded bg-indigo-950 border border-indigo-700/50 text-[9px] font-bold text-indigo-300 uppercase">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PROFILE READINESS STATUS */}
          <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  PROFILE READINESS
                </h2>
              </div>
              <Link
                href="/student/profile"
                className="text-xs text-indigo-400 hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1"
              >
                Edit Profile <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <StatusCheckRow
                icon={GraduationCap}
                label="Academic Info"
                value={educationInfo?.school ? `${educationInfo.school} (${educationInfo.degree || "Degree"})` : "Incomplete"}
                isComplete={hasAcademic}
              />
              <StatusCheckRow
                icon={FileText}
                label="PDF Resume"
                value={hasResume ? "Uploaded & On File" : "Missing Resume File"}
                isComplete={hasResume}
              />
              <StatusCheckRow
                icon={Layers}
                label="Declared Skills"
                value={skillsCount > 0 ? `${skillsCount} skills listed` : "No skills declared"}
                isComplete={skillsCount > 0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCheckRow({
  icon: Icon,
  label,
  value,
  isComplete,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <Icon className={`h-4 w-4 shrink-0 ${isComplete ? "text-emerald-400" : "text-amber-400"}`} />
        <div className="flex flex-col overflow-hidden">
          <span className="text-[10px] text-slate-500 uppercase">{label}</span>
          <span className="text-xs font-semibold text-slate-200 truncate">{value}</span>
        </div>
      </div>
      {isComplete ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
      ) : (
        <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-700/40 text-[9px] font-bold text-amber-300 uppercase shrink-0">
          Needs Update
        </span>
      )}
    </div>
  );
}
