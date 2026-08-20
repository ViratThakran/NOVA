"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

const STORIES = [
  {
    id: "clearing-engine",
    tag: "CAPITAL MARKETS · NOVA CASE",
    title: "Scaling a multi-asset matching engine to 250,000 orders/sec",
    synopsis:
      "We engineered a distributed C++ & Rust order matching engine with DPDK kernel bypass and zero-copy ring buffers. The system processes over 250K orders/sec with deterministic P99 latency under 3.8ms during peak market volatility.",
    stat: "250K ops/sec · 3.8ms P99 · 0 dropped frames",
    image: "/images/cards/software.jpg",
  },
  {
    id: "aml-graph",
    tag: "RISK & COMPLIANCE · NOVA CASE",
    title: "Cutting false-positive AML alerts by 74% using real-time graph AI",
    synopsis:
      "Replaced static rule-based transaction monitoring with a TigerGraph + PyTorch GNN intelligence pipeline. Correlating entity networks across 45M historical transactions dropped false-positive investigation overhead by 74% while uncovering complex multi-hop layering rings.",
    stat: "-74% false positives · 45M transactions analyzed",
    image: "/images/cards/gen_ai_research.jpg",
  },
  {
    id: "ledger-migration",
    tag: "CORE BANKING · NOVA CASE",
    title: "Zero-downtime ledger migration across $12B in active deposits",
    synopsis:
      "Executed a shadow-ledger dual-write migration strategy converting legacy batch-updated banking ledgers to an immutable event-sourced PostgreSQL + Kafka ledger. Completed cutover across 1.8M retail accounts without a single second of deposit service disruption.",
    stat: "$12B deposits · 1.8M accounts · 0s downtime",
    image: "/images/cards/build.jpg",
  },
];

export function FinancialInActionSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="industry-action"
      className="relative py-24 sm:py-32 bg-[#08080A] text-white border-b border-white/[0.08] overflow-hidden"
    >
      <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[400px] bg-teal-950/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-emerald-400 uppercase">
            04 / FINANCIAL SYSTEMS IN ACTION
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white capitalize leading-tight">
            High-assurance engineering under extreme volume
          </h2>
          <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed mt-2">
            Real institutional deployments where latency, accuracy, and fault tolerance are non-negotiable.
          </p>
        </div>

        <div className="flex flex-col gap-14 sm:gap-16">
          {STORIES.map((story, index) => (
            <motion.div
              key={story.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-20 items-center ${
                index % 2 === 1 ? "lg:[direction:rtl]" : ""
              }`}
            >
              <div className={`lg:col-span-5 ${index % 2 === 1 ? "[direction:ltr]" : ""}`}>
                <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-inner">
                  <Image
                    src={story.image}
                    alt={story.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="object-cover object-center opacity-85 transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                </div>
              </div>

              <div className={`lg:col-span-7 flex flex-col gap-5 ${index % 2 === 1 ? "[direction:ltr]" : ""}`}>
                <span className="text-[10px] font-mono font-semibold tracking-widest text-neutral-500 uppercase">
                  {story.tag}
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
                  {story.title}
                </h3>
                <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
                  {story.synopsis}
                </p>
                <div className="pt-4 border-t border-white/10">
                  <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase font-semibold">
                    {story.stat}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
