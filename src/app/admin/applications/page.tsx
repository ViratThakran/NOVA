import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Applications — NOVA Admin" };

export default function AdminApplicationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Applications" description="Review and act on student applications." />
      <EmptyState
        title="Application review is coming soon"
        description="Pending applications will be listed here, reviewable via the existing review_application() function."
      />
    </div>
  );
}
