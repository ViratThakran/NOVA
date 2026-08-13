import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Applications — NOVA" };

export default function StudentApplicationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Your applications" description="Track the status of internships you've applied to." />
      <EmptyState
        title="Your applications will appear here"
        description="Applications you submit will be listed here, sourced from the applications table."
      />
    </div>
  );
}
