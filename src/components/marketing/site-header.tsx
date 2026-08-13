import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { NAV_ITEMS } from "./content";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
        <Link
          href="/"
          className="rounded-sm text-body font-semibold tracking-tight text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          NOVA
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-sm text-small font-medium text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden md:inline-flex" })}>
            Login
          </Link>
          <Link href="/get-started" className={buttonVariants({ variant: "primary", size: "sm", className: "hidden md:inline-flex" })}>
            Get Started
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
