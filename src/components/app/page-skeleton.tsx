import { Skeleton } from "@/components/ui/skeleton";

// Ready for use in route-segment loading.tsx files once real async data
// fetching lands (Phase 3C/3D). Not wired into any route yet in Phase 3B —
// every current page is static, so a loading.tsx here would never fire.
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-2xl" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
