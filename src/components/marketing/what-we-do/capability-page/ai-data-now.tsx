"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

const SIGNALS = [
  {
    metric: "97%",
    label: "Enterprise Transformation",
    description:
      "Of technology leaders consider scalable AI and autonomous automation essential to strategic competitiveness.",
  },
  {
    metric: "67%",
    label: "Data Modernization",
    description:
      "Of modern engineering roadmaps prioritize unified data foundations, streaming pipelines, and vector infrastructure.",
  },
  {
    metric: "75%",
    label: "Quality & Governance",
    description:
      "Of production AI velocity depends directly on clean semantic data models, provenance, and verifiable retrieval.",
  },
  {
    metric: "10–15%",
    label: "Operational Velocity",
    description:
      "Sustained acceleration across decision cycles, automated multi-agent triage, and engineering throughput.",
  },
];

export function AiDataNowSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="ai-data-now"
      className="relative py-24 sm:py-32 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      {/* ── Ambient Soft Glow Orbs for Glassmorphism ── */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* Section Header */}
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
            02 / MARKET SIGNALS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 capitalize leading-tight">
            AI &amp; data now
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed mt-2">
            The convergence of intelligent models and production data systems is reshaping how modern organizations operate, decide, and build.
          </p>
        </div>

        {/* 4 Frosted Glass Signal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {SIGNALS.map((signal, index) => (
            <motion.div
              key={signal.label}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-7 sm:p-8 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.08)] hover:bg-white/85 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Large Distinct Metric */}
                <span className="block text-5xl sm:text-6xl lg:text-6xl font-light tracking-tight text-neutral-950 mb-4 transition-colors duration-200 group-hover:text-indigo-600 font-mono">
                  {signal.metric}
                </span>

                {/* Subtitle / Category Label */}
                <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-neutral-500 mb-3">
                  {signal.label}
                </h3>

                {/* Editorial Description */}
                <p className="text-sm sm:text-base text-neutral-700 font-normal leading-relaxed">
                  {signal.description}
                </p>
              </div>

              {/* Subtle bottom indicator */}
              <div className="h-0.5 w-8 bg-indigo-600/40 mt-6 group-hover:w-16 group-hover:bg-indigo-600 transition-all duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
