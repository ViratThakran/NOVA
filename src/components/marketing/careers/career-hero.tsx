"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TokenCloudVisual } from "./token-cloud-visual";
export { TexturedHighlight } from "./textured-highlight";

export interface CareerHeroProps {
  /** Main headline text or formatted elements */
  headline: React.ReactNode;
  /** Subtitle / lead paragraph */
  description?: React.ReactNode;
  /** Primary button label */
  primaryCtaLabel?: string;
  /** Primary button href */
  primaryCtaHref?: string;
  /** Optional secondary button or extra action elements */
  children?: React.ReactNode;
  /** Chapter identifier (e.g. "01 / CAREERS AT NOVA") */
  chapter?: string;
  className?: string;
}

export function CareerHero({
  headline,
  description,
  primaryCtaLabel,
  primaryCtaHref = "/internships",
  children,
  chapter,
  className,
}: CareerHeroProps) {
  return (
    <section
      data-chapter={chapter}
      className={cn(
        "relative min-h-[50vh] sm:min-h-[58vh] lg:min-h-[64vh] flex items-center bg-[#000000] text-white border-b border-white/[0.08] overflow-hidden select-none",
        "pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24",
        className
      )}
    >
      {/* ── Background Token Point Cloud Visual ── */}
      <TokenCloudVisual />

      {/* ── Foreground Text & Action Content ── */}
      <div className="relative z-20 mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28">
        <div className="flex flex-col items-start max-w-2xl">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-normal tracking-[-0.035em] text-white leading-[1.1]">
            {headline}
          </h1>

          {/* Subtitle Description */}
          {description && (
            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#8E8E93] font-normal leading-relaxed max-w-lg">
              {description}
            </p>
          )}

          {/* Primary CTA and custom action elements */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3.5 w-full">
            {primaryCtaLabel && (
              <Link
                href={primaryCtaHref}
                className="inline-flex items-center justify-center rounded-xl bg-[#EDEDED] hover:bg-white text-black font-medium text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 transition-all shadow-sm shrink-0"
              >
                {primaryCtaLabel}
              </Link>
            )}

            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
