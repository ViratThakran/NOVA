"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Layers, ArrowUpRight } from "lucide-react";
import { INDUSTRIES } from "@/data/industries";
import { cn } from "@/lib/utils";

export function IndustryDirectory() {
  const [activeIdx, setActiveIdx] = React.useState<number>(0);
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="industries"
      className="scroll-mt-16 bg-[#0B0B0E] py-20 sm:py-28 border-b border-white/10 text-white overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-800 pb-8 mb-12">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-[0.25em] text-indigo-400 uppercase">
              <Layers className="h-3.5 w-3.5" />
              <span>WHERE WE APPLY IT</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-none text-white">
              INDUSTRIES
            </h2>
          </div>
          <p className="text-sm sm:text-base text-neutral-400 max-w-md font-normal leading-relaxed">
            Deploying domain-grounded intelligence and resilient software architectures across high-consequence sectors.
          </p>
        </div>

        {/* Horizontal Editorial Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INDUSTRIES.map((industry, idx) => {
            const isActive = activeIdx === idx;

            return (
              <motion.div
                key={industry.slug}
                onMouseEnter={() => setActiveIdx(idx)}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={cn(
                  "group rounded-3xl p-7 sm:p-8 flex flex-col justify-between border transition-all duration-300 min-h-[340px]",
                  isActive
                    ? "bg-[#14141A] border-indigo-500/40 shadow-[0_12px_36px_rgba(99,102,241,0.08)]"
                    : "bg-[#101014] border-neutral-800/80 hover:border-neutral-700"
                )}
              >
                <div className="flex flex-col gap-4">
                  {/* Top Bar: Number + Arrow */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold tracking-widest text-indigo-400">
                      {industry.number}
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/10 group-hover:bg-white group-hover:text-neutral-950 transition-colors">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {/* Industry Title */}
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-snug">
                    {industry.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                    {industry.heroDescription || (industry as { description?: string }).description}
                  </p>
                </div>

                {/* Bottom: Relevant Capabilities Pills */}
                <div className="pt-6 border-t border-neutral-800/80 flex flex-col gap-3">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500">
                    Capabilities:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(industry.relevantCapabilities ?? ["AI & Intelligence", "Software & Technology", "Cloud & Infrastructure"]).map((cap) => (
                      <span
                        key={cap}
                        className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10.5px] font-mono text-neutral-300"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
