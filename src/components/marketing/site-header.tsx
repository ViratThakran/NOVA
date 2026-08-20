"use client";

import * as React from "react";
import Link from "next/link";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { MegaNav } from "./mega-nav";
import { MobileNav } from "./mobile-nav";

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = React.useState(!transparent);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (transparent) setScrolled(latest > 30);
  });

  const isFloating = transparent && !scrolled && !isMegaMenuOpen;
  const isDarkNavbar = isFloating || isMegaMenuOpen;

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-40 w-full transition-all duration-300 ease-out",
        isMegaMenuOpen
          ? "border-b border-white/[0.08] bg-[#1C1C1E] text-[#F5F5F5] shadow-none"
          : isFloating
          ? "border-b border-white/10 bg-black/25 backdrop-blur-md text-white"
          : "border-b border-neutral-200/80 bg-white/90 backdrop-blur-md text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
      )}
    >
      <div className="mx-auto grid grid-cols-[1fr_auto_1fr] h-16 w-full max-w-[1560px] items-center px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Zone 1: LEFT — Brand Identity */}
        <div className="flex items-center justify-start">
          <Link
            href="/"
            className={cn(
              "group flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 rounded-sm transition-colors",
              isDarkNavbar ? "focus-visible:ring-white/80" : "focus-visible:ring-neutral-950"
            )}
          >
            <span
              className={cn(
                "text-xl font-bold tracking-[0.14em] font-mono uppercase transition-colors duration-200",
                isDarkNavbar ? "text-white" : "text-neutral-950"
              )}
            >
              NOVA
            </span>
          </Link>
        </div>

        {/* Zone 2: CENTER — Primary Navigation */}
        <nav aria-label="Primary" className="hidden lg:flex items-center justify-center">
          <MegaNav light={isDarkNavbar} onOpenChange={setIsMegaMenuOpen} />
        </nav>

        {/* Zone 3: RIGHT — Actions Suite */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Search platform"
            onClick={() => {
              const el = document.getElementById("platform");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className={cn(
              "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2",
              isDarkNavbar
                ? "text-neutral-300 hover:bg-white/10 hover:text-white focus-visible:ring-white/60"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:ring-neutral-950"
            )}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>

          <Link
            href="/login"
            className={cn(
              "hidden sm:inline-flex items-center justify-center rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
              isDarkNavbar
                ? "text-neutral-200 hover:text-white hover:bg-white/10 focus-visible:ring-white/60"
                : "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 focus-visible:ring-neutral-950"
            )}
          >
            Login
          </Link>

          <Link
            href="/get-started"
            className={cn(
              "inline-flex items-center justify-center rounded-lg px-4 py-1.5 sm:py-2 text-sm font-medium transition-all shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2",
              isDarkNavbar
                ? "bg-white text-neutral-950 hover:bg-neutral-100 focus-visible:ring-white"
                : "bg-neutral-950 text-white hover:bg-neutral-800 focus-visible:ring-neutral-950"
            )}
          >
            Get Started
          </Link>

          <MobileNav light={isDarkNavbar} />
        </div>
      </div>
    </header>
  );
}

