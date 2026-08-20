"use client";

import Link from "next/link";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CareersSubNavProps {
  activeHref?: string;
  className?: string;
}

const LIFE_AT_NOVA_LINKS = [
  { href: "/careers", label: "Overview" },
  { href: "/careers/why-nova", label: "Why NOVA" },
  { href: "/careers/squad-life", label: "Squad Life" },
  { href: "/careers/hiring-process", label: "Hiring Process" },
];

const ECOSYSTEM_CATEGORIES = [
  { href: "/internships", label: "Opportunities", badge: "Live DB" },
  { href: "/courses", label: "Learning & Growth", badge: "Catalog" },
];

export function CareersSubNav({ activeHref = "/careers", className }: CareersSubNavProps) {
  return (
    <div
      className={cn(
        "sticky top-16 z-30 w-full border-b border-white/10 bg-[#07070A]/85 backdrop-blur-xl transition-colors",
        className
      )}
    >
      <div className="mx-auto flex h-12 w-full max-w-[1560px] items-center justify-between px-4 sm:px-8 lg:px-16 xl:px-20 text-xs">
        {/* Left: Ecosystem Label + Life at NOVA destinations */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="hidden md:flex items-center gap-1.5 pr-2.5 border-r border-white/10 text-neutral-400 font-mono font-bold tracking-widest uppercase text-[10px]">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>CAREERS</span>
          </div>

          <nav className="flex items-center gap-1" aria-label="Careers Section Navigation">
            {LIFE_AT_NOVA_LINKS.map((link) => {
              const isActive = activeHref === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "whitespace-nowrap px-3 py-1 rounded-lg font-mono text-[11px] sm:text-xs font-semibold tracking-wider uppercase transition-all",
                    isActive
                      ? "bg-white/15 text-cyan-300 shadow-xs border border-cyan-500/30"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Direct jumps to Opportunities & Learning */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px]">
          <span className="text-neutral-500 uppercase tracking-widest text-[10px] mr-1">DESTINATIONS:</span>
          {ECOSYSTEM_CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
            >
              <span>{cat.label}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                {cat.badge}
              </span>
              <ArrowUpRight className="h-3 w-3 text-neutral-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
