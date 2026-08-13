import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Settings — NOVA Admin" };

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" description="Platform-wide settings." />
      <EmptyState title="Settings are coming soon" description="Platform configuration will be manageable here." />
    </div>
  );
}
