"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface CaseStudy {
  id: string;
  tag: string;
  title: string;
  synopsis: string;
  architecture: string;
  image: string;
  href: string;
}

const REAL_WORLD_PROJECTS: CaseStudy[] = [
  {
    id: "ai-decision-platform",
    tag: "NOVA SOLUTION ARCHITECTURE · 01",
    title: "How we built an intelligent decision system",
    synopsis:
      "A prototype architecture integrating live streaming telemetry with continuous LLM reasoning agents to evaluate risk and automate complex multi-variable decisions in sub-second latency.",
    architecture: "Vector Indexing · Multi-Agent Consensus · Streaming Ingestion",
    image: "/images/cards/ai.jpg",
    href: "/contact",
  },
  {
    id: "unified-data-platform",
    tag: "NOVA SOLUTION ARCHITECTURE · 02",
    title: "Turning fragmented data into a unified intelligence layer",
    synopsis:
      "A production blueprint demonstrating the migration from siloed relational tables into a federated lakehouse with automated semantic embeddings for instant AI grounding.",
    architecture: "Iceberg Lakehouse · CDC Streaming · Automated Semantic Layers",
    image: "/images/cards/software.jpg",
    href: "/contact",
  },
  {
    id: "autonomous-squads",
    tag: "NOVA SOLUTION ARCHITECTURE · 03",
    title: "Building systems that reason, respond and improve",
    synopsis:
      "An autonomous code verification and pipeline diagnostic squad designed to autonomously analyze pull requests, run regression audits, and suggest targeted optimizations.",
    architecture: "Self-Correction Loops · Deterministic Guardrails · Tool Execution",
    image: "/images/cards/grow.jpg",
    href: "/contact",
  },
];

export function AiRealWorldSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="ai-real-world"
      className="relative py-24 sm:py-32 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      {/* ── Ambient Soft Glow Orbs for Glassmorphism ── */}
      <div className="absolute top-1/3 -right-20 w-[550px] h-[550px] bg-blue-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-[500px] h-[500px] bg-indigo-200/25 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* Section Header */}
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
            05 / REAL-WORLD PROOF
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 capitalize leading-tight">
            AI &amp; data in the real world
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed mt-2">
            Selected solution architectures, prototypes, and engineering demonstrations built by NOVA.
          </p>
        </div>

        {/* Frosted Glass Project Story Cards */}
        <div className="flex flex-col gap-8">
          {REAL_WORLD_PROJECTS.map((project, index) => (
            <motion.div
              key={project.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group relative p-8 sm:p-10 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/90 shadow-[0_10px_35px_0_rgba(0,0,0,0.03)] hover:bg-white/85 hover:shadow-[0_16px_48px_0_rgba(31,38,135,0.07)] transition-all duration-300"
            >
              <Link
                href={project.href}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-2xl"
              >
                {/* Visual Thumbnail (4 Cols) */}
                <div className="lg:col-span-4 w-full">
                  <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-200/80 shadow-inner">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 450px"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105 opacity-90"
                    />
                  </div>
                </div>

                {/* Narrative (8 Cols) */}
                <div className="lg:col-span-8 flex flex-col justify-between gap-4">
                  <span className="text-[11px] font-mono font-semibold tracking-widest text-neutral-500 uppercase">
                    {project.tag}
                  </span>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-950 group-hover:text-indigo-600 transition-colors duration-200">
                    {project.title}
                  </h3>

                  <p className="text-base sm:text-lg text-neutral-700 font-normal leading-relaxed">
                    {project.synopsis}
                  </p>

                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-neutral-200/60">
                    <span className="text-xs font-mono text-neutral-500">
                      Architecture: <span className="text-neutral-900 font-medium">{project.architecture}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 group-hover:translate-x-1.5 transition-transform duration-200">
                      <span>View Solution</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
