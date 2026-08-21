import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ArrowLeft, Layers } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { EditCourseForm } from "./edit-course-form";
import { StatusControl } from "./status-control";
import { SkillsManager } from "./skills-manager";

export const metadata: Metadata = { title: "Course details — NOVA Admin" };

const idSchema = z.string().uuid();

interface CourseRow {
  id: string;
  program_id: string;
  slug: string;
  title: string;
  description: string;
  overview: string | null;
  prerequisites: string | null;
  learning_outcomes: string[];
  level: string;
  duration_hours: number;
  status: "draft" | "published" | "archived";
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default async function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFoundState = (
    <div className="flex flex-col gap-8">
      <PageHeader title="Course details" />
      <EmptyState title="Course not found" description="This course doesn't exist." />
    </div>
  );

  if (!idSchema.safeParse(id).success) return notFoundState;

  const auth = await getAuthenticatedUser();
  if (!auth) return notFoundState; // layout already redirects unauthenticated/non-admin users; safe fallback
  const { supabase } = auth;

  const [{ data: course, error }, { data: programs, error: programsError }, { data: allSkills, error: skillsError }, { data: courseSkills }] =
    await Promise.all([
      supabase
        .from("courses")
        .select(
          "id, program_id, slug, title, description, overview, prerequisites, learning_outcomes, level, duration_hours, status, display_order, created_at, updated_at"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("programs").select("id, name").order("display_order", { ascending: true }),
      supabase.from("skills").select("id, name, category").order("category", { ascending: true }).order("name", { ascending: true }),
      supabase.from("course_skills").select("skill_id").eq("course_id", id),
    ]);

  if (error || programsError || skillsError) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Course details" />
        <ErrorState title="Couldn't load this course" description="Something went wrong. Please try again." />
      </div>
    );
  }

  if (!course) return notFoundState;

  const record = course as CourseRow;
  const selectedSkillIds = (courseSkills ?? []).map((row) => row.skill_id as string);

  const parentProgram = (programs ?? []).find((p) => p.id === record.program_id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Course Catalog
        </Link>
        {parentProgram && (
          <Link
            href={`/admin/programs/${parentProgram.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            Program: {parentProgram.name}
          </Link>
        )}
      </div>

      <PageHeader
        title={record.title}
        description={`Created ${new Date(record.created_at).toLocaleDateString()} · Last updated ${new Date(record.updated_at).toLocaleDateString()}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <EditCourseForm course={record} programs={programs ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h3 className="text-small font-semibold text-text">Skills</h3>
              <SkillsManager courseId={record.id} allSkills={allSkills ?? []} selectedSkillIds={selectedSkillIds} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h3 className="text-small font-semibold text-text">Publish state</h3>
              <StatusControl courseId={record.id} currentStatus={record.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
