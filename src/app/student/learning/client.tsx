"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Github,
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle,
  FileCode2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  BookOpen,
  ArrowRight,
  Check,
  X,
  Layers,
  Terminal,
  Cpu,
  Loader2,
  HelpCircle,
  Flame,
  GitCommit,
  GitBranch,
  RefreshCw,
  FolderGit2,
  CheckSquare,
  AlertTriangle,
  FileText,
  Briefcase,
} from "lucide-react";
import { submitInternshipTaskAction, getSubmissionStatusAction } from "@/app/student/actions";
import type {
  StudentLearningStateRow,
  EnrollmentMilestoneRow,
  ExecutionJobRow,
} from "@/lib/ai-engine/internship-mentor/db";

interface SubmissionItem {
  id: string;
  taskId: string;
  studentId: string;
  enrollmentId: string;
  submissionType: string;
  githubUrl: string;
  branch: string;
  commitSha: string;
  studentExplanation: string;
  attemptNumber: number;
  status: string;
  submittedAt: string;
  job: ExecutionJobRow | null;
  review: any | null;
  evidence: any | null;
}

interface StudentLearningWorkspaceProps {
  enrollment: {
    id: string;
    status: string;
    internshipTitle: string;
    companyName: string;
    durationWeeks: number;
  };
  activeTask: any;
  allTasks: any[];
  nextTask: any | null;
  submissions: SubmissionItem[];
  milestones: EnrollmentMilestoneRow[];
  learningState: StudentLearningStateRow | null;
}

export function StudentLearningWorkspace({
  enrollment,
  activeTask,
  allTasks,
  nextTask,
  submissions: initialSubmissions,
  milestones,
  learningState,
}: StudentLearningWorkspaceProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Local reactive submissions list
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions);
  const [activeTab, setActiveTab] = useState<"task" | "submissions" | "roadmap">("task");

  // Form State
  const [githubUrl, setGithubUrl] = useState(
    initialSubmissions.length > 0 ? initialSubmissions[initialSubmissions.length - 1].githubUrl : ""
  );
  const [branch, setBranch] = useState(
    initialSubmissions.length > 0 ? initialSubmissions[initialSubmissions.length - 1].branch : "main"
  );
  const [commitSha, setCommitSha] = useState("");
  const [studentExplanation, setStudentExplanation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  // In-Flight Processing State
  const latestSubmission = submissions[submissions.length - 1] || null;
  const isInFlight =
    latestSubmission &&
    ["submitted", "collecting_evidence", "running_verification", "in_review"].includes(
      latestSubmission.status
    );

  const [activeJobStatus, setActiveJobStatus] = useState<string | null>(
    isInFlight ? latestSubmission.job?.status || "queued" : null
  );
  const [pollingActive, setPollingActive] = useState<boolean>(Boolean(isInFlight));
  const [pollingAttempts, setPollingAttempts] = useState(0);

  // Sync props when router refreshes
  useEffect(() => {
    setSubmissions(initialSubmissions);
    const inFlight =
      initialSubmissions.length > 0 &&
      ["submitted", "collecting_evidence", "running_verification", "in_review"].includes(
        initialSubmissions[initialSubmissions.length - 1].status
      );
    setPollingActive(Boolean(inFlight));
  }, [initialSubmissions]);

  // Polling loop for in-flight submissions
  useEffect(() => {
    if (!pollingActive || !latestSubmission) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await getSubmissionStatusAction(latestSubmission.id);
        if (!isMounted) return;

        if (res && res.status === "success") {
          setActiveJobStatus(res.job?.status || res.submission.status);

          // Check if terminal state reached
          const isTerminal = ["passed", "needs_revision", "manual_review", "failed"].includes(
            res.submission.status
          );

          if (isTerminal || (res.job && ["completed", "failed", "timed_out"].includes(res.job.status))) {
            // Update local submission state with final review
            setSubmissions((prev) =>
              prev.map((s) =>
                s.id === latestSubmission.id
                  ? {
                      ...s,
                      status: res.submission.status,
                      job: res.job,
                      review: res.review,
                      evidence: res.evidence,
                    }
                  : s
              )
            );
            setPollingActive(false);
            startTransition(() => {
              router.refresh();
            });
          }
        }
      } catch (pollErr) {
        console.warn("Polling submission status error:", pollErr);
      }

      setPollingAttempts((prev) => {
        if (prev > 120) {
          // Max 5 minutes cutoff
          setPollingActive(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pollingActive, latestSubmission, router]);

  // Handle Submission Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const cleanUrl = githubUrl.trim();
    const cleanSha = commitSha.trim();
    const cleanExplanation = studentExplanation.trim();
    const cleanBranch = branch.trim() || "main";

    if (!cleanUrl.startsWith("https://github.com/") || cleanUrl.split("/").length < 5) {
      setSubmitError("Please enter a valid public GitHub repository URL (e.g. https://github.com/username/repository).");
      return;
    }

    if (!cleanSha || cleanSha.length < 7) {
      setSubmitError("Please provide a valid Git commit SHA (at least 7 characters from git rev-parse HEAD).");
      return;
    }

    if (cleanExplanation.length < 10) {
      setSubmitError("Please write a brief summary of what you implemented (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const fd = new FormData();
      fd.set("task_id", activeTask.id);
      fd.set("github_url", cleanUrl);
      fd.set("branch", cleanBranch);
      fd.set("commit_sha", cleanSha);
      fd.set("student_explanation", cleanExplanation);

      const res = await submitInternshipTaskAction(null, fd);

      if (res && res.status === "success") {
        const newSubItem: SubmissionItem = {
          id: res.submissionId,
          taskId: activeTask.id,
          studentId: "",
          enrollmentId: enrollment.id,
          submissionType: "github",
          githubUrl: cleanUrl,
          branch: cleanBranch,
          commitSha: cleanSha,
          studentExplanation: cleanExplanation,
          attemptNumber: res.attemptNumber,
          status: "submitted",
          submittedAt: new Date().toISOString(),
          job: {
            id: res.jobId || "",
            submission_id: res.submissionId,
            repository: cleanUrl.replace("https://github.com/", ""),
            commit_sha: cleanSha,
            execution_profile: "node_typescript",
            status: "queued",
            runner_version: "1.0",
            profile_version: "1.0",
            timeout_seconds: 60,
            exit_code: null,
            duration_ms: null,
            requested_at: new Date().toISOString(),
            started_at: null,
            completed_at: null,
            created_at: new Date().toISOString(),
          },
          review: null,
          evidence: null,
        };

        setSubmissions((prev) => [...prev, newSubItem]);
        setCommitSha("");
        setStudentExplanation("");
        setShowRevisionForm(false);
        setPollingActive(true);
        setActiveJobStatus("queued");

        startTransition(() => {
          router.refresh();
        });
      } else {
        setSubmitError(res?.message || "Failed to submit task. Please check your inputs.");
      }
    } catch (err: any) {
      setSubmitError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLatestPassed = latestSubmission?.review?.verdict === "passed" || activeTask.status === "completed";
  const isLatestNeedsRevision = latestSubmission?.review?.verdict === "needs_revision";
  const isLatestManualReview = latestSubmission?.review?.verdict === "manual_review";
  const isLatestFailed = latestSubmission?.status === "failed" || latestSubmission?.job?.status === "failed";
  const currentMilestoneIndex = activeTask.milestone_index ?? 0;
  const currentMilestone = milestones.find((m) => m.milestone_index === currentMilestoneIndex) || null;

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* 1. TOP HEADER & INTERNSHIP META */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {enrollment.internshipTitle}
              </span>
              <span className="text-xs font-medium text-muted-foreground">• {enrollment.companyName}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                {enrollment.durationWeeks} Weeks Track
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {activeTask.title}
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              {activeTask.objective}
            </p>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Milestone {currentMilestoneIndex + 1} of {milestones.length || 4}</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isLatestPassed
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : isLatestNeedsRevision
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}
              >
                {isLatestPassed ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                  </>
                ) : isLatestNeedsRevision ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" /> Needs Revision
                  </>
                ) : isInFlight ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> In Review
                  </>
                ) : (
                  <>
                    <Flame className="h-3.5 w-3.5" /> Assigned
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="capitalize font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                {activeTask.difficulty || "Intermediate"}
              </span>
              <span>~{activeTask.estimated_hours || 4} hrs est.</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 flex border-b border-border/60 gap-8">
          <button
            onClick={() => setActiveTab("task")}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "task"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            Task Specification
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "submissions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitCommit className="h-4 w-4" />
            Submission & Reviews ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "roadmap"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-4 w-4" />
            Curriculum Roadmap ({milestones.length})
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: MAIN CONTENT (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* TAB 1: TASK SPECIFICATION */}
          {activeTab === "task" && (
            <div className="flex flex-col gap-6">
              {/* Business Context & Real-World Framing */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Briefcase className="h-4 w-4" />
                  <span>Business Context & Engineering Role</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {activeTask.business_context}
                </p>
                {activeTask.reason_for_assignment && (
                  <div className="rounded-xl bg-muted/40 p-4 border border-border/50 text-xs text-muted-foreground">
                    <strong className="text-foreground font-medium block mb-1">Why this task was assigned:</strong>
                    {activeTask.reason_for_assignment}
                  </div>
                )}
                {activeTask.capstone_connection && (
                  <div className="rounded-xl bg-primary/5 p-4 border border-primary/20 text-xs text-foreground/90 space-y-1">
                    <strong className="text-primary font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Capstone Connection:
                    </strong>
                    <p className="text-muted-foreground">{activeTask.capstone_connection}</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold text-base">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <span>Implementation Instructions</span>
                </div>
                <div className="space-y-3">
                  {(activeTask.instructions || []).map((instruction: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-foreground/90">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                      <p className="pt-0.5 leading-relaxed">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deliverables & Expected Files */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold text-base">
                  <FolderGit2 className="h-5 w-5 text-primary" />
                  <span>Technical Deliverables (Repository Files)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your AI mentor and the automated container sandbox will verify the presence and correctness of these files in your repository:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(activeTask.deliverables || []).map((del: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-muted/30 px-3.5 py-2.5 text-xs font-mono text-foreground font-medium"
                    >
                      <FileCode2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{del}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold text-base">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <span>Acceptance & Evaluation Criteria</span>
                </div>
                <div className="space-y-2.5">
                  {(activeTask.acceptance_criteria || []).map((criterion: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5 text-sm"
                    >
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-foreground/90 leading-relaxed text-xs md:text-sm">{criterion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Practiced */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Skills Evaluated
                </span>
                <div className="flex flex-wrap gap-2">
                  {(activeTask.skills_practiced || []).map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBMISSIONS & REVIEWS HISTORY */}
          {activeTab === "submissions" && (
            <div className="flex flex-col gap-6">
              {submissions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                  <GitCommit className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground text-base">No Submissions Yet</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Complete your code in your GitHub repository and submit your pinned commit using the panel on the right.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {submissions.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className={`rounded-2xl border p-6 transition-all ${
                        sub.review?.verdict === "passed"
                          ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                          : sub.review?.verdict === "needs_revision"
                          ? "border-amber-500/30 bg-amber-500/[0.02]"
                          : "border-border bg-card"
                      }`}
                    >
                      {/* Attempt Header */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted font-bold text-sm text-foreground">
                            #{sub.attemptNumber}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-foreground">Attempt {sub.attemptNumber}</h4>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                                  sub.review?.verdict === "passed"
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : sub.review?.verdict === "needs_revision"
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                {sub.review?.verdict || sub.status}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Submitted {new Date(sub.submittedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {sub.review?.score !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Score:</span>
                            <span
                              className={`text-lg font-bold ${
                                sub.review.score >= 75 ? "text-emerald-500" : "text-amber-500"
                              }`}
                            >
                              {sub.review.score}/100
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Git Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4 bg-muted/30 p-3 rounded-xl">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Github className="h-3.5 w-3.5" />
                          <a
                            href={sub.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline text-foreground truncate max-w-[200px]"
                          >
                            {sub.githubUrl.replace("https://github.com/", "")}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono">
                          <GitBranch className="h-3.5 w-3.5" />
                          <span>{sub.branch}</span>
                        </div>
                        {sub.commitSha && (
                          <div className="flex items-center gap-1.5 font-mono">
                            <GitCommit className="h-3.5 w-3.5" />
                            <a
                              href={`${sub.githubUrl}/commit/${sub.commitSha}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline text-primary"
                            >
                              {(sub.commitSha || "").slice(0, 7)}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Review Summary */}
                      {sub.review && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                              Mentor Evaluation
                            </h5>
                            <p className="text-sm text-foreground/90 leading-relaxed">{sub.review.summary}</p>
                          </div>

                          {/* Strengths & Improvements */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {sub.review.strengths?.length > 0 && (
                              <div className="rounded-xl bg-emerald-500/5 p-3.5 border border-emerald-500/15 space-y-2">
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle className="h-3.5 w-3.5" /> Strengths
                                </span>
                                <ul className="space-y-1 text-xs text-foreground/85 list-disc list-inside">
                                  {sub.review.strengths.map((st: string, sIdx: number) => (
                                    <li key={sIdx} className="leading-relaxed">
                                      {st}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {sub.review.improvements?.length > 0 && (
                              <div className="rounded-xl bg-amber-500/5 p-3.5 border border-amber-500/15 space-y-2">
                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                  <AlertCircle className="h-3.5 w-3.5" /> Actionable Improvements
                                </span>
                                <ul className="space-y-1 text-xs text-foreground/85 list-disc list-inside">
                                  {sub.review.improvements.map((imp: string, iIdx: number) => (
                                    <li key={iIdx} className="leading-relaxed">
                                      {imp}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Criteria Verification Matrix */}
                          {sub.review.criteria_results?.length > 0 && (
                            <div className="pt-2 space-y-2">
                              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                Acceptance Criteria Breakdown
                              </span>
                              <div className="space-y-2">
                                {sub.review.criteria_results.map((c: any, cIdx: number) => (
                                  <div
                                    key={cIdx}
                                    className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border/60 bg-card text-xs"
                                  >
                                    <div className="space-y-1">
                                      <p className="font-medium text-foreground">{c.criterion}</p>
                                      <p className="text-muted-foreground">{c.reason}</p>
                                      {c.evidence?.length > 0 && (
                                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-primary">
                                          <FileCode2 className="h-3 w-3" />
                                          <span>{c.evidence.join(", ")}</span>
                                        </div>
                                      )}
                                    </div>
                                    <span
                                      className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        c.status === "met"
                                          ? "bg-emerald-500/10 text-emerald-500"
                                          : "bg-rose-500/10 text-rose-500"
                                      }`}
                                    >
                                      {c.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Next Steps */}
                          {sub.review.next_step && (
                            <div className="rounded-xl bg-primary/5 p-3.5 border border-primary/15 text-xs text-foreground/90">
                              <strong className="text-primary block font-semibold mb-1">Mentor Next Steps:</strong>
                              {sub.review.next_step}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROADMAP */}
          {activeTab === "roadmap" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground">Curriculum & Milestone Progression</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track your progress through all progressive milestones in this {enrollment.durationWeeks}-week engineering track.
                </p>
              </div>

              <div className="space-y-4">
                {milestones.map((m, idx) => {
                  const isCurrent = m.milestone_index === currentMilestoneIndex;
                  const isCompleted = m.status === "completed" || m.milestone_index < currentMilestoneIndex;
                  const matchingTask = allTasks.find((t) => t.milestone_index === m.milestone_index);

                  return (
                    <div
                      key={m.id || idx}
                      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? "border-primary bg-primary/[0.02] shadow-sm"
                          : isCompleted
                          ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                          : "border-border/60 bg-muted/20 opacity-70"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                      </span>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-foreground">{m.title}</h4>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isCompleted
                                ? "bg-emerald-500/10 text-emerald-500"
                                : isCurrent
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isCompleted ? "Completed" : isCurrent ? "Active Milestone" : "Upcoming"}
                          </span>
                        </div>

                        {/* Milestone Tasks */}
                        {(() => {
                          const mTasks = allTasks.filter((t) => t.milestone_index === m.milestone_index);
                          if (mTasks.length === 0) {
                            return (
                              <p className="text-xs text-muted-foreground pt-1">
                                Task will be configured upon unlocking this milestone.
                              </p>
                            );
                          }
                          return (
                            <div className="space-y-2 pt-2">
                              {mTasks.map((task) => {
                                const isThis = task.id === activeTask.id;
                                return (
                                  <Link
                                    key={task.id}
                                    href={`/student/learning?taskId=${task.id}`}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                                      isThis
                                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                                        : "border-border/60 bg-card hover:bg-muted/40 text-foreground"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <FileCode2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                      <span className="truncate max-w-[280px]">{task.title}</span>
                                    </div>
                                    <span
                                      className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        task.status === "completed"
                                          ? "bg-emerald-500/10 text-emerald-500"
                                          : isThis
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {task.status === "completed" ? "Passed" : isThis ? "Viewing" : task.status}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTION / SUBMISSION / REVIEW HERO (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* A. IN-FLIGHT ASYNCHRONOUS PROCESSING CARD */}
          {isInFlight && (
            <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/[0.03] to-card p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-primary animate-ping" />
                  <h3 className="font-bold text-sm text-foreground">Review In Progress</h3>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Attempt #{latestSubmission.attemptNumber}
                </span>
              </div>

              {/* Multi-Stage Step Progress */}
              <div className="space-y-4">
                {[
                  {
                    id: "queued",
                    label: "1. Submission Queued",
                    desc: "Persisted in execution queue",
                    icon: Database,
                    active: true,
                    done: activeJobStatus !== "queued",
                  },
                  {
                    id: "github",
                    label: "2. GitHub Analysis",
                    desc: "Verifying commit & deliverables tree",
                    icon: Github,
                    active: ["running", "github_analysis", "sandbox_execution", "ai_review", "validation", "completed"].includes(
                      activeJobStatus || ""
                    ),
                    done: ["sandbox_execution", "ai_review", "validation", "completed"].includes(activeJobStatus || ""),
                  },
                  {
                    id: "sandbox",
                    label: "3. Container Execution",
                    desc: "Running tests in Modal sandbox",
                    icon: Cpu,
                    active: ["sandbox_execution", "ai_review", "validation", "completed"].includes(activeJobStatus || ""),
                    done: ["ai_review", "validation", "completed"].includes(activeJobStatus || ""),
                  },
                  {
                    id: "ai",
                    label: "4. AI Mentor Review",
                    desc: "Analyzing code architecture with OpenRouter",
                    icon: Sparkles,
                    active: ["ai_review", "validation", "completed"].includes(activeJobStatus || ""),
                    done: ["validation", "completed"].includes(activeJobStatus || ""),
                  },
                  {
                    id: "validation",
                    label: "5. Score Validation",
                    desc: "Ensuring factual benchmark alignment",
                    icon: ShieldCheck,
                    active: ["validation", "completed"].includes(activeJobStatus || ""),
                    done: activeJobStatus === "completed",
                  },
                ].map((step, sIdx) => {
                  return (
                    <div key={sIdx} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {step.done ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check className="h-3 w-3" />
                          </div>
                        ) : step.active ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                          </div>
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground text-[10px] font-bold">
                            {sIdx + 1}
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p
                          className={`text-xs font-semibold ${
                            step.active ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground border border-border/60">
                You can safely refresh or leave this page. Your submission is saved and verified in the cloud.
              </div>
            </div>
          )}

          {/* B. PASS STATE & NEXT TASK PROGRESSION */}
          {isLatestPassed && (
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.04] to-card p-6 shadow-sm space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Award className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Task Completed!</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  You passed Milestone {currentMilestoneIndex + 1} with a score of{" "}
                  <strong className="text-emerald-500">{latestSubmission?.review?.score || 90}/100</strong>.
                </p>
              </div>

              {nextTask ? (
                <div className="pt-2">
                  <Link
                    href={`/student/learning?taskId=${nextTask.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20"
                  >
                    Proceed to Next Task
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-[11px] text-muted-foreground mt-2 truncate">
                    Next: {nextTask.title}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">
                  Your AI mentor is preparing your next progressive milestone task.
                </div>
              )}
            </div>
          )}

          {/* C. MANUAL REVIEW STATE */}
          {isLatestManualReview && !isInFlight && (
            <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-b from-sky-500/[0.04] to-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Manual Verification Required</h3>
                  <p className="text-xs text-muted-foreground">
                    Score: <strong className="text-sky-500">{latestSubmission?.review?.score}/100</strong>
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Automated tests and checks completed successfully. Your submission requires final mentor/instructor sign-off before unlocking the next milestone.
              </p>

              <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground border border-border/60">
                You will be notified once manual review is finalized.
              </div>
            </div>
          )}

          {/* D. NEEDS REVISION STATE */}
          {isLatestNeedsRevision && !isInFlight && !showRevisionForm && (
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.04] to-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Revision Required</h3>
                  <p className="text-xs text-muted-foreground">
                    Score: <strong className="text-amber-500">{latestSubmission?.review?.score}/100</strong>
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Review the mentor feedback above, update your implementation in GitHub, and submit a new revision attempt.
              </p>

              <button
                onClick={() => setShowRevisionForm(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Submit Revision (Attempt {(latestSubmission?.attemptNumber || 1) + 1})
              </button>
            </div>
          )}

          {/* D. SUBMISSION FORM (Initial or Revision) */}
          {(!isInFlight && !isLatestPassed && (!isLatestNeedsRevision || showRevisionForm)) && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  {showRevisionForm
                    ? `Submit Revision (Attempt ${(latestSubmission?.attemptNumber || 1) + 1})`
                    : "Submit Your Work"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Connect your GitHub repository commit for automated container testing and mentor review.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <div className="rounded-xl bg-rose-500/10 p-3 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* GitHub Repo URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>GitHub Repository URL</span>
                    <span className="text-[10px] text-muted-foreground">Must be public</span>
                  </label>
                  <div className="relative">
                    <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/username/repository"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Branch & Commit SHA */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Branch</label>
                    <input
                      type="text"
                      placeholder="main"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Commit SHA</span>
                      <span className="text-[10px] text-muted-foreground">HEAD</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 7fd1a60"
                      value={commitSha}
                      onChange={(e) => setCommitSha(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Implementation Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Implementation Notes</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Briefly describe what you implemented, files changed, and test coverage..."
                    value={studentExplanation}
                    onChange={(e) => setStudentExplanation(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex items-center gap-3">
                  {showRevisionForm && (
                    <button
                      type="button"
                      onClick={() => setShowRevisionForm(false)}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Queueing Submission...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {showRevisionForm ? "Submit Revision" : "Submit for AI Review"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* E. REVISION IN PROGRESS / INFRASTRUCTURE RETRY */}
          {isLatestFailed && !isInFlight && (
            <div className="rounded-3xl border border-rose-500/30 bg-rose-500/[0.03] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-rose-500">
                <AlertCircle className="h-5 w-5" />
                <h4 className="font-bold text-sm">Processing Interrupted</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The automated cloud runner encountered a temporary infrastructure interruption. Your submission attempt is saved and can be safely retried.
              </p>
              <button
                onClick={() => {
                  setPollingActive(true);
                  setActiveJobStatus("queued");
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Review Verification
              </button>
            </div>
          )}

          {/* F. STUDENT PROGRESS CARD */}
          {learningState && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                  Internship Velocity
                </h4>
                <span className="text-xs font-bold text-primary">
                  {learningState.average_score > 0 ? `${Math.round(learningState.average_score)}% Avg` : "Initial Phase"}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Milestone Completion</span>
                  <span className="font-medium text-foreground">
                    {learningState.completed_milestones?.length || 0} / {milestones.length || 4}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (((learningState.completed_milestones?.length || 0) + (isLatestPassed ? 1 : 0)) /
                          (milestones.length || 4)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {learningState.difficulty_recommendation && (
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="text-muted-foreground">Adaptive Target:</span>
                  <span className="font-semibold text-foreground">
                    {learningState.current_difficulty?.toUpperCase() || "INTERMEDIATE"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icon helper
function Database(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}
