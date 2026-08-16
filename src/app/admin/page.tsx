import { redirect } from "next/navigation";

// AdminLayout already runs requireRole("admin") for every route under
// /admin — an unauthenticated or non-admin visitor is redirected before
// this ever executes. This page exists purely so /admin itself resolves
// to something instead of 404ing.
export default function AdminRootPage() {
  redirect("/admin/dashboard");
}
