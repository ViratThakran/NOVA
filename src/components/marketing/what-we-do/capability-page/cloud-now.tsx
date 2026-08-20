"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

const SIGNALS = [
  {
    metric: "94%",
    label: "Cloud Migration Priority",
    description:
      "Of enterprise CIOs rank cloud-native transformation as a top-three strategic priority for 2025 and beyond.",
  },
  {
    metric: "3×",
    label: "Resilience Advantage",
    description:
      "Organizations with mature multi-cloud and redundancy architectures recover 3× faster from critical infrastructure failures.",
  },
  {
    metric: "40%",
    label: "Cost Optimization",
    description:
      "Of cloud infrastructure spend is wasted through misconfigured provisioning, idle compute, and over-allocated storage.",
  },
  {
    metric: "<99ms",
    label: "Latency Standard",
    description:
      "Sub-99ms global response times are now an expected baseline for enterprise platforms serving modern end-users at scale.",
  },
];

export function CloudNowSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="cloud-now"
      className="relative py-24 sm:py-32 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-indigo-300/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-sky-600 uppercase">
            02 / MARKET SIGNALS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 capitalize leading-tight">
            Cloud &amp; infrastructure now
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed mt-2">
            Resilient cloud foundations and distributed infrastructure have shifted from competitive advantage to operational necessity.
          </p>
        </div>

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
                <span className="block text-5xl sm:text-6xl font-light tracking-tight text-neutral-950 mb-4 transition-colors duration-200 group-hover:text-sky-600 font-mono">
                  {signal.metric}
                </span>
                <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-neutral-500 mb-3">
                  {signal.label}
                </h3>
                <p className="text-sm sm:text-base text-neutral-700 font-normal leading-relaxed">
                  {signal.description}
                </p>
              </div>
              <div className="h-0.5 w-8 bg-sky-600/40 mt-6 group-hover:w-16 group-hover:bg-sky-600 transition-all duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
