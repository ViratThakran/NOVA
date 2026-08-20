"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CapabilityData } from "@/data/capabilities";

interface CapabilityInsightsProps {
  capability: CapabilityData;
}

export function CapabilityInsights({ capability }: CapabilityInsightsProps) {
  const prefersReducedMotion = useReducedMotion();
  const featured = capability.insights[0];
  const secondary = capability.insights.slice(1);

  if (!capability.insights.length) return null;

  return (
    <section
      id="insights"
      className="scroll-mt-16 bg-[#07070A] py-20 sm:py-32 border-b border-white/[0.08] text-white"
    >
      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-800/60 pb-8 mb-14">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
              <span className="h-px w-4 bg-indigo-400" />
              <span>08 / PERSPECTIVES & RESEARCH</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none">
              RELATED THINKING
            </h2>
          </div>
          <Link
            href="/what-we-think"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <span>View all publications</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Editorial grid: 1 featured + secondary rows */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

          {/* Featured Essay — left, full height */}
          {featured && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-7"
            >
              <Link
                href={featured.href}
                className="group relative flex flex-col justify-between h-full rounded-3xl bg-[#0D0D12] border border-neutral-800/60 p-8 sm:p-10 overflow-hidden hover:border-indigo-500/50 transition-all duration-300"
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-[11px] font-bold text-indigo-400 tracking-[0.25em] uppercase">
                      FEATURED ESSAY — {featured.category}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-600 shrink-0">{featured.readTime}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight group-hover:text-indigo-100 transition-colors duration-300">
                    {featured.title}
                  </h3>

                  <p className="text-sm text-neutral-500 font-normal leading-relaxed">
                    An in-depth analysis on transitioning prototype LLM workflows into fault-tolerant, low-latency microservices with automated evaluation feedback loops.
                  </p>
                </div>

                <div className="pt-8 border-t border-neutral-800/60 flex items-center justify-between relative z-10 mt-10">
                  <span className="text-xs font-mono text-neutral-600">NOVA Research Division</span>
                  <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all">
                    <span>Read publication</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Secondary rows — right column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {secondary.map((item, idx) => (
              <motion.div
                key={item.number}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (idx + 1) * 0.08 }}
                className="flex-1"
              >
                <Link
                  href={item.href}
                  className="group flex flex-col justify-between h-full rounded-3xl bg-[#0D0D12] border border-neutral-800/60 p-6 sm:p-7 overflow-hidden hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] font-bold text-neutral-600 tracking-[0.25em] uppercase">
                        {item.number} / {item.category}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-700">{item.readTime}</span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold tracking-tight text-neutral-200 leading-snug group-hover:text-white transition-colors duration-200">
                      {item.title}
                    </h4>
                  </div>

                  <div className="pt-5 border-t border-neutral-800/50 flex items-center justify-between mt-5">
                    <span className="text-[11px] font-mono text-neutral-700">Research Article</span>
                    <span className="text-xs font-semibold text-neutral-400 group-hover:text-white flex items-center gap-1.5 transition-colors">
                      Read
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
