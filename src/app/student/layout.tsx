import { DashboardShell } from "@/components/app/dashboard-shell";
import { STUDENT_NAV_ITEMS } from "@/components/app/dashboard-nav-config";
import { requireRole } from "@/lib/auth";

// The real security boundary is RLS on every table (see
// supabase/migrations), enforced regardless of this check — requireRole()
// exists to send people to the right place in the UI, not to be the
// authorization system itself.
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireRole("student");

  return (
    <DashboardShell roleLabel="Student" navItems={STUDENT_NAV_ITEMS} userEmail={user.email ?? ""}>
      {children}
    </DashboardShell>
  );
}
