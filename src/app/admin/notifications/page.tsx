import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Notifications — NOVA Admin" };

export default function AdminNotificationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Notifications" description="System notifications." />
      <EmptyState title="Notifications are coming soon" description="Platform-wide notifications will appear here." />
    </div>
  );
}
