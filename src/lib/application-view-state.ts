// Pure UI-state helpers for the student internship/application experience.
// Kept out of the page components so they're directly unit-testable without
// rendering anything or touching Supabase.

export type ApplicationStatus = "pending" | "under_review" | "accepted" | "rejected";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "info";

// Maps a status value straight from the applications.status column (never an
// invented state) to display copy + a Badge variant.
export function getApplicationStatusMeta(status: string): { label: string; variant: BadgeVariant } {
  switch (status) {
    case "pending":
      return { label: "Pending", variant: "warning" };
    case "under_review":
      return { label: "Under review", variant: "info" };
    case "accepted":
      return { label: "Accepted", variant: "success" };
    case "rejected":
      return { label: "Rejected", variant: "error" };
    default:
      return { label: status, variant: "default" };
  }
}

export type InternshipApplyViewState = "unavailable" | "already_applied" | "can_apply";

// Decides what the internship detail page shows in place of the apply form:
// the internship itself may no longer be visible (closed/archived/deleted,
// which RLS/the page query already collapse into "not found"), the student
// may already have an application against it, or neither — the normal case.
export function getInternshipApplyViewState(params: {
  internshipAvailable: boolean;
  hasExistingApplication: boolean;
}): InternshipApplyViewState {
  if (!params.internshipAvailable) return "unavailable";
  if (params.hasExistingApplication) return "already_applied";
  return "can_apply";
}
