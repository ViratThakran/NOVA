"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus, Minus, ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CapabilityTopic {
  id: string;
  number: string;
  code: string;
  title: string;
  headline: string;
  description: string;
  tags: string[];
  href: string;
}

const CAPABILITY_TOPICS: CapabilityTopic[] = [
  {
    id: "ai",
    number: "01",
    code: "AI-01",
    title: "AI & INTELLIGENCE",
    headline: "Autonomous agent pipelines, fine-tuned models, and reasoning systems.",
    description:
      "The thinking that happens before the code: custom autonomous agent pipelines, fine-tuned reasoning models, and self-verifying evaluation loops designed to execute complex operations reliably at scale.",
    tags: [
      "AUTONOMOUS AGENTS",
      "FINE-TUNED LLMS",
      "REASONING PIPELINES",
      "VECTOR EMBEDDINGS",
      "EVALUATION LOOPS",
    ],
    href: "/services",
  },
  {
    id: "products",
    number: "02",
    code: "DP-02",
    title: "DIGITAL PRODUCTS",
    headline: "Digital experiences engineered around real-world utility and user behavior.",
    description:
      "Modern web applications and mobile platforms engineered for speed, usability, edge-native responsiveness, and accessibility with scalable design systems that convert visitors into active users.",
    tags: [
      "NEXT.JS & REACT",
      "EDGE PLATFORMS",
      "MOBILE UX",
      "DESIGN SYSTEMS",
      "ACCESSIBILITY",
    ],
    href: "/services",
  },
  {
    id: "software",
    number: "03",
    code: "ST-03",
    title: "SOFTWARE & SYSTEMS",
    headline: "Resilient backend services, distributed cloud nodes, and microservices.",
    description:
      "High-throughput infrastructure built with strict concurrency, distributed caching, observability, and zero-downtime resilience for high-load production workloads and enterprise architectures.",
    tags: [
      "DISTRIBUTED NODES",
      "MICROSERVICES",
      "CLOUD ARCHITECTURE",
      "API GATEWAYS",
      "DATABASE SHARDING",
    ],
    href: "/services",
  },
  {
    id: "data",
    number: "04",
    code: "DA-04",
    title: "DATA & ANALYTICS",
    headline: "High-throughput data ingestion, streaming pipelines, and warehouses.",
    description:
      "Transform distributed data telemetry into clear, real-time metrics and high-conviction decision systems with low-latency streaming infrastructure and modern data lake architectures.",
    tags: [
      "STREAMING PIPELINES",
      "DATA LAKES",
      "REAL-TIME TELEMETRY",
      "ANALYTICS ENGINES",
      "DATA MODELING",
    ],
    href: "/services",
  },
  {
    id: "automation",
    number: "05",
    code: "AO-05",
    title: "AUTOMATION & DEVOPS",
    headline: "Self-healing deployment engines and CI/CD automation pipelines.",
    description:
      "Eliminate manual operational bottlenecks with automated verification loops, infrastructure-as-code, and continuous release pipelines that deploy safely with zero downtime.",
    tags: [
      "CI/CD PIPELINES",
      "INFRA AS CODE",
      "SELF-HEALING",
      "ZERO-DOWNTIME",
      "TEST AUTOMATION",
    ],
    href: "/services",
  },
  {
    id: "talent",
    number: "06",
    code: "TS-06",
    title: "TALENT & SQUADS",
    headline: "Directly connect organizations with proven builders and vetted squads.",
    description:
      "Embed engineers and agile squads with demonstrated repository contributions directly into your production teams to accelerate execution velocity and ship mission-critical software.",
    tags: [
      "EMBEDDED SQUADS",
      "VERIFIED COMMITS",
      "ARCHITECTURE ADVISORY",
      "PAIR PROGRAMMING",
      "CODE REVIEWS",
    ],
    href: "/services",
  },
];

export function WhatWeDoSection() {
  const [activeId, setActiveId] = React.useState<string>("ai");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="what-we-do"
      className="scroll-mt-16 bg-[#FAFAFA] py-16 sm:py-24 border-b border-neutral-200 text-neutral-950"
    >
      <div className="mx-auto flex w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col w-full gap-8 sm:gap-10">
          {/* ── Full-Width Header Block ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-300 pb-7">
            {/* Left: eyebrow + heading */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-[0.25em] text-neutral-500 uppercase">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>03 / CAPABILITIES &amp; SOLUTIONS</span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-[72px] font-black tracking-tight text-neutral-950 uppercase leading-[0.92]">
                WHAT WE
                <br />
                ACTUALLY
                <br />
                BUILD.
              </h2>
            </div>

            {/* Right: description + CTA pinned to bottom-right */}
            <div className="flex flex-col gap-4 max-w-sm shrink-0 sm:pb-1">
              <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed">
                From artificial intelligence and autonomous agents to cloud platforms and data systems, NOVA turns engineering into tangible products.
              </p>
              <div>
                <Link
                  href="/services"
                  className="group inline-flex items-center gap-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white px-5 py-3 text-xs sm:text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98]"
                >
                  <span>Explore All Capabilities</span>
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Full-Width Accordion List ── */}
          <div className="flex flex-col divide-y divide-neutral-300/80 border-b border-neutral-300/80">
            {CAPABILITY_TOPICS.map((topic) => {
              const isOpen = activeId === topic.id;
              return (
                <div
                  key={topic.id}
                  onMouseEnter={() => setActiveId(topic.id)}
                  onClick={() => setActiveId(topic.id)}
                  className={cn(
                    "group cursor-pointer py-4 sm:py-5.5 transition-all duration-200 flex flex-col text-left select-none",
                    isOpen
                      ? "bg-neutral-100/80 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-2xl"
                      : "hover:bg-neutral-100/40 -mx-2 px-2 sm:-mx-4 sm:px-4 rounded-xl"
                  )}
                >
                  {/* Topic Title Bar */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-baseline gap-3 sm:gap-5">
                      <span className={cn(
                        "font-mono text-xs sm:text-sm font-bold transition-colors duration-200",
                        isOpen ? "text-neutral-950" : "text-neutral-400 group-hover:text-neutral-700"
                      )}>
                        {topic.number}
                      </span>
                      <h3
                        className="text-2xl sm:text-3xl lg:text-[40px] font-black tracking-tight uppercase leading-none text-neutral-950 transition-colors duration-200"
                      >
                        {topic.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                      <span className="text-[11px] font-mono font-medium text-neutral-400 hidden sm:inline">
                        {topic.code}
                      </span>
                      <div className="flex h-6 w-6 items-center justify-center text-neutral-950 transition-transform duration-200">
                        {isOpen ? (
                          <Minus className="h-4.5 w-4.5 font-bold" />
                        ) : (
                          <Plus className="h-4.5 w-4.5 font-bold group-hover:scale-110" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hover-Driven Expandable Details Tray */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={
                          prefersReducedMotion
                            ? { opacity: 1, height: "auto" }
                            : { opacity: 0, height: 0 }
                        }
                        animate={{ opacity: 1, height: "auto" }}
                        exit={
                          prefersReducedMotion
                            ? { opacity: 0, height: 0 }
                            : { opacity: 0, height: 0 }
                        }
                        transition={{
                          duration: 0.28,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 sm:pt-5 flex flex-col lg:flex-row gap-5 lg:gap-8 justify-between items-start">
                          {/* Left: Detailed Description */}
                          <div className="flex-1 flex flex-col gap-2.5">
                            <p className="text-sm sm:text-[15px] text-neutral-700 leading-relaxed font-normal">
                              {topic.description}
                            </p>
                            <div className="pt-1">
                              <Link
                                href={topic.href}
                                className="group/link inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-950 hover:text-neutral-600 transition-colors underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-950"
                              >
                                <span>Learn more about {topic.title.toLowerCase()}</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
                              </Link>
                            </div>
                          </div>

                          {/* Right: Filter Pill Tags */}
                          <div className="flex flex-wrap gap-2 lg:max-w-xs shrink-0">
                            {topic.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-white border border-neutral-300 px-3 py-1 text-[11px] font-mono font-medium tracking-wider text-neutral-700 shadow-xs transition-colors hover:border-neutral-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}