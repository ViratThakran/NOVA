// Single source of truth for dashboard sidebar navigation — edit here, not
// per-page, so the nav can be redesigned later without touching every route.

export interface DashboardNavItem {
  href: string;
  label: string;
}

export interface DashboardNavGroup {
  title: string;
  items: readonly DashboardNavItem[];
}

export const STUDENT_NAV_GROUPS: readonly DashboardNavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      { href: "/student/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "CAREER & OPPORTUNITIES",
    items: [
      { href: "/student/internships", label: "Explore Internships" },
      { href: "/student/applications", label: "My Applications" },
      { href: "/student/enrollments", label: "My Residencies" },
    ],
  },
  {
    title: "LEARNING & SERVICES",
    items: [
      { href: "/student/programs", label: "Learning Programs" },
      { href: "/student/services", label: "AI Services & Requests" },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { href: "/student/profile", label: "Profile & Resume" },
      { href: "/student/notifications", label: "Notifications" },
      { href: "/student/settings", label: "Settings" },
    ],
  },
];

export const STUDENT_NAV_ITEMS: readonly DashboardNavItem[] = STUDENT_NAV_GROUPS.flatMap(
  (group) => group.items
);

export const COMPANY_NAV_ITEMS: readonly DashboardNavItem[] = [
  { href: "/company", label: "Dashboard" },
  { href: "/company/profile", label: "Company" },
  { href: "/company/members", label: "Members" },
  { href: "/company/internships", label: "Internships" },
  { href: "/company/applications", label: "Applications" },
  { href: "/company/services", label: "Services" },
  { href: "/company/services/requests", label: "My Requests" },
];

export const ADMIN_NAV_GROUPS: readonly DashboardNavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      { href: "/admin/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "PEOPLE & PARTNERS",
    items: [
      { href: "/admin/students", label: "Students" },
      { href: "/admin/companies", label: "Companies" },
    ],
  },
  {
    title: "OPPORTUNITIES & RESIDENCIES",
    items: [
      { href: "/admin/internships", label: "Internships" },
      { href: "/admin/applications", label: "Applications" },
      { href: "/admin/enrollments", label: "Enrollments" },
    ],
  },
  {
    title: "LEARNING & SERVICES",
    items: [
      { href: "/admin/programs", label: "Programs" },
      { href: "/admin/courses", label: "Courses" },
      { href: "/admin/services", label: "Services" },
      { href: "/admin/services/requests", label: "Service Requests" },
    ],
  },
  {
    title: "GOVERNANCE & SYSTEM",
    items: [
      { href: "/admin/ai-operations", label: "AI Operations" },
      { href: "/admin/audit-logs", label: "Audit Logs" },
      { href: "/admin/contact", label: "Contact" },
      { href: "/admin/media", label: "Media Studio" },
      { href: "/admin/notifications", label: "Notifications" },
      { href: "/admin/settings", label: "Settings" },
    ],
  },
];

export const ADMIN_NAV_ITEMS: readonly DashboardNavItem[] = ADMIN_NAV_GROUPS.flatMap(
  (group) => group.items
);
