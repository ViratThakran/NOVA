// Single source of truth for dashboard sidebar navigation — edit here, not
// per-page, so the nav can be redesigned later without touching every route.

export interface DashboardNavItem {
  href: string;
  label: string;
  iconName?: string;
}

export interface DashboardNavGroup {
  title: string;
  items: readonly DashboardNavItem[];
}

export const STUDENT_NAV_GROUPS: readonly DashboardNavGroup[] = [
  {
    title: "ACADEMIC & RESIDENCIES",
    items: [
      { href: "/student/dashboard", label: "Dashboard", iconName: "LayoutDashboard" },
      { href: "/student/enrollments", label: "My Residencies", iconName: "Briefcase" },
      { href: "/student/applications", label: "Applications", iconName: "ClipboardList" },
      { href: "/student/programs", label: "Learning Programs", iconName: "GraduationCap" },
      { href: "/student/projects", label: "Deliverables", iconName: "FolderClosed" },
      { href: "/student/internships", label: "Opportunities", iconName: "Bookmark" },
      { href: "/student/services", label: "AI Services", iconName: "Layers" },
    ],
  },
  {
    title: "ACCOUNT & SETTINGS",
    items: [
      { href: "/student/profile", label: "Profile & Resume", iconName: "User" },
      { href: "/student/notifications", label: "Notifications", iconName: "Bell" },
      { href: "/student/settings", label: "Settings", iconName: "Settings" },
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
