import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Internships — NOVA" };

export default function StudentInternshipsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Internships" description="Browse open internships." />
      <EmptyState
        title="Internship listings are coming soon"
        description="Open internships from the internships table will be listed here once this feature is connected."
      />
    </div>
  );
}
