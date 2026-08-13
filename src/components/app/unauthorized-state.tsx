import Link from "next/link";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export interface UnauthorizedStateProps {
  title?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
}

// Not wired into any layout yet (Phase 3B has no real auth check to fail).
// This exists so Phase 3C's role check has a ready-made place to redirect
// to / render, without inventing a second component later.
export function UnauthorizedState({
  title = "You don't have access to this page",
  description = "This area requires a different account or role.",
  href = "/",
  actionLabel = "Back to NOVA",
}: UnauthorizedStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-border px-6 py-16 text-center">
      <Lock className="h-8 w-8 text-text-muted" aria-hidden="true" />
      <p className="text-body font-medium text-text">{title}</p>
      <p className="max-w-md text-small text-text-muted">{description}</p>
      <Link href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
        {actionLabel}
      </Link>
    </div>
  );
}
