// Pure UI-state helpers for the student enrollment pages. Enrollment status
// only ever comes from the enrollments.status column ('active' | 'completed'
// | 'withdrawn') — never invented.

export type EnrollmentStatus = "active" | "completed" | "withdrawn";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "info";

export function getEnrollmentStatusMeta(status: string): { label: string; variant: BadgeVariant } {
  switch (status) {
    case "active":
      return { label: "Active", variant: "info" };
    case "completed":
      return { label: "Completed", variant: "success" };
    case "withdrawn":
      return { label: "Withdrawn", variant: "warning" };
    default:
      return { label: status, variant: "default" };
  }
}
