import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Notifications — NOVA" };

export default function StudentNotificationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Notifications" description="Updates about your applications and account." />
      <EmptyState
        title="Notifications are coming soon"
        description="Updates from the notifications table will be listed here once this feature is connected."
      />
    </div>
  );
}
