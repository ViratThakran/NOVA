// Pure UI-state helper for admin internship management. Status only ever
// comes from the internships.status column ('draft' | 'open' | 'closed' |
// 'archived') — never invented, and the schema places no restriction on
// which status can move to which, so there is no transition logic here to
// mirror (unlike applications' review_application()).

export type InternshipStatus = "draft" | "open" | "closed" | "archived";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "info";

export const INTERNSHIP_STATUSES: readonly InternshipStatus[] = ["draft", "open", "closed", "archived"];

export function getInternshipStatusMeta(status: string): { label: string; variant: BadgeVariant } {
  switch (status) {
    case "draft":
      return { label: "Draft", variant: "default" };
    case "open":
      return { label: "Open", variant: "success" };
    case "closed":
      return { label: "Closed", variant: "warning" };
    case "archived":
      return { label: "Archived", variant: "info" };
    default:
      return { label: status, variant: "default" };
  }
}
