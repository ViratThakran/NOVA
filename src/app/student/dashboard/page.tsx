import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Briefcase,
  CheckCircle2,
  Clock,
  RotateCcw,
  Award,
  Layers,
  FileCode2,
  Check,
  ChevronRight,
  ExternalLink,
  Flame,
  Loader2,
  AlertTriangle,
  Send,
  MessageSquare,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getStudentDashboardState } from "@/lib/ai-engine/internship-mentor";

export const metadata: Metadata = {
  title: "Internship Command Center | NOVA",
  description: "Track your active engineering internship, real-world milestones, AI mentor feedback, and next tasks.",
};

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const { user, supabase } = await requireRole("student");

  // Fetch aggregated, authoritative real database state
  const dashboard = await getStudentDashboardState(supabase, user.id);

  if (!dashboard.profile.onboarded) {
    redirect("/student/onboarding");
  }

  const studentName = dashboard.profile.first_name || dashboard.profile.email.split("@")[0];

  // 1. EMPTY STATE: NO ACTIVE INTERNSHIP
  if (dashboard.status === "no_enrollment" || !dashboard.enrollment) {
    const apps = dashboard.applications || [];
    return (
      <div className="flex flex-col gap-8 pb-16">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome, {studentName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Your engineering internship dashboard and adaptive learning workspace.
            </p>
          </div>
        </div>

        {/* Dynamic Status / Next Action Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    dashboard.nextAction.badgeVariant === "success"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : dashboard.nextAction.badgeVariant === "warning"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {dashboard.nextAction.badgeText}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {dashboard.nextAction.title}
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {dashboard.nextAction.description}
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href={dashboard.nextAction.ctaHref}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
              >
                {dashboard.nextAction.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Applications List if Submitted */}
        {apps.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-primary" />
                Submitted Applications ({apps.length})
              </h3>
              <Link
                href="/student/applications"
                className="text-xs font-medium text-primary hover:underline"
              >
                View Tracker →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-muted-foreground truncate max-w-[200px]">
                        {app.companyName}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          app.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : app.status === "under_review"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : app.status === "rejected"
                            ? "bg-muted text-muted-foreground"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {app.status === "under_review" ? "Under Review" : app.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-foreground text-sm line-clamp-1">{app.internshipTitle}</h4>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                    <span className="text-muted-foreground">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/student/applications/${app.id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-8 md:p-12 text-center shadow-sm max-w-3xl mx-auto space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Briefcase className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">No Active Applications or Tracks</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Explore available industry residencies to submit your application and get assigned your first milestone task.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/student/internships"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                Browse Opportunities
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  const {
    enrollment,
    milestones,
    currentMilestoneIndex,
    currentMilestone,
    currentTask,
    nextAvailableTask,
    latestSubmission,
    latestJob,
    latestReview,
    recentMentorFeedback,
    performanceMetrics,
    nextAction,
  } = dashboard;

  const isPassed = latestReview?.verdict === "passed" || currentTask?.status === "completed";
  const isNeedsRevision = latestReview?.verdict === "needs_revision";
  const isProcessing =
    latestSubmission &&
    ["submitted", "collecting_evidence", "running_verification", "in_review"].includes(
      latestSubmission.status
    );

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* ── 1. TOP HEADER & GREETING ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>ACTIVE RESIDENCY</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {studentName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {enrollment.internshipTitle} • <span className="font-medium text-foreground">{enrollment.companyName}</span> ({enrollment.durationWeeks} Weeks Track)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student/learning"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Open Learning Workspace
          </Link>
        </div>
      </div>

      {/* ── 2. DASHBOARD HERO: INTERNSHIP COMMAND CENTER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Details (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Layers className="h-3.5 w-3.5" />
                Milestone {currentMilestoneIndex + 1} of {performanceMetrics.totalMilestones}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {currentMilestone?.title || "Active Milestone"}
              </span>
            </div>

            <div>
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                Current Focus
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mt-0.5">
                {currentTask ? currentTask.title : "Initializing Task Specification..."}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl line-clamp-2">
                {currentTask?.objective || enrollment.description}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Internship Curriculum Progress</span>
                <span className="font-bold text-primary font-mono">{performanceMetrics.progressPercentage}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${performanceMetrics.progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Action Trigger (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-center rounded-2xl bg-card/80 p-5 border border-border/70 backdrop-blur-md shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  nextAction.badgeVariant === "success"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : nextAction.badgeVariant === "warning"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : nextAction.badgeVariant === "info"
                    ? "bg-sky-500/10 text-sky-500 border border-sky-500/20"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isPassed ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : isNeedsRevision ? (
                  <RotateCcw className="h-3 w-3" />
                ) : (
                  <Flame className="h-3 w-3" />
                )}
                {nextAction.badgeText}
              </span>

              {latestReview?.score !== undefined && (
                <span className="text-xs font-bold text-foreground">
                  Score: <span className="text-primary font-mono">{latestReview.score}/100</span>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-sm text-foreground">{nextAction.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {nextAction.description}
              </p>
              {nextAction.currentStageLabel && (
                <div className="mt-2 rounded-lg bg-muted/50 p-2 text-[11px] font-mono text-primary flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {nextAction.currentStageLabel}
                </div>
              )}
            </div>

            <Link
              href={nextAction.ctaHref}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            >
              <span>{nextAction.ctaLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. PERFORMANCE SUMMARY METRICS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tasks Completed
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{performanceMetrics.tasksCompleted}</span>
            <span className="text-xs text-muted-foreground">/ {performanceMetrics.totalMilestones} Milestones</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Average Score
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">
              {performanceMetrics.averageScore > 0 ? `${performanceMetrics.averageScore}%` : "—"}
            </span>
            <span className="text-xs text-muted-foreground font-medium">Evaluation Avg</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Target Velocity
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{performanceMetrics.currentDifficulty}</span>
            <span className="text-xs text-muted-foreground">Adaptive</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Revisions Logged
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{performanceMetrics.totalRevisions}</span>
            <span className="text-xs text-muted-foreground">Iterations</span>
          </div>
        </div>
      </div>

      {/* ── 4. TWO-COLUMN MAIN SECTION: CURRENT TASK + ROADMAP & FEEDBACK ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CURRENT TASK & RECENT FEEDBACK (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* A. CURRENT TASK SPECIFICATION CARD */}
          {currentTask && (
            <div className="rounded-3xl border border-border bg-card p-6 md:p-7 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Active Milestone Task
                    </span>
                    <span className="text-xs text-muted-foreground">• Milestone {currentMilestoneIndex + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{currentTask.title}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="bg-muted px-2.5 py-0.5 rounded-md font-medium text-foreground capitalize">
                    {currentTask.difficulty || "Intermediate"}
                  </span>
                  <span>~{currentTask.estimated_hours || 4} hrs</span>
                </div>
              </div>

              {/* Task Objective */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Objective</h4>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {currentTask.objective}
                </p>
              </div>

              {/* Deliverables Snippet */}
              {currentTask.deliverables && currentTask.deliverables.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Expected Repository Deliverables
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentTask.deliverables.map((del: string, dIdx: number) => (
                      <span
                        key={dIdx}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-mono text-foreground font-medium"
                      >
                        <FileCode2 className="h-3.5 w-3.5 text-primary" />
                        {del}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest Submission State Banner */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <span>Submission Status:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md uppercase font-bold text-[11px] ${
                        isPassed
                          ? "bg-emerald-500/10 text-emerald-500"
                          : isNeedsRevision
                          ? "bg-amber-500/10 text-amber-500"
                          : isProcessing
                          ? "bg-sky-500/10 text-sky-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {latestSubmission ? latestSubmission.status : "Not Submitted"}
                    </span>
                  </div>
                  {latestSubmission && latestSubmission.commit_sha && (
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Commit: {(latestSubmission.commit_sha || "").slice(0, 7)} (Attempt #{latestSubmission.attempt_number})
                    </p>
                  )}
                </div>

                <Link
                  href={`/student/learning?taskId=${currentTask.id}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs shrink-0"
                >
                  <span>
                    {isProcessing
                      ? "View Submission"
                      : isNeedsRevision
                      ? "Revise Submission"
                      : isPassed
                      ? nextAvailableTask
                        ? "Continue to Next Task"
                        : "View In Workspace"
                      : "Start Task"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* B. RECENT MENTOR FEEDBACK */}
          <div className="rounded-3xl border border-border bg-card p-6 md:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">Recent AI Mentor Feedback</h3>
              </div>
              <Link
                href="/student/learning"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Full Review History</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentMentorFeedback.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center space-y-2">
                <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto" />
                <h4 className="text-xs font-semibold text-foreground">No Feedback Logged Yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Submit your code for your active milestone task to receive automated container testing and actionable AI mentor reviews.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMentorFeedback.map((feedback) => (
                  <div
                    key={feedback.id}
                    className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition-all ${
                      feedback.verdict === "passed"
                        ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                        : feedback.verdict === "needs_revision"
                        ? "border-amber-500/30 bg-amber-500/[0.02]"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs sm:text-sm text-foreground">{feedback.taskTitle}</h4>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              feedback.verdict === "passed"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {feedback.verdict}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Attempt #{feedback.attemptNumber} • {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-foreground">
                        Score: <strong className={feedback.score >= 75 ? "text-emerald-500" : "text-amber-500"}>{feedback.score}/100</strong>
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                      {feedback.summary}
                    </p>

                    {feedback.improvements?.length > 0 && (
                      <div className="rounded-xl bg-muted/40 p-3 text-xs text-foreground/80 border border-border/40">
                        <strong className="text-foreground block font-medium mb-1">Mentor Improvement Focus:</strong>
                        <p>{feedback.improvements[0]}</p>
                      </div>
                    )}

                    <div className="pt-1 flex justify-end">
                      <Link
                        href={`/student/learning?taskId=${feedback.taskId}`}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>View in Learning Workspace</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CURRICULUM ROADMAP (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-foreground">Curriculum Roadmap</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adaptive milestones generated for your {enrollment.durationWeeks}-week residency.
              </p>
            </div>

            <div className="space-y-3">
              {milestones.map((m, idx) => {
                const isCurrent = m.milestone_index === currentMilestoneIndex;
                const isCompleted = m.status === "completed" || m.milestone_index < currentMilestoneIndex;

                return (
                  <div
                    key={m.id || idx}
                    className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? "border-primary bg-primary/[0.03] shadow-xs"
                        : isCompleted
                        ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                        : "border-border/60 bg-muted/20 opacity-70"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                    </span>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs text-foreground">{m.title}</h4>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-500"
                              : isCurrent
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? "Passed" : isCurrent ? "Active" : "Upcoming"}
                        </span>
                      </div>
                      {isCurrent && currentTask && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          Task: {currentTask.title}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border/60">
              <Link
                href="/student/learning"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
              >
                <span>Open Full Curriculum</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
