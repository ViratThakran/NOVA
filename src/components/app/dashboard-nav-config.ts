// Single source of truth for dashboard sidebar navigation — edit here, not
// per-page, so the nav can be redesigned later without touching every route.

export interface DashboardNavItem {
  href: string;
  label: string;
}

export const STUDENT_NAV_ITEMS: readonly DashboardNavItem[] = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/onboarding", label: "Onboarding" },
  { href: "/student/profile", label: "Profile" },
  { href: "/student/internships", label: "Internships" },
  { href: "/student/applications", label: "Applications" },
  { href: "/student/enrollments", label: "Enrollments" },
  { href: "/student/services", label: "Services" },
  { href: "/student/programs", label: "Programs" },
  { href: "/student/learning", label: "Learning" },
  { href: "/student/projects", label: "Projects" },
  { href: "/student/portfolio", label: "Portfolio" },
  { href: "/student/notifications", label: "Notifications" },
  { href: "/student/settings", label: "Settings" },
];

export const COMPANY_NAV_ITEMS: readonly DashboardNavItem[] = [
  { href: "/company", label: "Dashboard" },
  { href: "/company/profile", label: "Company" },
  { href: "/company/members", label: "Members" },
  { href: "/company/internships", label: "Internships" },
  { href: "/company/applications", label: "Applications" },
  { href: "/company/services", label: "Services" },
];

export const ADMIN_NAV_ITEMS: readonly DashboardNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/internships", label: "Internships" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/services/requests", label: "Service Requests" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/enrollments", label: "Enrollments" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
  { href: "/admin/contact", label: "Contact" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/settings", label: "Settings" },
];
