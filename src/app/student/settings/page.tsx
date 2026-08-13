import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Settings — NOVA" };

export default function StudentSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" description="Manage your account preferences." />
      <EmptyState title="Settings are coming soon" description="Account preferences will be manageable here." />
    </div>
  );
}
