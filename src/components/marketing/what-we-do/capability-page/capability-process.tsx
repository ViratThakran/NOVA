"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CapabilityData } from "@/data/capabilities";
import { cn } from "@/lib/utils";

interface CapabilityProcessProps {
  capability: CapabilityData;
}

export function CapabilityProcess({ capability }: CapabilityProcessProps) {
  const [activeStep, setActiveStep] = React.useState<number>(0);
  const prefersReducedMotion = useReducedMotion();

  if (!capability.process.length) return null;

  const active = capability.process[activeStep];

  return (
    <section
      id="process"
      className="scroll-mt-16 bg-[#07070A] py-20 sm:py-32 border-b border-white/[0.08] text-white overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-800/60 pb-8 mb-16">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
              <span className="h-px w-4 bg-indigo-400" />
              <span>06 / DELIVERY LIFECYCLE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-none text-white">
              FROM IDEA TO PRODUCTION
            </h2>
          </div>
          <p className="text-sm sm:text-base text-neutral-500 max-w-md font-normal leading-relaxed">
            Our disciplined engineering workflow bridges conceptual formulation with resilient multi-region cloud deployment.
          </p>
        </div>

        {/* Process Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Step selector tabs */}
          <div className="lg:col-span-5 flex flex-col gap-1">
            {capability.process.map((step, idx) => {
              const isActive = activeStep === idx;
              const isPast = idx < activeStep;

              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  onMouseEnter={() => setActiveStep(idx)}
                  className={cn(
                    "group text-left flex items-start gap-5 py-5 px-5 sm:px-6 rounded-2xl transition-all duration-200 cursor-pointer border",
                    isActive
                      ? "bg-white/[0.05] border-indigo-500/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "border-transparent hover:bg-white/[0.025]"
                  )}
                >
                  {/* Step number circle */}
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center font-mono text-[11px] font-bold border shrink-0 mt-0.5 transition-all duration-300",
                      isActive
                        ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_16px_rgba(99,102,241,0.4)]"
                        : isPast
                        ? "bg-neutral-900 border-indigo-800/60 text-indigo-500"
                        : "bg-[#0D0D12] border-neutral-800 text-neutral-600 group-hover:border-neutral-700"
                    )}
                  >
                    {step.number}
                  </div>

                  {/* Step info */}
                  <div className="flex flex-col gap-0.5">
                    <h3
                      className={cn(
                        "text-base sm:text-lg font-black uppercase tracking-tight transition-colors",
                        isActive
                          ? "text-white"
                          : "text-neutral-500 group-hover:text-neutral-200"
                      )}
                    >
                      {step.title}
                    </h3>
                    <span
                      className={cn(
                        "text-xs font-mono transition-colors",
                        isActive ? "text-indigo-400" : "text-neutral-700"
                      )}
                    >
                      {step.tagline}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Active step detail */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <motion.div
              key={activeStep}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl bg-[#0D0D12] border border-neutral-800/60 overflow-hidden"
            >
              {/* Top bar */}
              <div className="px-8 sm:px-10 py-5 border-b border-neutral-800/50 flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-indigo-400 tracking-[0.25em] uppercase">
                  PHASE {active?.number} — {active?.title}
                </span>
                <div className="flex gap-1.5">
                  {capability.process.map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                      style={{
                        background: i <= activeStep ? "#6366f1" : "rgba(255,255,255,0.1)",
                        transform: i === activeStep ? "scale(1.3)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="px-8 sm:px-10 py-10 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                    {active?.title}
                  </h3>
                  <p className="text-sm font-mono text-indigo-400">
                    {active?.tagline}
                  </p>
                </div>

                <p className="text-base sm:text-lg text-neutral-300 font-normal leading-relaxed">
                  {active?.description}
                </p>

                {/* Navigation hint */}
                <div className="flex items-center gap-4 pt-4 border-t border-neutral-800/40">
                  {activeStep > 0 && (
                    <button
                      onClick={() => setActiveStep(s => s - 1)}
                      className="text-xs font-mono text-neutral-600 hover:text-neutral-300 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                        <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {capability.process[activeStep - 1]?.title}
                    </button>
                  )}
                  <div className="flex-1" />
                  {activeStep < capability.process.length - 1 && (
                    <button
                      onClick={() => setActiveStep(s => s + 1)}
                      className="text-xs font-mono text-neutral-500 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                    >
                      {capability.process[activeStep + 1]?.title}
                      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
