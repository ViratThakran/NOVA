import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Portfolio — NOVA" };

export default function StudentPortfolioPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Portfolio" description="A shareable record of your work on NOVA." />
      <EmptyState
        title="Your portfolio is coming soon"
        description="A shareable summary of your NOVA work and outcomes will appear here."
      />
    </div>
  );
}
