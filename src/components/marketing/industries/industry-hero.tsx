"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ShieldCheck, Zap, Activity } from "lucide-react";
import { IndustryAccent, getIndustryAccent } from "./industry-theme";
import { cn } from "@/lib/utils";

interface MetricBadge {
  label: string;
  value: string;
}

interface IndustryHeroProps {
  number?: string;
  title: string;
  tagline: string;
  description: string;
  illustrationSrc?: string;
  accent?: IndustryAccent;
  metrics?: MetricBadge[];
}

export function IndustryHero({
  number = "02 / INDUSTRY",
  title = "Financial services",
  tagline = "CAPITAL MARKETS · BANKING · FINTECH",
  description = "Engineering high-throughput transaction systems, real-time risk intelligence, and cloud-native ledger infrastructure built for zero-downtime capital operations.",
  illustrationSrc = "/images/cards/grow.jpg",
  accent = "emerald",
  metrics = [
    { label: "Execution Latency", value: "< 4.2ms P99" },
    { label: "System Availability", value: "99.999% SLA" },
    { label: "Transaction Scale", value: "250K+ ops/sec" },
    { label: "Compliance Benchmark", value: "SOC2 & ISO 27001" },
  ],
}: IndustryHeroProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const a = getIndustryAccent(accent);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const visualY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const visualOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.35]);

  return (
    <section
      ref={containerRef}
      id="industry-hero"
      aria-label={`${title} Hero`}
      className="relative min-h-[90vh] lg:min-h-screen bg-[#060608] text-white flex items-center overflow-hidden pt-28 pb-16 lg:py-28"
    >
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[650px] h-[650px] bg-emerald-950/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-teal-950/25 rounded-full blur-[120px] pointer-events-none" />

      {/* Subtle fine geometric grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 xl:gap-20 items-center">
          
          {/* LEFT: Seamless blended visual */}
          <div className="lg:col-span-6 order-2 lg:order-1 flex items-center justify-center relative">
            <motion.div
              style={prefersReducedMotion ? {} : { y: visualY, opacity: visualOpacity }}
              className="relative w-full max-w-[620px] aspect-[4/3] sm:aspect-[16/11] flex items-center justify-center"
            >
              {/* Radial backdrop highlight */}
              <div
                className="absolute inset-0 bg-radial from-emerald-500/15 via-teal-900/10 to-transparent blur-3xl opacity-80 pointer-events-none"
                aria-hidden="true"
              />

              {/* Seamless Screen Blended Image Container */}
              <div
                className="relative w-full h-full [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)] overflow-visible"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
                }}
              >
                <Image
                  src={illustrationSrc}
                  alt={`${title} Architecture Visual`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 680px"
                  className="object-cover object-center mix-blend-screen opacity-90 scale-105 filter brightness-110 contrast-125"
                />
              </div>

              {/* Live Status Badge overlay */}
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0F0F12]/80 backdrop-blur-xl border border-white/10 shadow-2xl"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="font-mono text-xs text-neutral-300 tracking-wide font-medium">
                  Financial Systems: <span className="text-emerald-400 font-semibold">Active &amp; Scaled</span>
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* RIGHT: Editorial Typography & Institutional Context */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col justify-center gap-6">
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <span className={cn("px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase border", a.badgeBg, a.badgeBorder, a.badgeText)}>
                {tagline}
              </span>
              <span className="text-neutral-500 font-mono text-xs">
                {number}
              </span>
            </motion.div>

            <motion.h1
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white capitalize leading-[1.08]"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg lg:text-xl text-neutral-300 font-normal leading-relaxed max-w-xl"
            >
              {description}
            </motion.p>

            {/* Live Metrics Grid */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-white/10"
            >
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md"
                >
                  <div className="text-base sm:text-xl font-mono font-semibold text-white tracking-tight">
                    {m.value}
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mt-1">
                    {m.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
