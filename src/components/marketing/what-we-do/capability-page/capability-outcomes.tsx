"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CapabilityData } from "@/data/capabilities";

interface CapabilityOutcomesProps {
  capability: CapabilityData;
}

export function CapabilityOutcomes({ capability }: CapabilityOutcomesProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!capability.outcomes.length) return null;

  return (
    <section
      id="outcomes"
      className="scroll-mt-16 bg-[#060608] py-24 sm:py-36 border-b border-white/[0.08] text-white overflow-hidden"
    >
      {/* Wide editorial container — allows headline text to breathe */}
      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">

        {/* Section label */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-800/60 pb-8 mb-20">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
              <span className="h-px w-4 bg-indigo-400" />
              <span>05 / MEASURABLE ADVANTAGE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none">
              FROM INTELLIGENCE<br className="hidden sm:block" /> TO IMPACT
            </h2>
          </div>
          <p className="text-sm sm:text-base text-neutral-500 max-w-sm font-normal leading-relaxed">
            Durable enterprise capabilities that compound in value rather than fragile single-model prototypes.
          </p>
        </div>

        {/* Kinetic Editorial Statements — huge type, no cards */}
        <div className="flex flex-col">
          {capability.outcomes.map((outcome, idx) => (
            <motion.div
              key={outcome.headline}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group grid grid-cols-1 lg:grid-cols-12 items-baseline gap-4 lg:gap-10 py-10 sm:py-14 border-b border-neutral-800/40 last:border-0"
            >
              {/* Index */}
              <div className="lg:col-span-1 flex items-center lg:items-start lg:justify-end pt-1">
                <span className="font-mono text-xs sm:text-sm font-bold text-neutral-700 group-hover:text-indigo-500 transition-colors duration-300">
                  0{idx + 1}
                </span>
              </div>

              {/* Giant headline */}
              <div className="lg:col-span-7">
                <h3 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tight leading-[0.88] text-white group-hover:text-neutral-100 transition-colors duration-300">
                  {outcome.headline}
                </h3>
              </div>

              {/* Description — right aligned on large screens */}
              <div className="lg:col-span-4 lg:pl-6">
                <p className="text-sm sm:text-base text-neutral-500 font-normal leading-relaxed group-hover:text-neutral-300 transition-colors duration-400">
                  {outcome.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
