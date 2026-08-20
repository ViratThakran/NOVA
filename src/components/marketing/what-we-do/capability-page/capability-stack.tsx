"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { CapabilityData } from "@/data/capabilities";
import { cn } from "@/lib/utils";

interface CapabilityStackProps {
  capability: CapabilityData;
}

const LAYER_COLORS: Record<string, { accent: string; glow: string; bg: string }> = {
  DATA:         { accent: "rgba(99,102,241,1)",   glow: "rgba(99,102,241,0.35)",  bg: "rgba(99,102,241,0.08)" },
  MODELS:       { accent: "rgba(139,92,246,1)",   glow: "rgba(139,92,246,0.35)", bg: "rgba(139,92,246,0.08)" },
  INTELLIGENCE: { accent: "rgba(6,182,212,1)",    glow: "rgba(6,182,212,0.35)",  bg: "rgba(6,182,212,0.08)" },
  AGENTS:       { accent: "rgba(16,185,129,1)",   glow: "rgba(16,185,129,0.35)", bg: "rgba(16,185,129,0.08)" },
  APPLICATIONS: { accent: "rgba(245,158,11,1)",   glow: "rgba(245,158,11,0.35)", bg: "rgba(245,158,11,0.08)" },
  OUTCOMES:     { accent: "rgba(239,68,68,1)",    glow: "rgba(239,68,68,0.35)",  bg: "rgba(239,68,68,0.08)" },
};

export function CapabilityStack({ capability }: CapabilityStackProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeLayer, setActiveLayer] = React.useState<number>(0);
  const [isHovered, setIsHovered] = React.useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 20%"],
  });

  // Drive active layer from scroll when not hovered
  React.useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      if (isHovered) return;
      const idx = Math.min(
        capability.stackSteps.length - 1,
        Math.floor(latest * capability.stackSteps.length)
      );
      setActiveLayer(idx);
    });
  }, [scrollYProgress, capability.stackSteps.length, isHovered]);

  const activeStep = capability.stackSteps[activeLayer];
  const colors = LAYER_COLORS[activeStep?.layer] || LAYER_COLORS["DATA"];

  if (!capability.stackSteps.length) return null;

  return (
    <section
      id="stack"
      ref={containerRef}
      className="scroll-mt-16 bg-[#07070A] py-20 sm:py-32 border-b border-white/[0.08] text-white overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">

        {/* Section Label */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-800/60 pb-8 mb-16">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
              <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="5" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.5"/>
                <rect x="5.5" y="3" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.7"/>
                <rect x="10" y="1" width="3" height="12" rx="0.5" fill="currentColor"/>
              </svg>
              <span>02 / SYSTEM ARCHITECTURE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-none text-white">
              THE AI STACK
            </h2>
          </div>
          <p className="text-sm sm:text-base text-neutral-400 max-w-md font-normal leading-relaxed">
            A cohesive horizontal signal pipeline — from raw data ingestion through grounded intelligence to real-world outcomes.
          </p>
        </div>

        {/* ── Horizontal Signal Flow Pipeline ── */}
        <div
          className="relative"
          onMouseLeave={() => { setIsHovered(false); }}
        >
          {/* Pipeline Steps Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-neutral-800/40 rounded-2xl overflow-hidden border border-neutral-800/60">
            {capability.stackSteps.map((step, idx) => {
              const isCurrent = idx === activeLayer;
              const isActivated = idx <= activeLayer;
              const stepColors = LAYER_COLORS[step.layer] || LAYER_COLORS["DATA"];

              return (
                <button
                  key={step.layer}
                  type="button"
                  onClick={() => { setActiveLayer(idx); setIsHovered(true); }}
                  onMouseEnter={() => { setActiveLayer(idx); setIsHovered(true); }}
                  className={cn(
                    "group relative flex flex-col gap-3 p-5 sm:p-6 text-left transition-all duration-300 cursor-pointer",
                    isCurrent ? "bg-[#111118]" : "bg-[#09090D] hover:bg-[#0D0D12]"
                  )}
                >
                  {/* Active glow bar at top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-500"
                    style={{ background: isCurrent ? stepColors.accent : "transparent" }}
                  />

                  {/* Layer Index */}
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold tracking-[0.25em] transition-colors",
                      isCurrent ? "text-white" : isActivated ? "text-neutral-400" : "text-neutral-600"
                    )}
                  >
                    L{String(idx + 1).padStart(2, "0")}
                  </span>

                  {/* Layer Name */}
                  <h3
                    className={cn(
                      "text-sm sm:text-base font-black uppercase tracking-tight transition-all duration-300",
                      isCurrent ? "text-white" : isActivated ? "text-neutral-300" : "text-neutral-600 group-hover:text-neutral-400"
                    )}
                    style={isCurrent ? { color: stepColors.accent } : {}}
                  >
                    {step.layer}
                  </h3>

                  {/* Brief subtitle (only on current) */}
                  <p
                    className={cn(
                      "text-[11px] text-neutral-500 font-normal leading-snug transition-opacity duration-300 hidden sm:block",
                      isCurrent ? "opacity-100 text-neutral-300" : "opacity-60"
                    )}
                  >
                    {step.description}
                  </p>

                  {/* Active indicator dot */}
                  {isCurrent && (
                    <motion.div
                      layoutId="stack-active-dot"
                      className="absolute bottom-4 right-4 h-2 w-2 rounded-full"
                      style={{ background: stepColors.accent }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Active Layer Detail Panel ── */}
          <motion.div
            key={activeLayer}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 rounded-2xl border border-neutral-800/60 overflow-hidden"
            style={{ background: colors.bg }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left: Big Layer Name + Number */}
              <div
                className="lg:col-span-4 p-8 sm:p-10 flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r border-neutral-800/40"
              >
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[11px] font-bold tracking-[0.25em] uppercase" style={{ color: colors.accent }}>
                    LAYER {String(activeLayer + 1).padStart(2, "0")} / {capability.stackSteps.length}
                  </span>
                  <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none">
                    {activeStep?.layer}
                  </h3>
                </div>

                {/* Progress track */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    {capability.stackSteps.map((_, i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-500"
                        style={{
                          background: i <= activeLayer ? colors.accent : "rgba(255,255,255,0.1)",
                          opacity: i === activeLayer ? 1 : i < activeLayer ? 0.6 : 0.3,
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
                    Signal Progress
                  </span>
                </div>
              </div>

              {/* Right: Detail Content */}
              <div className="lg:col-span-8 p-8 sm:p-10 flex flex-col gap-6">
                <p className="text-lg sm:text-xl text-neutral-200 font-normal leading-relaxed max-w-2xl">
                  {activeStep?.detail}
                </p>

                <div className="flex flex-col gap-3 pt-4 border-t border-neutral-800/40">
                  <span className="font-mono text-[11px] text-neutral-500 uppercase tracking-wider">
                    Infrastructure Layer
                  </span>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {activeStep?.description}
                  </p>
                </div>

                {/* Flow arrows to next layer */}
                {activeLayer < capability.stackSteps.length - 1 && (
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs font-mono text-neutral-600 uppercase tracking-wider">Next:</span>
                    <span
                      className="text-xs font-mono font-bold uppercase tracking-wider"
                      style={{ color: LAYER_COLORS[capability.stackSteps[activeLayer + 1]?.layer]?.accent || colors.accent }}
                    >
                      {capability.stackSteps[activeLayer + 1]?.layer}
                    </span>
                    <svg className="h-3.5 w-3.5 text-neutral-600" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                {activeLayer === capability.stackSteps.length - 1 && (
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: colors.accent }} />
                    <span className="text-xs font-mono uppercase tracking-wider" style={{ color: colors.accent }}>
                      Pipeline Complete — Intelligence Delivered
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
