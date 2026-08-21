import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV_ITEMS, ADMIN_NAV_GROUPS } from "@/components/app/dashboard-nav-config";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRole("admin");

  return (
    <DashboardShell
      roleLabel="Admin"
      navItems={ADMIN_NAV_ITEMS}
      navGroups={ADMIN_NAV_GROUPS}
      userEmail={user.email ?? ""}
    >
      {children}
    </DashboardShell>
  );
}
