import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

// The default state for every not-yet-implemented feature area — an honest
// "nothing here yet" rather than fabricated content or a silent blank page.
export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-dashed border-border px-6 py-16 text-center",
        className
      )}
    >
      <Icon className="h-8 w-8 text-text-muted" aria-hidden="true" />
      <p className="text-body font-medium text-text">{title}</p>
      {description && <p className="max-w-md text-small text-text-muted">{description}</p>}
      {action}
    </div>
  );
}
