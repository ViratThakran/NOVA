"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CapabilityData, CapabilityService } from "@/data/capabilities";
import { cn } from "@/lib/utils";

interface CapabilityServicesProps {
  capability: CapabilityData;
}

// Tech stack signals per service
const SERVICE_META: Record<string, { gradient: string; signal: string }> = {
  "01": { gradient: "from-indigo-500/20 via-transparent to-transparent", signal: "sub-100ms inference" },
  "02": { gradient: "from-violet-500/20 via-transparent to-transparent", signal: "zero hallucination" },
  "03": { gradient: "from-cyan-500/20 via-transparent to-transparent", signal: "multi-agent mesh" },
  "04": { gradient: "from-emerald-500/20 via-transparent to-transparent", signal: "continuous learning" },
  "05": { gradient: "from-amber-500/20 via-transparent to-transparent", signal: "edge-native vision" },
  "06": { gradient: "from-rose-500/20 via-transparent to-transparent", signal: "cross-lingual NLP" },
};

export function CapabilityServices({ capability }: CapabilityServicesProps) {
  const [selectedIdx, setSelectedIdx] = React.useState<number>(0);
  const prefersReducedMotion = useReducedMotion();

  const activeService: CapabilityService =
    capability.services[selectedIdx] || capability.services[0];
  const meta = SERVICE_META[activeService?.number] || SERVICE_META["01"];

  if (!capability.services.length) return null;

  return (
    <section
      id="services"
      className="scroll-mt-16 bg-[#060608] py-20 sm:py-32 border-b border-white/[0.08] text-white"
    >
      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">

        {/* Section Label */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-800/60 pb-8 mb-14">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
              <span className="h-px w-4 bg-indigo-400" />
              <span>03 / CORE OFFERINGS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none">
              WHAT WE BUILD
            </h2>
          </div>
          <p className="text-sm sm:text-base text-neutral-400 max-w-md font-normal leading-relaxed">
            Six specialized AI engineering disciplines — each a production-grade system, not a prototype.
          </p>
        </div>

        {/* Split Layout: Service List (left) + Live Preview (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Left: Numbered service list */}
          <div className="lg:col-span-5 flex flex-col">
            {capability.services.map((service, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={service.title}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={cn(
                    "group text-left py-5 sm:py-6 px-5 sm:px-6 flex items-center justify-between transition-all duration-200 rounded-2xl cursor-pointer select-none border",
                    isSelected
                      ? "bg-white/[0.06] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "border-transparent hover:bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-baseline gap-4 sm:gap-5">
                    <span
                      className={cn(
                        "font-mono text-xs font-bold shrink-0 transition-colors",
                        isSelected ? "text-indigo-400" : "text-neutral-600 group-hover:text-neutral-400"
                      )}
                    >
                      {service.number}
                    </span>
                    <h3
                      className={cn(
                        "text-base sm:text-xl font-black uppercase tracking-tight leading-tight transition-colors",
                        isSelected ? "text-white" : "text-neutral-500 group-hover:text-neutral-200"
                      )}
                    >
                      {service.title}
                    </h3>
                  </div>
                  <ArrowRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-all duration-200",
                      isSelected
                        ? "text-indigo-400 translate-x-0.5 opacity-100"
                        : "text-neutral-700 opacity-0 group-hover:opacity-60"
                    )}
                  />
                </button>
              );
            })}

            {/* Request link */}
            <div className="mt-8 px-5">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-indigo-300 transition-colors group"
              >
                <span>Request an AI Engineering Squad</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          {/* Right: Detail Panel */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeService?.title}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative rounded-3xl bg-[#0D0D12] border border-neutral-800/80 overflow-hidden"
              >
                {/* Subtle gradient per service */}
                <div className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none opacity-70", meta.gradient)} />

                <div className="relative z-10 flex flex-col gap-0">
                  {/* Top bar */}
                  <div className="flex items-center justify-between px-7 sm:px-9 py-5 border-b border-neutral-800/60">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] font-bold text-indigo-400 tracking-[0.25em] uppercase">
                        {activeService?.number} / AI ENGINEERING
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-mono text-neutral-500">{meta.signal}</span>
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="px-7 sm:px-9 py-8 flex flex-col gap-6">
                    <h4 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                      {activeService?.title}
                    </h4>
                    <p className="text-sm sm:text-base text-neutral-300 font-normal leading-relaxed max-w-lg">
                      {activeService?.shortExplanation}
                    </p>

                    {/* Typical outcomes */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-500">
                        Typical Outcomes
                      </span>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {activeService?.typicalOutcomes}
                      </p>
                    </div>
                  </div>

                  {/* Tech stack */}
                  <div className="px-7 sm:px-9 py-6 border-t border-neutral-800/60">
                    <div className="flex flex-col gap-3">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-500">
                        Core Stack
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {activeService?.keyTechnologies.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-full bg-white/[0.06] border border-white/[0.12] px-3 py-1 text-[11px] font-mono text-neutral-200 hover:bg-white/[0.1] transition-colors cursor-default"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
