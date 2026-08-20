"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CapabilityData } from "@/data/capabilities";
import { cn } from "@/lib/utils";

interface CapabilityActionProps {
  capability: CapabilityData;
}

export function CapabilityAction({ capability }: CapabilityActionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);

  const featured = capability.actionItems[0];
  const secondaryRows = capability.actionItems.slice(1);

  if (!capability.actionItems.length) return null;

  return (
    <section
      id="action"
      className="scroll-mt-16 bg-[#07070A] py-20 sm:py-32 border-b border-white/[0.08] text-white overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-800/60 pb-8 mb-14">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
              <span className="h-px w-4 bg-indigo-400" />
              <span>04 / DEPLOYED PARADIGMS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-none text-white">
              AI IN ACTION
            </h2>
          </div>
          <p className="text-sm sm:text-base text-neutral-500 max-w-md font-normal leading-relaxed">
            Concrete architectural systems built by NOVA engineering squads to solve high-consequence enterprise challenges.
          </p>
        </div>

        {/* ── 1. Large Dominant Feature Story ── */}
        {featured && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl overflow-hidden mb-4 border border-indigo-500/25"
          >
            {/* Layered cinematic background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0D0D1C] via-[#09090F] to-[#060608]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_80%_20%,rgba(99,102,241,0.18),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_20%_80%,rgba(6,182,212,0.08),transparent_70%)]" />
            {/* Grid texture */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left content */}
              <div className="lg:col-span-8 p-8 sm:p-12 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold tracking-widest text-indigo-400 uppercase px-3 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-800/50">
                    {featured.tag}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Remediating Loop
                  </span>
                </div>

                <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black uppercase tracking-tight text-white leading-tight max-w-3xl">
                  {featured.title}
                </h3>

                <p className="text-base sm:text-lg text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  {featured.description}
                </p>

                <Link
                  href="/contact"
                  className="mt-2 self-start inline-flex items-center gap-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 px-6 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                >
                  <span>Explore this architecture</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Right: Real-time telemetry */}
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/[0.06] p-8 sm:p-10 flex flex-col gap-8 justify-center">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Detection Speed</span>
                  <span className="text-3xl font-black font-mono text-white leading-none">&lt; 380<span className="text-base font-mono text-neutral-400 ml-1">ms</span></span>
                </div>
                <div className="h-px bg-neutral-800/60" />
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Remediation Mode</span>
                  <span className="text-xl font-bold font-mono text-indigo-300">Self-Healing</span>
                </div>
                <div className="h-px bg-neutral-800/60" />
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Verification Protocol</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">Deterministic Guard</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── 2. Secondary rows ── */}
        <div className="flex flex-col border-t border-neutral-800/40">
          {secondaryRows.map((item, idx) => {
            const isHovered = hoveredRow === item.id;

            return (
              <motion.div
                key={item.id}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                onMouseEnter={() => setHoveredRow(item.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={cn(
                  "group py-7 sm:py-9 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-800/40 transition-colors duration-200 cursor-pointer",
                  isHovered ? "bg-white/[0.02]" : ""
                )}
              >
                <div className="flex items-baseline gap-5 sm:gap-8 md:max-w-2xl">
                  <span className="font-mono text-xs sm:text-sm font-bold text-neutral-700 group-hover:text-indigo-400 transition-colors shrink-0">
                    0{idx + 2}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-mono font-bold tracking-widest text-indigo-500 uppercase">
                      {item.tag}
                    </span>
                    <h4 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-neutral-200 group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-neutral-500 font-normal max-w-md leading-relaxed group-hover:text-neutral-300 transition-colors">
                  {item.description}
                </p>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="h-9 w-9 flex items-center justify-center rounded-full border border-neutral-800 bg-transparent group-hover:bg-indigo-600 group-hover:border-indigo-400 group-hover:translate-x-1 transition-all duration-200">
                    <ArrowRight className="h-4 w-4" />
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
