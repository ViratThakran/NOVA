"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-8 w-8 text-caption",
  md: "h-10 w-10 text-small",
  lg: "h-14 w-14 text-body",
} as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  /** Required even when `src` is set — used as the image alt text and as a fallback source for initials. */
  alt: string;
  fallback?: string;
  size?: keyof typeof sizeClasses;
}

export function Avatar({ src, alt, fallback, size = "md", className, ...props }: AvatarProps) {
  const [errored, setErrored] = React.useState(false);
  const showImage = Boolean(src) && !errored;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-elevated font-medium text-text-muted",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showImage ? (
        // Avatar sources are arbitrary/user-provided; next/image would require
        // per-domain remotePatterns config, which is out of scope here.
        <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setErrored(true)} />
      ) : (
        <span aria-hidden="true">{(fallback ?? alt).trim().charAt(0).toUpperCase()}</span>
      )}
      {!showImage && <span className="sr-only">{alt}</span>}
    </span>
  );
}
