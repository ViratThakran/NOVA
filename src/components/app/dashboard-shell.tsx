import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { NavLink } from "@/components/navigation/nav-link";
import type { DashboardNavItem } from "./dashboard-nav-config";

export interface DashboardShellProps {
  roleLabel: string;
  navItems: readonly DashboardNavItem[];
  userEmail: string;
  children: React.ReactNode;
}

// Shared shell for both StudentDashboardLayout and AdminDashboardLayout —
// only the role label and nav items differ between them, so the actual
// chrome (sidebar/nav/topbar) is centralized here rather than duplicated.
// One <nav> renders as a vertical sidebar on desktop and a horizontally
// scrollable strip on mobile via responsive classes alone (no separate
// mobile-only markup, no client component needed).
export function DashboardShell({ roleLabel, navItems, userEmail, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="shrink-0 border-b border-border md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 p-4 md:p-6">
          <Link
            href="/"
            className="rounded-sm text-body font-semibold tracking-tight text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            NOVA
          </Link>
          <div className="flex items-center gap-2">
            <Badge>{roleLabel}</Badge>
            {/* Kept in the always-visible sidebar row (not the desktop-only
                topbar below) so logout is reachable on every breakpoint. */}
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Log out">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>

        <nav
          aria-label={`${roleLabel} navigation`}
          className="flex gap-1 overflow-x-auto px-4 pb-4 md:flex-col md:overflow-visible md:px-4 md:pb-6"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="shrink-0 whitespace-nowrap rounded-md px-3 py-2 hover:bg-surface md:whitespace-normal"
              activeClassName="bg-surface text-text"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="hidden items-center justify-end gap-3 border-b border-border px-8 py-4 md:flex">
          <span className="text-small text-text-muted">{userEmail}</span>
          <Avatar alt={userEmail} size="sm" />
        </header>
        <main className="flex-1">
          <Container className="py-8">{children}</Container>
        </main>
      </div>
    </div>
  );
}
