import Link from "next/link";
import { LogOut, Shield, User, ChevronRight, Bell, Sparkles } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import { NavLink } from "@/components/navigation/nav-link";
import type { DashboardNavItem, DashboardNavGroup } from "./dashboard-nav-config";

export interface DashboardShellProps {
  roleLabel: string;
  navItems: readonly DashboardNavItem[];
  navGroups?: readonly DashboardNavGroup[];
  userEmail: string;
  firstName?: string;
  unreadCount?: number;
  children: React.ReactNode;
}

export function DashboardShell({
  roleLabel,
  navItems,
  navGroups,
  userEmail,
  firstName,
  unreadCount = 0,
  children,
}: DashboardShellProps) {
  const isStudent = roleLabel.toLowerCase() === "student";

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#080B11] text-slate-100 selection:bg-indigo-500/30">
      {/* SIDEBAR / MOBILE NAV */}
      <aside className="shrink-0 border-b border-slate-800/80 bg-[#0B0E17] md:w-64 md:border-b-0 md:border-r border-slate-800/80 flex flex-col justify-between">
        <div>
          {/* Logo / Brand Header */}
          <div className="flex items-center justify-between gap-3 p-4 md:px-6 md:py-5 border-b border-slate-800/60">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-sm text-base font-black tracking-wider text-white uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Shield className="h-5 w-5 text-indigo-400" />
              <span>NOVA</span>
              <span className="text-[10px] font-mono font-normal text-slate-400 border border-slate-700/60 px-1.5 py-0.5 rounded">
                {isStudent ? "STUDENT" : "OPS"}
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 font-mono text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav
            aria-label={`${roleLabel} navigation`}
            className="flex gap-1 overflow-x-auto p-3.5 md:flex-col md:overflow-visible md:p-4 md:gap-5 scrollbar-none"
          >
            {navGroups && navGroups.length > 0 ? (
              navGroups.map((group) => (
                <div key={group.title} className="flex flex-col gap-1">
                  <span className="hidden md:block px-3 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em]">
                    {group.title}
                  </span>
                  <div className="flex gap-1 md:flex-col">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.href}
                        href={item.href}
                        className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 md:whitespace-normal transition-all"
                        activeClassName="bg-indigo-600/15 text-indigo-300 font-semibold border-l-2 border-indigo-500 pl-2.5"
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex gap-1 md:flex-col">
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 md:whitespace-normal transition-all"
                    activeClassName="bg-indigo-600/15 text-indigo-300 font-semibold border-l-2 border-indigo-500 pl-2.5"
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer — User & System Status */}
        <div className="hidden md:flex flex-col gap-3 p-4 border-t border-slate-800/60 bg-[#090C14]">
          {isStudent ? (
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                CAREER TRACK
              </span>
              <span className="text-[10px] text-slate-500 uppercase">STUDENT PORTAL</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM ONLINE
              </span>
              <span>v2.4</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/40">
            <Link
              href={isStudent ? "/student/profile" : "#"}
              className="flex items-center gap-2 overflow-hidden group hover:opacity-90 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:border-indigo-500/50">
                <User className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-300" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-mono text-slate-200 font-semibold truncate max-w-[110px]">
                  {firstName || userEmail.split("@")[0]}
                </span>
                <span className="text-[10px] font-mono text-slate-500 truncate max-w-[110px]">
                  {userEmail}
                </span>
              </div>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-800/80 bg-[#0B0E17]/90 backdrop-blur-md px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-slate-500">NOVA</span>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="text-indigo-300 font-semibold uppercase">
              {isStudent ? "STUDENT PORTAL" : `${roleLabel} CONSOLE`}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {isStudent ? (
              <>
                <Link
                  href="/student/notifications"
                  className="relative p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-mono font-bold text-white shadow-sm">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/student/profile"
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-[10px] font-bold text-indigo-300 font-mono">
                    {(firstName || userEmail)[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-mono text-slate-300 hidden sm:inline font-semibold">
                    {firstName || userEmail.split("@")[0]}
                  </span>
                </Link>
              </>
            ) : (
              <span className="text-xs font-mono text-slate-400 hidden lg:inline">{userEmail}</span>
            )}

            <form action={logoutAction} className="md:hidden">
              <button
                type="submit"
                className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1560px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
