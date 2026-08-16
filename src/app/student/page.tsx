import { redirect } from "next/navigation";

// StudentLayout already runs requireRole("student") for every route under
// /student — an unauthenticated or non-student visitor is redirected
// before this ever executes. /student/dashboard itself further redirects
// to /student/onboarding when onboarding isn't complete, so this stays a
// plain hand-off rather than duplicating that check.
export default function StudentRootPage() {
  redirect("/student/dashboard");
}
