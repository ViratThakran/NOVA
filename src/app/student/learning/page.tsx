import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { StudentLearningWorkspace } from "./client";
import { resolveAuthoritativeStudentJourney } from "@/lib/ai-engine/internship-mentor";
import { Briefcase, Sparkles, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learning Workspace | NOVA",
  description: "Your personalized engineering tasks, automated repository review, and adaptive curriculum progression.",
};

interface PageProps {
  searchParams: Promise<{ taskId?: string }>;
}

export default async function StudentLearningPage({ searchParams }: PageProps) {
  const { user, supabase } = await requireRole("student");
  const params = await searchParams;

  // Single Authoritative Journey Resolver (Shared with Dashboard)
  const journey = await resolveAuthoritativeStudentJourney(supabase, user.id, {
    targetTaskId: params.taskId,
  });

  if (journey.status === "no_enrollment" || !journey.enrollment) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="AI Internship Mentor"
          description="Your personalized engineering tasks, automated repository review, and adaptive curriculum progression."
        />
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Briefcase className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">No Active Internship Enrollment Found</h2>
          <p className="max-w-md mx-auto text-sm text-muted-foreground mb-6">
            You do not currently have an active internship enrollment. Browse available roles or check your application status to begin your engineering journey.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/student/internships"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              Browse Internships
            </Link>
            <Link
              href="/student/applications"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-background text-foreground font-medium text-sm hover:bg-muted transition-all"
            >
              <BookOpen className="h-4 w-4" />
              View Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!journey.activeTask) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="AI Internship Mentor"
          description="Your personalized engineering tasks, automated repository review, and adaptive curriculum progression."
        />
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Preparing Your Next Engineering Task</h2>
          <p className="max-w-md mx-auto text-sm text-muted-foreground mb-6">
            Your AI mentor is analyzing your skill profile and configuring your milestone requirements. Please refresh in a moment.
          </p>
          <Link
            href="/student/learning"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-sm"
          >
            Refresh Workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <StudentLearningWorkspace
      enrollment={journey.enrollment}
      activeTask={journey.activeTask}
      allTasks={journey.allTasks}
      nextTask={journey.nextTask}
      submissions={journey.taskSubmissions}
      milestones={journey.milestones}
      learningState={journey.learningState || null}
    />
  );
}
