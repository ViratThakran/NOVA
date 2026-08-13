import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Students — NOVA Admin" };

export default function AdminStudentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Students" description="Manage registered students." />
      <EmptyState
        title="Student management is coming soon"
        description="Registered students, sourced from profiles and student_profiles, will be listed here."
      />
    </div>
  );
}
