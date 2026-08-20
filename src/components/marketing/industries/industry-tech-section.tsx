"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { IndustryAccent, getIndustryAccent } from "./industry-theme";
import { cn } from "@/lib/utils";

export interface IndustryStackLayer {
  layer: string;
  detail: string;
}

export interface IndustryTechItem {
  name: string;
  category: string;
}

interface Props {
  id?: string;
  chapter?: string;
  heading: string;
  subtext: string;
  pipelineLabel?: string;
  stackLayers: IndustryStackLayer[];
  techsLabel?: string;
  techs: IndustryTechItem[];
  accent?: IndustryAccent;
}

export function IndustryTechSection({
  id = "industry-technology",
  chapter = "06 / ARCHITECTURE & ECOSYSTEM",
  heading,
  subtext,
  pipelineLabel = "Transaction Architecture Flow",
  stackLayers,
  techsLabel = "Production Technologies",
  techs,
  accent = "emerald",
}: Props) {
  const prefersReducedMotion = useReducedMotion();
  const a = getIndustryAccent(accent);

  return (
    <section
      id={id}
      className="relative py-24 sm:py-32 bg-[#F5F7FA] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className={cn("absolute top-10 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none", a.orb1)} />
      <div className={cn("absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none", a.orb2)} />

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

        {/* Pipeline Flow */}
        <div className="mb-20">
          <span className="block text-[11px] font-mono font-semibold tracking-widest text-neutral-500 uppercase mb-6">
            {pipelineLabel}
          </span>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${Math.min(stackLayers.length, 5)}, minmax(0, 1fr))` }}
          >
            {stackLayers.map((item, index) => (
              <motion.div
                key={item.layer}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="relative flex flex-col justify-between p-6 rounded-2xl bg-white/75 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_0_rgba(0,0,0,0.03)] hover:shadow-md hover:border-white transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn("text-xs font-mono font-bold", a.text)}>0{index + 1}</span>
                    {index < stackLayers.length - 1 && (
                      <ArrowRight className="hidden sm:block h-3.5 w-3.5 text-neutral-400" />
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight text-neutral-950 mb-2">
                    {item.layer}
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tech Grid */}
        <div>
          <span className="block text-[11px] font-mono font-semibold tracking-widest text-neutral-500 uppercase mb-6">
            {techsLabel}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {techs.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.025 }}
                className="flex flex-col p-4 rounded-xl bg-white/65 backdrop-blur-lg border border-white/80 hover:bg-white/90 shadow-[0_4px_20px_0_rgba(0,0,0,0.02)] transition-all duration-200"
              >
                <span className="text-sm sm:text-base font-semibold text-neutral-950">{tech.name}</span>
                <span className="text-xs text-neutral-500 mt-1">{tech.category}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
