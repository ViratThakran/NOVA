import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Enrollments — NOVA Admin" };

export default function AdminEnrollmentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Enrollments" description="Manage active and completed enrollments." />
      <EmptyState
        title="Enrollment management is coming soon"
        description="Enrollments created via accepted applications will be listed here."
      />
    </div>
  );
}
