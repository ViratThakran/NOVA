import Link from "next/link";
import { NAV_ITEMS } from "./content";

export function SiteFooter() {
  return (
    <footer id="about" className="scroll-mt-16">
      <div className="mx-auto flex w-full max-w-content flex-col gap-6 border-t border-border px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 xl:px-12">
        <div className="flex flex-col gap-2 lg:max-w-md">
          <Link
            href="/"
            className="rounded-sm text-body font-semibold tracking-tight text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            NOVA
          </Link>
          <p className="text-small text-text-muted">
            A technology organization and platform connecting learning, real-world work,
            technology, talent, and companies in one ecosystem.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-sm text-small text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <p className="text-caption text-text-muted">© {new Date().getFullYear()} NOVA.</p>
      </div>
    </footer>
  );
}
