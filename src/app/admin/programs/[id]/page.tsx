import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth";
import { EditProgramForm } from "./edit-program-form";
import { StatusControl } from "./status-control";
import { SkillsManager } from "./skills-manager";

export const metadata: Metadata = { title: "Program details — NOVA Admin" };

const idSchema = z.string().uuid();

interface ProgramRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  long_description: string;
  overview: string | null;
  prerequisites: string | null;
  category: string;
  difficulty: string;
  duration_weeks: number;
  career_outcomes: string[];
  status: "draft" | "published" | "archived";
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default async function AdminProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFoundState = (
    <div className="flex flex-col gap-8">
      <PageHeader title="Program details" />
      <EmptyState title="Program not found" description="This program doesn't exist." />
    </div>
  );

  if (!idSchema.safeParse(id).success) return notFoundState;

  const auth = await getAuthenticatedUser();
  if (!auth) return notFoundState; // layout already redirects unauthenticated/non-admin users; safe fallback
  const { supabase } = auth;

  const [{ data: program, error }, { data: allSkills, error: skillsError }, { data: programSkills }, { data: courses }] = await Promise.all([
    supabase
      .from("programs")
      .select(
        "id, slug, name, short_description, long_description, overview, prerequisites, category, difficulty, duration_weeks, career_outcomes, status, display_order, created_at, updated_at"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("skills").select("id, name, category").order("category", { ascending: true }).order("name", { ascending: true }),
    supabase.from("program_skills").select("skill_id").eq("program_id", id),
    supabase.from("courses").select("id, title, status, display_order").eq("program_id", id).order("display_order", { ascending: true }),
  ]);

  if (error || skillsError) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Program details" />
        <ErrorState title="Couldn't load this program" description="Something went wrong. Please try again." />
      </div>
    );
  }

  if (!program) return notFoundState;

  const record = program as ProgramRow;
  const selectedSkillIds = (programSkills ?? []).map((row) => row.skill_id as string);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Programs Catalog
      </Link>

      <PageHeader
        title={record.name}
        description={`Created ${new Date(record.created_at).toLocaleDateString()} · Last updated ${new Date(record.updated_at).toLocaleDateString()}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <EditProgramForm program={record} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h3 className="text-small font-semibold text-text">Skills</h3>
              <SkillsManager programId={record.id} allSkills={allSkills ?? []} selectedSkillIds={selectedSkillIds} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h3 className="text-small font-semibold text-text">Publish state</h3>
              <StatusControl programId={record.id} currentStatus={record.status} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-small font-semibold text-text">Courses</h3>
                <Link href={`/admin/courses/new?program_id=${record.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Add course
                </Link>
              </div>
              {!courses || courses.length === 0 ? (
                <p className="text-small text-text-muted">No courses in this program yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {courses.map((course) => (
                    <li key={course.id}>
                      <Link href={`/admin/courses/${course.id}`} className="flex items-center justify-between gap-2 text-small text-text hover:underline">
                        <span>{course.title}</span>
                        <Badge variant={course.status === "published" ? "success" : course.status === "archived" ? "default" : "warning"}>
                          {course.status}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
