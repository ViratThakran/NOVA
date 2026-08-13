import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Admin dashboard — NOVA" };

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Admin dashboard" description="An overview of platform activity." />
      <EmptyState
        title="The admin dashboard is coming soon"
        description="An overview of students, applications, and enrollments will appear here."
      />
    </div>
  );
}
