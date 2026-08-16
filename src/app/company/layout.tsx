import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { COMPANY_NAV_ITEMS } from "@/components/app/dashboard-nav-config";
import { getAuthenticatedUser } from "@/lib/auth";

// Deliberately login-only, NOT requireCompanyAccess() — /company/new (a
// company-less user's path to actually creating one) lives under this same
// segment and must render without being redirected away first. Every other
// page under /company/* already calls requireCompanyAccess() itself for
// its own data needs (companyId/companyRole), so the real "must belong to
// a company" gate is still enforced per-page, same non-authoritative
// pattern as student/admin layouts: RLS (is_company_admin()/
// is_company_member(), Phase 5B-1) is the real boundary regardless.
export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login");
  const { user } = auth;

  return (
    <DashboardShell roleLabel="Company" navItems={COMPANY_NAV_ITEMS} userEmail={user.email ?? ""}>
      {children}
    </DashboardShell>
  );
}
