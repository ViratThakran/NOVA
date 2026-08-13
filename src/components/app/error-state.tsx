import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

// Presentational error block, meant to be rendered from a route-segment
// error.tsx boundary (see src/app/student/error.tsx, src/app/admin/error.tsx).
export function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-error/30 bg-error/5 px-6 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-error" aria-hidden="true" />
      <p className="text-body font-medium text-text">{title}</p>
      <p className="max-w-md text-small text-text-muted">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
