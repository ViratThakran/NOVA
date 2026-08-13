import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Projects — NOVA" };

export default function StudentProjectsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Projects" description="Real work you've built as part of NOVA." />
      <EmptyState
        title="Projects are coming soon"
        description="Projects you complete through NOVA will be listed here."
      />
    </div>
  );
}
