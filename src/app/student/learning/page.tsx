import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Learning — NOVA" };

export default function StudentLearningPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Learning" description="Your learning activity and progress." />
      <EmptyState
        title="Learning activity is coming soon"
        description="Your progress through NOVA's learning content will appear here."
      />
    </div>
  );
}
