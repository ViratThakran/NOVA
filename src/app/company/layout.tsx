import { DashboardShell } from "@/components/app/dashboard-shell";
import { COMPANY_NAV_ITEMS } from "@/components/app/dashboard-nav-config";
import { requireCompanyAccess } from "@/lib/auth";

// Same non-authoritative pattern as student/admin layouts: RLS
// (is_company_admin()/is_company_member(), Phase 5B-1) is the real
// boundary regardless of this check.
export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireCompanyAccess();

  return (
    <DashboardShell roleLabel="Company" navItems={COMPANY_NAV_ITEMS} userEmail={user.email ?? ""}>
      {children}
    </DashboardShell>
  );
}
