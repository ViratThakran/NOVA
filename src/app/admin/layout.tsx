import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV_ITEMS } from "@/components/app/dashboard-nav-config";
import { requireRole } from "@/lib/auth";

// Same real boundary as src/app/student/layout.tsx: RLS remains the actual
// enforcement (public.is_current_user_admin() already exists server-side
// and is what every admin-only RLS policy actually checks) regardless of
// this UX-level check.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRole("admin");

  return (
    <DashboardShell roleLabel="Admin" navItems={ADMIN_NAV_ITEMS} userEmail={user.email ?? ""}>
      {children}
    </DashboardShell>
  );
}
