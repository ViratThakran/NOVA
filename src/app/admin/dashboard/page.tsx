import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Admin dashboard — NOVA" };

// Every count below is admin-readable via each table's own `OR
// is_current_user_admin()` RLS branch — no new policy or RPC needed.
const KPIS = [
  { key: "students", label: "Students", table: "user_roles", href: "/admin/students", filter: { role: "student" } },
  { key: "companies", label: "Companies", table: "companies", href: "/admin/companies", filter: {} },
  { key: "openInternships", label: "Open internships", table: "internships", href: "/admin/internships?status=open", filter: { status: "open" } },
  { key: "pendingApplications", label: "Pending applications", table: "applications", href: "/admin/applications?status=pending", filter: { status: "pending" } },
  { key: "activeEnrollments", label: "Active enrollments", table: "enrollments", href: "/admin/enrollments", filter: { status: "active" } },
] as const;

export default async function AdminDashboardPage() {
  const supabase = await createServerSideClient();

  const results = await Promise.all(
    KPIS.map((kpi) => {
      let query = supabase.from(kpi.table).select("*", { count: "exact", head: true });
      for (const [column, value] of Object.entries(kpi.filter)) {
        query = query.eq(column, value);
      }
      return query;
    })
  );

  const hasError = results.some((r) => r.error);
  if (hasError) {
    results.forEach((r, i) => r.error && console.error(`AdminDashboardPage KPI "${KPIS[i].key}":`, r.error));
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Admin dashboard" description="An overview of platform activity." />

      {hasError ? (
        <ErrorState title="Couldn't load the dashboard" description="Something went wrong. Please try again." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {KPIS.map((kpi, i) => (
            <Link key={kpi.key} href={kpi.href}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="flex flex-col gap-1 p-6">
                  <span className="text-caption text-text-muted">{kpi.label}</span>
                  <span className="text-h2 font-semibold text-text">{results[i].count ?? 0}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
