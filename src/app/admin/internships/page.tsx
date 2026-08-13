import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Internships — NOVA Admin" };

export default function AdminInternshipsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Internships" description="Create and manage internship listings." />
      <EmptyState
        title="Internship management is coming soon"
        description="You'll be able to create, edit, and publish internships from the internships table here."
      />
    </div>
  );
}
