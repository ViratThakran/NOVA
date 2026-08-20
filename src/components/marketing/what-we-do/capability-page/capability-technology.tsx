"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CapabilityData, TechCategory } from "@/data/capabilities";
import { cn } from "@/lib/utils";

interface CapabilityTechnologyProps {
  capability: CapabilityData;
}

export function CapabilityTechnology({ capability }: CapabilityTechnologyProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const activeCategory =
    capability.techCategories.find((c) => c.id === activeId) ||
    capability.techCategories[0];

  if (!capability.techCategories.length) return null;

  return (
    <section
      id="technology"
      className="scroll-mt-16 bg-[#060608] py-20 sm:py-32 border-b border-white/[0.08] text-white overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-800/60 pb-8 mb-16">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
              <span className="h-px w-4 bg-indigo-400" />
              <span>07 / STACK ECOSYSTEM</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-none text-white">
              THE TECHNOLOGY<br className="hidden sm:block" /> BEHIND IT
            </h2>
          </div>
          <p className="text-sm sm:text-base text-neutral-500 max-w-md font-normal leading-relaxed">
            Select any ecosystem node to inspect production-grade framework integrations, model serving harnesses, and data pipelines.
          </p>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left: Category node grid */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Central hub badge */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-950/60 to-violet-950/60 border border-indigo-500/30 px-5 py-4 flex items-center gap-3 mb-2">
              <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
              <span className="text-sm font-black uppercase tracking-tight text-white">
                CENTRAL CORE: AI & INTELLIGENCE
              </span>
              <span className="ml-auto text-[11px] font-mono text-indigo-400 uppercase">Unified Mesh</span>
            </div>

            {/* Satellite nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {capability.techCategories.map((cat) => {
                const isActive = activeId === cat.id || (!activeId && cat.id === capability.techCategories[0]?.id);
                const isRelated =
                  activeId && activeId !== cat.id &&
                  activeCategory?.relationships?.includes(cat.id);
                const isDimmed = activeId && !isActive && !isRelated;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onMouseEnter={() => setActiveId(cat.id)}
                    onMouseLeave={() => setActiveId(null)}
                    onClick={() => setActiveId(cat.id)}
                    className={cn(
                      "text-left rounded-2xl p-4 sm:p-5 border transition-all duration-200 select-none cursor-pointer",
                      isActive
                        ? "bg-indigo-950/70 border-indigo-400/60 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                        : isRelated
                        ? "bg-[#0E0E14] border-neutral-700"
                        : isDimmed
                        ? "bg-[#08080B] border-neutral-900 opacity-30"
                        : "bg-[#0D0D12] border-neutral-800 hover:border-neutral-600"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold text-indigo-400 tracking-wider uppercase">
                        {cat.items.length} libraries
                      </span>
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-all",
                          isActive ? "bg-white animate-ping" : "bg-indigo-600/60"
                        )}
                      />
                    </div>
                    <h3 className={cn(
                      "text-sm font-black uppercase tracking-tight",
                      isActive ? "text-white" : "text-neutral-400"
                    )}>
                      {cat.category}
                    </h3>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Active category detail panel */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <motion.div
              key={activeCategory?.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl bg-[#0D0D12] border border-neutral-800/60 overflow-hidden"
            >
              {/* Top bar */}
              <div className="px-7 sm:px-9 py-5 border-b border-neutral-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="font-mono text-[11px] font-bold text-indigo-400 tracking-[0.22em] uppercase">
                    {activeCategory?.category}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-neutral-700">Interoperable</span>
              </div>

              {/* Libraries */}
              <div className="px-7 sm:px-9 py-8 flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                    {activeCategory?.category}
                  </h4>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-600">
                    Verified Production Libraries
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeCategory?.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white/[0.06] border border-white/[0.1] px-3.5 py-1.5 text-xs font-mono text-neutral-200 hover:bg-white/[0.1] hover:border-white/20 hover:text-white transition-all cursor-default"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {/* Relationships */}
                {activeCategory?.relationships?.length > 0 && (
                  <div className="flex flex-col gap-2 pt-4 border-t border-neutral-800/40">
                    <span className="text-[11px] font-mono text-neutral-600 uppercase tracking-wider">
                      Direct Integrations
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeCategory.relationships.map((rel) => {
                        const relCat = capability.techCategories.find(c => c.id === rel);
                        return relCat ? (
                          <button
                            key={rel}
                            onClick={() => setActiveId(rel)}
                            className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                          >
                            <span>→</span>
                            <span>{relCat.category}</span>
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Status line */}
                <div className="pt-2 border-t border-neutral-800/30">
                  <span className="text-[11px] font-mono text-emerald-500">
                    ● Continuous evaluation loop active
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
