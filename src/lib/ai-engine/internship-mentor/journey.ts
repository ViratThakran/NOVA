import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase";
import {
  AI_ML_INTERNSHIP_DEFINITION,
  FULLSTACK_INTERNSHIP_DEFINITION,
  CLOUD_DEVOPS_INTERNSHIP_DEFINITION,
  DATA_ENGINEERING_INTERNSHIP_DEFINITION,
  CYBERSECURITY_INTERNSHIP_DEFINITION,
  UIUX_DESIGN_INTERNSHIP_DEFINITION,
} from "./definitions";
import { generateCurriculumPlan } from "./curriculum";
import { buildStudentContext } from "./context";
import { generateNextInternshipTask } from "./service";
import {
  getEnrollmentWithInternship,
  getStudentLearningState,
  upsertStudentLearningState,
  getEnrollmentMilestones,
  upsertEnrollmentMilestone,
  getInternshipTaskById,
  insertInternshipTask,
  getSubmissionsForTask,
  getReviewsForSubmissions,
  getTasksForEnrollment,
  type StudentLearningStateRow,
  type EnrollmentMilestoneRow,
  type EnrollmentWithInternshipRow,
  type ExecutionJobRow,
  type InternshipTaskRow,
} from "./db";
import type { InternshipDefinition } from "./types";

export interface StudentJourneyState {
  enrollment: EnrollmentWithInternshipRow;
  learningState: StudentLearningStateRow;
  milestones: EnrollmentMilestoneRow[];
  activeTask: any | null;
  submissions: any[];
  reviews: any[];
}

/**
 * Resolves an InternshipDefinition from a title/description.
 */
export function resolveInternshipDefinition(
  title: string,
  description?: string
): InternshipDefinition {
  const normalized = (title + " " + (description || "")).toLowerCase();

  if (normalized.includes("machine learning") || normalized.includes("ai/ml") || normalized.includes("data science") || normalized.includes("ai systems") || normalized.includes("llm")) {
    return AI_ML_INTERNSHIP_DEFINITION;
  }
  if (normalized.includes("cloud") || normalized.includes("devops") || normalized.includes("sre") || normalized.includes("infrastructure")) {
    return CLOUD_DEVOPS_INTERNSHIP_DEFINITION;
  }
  if (normalized.includes("data engineer") || normalized.includes("etl") || normalized.includes("data warehouse")) {
    return DATA_ENGINEERING_INTERNSHIP_DEFINITION;
  }
  if (normalized.includes("security") || normalized.includes("cyber") || normalized.includes("penetration")) {
    return CYBERSECURITY_INTERNSHIP_DEFINITION;
  }
  if (normalized.includes("design") || normalized.includes("ui/ux") || normalized.includes("figma")) {
    return UIUX_DESIGN_INTERNSHIP_DEFINITION;
  }

  // Default to Fullstack Web Development
  return FULLSTACK_INTERNSHIP_DEFINITION;
}

export interface GetOrInitializeJourneyOptions {
  enrollmentId: string;
  studentId: string;
  supabaseClient?: SupabaseClient;
  disableAiFallback?: boolean; // Default true in production
}

/**
 * Idempotently gets or initializes a student's internship mentor journey.
 * 
 * Guarantees:
 * 1. Strict Authorization: Student must own the active enrollment.
 * 2. Idempotency: Repeated calls will never create duplicate learning states, milestones, or tasks.
 * 3. Authoritative Task 1 Generation: Real AI task generation using OpenRouter with deterministic validation.
 * 4. No Silent Mock Fallback: When disableAiFallback is true (production), failure to generate a valid AI task throws an error rather than generating synthetic data.
 */
export async function getOrInitializeStudentJourney(
  options: GetOrInitializeJourneyOptions
): Promise<StudentJourneyState> {
  const {
    enrollmentId,
    studentId,
    supabaseClient,
    disableAiFallback = true,
  } = options;

  const supabase = supabaseClient ?? createAdminClient();

  // 1. Authorize: Verify student owns the enrollment and enrollment is active
  const enrollment = await getEnrollmentWithInternship(supabase, enrollmentId, studentId);
  if (!enrollment) {
    throw new Error("Unauthorized: Enrollment not found or does not belong to the authenticated student.");
  }
  if (enrollment.status !== "active") {
    throw new Error(`Invalid enrollment state: Enrollment status is '${enrollment.status}', must be 'active'.`);
  }

  const internshipTitle = enrollment.internship?.title || "Full-Stack Web Development Intern";
  const internshipDef = resolveInternshipDefinition(internshipTitle, enrollment.internship?.description);
  const curriculum = generateCurriculumPlan(internshipDef);

  // 2. Check if student_learning_states already exists
  let learningState = await getStudentLearningState(supabase, enrollmentId);
  let milestones = await getEnrollmentMilestones(supabase, enrollmentId);

  // 3. If milestones are missing, initialize them idempotently
  if (milestones.length === 0) {
    for (let i = 0; i < curriculum.milestones.length; i++) {
      const cm = curriculum.milestones[i];
      await upsertEnrollmentMilestone(supabase, {
        enrollment_id: enrollmentId,
        milestone_index: cm.milestone_index,
        title: cm.title,
        status: i === 0 ? "in_progress" : "locked",
        completed_task_count: 0,
        average_score: null,
      });
    }
    milestones = await getEnrollmentMilestones(supabase, enrollmentId);
  }

  // 4. If learning state exists and active task exists, return existing journey (Idempotent Path)
  if (learningState?.active_task_id) {
    const activeTask = await getInternshipTaskById(supabase, learningState.active_task_id);
    if (activeTask) {
      const submissions = await getSubmissionsForTask(supabase, activeTask.id);
      const submissionIds = submissions.map((s) => s.id);
      const reviews = await getReviewsForSubmissions(supabase, submissionIds);

      return {
        enrollment,
        learningState,
        milestones,
        activeTask,
        submissions,
        reviews,
      };
    }
  }

  // 5. Initialize Task 1 via Real OpenRouter Generation with Deterministic Validation
  const studentContext = buildStudentContext({
    student: {
      id: studentId,
      name: "Intern",
      declared_skills: enrollment.student_profile?.skills || internshipDef.required_skills.slice(0, 3),
    },
    internship: internshipDef,
    performanceRecords: [],
  });

  const taskGenResult = await generateNextInternshipTask({
    internship: internshipDef,
    curriculum,
    currentMilestone: curriculum.milestones[0],
    studentContext,
    disableFallback: disableAiFallback,
  });

  if (!taskGenResult.validation.valid) {
    throw new Error(
      `Task 1 generation failed deterministic validation: ${taskGenResult.validation.errors.join("; ")}`
    );
  }

  // 6. Persist Task 1 in public.internship_tasks
  const insertedTask = await insertInternshipTask(supabase, {
    enrollment_id: enrollmentId,
    student_id: studentId,
    internship_id: enrollment.internship_id,
    milestone_index: 0,
    title: taskGenResult.task.title,
    objective: taskGenResult.task.objective,
    business_context: taskGenResult.task.business_context,
    instructions: taskGenResult.task.instructions,
    deliverables: taskGenResult.task.deliverables,
    acceptance_criteria: taskGenResult.task.acceptance_criteria,
    skills_practiced: taskGenResult.task.skills_practiced,
    difficulty: taskGenResult.task.difficulty,
    estimated_hours: taskGenResult.task.estimated_hours,
    status: "assigned",
  });

  // 7. Upsert student_learning_states with active_task_id
  learningState = await upsertStudentLearningState(supabase, {
    enrollment_id: enrollmentId,
    student_id: studentId,
    internship_id: enrollment.internship_id,
    current_milestone_index: 0,
    completed_milestones: [],
    active_task_id: insertedTask.id,
    total_submissions: 0,
    passed_submissions: 0,
    average_score: 0,
    learning_velocity: 1.0,
    current_difficulty: "beginner",
    difficulty_recommendation: "MAINTAIN",
    skill_ratings: [],
    observed_strengths: [],
    observed_weaknesses: [],
    repeated_errors: [],
    next_recommended_focus: null,
    capstone_progress_percentage: 0,
    last_evaluated_at: null,
  });

  // 8. Record Notification
  try {
    await supabase.from("notifications").insert({
      user_id: studentId,
      title: "New Internship Task Assigned",
      message: `You have been assigned: ${insertedTask.title}. Begin by reviewing the task specification.`,
    });
  } catch (notifErr) {
    console.error("Failed to write notification:", notifErr);
  }

  return {
    enrollment,
    learningState,
    milestones,
    activeTask: insertedTask,
    submissions: [],
    reviews: [],
  };
}

export interface AuthoritativeJourneyState {
  status: "active" | "no_enrollment";
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    onboarded: boolean;
  };
  enrollment?: {
    id: string;
    status: string;
    internshipTitle: string;
    companyName: string;
    durationWeeks: number;
    description: string;
  };
  learningState?: StudentLearningStateRow | null;
  milestones: EnrollmentMilestoneRow[];
  currentMilestoneIndex: number;
  currentMilestone?: EnrollmentMilestoneRow | null;
  activeTask?: InternshipTaskRow | null;
  currentTask?: InternshipTaskRow | null;
  nextTask?: InternshipTaskRow | null;
  nextAvailableTask?: InternshipTaskRow | null;
  allTasks: InternshipTaskRow[];
  taskSubmissions: Array<{
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
  }>;
  latestSubmission?: any | null;
  latestJob?: ExecutionJobRow | null;
  latestReview?: any | null;
  recentMentorFeedback: Array<{
    id: string;
    taskId: string;
    taskTitle: string;
    milestoneIndex: number;
    attemptNumber: number;
    score: number;
    verdict: string;
    summary: string;
    strengths: string[];
    improvements: string[];
    createdAt: string;
  }>;
  performanceMetrics: {
    tasksCompleted: number;
    totalMilestones: number;
    completedMilestonesCount: number;
    averageScore: number;
    totalRevisions: number;
    progressPercentage: number;
    currentDifficulty: string;
  };
  applications?: Array<{
    id: string;
    internshipId: string;
    internshipTitle: string;
    companyName: string;
    status: string;
    createdAt: string;
  }>;
  nextAction: {
    type: "no_submission" | "processing" | "needs_revision" | "passed" | "manual_review" | "failed";
    badgeText: string;
    badgeVariant: "default" | "success" | "warning" | "destructive" | "info";
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
    currentStageLabel?: string;
  };
}

/**
 * Single Authoritative Resolver for Student Journey State across Dashboard and Workspace.
 * Guarantees that Dashboard and Workspace always agree on active task, milestone, and next action.
 */
export async function resolveAuthoritativeStudentJourney(
  supabase: SupabaseClient,
  studentId: string,
  options?: { targetTaskId?: string }
): Promise<AuthoritativeJourneyState> {
  // 1. Fetch Student Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, onboarded")
    .eq("id", studentId)
    .maybeSingle();

  const userProfile = {
    first_name: profile?.first_name || null,
    last_name: profile?.last_name || null,
    email: profile?.email || "",
    onboarded: profile?.onboarded ?? true,
  };

  // 2. Fetch Active Enrollment
  const { data: enrollments, error: enrollErr } = await supabase
    .from("enrollments")
    .select(`
      id,
      student_id,
      internship_id,
      status,
      created_at,
      internship:internships(
        id,
        title,
        description,
        duration_weeks,
        companies(name)
      )
    `)
    .eq("student_id", studentId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (enrollErr || !enrollments || enrollments.length === 0) {
    // Check if student has submitted applications
    const { data: userApplications } = await supabase
      .from("applications")
      .select(`
        id,
        internship_id,
        status,
        created_at,
        internship:internships(
          id,
          title,
          companies(name)
        )
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    const studentApplications = (userApplications || []).map((app: any) => {
      const rawInternship = Array.isArray(app.internship) ? app.internship[0] : app.internship;
      const rawCompany = Array.isArray(rawInternship?.companies)
        ? rawInternship?.companies[0]
        : rawInternship?.companies;
      return {
        id: app.id,
        internshipId: app.internship_id,
        internshipTitle: rawInternship?.title || "Internship Track",
        companyName: rawCompany?.name || "Partner Company",
        status: app.status,
        createdAt: app.created_at,
      };
    });

    const pendingApp = studentApplications.find(
      (a: any) => a.status === "pending" || a.status === "under_review"
    );
    const acceptedApp = studentApplications.find((a: any) => a.status === "accepted");

    let nextAction: AuthoritativeJourneyState["nextAction"];

    if (acceptedApp) {
      nextAction = {
        type: "no_submission",
        badgeText: "Application Accepted",
        badgeVariant: "success",
        title: "Application Accepted! 🎉",
        description: `Congratulations, you've been selected for ${acceptedApp.internshipTitle} at ${acceptedApp.companyName}. Your residency is being configured.`,
        ctaLabel: "View Applications Tracker",
        ctaHref: "/student/applications",
      };
    } else if (pendingApp) {
      nextAction = {
        type: "no_submission",
        badgeText: pendingApp.status === "under_review" ? "Under Review" : "Application Pending",
        badgeVariant: "warning",
        title: "Application Under Review",
        description: `Your application for ${pendingApp.internshipTitle} at ${pendingApp.companyName} is currently in review.`,
        ctaLabel: "View Application Status",
        ctaHref: `/student/applications/${pendingApp.id}`,
      };
    } else {
      nextAction = {
        type: "no_submission",
        badgeText: "No Active Track",
        badgeVariant: "default",
        title: "Explore Engineering Internships",
        description: "Apply to industry residencies to receive adaptive AI mentorship and real-world milestones.",
        ctaLabel: "Browse Internships",
        ctaHref: "/student/internships",
      };
    }

    return {
      status: "no_enrollment",
      profile: userProfile,
      milestones: [],
      currentMilestoneIndex: 0,
      allTasks: [],
      taskSubmissions: [],
      recentMentorFeedback: [],
      applications: studentApplications,
      performanceMetrics: {
        tasksCompleted: 0,
        totalMilestones: 0,
        completedMilestonesCount: 0,
        averageScore: 0,
        totalRevisions: 0,
        progressPercentage: 0,
        currentDifficulty: "INTERMEDIATE",
      },
      nextAction,
    };
  }

  const activeEnrollment = enrollments[0];
  const enrollmentId = activeEnrollment.id;
  const rawInternship = Array.isArray(activeEnrollment.internship)
    ? activeEnrollment.internship[0]
    : activeEnrollment.internship;
  const rawCompany = Array.isArray(rawInternship?.companies)
    ? rawInternship?.companies[0]
    : rawInternship?.companies;

  const enrollmentMeta = {
    id: enrollmentId,
    status: activeEnrollment.status,
    internshipTitle: rawInternship?.title || "Engineering Track",
    companyName: rawCompany?.name || "Nova Residency",
    durationWeeks: rawInternship?.duration_weeks || 12,
    description: rawInternship?.description || "",
  };

  // 3. In parallel, fetch learning state, milestones, tasks, and submissions
  let [learningState, milestones, tasks, submissionsRes] = await Promise.all([
    getStudentLearningState(supabase, enrollmentId),
    getEnrollmentMilestones(supabase, enrollmentId),
    getTasksForEnrollment(supabase, enrollmentId),
    supabase
      .from("internship_submissions")
      .select("*")
      .eq("enrollment_id", enrollmentId)
      .order("submitted_at", { ascending: true }),
  ]);

  // 4. Auto-initialize journey if enrollment is active but has no tasks yet
  if (tasks.length === 0) {
    try {
      const journey = await getOrInitializeStudentJourney({
        enrollmentId,
        studentId,
        supabaseClient: supabase,
        disableAiFallback: true,
      });
      if (journey.activeTask) {
        tasks = [journey.activeTask];
      }
      learningState = await getStudentLearningState(supabase, enrollmentId);
      milestones = await getEnrollmentMilestones(supabase, enrollmentId);
    } catch (initErr) {
      console.error("resolveAuthoritativeStudentJourney auto-init error:", initErr);
    }
  }

  const allSubmissions = submissionsRes.data || [];
  const submissionIds = allSubmissions.map((s: any) => s.id);
  
  // In parallel, fetch jobs and reviews for all submissions
  let allJobs: ExecutionJobRow[] = [];
  let allReviews: any[] = [];
  let allEvidences: any[] = [];

  if (submissionIds.length > 0) {
    const [jobsRes, reviewsRes, evidencesRes] = await Promise.all([
      supabase.from("execution_jobs").select("*").in("submission_id", submissionIds),
      supabase.from("internship_reviews").select("*").in("submission_id", submissionIds),
      supabase.from("runtime_evidences").select("*").in("submission_id", submissionIds),
    ]);
    allJobs = jobsRes.data || [];
    allReviews = reviewsRes.data || [];
    allEvidences = evidencesRes.data || [];
  }

  // 5. Authoritatively Resolve Active Task
  let activeTask: InternshipTaskRow | null = null;
  if (options?.targetTaskId) {
    // Verify target task belongs to student's active enrollment
    activeTask = tasks.find((t: InternshipTaskRow) => t.id === options.targetTaskId) || null;
  }
  if (!activeTask && learningState?.active_task_id) {
    activeTask = tasks.find((t: InternshipTaskRow) => t.id === learningState?.active_task_id) || null;
  }
  if (!activeTask && tasks.length > 0) {
    // Find first non-completed or latest task
    activeTask = tasks.find((t: InternshipTaskRow) => t.status !== "completed") || tasks[tasks.length - 1];
  }

  // 6. Current Milestone & Next Available Task
  const currentMilestoneIndex = activeTask?.milestone_index ?? learningState?.current_milestone_index ?? 0;
  const currentMilestone =
    milestones.find((m: EnrollmentMilestoneRow) => m.milestone_index === currentMilestoneIndex) || milestones[0] || null;

  const activeTaskSubmissionsRaw = activeTask
    ? allSubmissions.filter((s: any) => s.task_id === activeTask!.id)
    : [];

  const taskSubmissions = activeTaskSubmissionsRaw.map((s: any) => {
    const job = allJobs.find((j) => j.submission_id === s.id) || null;
    const review = allReviews.find((r) => r.submission_id === s.id) || null;
    const evidence = allEvidences.find((e) => e.submission_id === s.id) || null;
    return {
      id: s.id,
      taskId: s.task_id,
      studentId: s.student_id,
      enrollmentId: s.enrollment_id,
      submissionType: s.submission_type || "github",
      githubUrl: s.github_url,
      branch: s.branch || "main",
      commitSha: s.commit_sha,
      studentExplanation: s.student_explanation || "",
      attemptNumber: s.attempt_number || 1,
      status: s.status,
      submittedAt: s.submitted_at,
      job,
      review,
      evidence,
    };
  });

  const latestSubmission = taskSubmissions.length > 0 ? taskSubmissions[taskSubmissions.length - 1] : null;
  const latestJob = latestSubmission?.job || null;
  const latestReview = latestSubmission?.review || null;

  const isCurrentPassed = latestReview?.verdict === "passed" || activeTask?.status === "completed";
  const isNeedsRevision = latestReview?.verdict === "needs_revision";
  const isManualReview = latestReview?.verdict === "manual_review";
  const isProcessing =
    latestSubmission &&
    !latestReview &&
    ["submitted", "collecting_evidence", "running_verification", "in_review"].includes(
      latestSubmission.status
    );
  const isFailed =
    latestSubmission?.status === "failed" || latestJob?.status === "failed" || latestJob?.status === "timed_out";

  // Discover Next Task in Supabase if passed
  let nextTask: InternshipTaskRow | null = null;
  if (isCurrentPassed) {
    nextTask = tasks.find((t: InternshipTaskRow) => t.milestone_index === currentMilestoneIndex + 1) || null;
  }

  // 7. Recent Mentor Feedback Across All Tasks
  const recentMentorFeedback = allReviews
    .map((r: any) => {
      const task = tasks.find((t: InternshipTaskRow) => t.id === r.task_id);
      return {
        id: r.id,
        taskId: r.task_id,
        taskTitle: task?.title || "Engineering Milestone Task",
        milestoneIndex: task?.milestone_index ?? 0,
        attemptNumber: r.attempt_number || 1,
        score: r.score,
        verdict: r.verdict,
        summary: r.summary,
        strengths: r.strengths || [],
        improvements: r.improvements || [],
        createdAt: r.created_at || new Date().toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // 8. Performance Metrics Calculation
  const tasksCompleted = tasks.filter((t: InternshipTaskRow) => t.status === "completed").length;
  const totalMilestones = milestones.length || 4;
  const completedMilestonesCount = milestones.filter((m: EnrollmentMilestoneRow) => m.status === "completed").length;

  let averageScore = 0;
  if (learningState?.average_score && learningState.average_score > 0) {
    averageScore = Math.round(learningState.average_score);
  } else if (allReviews.length > 0) {
    const totalScore = allReviews.reduce((acc: number, r: any) => acc + (r.score || 0), 0);
    averageScore = Math.round(totalScore / allReviews.length);
  }

  const totalRevisions = allSubmissions.filter((s: any) => (s.attempt_number || 1) > 1).length;
  const progressPercentage =
    totalMilestones > 0
      ? Math.min(100, Math.round(((completedMilestonesCount + (isCurrentPassed ? 1 : 0)) / totalMilestones) * 100))
      : 0;

  // 9. Derive Unambiguous Next Action
  let nextAction: AuthoritativeJourneyState["nextAction"];

  if (isProcessing) {
    let stageLabel = "Queued for verification";
    if (latestJob?.status === "running") stageLabel = "Running test sandbox & AI evaluation";
    else if (latestJob?.status === "completed") stageLabel = "Finalizing mentor review";

    nextAction = {
      type: "processing",
      badgeText: "Review in Progress",
      badgeVariant: "info",
      title: "Your mentor is reviewing your work",
      description: `Automated test sandbox and AI evaluation are analyzing commit ${latestSubmission?.commitSha?.slice(0, 7) || ""}.`,
      ctaLabel: "View Live Review",
      ctaHref: `/student/learning?taskId=${activeTask?.id || ""}`,
      currentStageLabel: stageLabel,
    };
  } else if (isNeedsRevision) {
    nextAction = {
      type: "needs_revision",
      badgeText: "Revision Required",
      badgeVariant: "warning",
      title: "Your mentor requested changes",
      description: latestReview?.summary || "Your implementation needs revision before advancing to the next milestone.",
      ctaLabel: "Revise Submission",
      ctaHref: `/student/learning?taskId=${activeTask?.id || ""}`,
    };
  } else if (isManualReview) {
    nextAction = {
      type: "manual_review",
      badgeText: "Manual Review Required",
      badgeVariant: "info",
      title: "Submission Pending Mentor Evaluation",
      description: "Automated checks completed. A mentor or instructor will perform a final review before signoff.",
      ctaLabel: "View Review Details",
      ctaHref: `/student/learning?taskId=${activeTask?.id || ""}`,
    };
  } else if (isFailed) {
    nextAction = {
      type: "failed",
      badgeText: "Verification Interrupted",
      badgeVariant: "destructive",
      title: "Your submission needs to be retried",
      description: "The automated cloud runner encountered a temporary infrastructure issue. Your submission was received and can be retried safely.",
      ctaLabel: "Retry Submission",
      ctaHref: `/student/learning?taskId=${activeTask?.id || ""}`,
    };
  } else if (isCurrentPassed) {
    nextAction = {
      type: "passed",
      badgeText: "Milestone Completed",
      badgeVariant: "success",
      title: nextTask ? "Your next task is ready" : "Track Milestone Completed!",
      description: nextTask
        ? `Proceed to Milestone ${currentMilestoneIndex + 2}: ${nextTask.title}`
        : "You have completed this milestone track. Review your code in the learning workspace.",
      ctaLabel: nextTask ? "Continue to Next Task" : "View Learning Workspace",
      ctaHref: nextTask
        ? `/student/learning?taskId=${nextTask.id}`
        : `/student/learning?taskId=${activeTask?.id || ""}`,
    };
  } else {
    nextAction = {
      type: "no_submission",
      badgeText: `Milestone ${currentMilestoneIndex + 1} Focus`,
      badgeVariant: "default",
      title: "Start your current task",
      description: activeTask?.objective || "Review instructions, implement deliverables in your GitHub repository, and submit for evaluation.",
      ctaLabel: "Start Task",
      ctaHref: activeTask ? `/student/learning?taskId=${activeTask.id}` : "/student/learning",
    };
  }

  return {
    status: "active",
    profile: userProfile,
    enrollment: enrollmentMeta,
    learningState,
    milestones,
    currentMilestoneIndex,
    currentMilestone,
    activeTask,
    currentTask: activeTask,
    nextTask,
    nextAvailableTask: nextTask,
    allTasks: tasks,
    taskSubmissions,
    latestSubmission,
    latestJob,
    latestReview,
    recentMentorFeedback,
    performanceMetrics: {
      tasksCompleted,
      totalMilestones,
      completedMilestonesCount,
      averageScore,
      totalRevisions,
      progressPercentage,
      currentDifficulty: (learningState?.current_difficulty || "intermediate").toUpperCase(),
    },
    nextAction,
  };
}
