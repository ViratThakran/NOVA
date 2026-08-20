"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  RefreshCw,
  FileCheck2,
  Cpu,
  HeartPulse,
  Activity,
  Car,
  Factory,
  ShoppingCart,
  Server,
  Zap,
  LucideIcon,
} from "lucide-react";
import { IndustryAccent, getIndustryAccent } from "./industry-theme";
import { cn } from "@/lib/utils";

export type AssuranceIconName =
  | "ShieldCheck"
  | "Lock"
  | "KeyRound"
  | "RefreshCw"
  | "FileCheck2"
  | "Cpu"
  | "HeartPulse"
  | "Activity"
  | "Car"
  | "Factory"
  | "ShoppingCart"
  | "Server"
  | "Zap";

const ICON_MAP: Record<string, LucideIcon> = {
  ShieldCheck,
  Lock,
  KeyRound,
  RefreshCw,
  FileCheck2,
  Cpu,
  HeartPulse,
  Activity,
  Car,
  Factory,
  ShoppingCart,
  Server,
  Zap,
};

export interface AssurancePillar {
  iconName?: AssuranceIconName | string;
  icon?: LucideIcon;
  title: string;
  badge: string;
  description: string;
}

interface Props {
  id?: string;
  chapter?: string;
  heading: string;
  subtext: string;
  pillars: AssurancePillar[];
  accent?: IndustryAccent;
}

export function IndustryAssuranceSection({
  id = "industry-assurance",
  chapter = "05 / INSTITUTIONAL ASSURANCE",
  heading,
  subtext,
  pillars,
  accent = "emerald",
}: Props) {
  const prefersReducedMotion = useReducedMotion();
  const a = getIndustryAccent(accent);

  return (
    <section
      id={id}
      className="relative py-24 sm:py-32 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className={cn("absolute top-1/3 -right-20 w-[550px] h-[550px] rounded-full blur-3xl pointer-events-none", a.orb1)} />
      <div className={cn("absolute bottom-10 -left-20 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none", a.orb2)} />

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, index) => {
            const Icon = (pillar.iconName ? ICON_MAP[pillar.iconName] : pillar.icon) || ShieldCheck;
            return (
              <motion.div
                key={pillar.title}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="group relative p-8 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 shadow-[0_10px_35px_0_rgba(0,0,0,0.03)] hover:shadow-[0_16px_48px_0_rgba(0,0,0,0.08)] hover:bg-white/90 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className={cn("p-3 rounded-2xl border transition-colors duration-300", a.badgeBg, a.badgeBorder, a.text, "group-hover:bg-neutral-950 group-hover:text-white")}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={cn("font-mono text-[10px] font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider", a.badgeBg, a.badgeBorder, a.text)}>
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className={cn("text-xl font-bold tracking-tight text-neutral-950 mb-3 transition-colors", `group-hover:${a.text}`)}>
                    {pillar.title}
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
                <div className={cn("h-0.5 w-8 mt-8 transition-all duration-300", a.barBg, "group-hover:w-16", a.barHoverBg)} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
