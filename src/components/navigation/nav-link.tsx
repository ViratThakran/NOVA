"use client";

import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavLinkProps extends LinkProps {
  className?: string;
  activeClassName?: string;
  /** Match only the exact path rather than any nested route beneath it. */
  exact?: boolean;
  children: React.ReactNode;
}

export function NavLink({ href, className, activeClassName, exact = false, children, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const hrefPath = typeof href === "string" ? href : (href.pathname ?? "");
  const isActive = exact ? pathname === hrefPath : pathname === hrefPath || pathname?.startsWith(`${hrefPath}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "rounded-sm text-small font-medium text-text-muted transition-colors hover:text-text",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isActive && (activeClassName ?? "text-text"),
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
