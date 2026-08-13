import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Enrollments — NOVA" };

export default function StudentEnrollmentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Your enrollments" description="Internships you've been accepted into." />
      <EmptyState
        title="Your enrollments will appear here"
        description="Once an application is accepted, the resulting enrollment will be listed here."
      />
    </div>
  );
}
