import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Internship details — NOVA" };

export default async function StudentInternshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Internship details" description={`Viewing internship ${id}.`} />
      <EmptyState
        title="Internship details are coming soon"
        description="The full listing and your application status for this internship will appear here."
      />
    </div>
  );
}
