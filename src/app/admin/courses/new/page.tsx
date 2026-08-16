import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { createServerSideClient } from "@/lib/supabase";
import { CreateCourseForm } from "./create-course-form";

export const metadata: Metadata = { title: "Create course — NOVA Admin" };

export default async function NewCoursePage({ searchParams }: { searchParams: Promise<{ program_id?: string }> }) {
  const { program_id: prefillProgramId } = await searchParams;
  const supabase = await createServerSideClient();

  // Admin sees every program regardless of status here — a course can be
  // assigned to a still-draft program while both are being built out.
  const { data: programs, error } = await supabase.from("programs").select("id, name").order("display_order", { ascending: true });

  if (error || !programs) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Create course" />
        <ErrorState title="Couldn't load programs" description="Something went wrong. Please try again." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Create course" description="New courses start as a draft, not visible to the public catalog." />
      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <CreateCourseForm programs={programs} defaultProgramId={prefillProgramId} />
        </CardContent>
      </Card>
    </div>
  );
}
