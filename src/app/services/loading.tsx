import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageSkeleton } from "@/components/app/page-skeleton";

export default function Loading() {
  return (
    <PublicPageShell>
      <PageSkeleton />
    </PublicPageShell>
  );
}
