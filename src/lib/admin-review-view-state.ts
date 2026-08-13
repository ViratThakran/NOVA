// Pure UI-state helpers for the admin application review workflow. These
// mirror the *conditions* that review_application() and
// mark_application_under_review() themselves enforce — never the
// transitions/side-effects — so the admin UI can show or hide the right
// buttons without duplicating any SQL. The RPCs remain the sole, authoritative
// enforcement of these rules; a mismatch here only ever hides a button early,
// it can never let an invalid transition through (the RPC still re-checks).

export type ApplicationStatus = "pending" | "under_review" | "accepted" | "rejected";

// Mirrors mark_application_under_review()'s own guard: `status != 'pending'`.
export function canMarkUnderReview(status: string): boolean {
  return status === "pending";
}

// Mirrors review_application()'s own guard: `status NOT IN ('pending', 'under_review')`.
export function canReview(status: string): boolean {
  return status === "pending" || status === "under_review";
}

export type ApplicationStatusFilter = "all" | ApplicationStatus;

const VALID_STATUS_FILTERS: readonly ApplicationStatusFilter[] = [
  "all",
  "pending",
  "under_review",
  "accepted",
  "rejected",
];

// Normalizes the raw `status` search param on /admin/applications to one of
// the real applications.status values (or "all") — never an invented state,
// and never passes an unrecognized value straight into a query filter.
export function normalizeApplicationStatusFilter(raw: string | string[] | undefined): ApplicationStatusFilter {
  if (typeof raw !== "string") return "all";
  return (VALID_STATUS_FILTERS as readonly string[]).includes(raw) ? (raw as ApplicationStatusFilter) : "all";
}
