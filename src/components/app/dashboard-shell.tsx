import Link from "next/link";
import {
  LogOut,
  Shield,
  User,
  ChevronRight,
  Bell,
  Sparkles,
  Search,
  MessageSquare,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  FileText,
  GraduationCap,
  BookOpen,
  FolderClosed,
  UserCheck,
  Bookmark,
  CreditCard,
  Settings,
  SlidersHorizontal,
  Briefcase,
  Layers,
  Building2,
  Users,
  Cpu,
  Inbox,
  Image,
} from "lucide-react";
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

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  FileText,
  GraduationCap,
  BookOpen,
  FolderClosed,
  UserCheck,
  Bookmark,
  CreditCard,
  Bell,
  Settings,
  SlidersHorizontal,
  Briefcase,
  Layers,
  User,
  Building2,
  Users,
  Cpu,
  Inbox,
  Image,
};

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
    <div className="flex min-h-screen flex-col md:flex-row bg-[#F4F6FB] text-slate-900 font-sans antialiased selection:bg-sky-500/20 relative overflow-x-hidden">
      {/* Soft atmospheric gradient mesh for glassmorphism refraction */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl opacity-70" />
        <div className="absolute top-1/4 right-0 w-[30rem] h-[30rem] bg-indigo-100/60 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-1/3 w-[28rem] h-[28rem] bg-purple-100/50 rounded-full blur-3xl opacity-60" />
      </div>

      {/* SIDEBAR: DEEP NAVY BLUE LIKE REFERENCE */}
      <aside className="shrink-0 bg-[#0B1322] border-b md:border-b-0 md:border-r border-[#162238] md:w-60 lg:w-64 flex flex-col justify-between text-white z-20 shadow-xl">
        <div>
          {/* Logo / Brand Header */}
          <div className="flex items-center justify-between gap-3 p-5 lg:px-6 lg:py-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-sm text-lg font-black tracking-widest text-white uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center border border-white/15 shadow-sm">
                <Shield className="h-3.5 w-3.5 text-sky-400" />
              </div>
              <span>NOVA</span>
              <span className="text-[9px] font-mono font-medium text-slate-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                {roleLabel.toUpperCase()}
              </span>
            </Link>
          </div>

          {/* Navigation Groups */}
          <nav
            aria-label={`${roleLabel} Navigation`}
            className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-col md:overflow-visible md:px-4 md:py-2 md:gap-6 scrollbar-none"
          >
            {navGroups && navGroups.length > 0 ? (
              navGroups.map((group) => (
                <div key={group.title} className="flex flex-col gap-1.5">
                  <span className="hidden md:block px-3 font-mono text-[9.5px] font-bold text-[#64748B] uppercase tracking-[0.24em]">
                    {group.title}
                  </span>
                  <div className="flex gap-1 md:flex-col md:gap-1">
                    {group.items.map((item) => {
                      const IconComponent = item.iconName ? ICON_MAP[item.iconName] || LayoutDashboard : LayoutDashboard;
                      return (
                        <NavLink
                          key={item.href}
                          href={item.href}
                          className="shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-medium text-[#94A3B8] hover:bg-white/[0.06] hover:text-white md:whitespace-normal transition-all duration-150 flex items-center gap-2.5"
                          activeClassName="bg-[#18233C] text-white font-semibold shadow-xs"
                        >
                          <IconComponent className="h-4 w-4 shrink-0 opacity-80" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex gap-1 md:flex-col md:gap-1">
                {navItems.map((item) => {
                  const IconComponent = item.iconName ? ICON_MAP[item.iconName] || LayoutDashboard : LayoutDashboard;
                  return (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      className="shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-medium text-[#94A3B8] hover:bg-white/[0.06] hover:text-white md:whitespace-normal transition-all duration-150 flex items-center gap-2.5"
                      activeClassName="bg-[#18233C] text-white font-semibold shadow-xs"
                    >
                      <IconComponent className="h-4 w-4 shrink-0 opacity-80" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer: Logout Button */}
        <div className="hidden md:flex flex-col gap-2 p-4 border-t border-[#162238]">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#94A3B8] hover:text-red-400 hover:bg-white/[0.04] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT AREA WITH FROSTED GLASS TOPBAR */}
      <div className="flex flex-1 flex-col min-w-0 z-10">
        {/* Top Header with Glassmorphism */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-200/60 bg-white/75 backdrop-blur-2xl px-6 lg:px-8 py-3.5 sticky top-0 z-20 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
          {/* Search Input Bar */}
          <div className="relative flex items-center max-w-xs sm:max-w-sm w-full">
            <Search className="absolute left-3.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${roleLabel.toLowerCase()} portal...`}
              aria-label="Search portal"
              className="w-full pl-9 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-300 rounded-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all shadow-inner/10"
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell */}
            <Link
              href={isStudent ? "/student/notifications" : "/admin/notifications"}
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>

            {/* Profile Avatar */}
            <Link
              href={isStudent ? "/student/profile" : "/admin/settings"}
              className="flex items-center gap-2.5 pl-1 rounded-full hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 border border-white shadow-xs flex items-center justify-center text-white text-xs font-bold">
                {(firstName || userEmail)[0].toUpperCase()}
              </div>
            </Link>

            {/* Mobile Logout */}
            <form action={logoutAction} className="md:hidden">
              <button
                type="submit"
                className="p-2 rounded-full text-slate-500 hover:text-red-500 hover:bg-slate-100 transition-colors"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
