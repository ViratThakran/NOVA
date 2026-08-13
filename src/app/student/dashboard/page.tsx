import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Dashboard — NOVA" };

export default function StudentDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Your dashboard" description="An overview of your NOVA activity." />
      <EmptyState
        title="Your dashboard is coming soon"
        description="An overview of your applications, enrollments, and activity will appear here."
      />
    </div>
  );
}
