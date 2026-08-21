import { DashboardShell } from "@/components/app/dashboard-shell";
import { STUDENT_NAV_GROUPS, STUDENT_NAV_ITEMS } from "@/components/app/dashboard-nav-config";
import { requireRole } from "@/lib/auth";
import { countUnread } from "@/lib/notification-view-state";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase } = await requireRole("student");

  const [{ data: profile }, { data: notifications }] = await Promise.all([
    supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle(),
    supabase.from("notifications").select("id, read").eq("user_id", user.id),
  ]);

  const unreadCount = countUnread(notifications ?? []);
  const firstName = profile?.first_name ?? undefined;

  return (
    <DashboardShell
      roleLabel="Student"
      navItems={STUDENT_NAV_ITEMS}
      navGroups={STUDENT_NAV_GROUPS}
      userEmail={user.email ?? ""}
      firstName={firstName}
      unreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
