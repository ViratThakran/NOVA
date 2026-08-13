import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Programs — NOVA" };

export default function StudentProgramsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Programs" description="NOVA learning programs available to you." />
      <EmptyState
        title="Programs are coming soon"
        description="NOVA's learning programs will be listed here once this feature is built."
      />
    </div>
  );
}
