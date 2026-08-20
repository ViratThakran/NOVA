"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { CAPABILITIES, CapabilityData } from "@/data/capabilities";
import { cn } from "@/lib/utils";

export function CapabilityDirectory() {
  const [activeSlug, setActiveSlug] = React.useState<string>("ai-intelligence");
  const prefersReducedMotion = useReducedMotion();

  const activeCapability =
    CAPABILITIES.find((c) => c.slug === activeSlug) || CAPABILITIES[0];

  return (
    <section
      id="capabilities"
      className="scroll-mt-16 bg-[#F7F7F8] py-20 sm:py-28 border-b border-neutral-200 text-neutral-950"
    >
      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-300/80 pb-8 mb-12">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-[0.25em] text-neutral-500 uppercase">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>CORE DISCIPLINES</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 uppercase leading-none">
              OUR CAPABILITIES
            </h2>
          </div>
          <p className="text-sm sm:text-base text-neutral-600 max-w-md font-normal leading-relaxed">
            Select a capability to explore our engineering architecture, service offerings, and real-world outcomes.
          </p>
        </div>

        {/* Desktop Split-Screen Editorial List + Dynamic Interactive Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Interactive Capability List (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col divide-y divide-neutral-300/70 border-y border-neutral-300/70">
            {CAPABILITIES.map((cap) => {
              const isActive = activeSlug === cap.slug;
              const isFlagship = cap.slug === "ai-intelligence";

              return (
                <div
                  key={cap.slug}
                  onMouseEnter={() => setActiveSlug(cap.slug)}
                  className={cn(
                    "group relative transition-all duration-200 py-6 sm:py-7 px-4 sm:px-6 rounded-2xl cursor-pointer select-none",
                    isActive
                      ? "bg-white shadow-md border-l-4 border-indigo-600"
                      : "hover:bg-white/60 opacity-85 hover:opacity-100"
                  )}
                >
                  <Link
                    href={`/what-we-do/${cap.slug}`}
                    className="flex items-center justify-between gap-4 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg"
                  >
                    <div className="flex items-baseline gap-4 sm:gap-6">
                      <span
                        className={cn(
                          "font-mono text-sm sm:text-base font-bold transition-colors",
                          isActive ? "text-indigo-600" : "text-neutral-400 group-hover:text-neutral-700"
                        )}
                      >
                        {cap.number}
                      </span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={cn(
                              "text-xl sm:text-2xl lg:text-3xl font-black tracking-tight uppercase leading-none transition-colors",
                              isActive ? "text-neutral-950" : "text-neutral-800 group-hover:text-neutral-950"
                            )}
                          >
                            {cap.title}
                          </h3>
                          {isFlagship && (
                            <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700">
                              Flagship
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-500 font-normal line-clamp-1 group-hover:text-neutral-700 transition-colors">
                          {cap.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200",
                          isActive
                            ? "bg-neutral-950 border-neutral-950 text-white translate-x-1"
                            : "border-neutral-300 text-neutral-600 group-hover:border-neutral-950 group-hover:text-neutral-950"
                        )}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Right Column: Dynamic Preview Stage (Sticky on Desktop) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCapability.slug}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="rounded-3xl bg-neutral-950 text-white p-7 sm:p-9 shadow-xl border border-neutral-800 flex flex-col justify-between min-h-[460px]"
              >
                <div className="flex flex-col gap-6">
                  {/* Stage Header */}
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
                    <span className="font-mono text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">
                      NOVA CAPABILITY — {activeCapability.number}
                    </span>
                    <span className="text-xs font-mono text-neutral-400 uppercase">Production Ready</span>
                  </div>

                  {/* Headline & Description */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                      {activeCapability.title}
                    </h4>
                    <p className="text-sm sm:text-base text-neutral-300 font-normal leading-relaxed">
                      {activeCapability.shortDescription}
                    </p>
                  </div>

                  {/* Key Offerings Preview */}
                  {activeCapability.services && activeCapability.services.length > 0 && (
                    <div className="flex flex-col gap-2.5 pt-2">
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">
                        Focus Areas:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {activeCapability.services.slice(0, 4).map((srv) => (
                          <div key={srv.title} className="flex items-center gap-1.5 text-xs text-neutral-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate">{srv.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Action Link */}
                <div className="pt-8 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-400">Deep-dive architecture</span>
                  <Link
                    href={`/what-we-do/${activeCapability.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-xs"
                  >
                    <span>Explore {activeCapability.title}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
