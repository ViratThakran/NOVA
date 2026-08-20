"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Cpu, GraduationCap, Users, Sparkles, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroCanvas3D } from "./hero-canvas-3d";

interface EcosystemNodeDetail {
  id: string;
  number: string;
  title: string;
  eyebrow: string;
  statement: string;
  description: string;
  subElements: string[];
  ctaText: string;
  ctaHref: string;
  color: string;
  icon: React.ElementType;
}

const ECOSYSTEM_CARDS: EcosystemNodeDetail[] = [
  {
    id: "technology",
    number: "01",
    title: "TECHNOLOGY",
    eyebrow: "INTELLIGENT INFRASTRUCTURE",
    statement: "Technology enables people.",
    description: "The intelligent infrastructure underneath it all — AI engines, dev platforms, automated pipelines, and cloud services that power modern execution.",
    subElements: ["AI Development", "Software & Cloud", "Data Systems", "Automation Engines"],
    ctaText: "Explore Technology",
    ctaHref: "#what-we-do",
    color: "blue",
    icon: Cpu,
  },
  {
    id: "learning",
    number: "02",
    title: "LEARNING",
    eyebrow: "RIGOROUS CAPABILITY",
    statement: "Learning creates capability.",
    description: "Hands-on, project-driven engineering curriculum designed to build structural intuition, architectural rigor, and verifiable competence.",
    subElements: ["Mastery Cohorts", "Challenge Labs", "Systems Design", "Technical Modules"],
    ctaText: "Explore Curriculum",
    ctaHref: "#platform",
    color: "indigo",
    icon: GraduationCap,
  },
  {
    id: "people",
    number: "03",
    title: "PEOPLE",
    eyebrow: "BUILDER COLLECTIVE",
    statement: "Experience creates confidence.",
    description: "Ambitious students, veteran engineers, mentors, and collaborative squads working on real production problems that demand high-conviction execution.",
    subElements: ["Builders & Engineers", "Industry Mentors", "Synchronized Squads", "Global Network"],
    ctaText: "Explore The Community",
    ctaHref: "#who-we-are",
    color: "purple",
    icon: Users,
  },
  {
    id: "opportunity",
    number: "04",
    title: "OPPORTUNITY",
    eyebrow: "CAREER DOORWAYS",
    statement: "Opportunity creates careers.",
    description: "Direct pathways to paid internships, venture incubation, enterprise service delivery, and high-growth hiring pipelines worldwide.",
    subElements: ["Paid Internships", "Direct-to-Role Hiring", "Founder Co-Builds", "Venture Pathways"],
    ctaText: "Discover Pathways",
    ctaHref: "#careers",
    color: "emerald",
    icon: Sparkles,
  },
];

export function EcosystemSection() {
  const [activeNodeId, setActiveNodeId] = React.useState<string>("technology");
  const prefersReducedMotion = useReducedMotion();

  const activeNode = ECOSYSTEM_CARDS.find((n) => n.id === activeNodeId) || ECOSYSTEM_CARDS[0];

  return (
    <section id="ecosystem" className="scroll-mt-16 bg-[#FAFAFA] py-20 sm:py-32 border-b border-neutral-200">
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-12 sm:gap-16 px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-200 pb-8 sm:pb-10">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-3 max-w-3xl"
          >
            <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-primary">
              Ecosystem Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-950">
              The interconnected NOVA engine.
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 max-w-xl">
              A synchronized digital foundation designed so each pillar directly reinforces and accelerates the next.
            </p>
          </motion.div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-500 pb-1">
            <Network className="h-4 w-4 text-primary" />
            <span>INTERACTIVE ARCHITECTURE</span>
          </div>
        </div>

        {/* Center: 3D Stage + 4 Rich Structural Explanatory Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left / Top: Clean 3D Interactive Canvas */}
          <div className="lg:col-span-7 relative flex flex-col items-center justify-center min-h-[420px] sm:min-h-[500px] rounded-3xl border border-neutral-800 bg-[#0C0C0C] text-white overflow-hidden p-6 sm:p-8 shadow-xl">
            <HeroCanvas3D />

            {/* Central Core Hub */}
            <div className="relative z-10 flex flex-col items-center justify-center h-20 w-20 rounded-full border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md">
              <span className="text-xs font-mono font-bold tracking-widest text-white">NOVA</span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1 animate-pulse" />
            </div>

            {/* Quick Interactive Selector Badges */}
            <div className="absolute top-4 inset-x-4 z-20 flex flex-wrap items-center justify-center gap-2">
              {ECOSYSTEM_CARDS.map((card) => {
                const isActive = card.id === activeNodeId;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setActiveNodeId(card.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider transition-all backdrop-blur-md border",
                      isActive
                        ? "border-blue-400 bg-blue-600/30 text-white shadow-md scale-105"
                        : "border-white/15 bg-black/50 text-white/70 hover:text-white hover:border-white/30"
                    )}
                  >
                    <card.icon className="h-3 w-3" />
                    <span>{card.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Node Bottom Live Summary inside Canvas Container */}
            <div className="absolute bottom-4 inset-x-4 z-20 rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 backdrop-blur-md flex items-center justify-between">
              <span className="text-xs font-mono text-white/80">
                ACTIVE NODE: <strong className="text-white">{activeNode.title}</strong>
              </span>
              <span className="text-xs text-blue-300 font-medium hidden sm:inline-block">
                {activeNode.statement}
              </span>
            </div>
          </div>

          {/* Right / Grid: The 4 Distinct Explanatory Cards */}
          <div className="lg:col-span-5 flex flex-col gap-3.5">
            {ECOSYSTEM_CARDS.map((node) => {
              const isActive = node.id === activeNodeId;
              const Icon = node.icon;
              return (
                <div
                  key={node.id}
                  onClick={() => setActiveNodeId(node.id)}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 transition-all duration-200 border cursor-pointer",
                    isActive
                      ? "border-neutral-950 bg-white shadow-lg ring-1 ring-neutral-950/10"
                      : "border-neutral-200/90 bg-white/80 hover:bg-white hover:border-neutral-400 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl font-mono text-xs font-bold transition-colors",
                          isActive
                            ? "bg-neutral-950 text-white"
                            : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
                        )}
                      >
                        {node.number}
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold tracking-tight text-neutral-950">
                          {node.title}
                        </h3>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 block">
                          {node.eyebrow}
                        </span>
                      </div>
                    </div>

                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-neutral-400 group-hover:text-neutral-700"
                      )}
                    />
                  </div>

                  <p className="mt-2.5 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    {node.description}
                  </p>

                  {/* Sub-elements Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-neutral-100">
                    {node.subElements.map((elem) => (
                      <span
                        key={elem}
                        className="rounded-md bg-neutral-50 border border-neutral-200/80 px-2 py-0.5 text-[11px] font-medium text-neutral-700"
                      >
                        {elem}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
