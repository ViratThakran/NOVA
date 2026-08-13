import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Profile — NOVA" };

export default function StudentProfilePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Your profile" description="Manage your personal and academic information." />
      <EmptyState
        title="Profile management is coming soon"
        description="You'll be able to view and edit your profile and student details here."
      />
    </div>
  );
}
