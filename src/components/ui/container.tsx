import * as React from "react";
import { cn } from "@/lib/utils";

// Responsive page-width wrapper: 16px padding on mobile, 24px on tablet,
// scaling to 32-48px on desktop, capped at the 1280px max content width.
export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8 xl:px-12", className)}
      {...props}
    />
  );
}
