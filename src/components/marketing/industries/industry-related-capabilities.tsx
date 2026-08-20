"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { IndustryAccent, getIndustryAccent } from "./industry-theme";
import { cn } from "@/lib/utils";

interface RelatedCap {
  number: string;
  title: string;
  description: string;
  href: string;
}

interface Props {
  industryName?: string;
  accent?: IndustryAccent;
  capabilities?: RelatedCap[];
}

const DEFAULT_CAPS: RelatedCap[] = [
  {
    number: "01",
    title: "AI & Data",
    description: "Real-time fraud graph detection, predictive risk models, and streaming telemetry.",
    href: "/what-we-do/ai-intelligence",
  },
  {
    number: "02",
    title: "Cloud & Infrastructure",
    description: "Zero-downtime, multi-region Kubernetes and low-latency cloud deployments.",
    href: "/what-we-do/cloud",
  },
  {
    number: "03",
    title: "Software & Technology",
    description: "Mission-critical backend microservices, FIX order gateways, and event-sourced ledgers.",
    href: "/what-we-do/software-technology",
  },
  {
    number: "05",
    title: "Data & Analytics",
    description: "Consolidated financial data lakes, tick analytics, and executive compliance reporting.",
    href: "/what-we-do/data-analytics",
  },
  {
    number: "06",
    title: "Automation",
    description: "Continuous compliance verification, SOC2 telemetry, and automated release gates.",
    href: "/what-we-do/automation",
  },
];

export function IndustryRelatedCapabilities({
  industryName = "Financial Services",
  accent = "emerald",
  capabilities = DEFAULT_CAPS,
}: Props) {
  const a = getIndustryAccent(accent);
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="industry-related"
      className="relative py-24 sm:py-32 bg-[#F8F9FB] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className={cn("absolute top-10 right-10 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none", a.orb1)} />
      <div className={cn("absolute bottom-10 left-10 w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none", a.orb2)} />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-3 max-w-2xl mb-14 sm:mb-18">
          <span className={cn("text-[11px] font-mono font-semibold tracking-[0.24em] uppercase", a.text)}>
            07 / SUPPORTING CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 capitalize leading-tight">
            NOVA capabilities powering {industryName}
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed mt-2">
            Explore the specialized horizontal engineering disciplines that underpin our financial solutions.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {capabilities.map((cap, index) => (
            <motion.div
              key={cap.title}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                href={cap.href}
                className={cn(
                  "group flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-7 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_6px_24px_0_rgba(0,0,0,0.03)]",
                  "hover:bg-white/90 hover:border-white transition-all duration-200 focus-visible:outline-none",
                  a.focusRing
                )}
              >
                <div className="flex items-start sm:items-center gap-4 sm:gap-8">
                  <span className={cn("text-xs font-mono font-bold text-neutral-400 transition-colors duration-200 pt-1 sm:pt-0", `group-hover:${a.text}`)}>
                    {cap.number}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                    <span className={cn("text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 transition-colors duration-200", `group-hover:${a.text}`)}>
                      {cap.title}
                    </span>
                    <span className="text-sm text-neutral-500 group-hover:text-neutral-700 transition-colors duration-200">
                      {cap.description}
                    </span>
                  </div>
                </div>
                <div className={cn("mt-3 sm:mt-0 flex items-center gap-2 self-end sm:self-auto font-medium text-sm", a.text)}>
                  <span className="hidden sm:inline opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                    Explore Capability
                  </span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
