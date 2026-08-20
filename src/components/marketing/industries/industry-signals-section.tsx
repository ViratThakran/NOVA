"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { IndustryAccent, getIndustryAccent } from "./industry-theme";
import { cn } from "@/lib/utils";

export interface IndustrySignal {
  metric: string;
  label: string;
  description: string;
}

interface Props {
  id?: string;
  chapter?: string;
  heading: string;
  subtext: string;
  signals: IndustrySignal[];
  accent?: IndustryAccent;
}

export function IndustrySignalsSection({
  id = "industry-signals",
  chapter = "02 / INDUSTRY SIGNALS",
  heading,
  subtext,
  signals,
  accent = "emerald",
}: Props) {
  const prefersReducedMotion = useReducedMotion();
  const a = getIndustryAccent(accent);

  return (
    <section
      id={id}
      className="relative py-24 sm:py-32 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className={cn("absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl pointer-events-none", a.orb1)} />
      <div className={cn("absolute bottom-10 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none", a.orb2)} />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className={cn("text-[11px] font-mono font-semibold tracking-[0.24em] uppercase", a.text)}>
            {chapter}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 capitalize leading-tight">
            {heading}
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed mt-2">
            {subtext}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {signals.map((signal, index) => (
            <motion.div
              key={signal.label}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-7 sm:p-8 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.08)] hover:bg-white/85 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <span className={cn("block text-5xl sm:text-6xl font-light tracking-tight text-neutral-950 mb-4 transition-colors duration-200 font-mono", a.metricHover)}>
                  {signal.metric}
                </span>
                <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-neutral-500 mb-3">
                  {signal.label}
                </h3>
                <p className="text-sm sm:text-base text-neutral-700 font-normal leading-relaxed">
                  {signal.description}
                </p>
              </div>
              <div className={cn("h-0.5 w-8 mt-6 transition-all duration-300", a.barBg, "group-hover:w-16", a.barHoverBg)} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
