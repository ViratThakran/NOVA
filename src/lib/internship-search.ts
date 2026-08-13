// Normalizes the raw `q` search param from /student/internships into either
// a trimmed, length-capped string to pass to an ilike filter, or null when
// there's nothing meaningful to search for (so callers can skip the filter
// entirely rather than running a vacuous `%%` match).
const MAX_QUERY_LENGTH = 100;

export function sanitizeInternshipSearchQuery(raw: string | string[] | undefined): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, MAX_QUERY_LENGTH);
}
