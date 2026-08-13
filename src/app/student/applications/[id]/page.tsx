import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Application details — NOVA" };

export default async function StudentApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Application details" description={`Viewing application ${id}.`} />
      <EmptyState
        title="Application details are coming soon"
        description="The status, cover letter, and review outcome for this application will appear here."
      />
    </div>
  );
}
