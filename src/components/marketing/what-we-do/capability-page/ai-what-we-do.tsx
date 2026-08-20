"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OfferingSubItem {
  num: string;
  label: string;
  href: string;
}

interface CapabilityOffering {
  id: string;
  title: string;
  image: string;
  items: OfferingSubItem[];
}

const OFFERINGS: CapabilityOffering[] = [
  {
    id: "ai-engineering",
    title: "AI Engineering",
    image: "/images/cards/ai.jpg",
    items: [
      { num: "01", label: "Low-Latency Model Serving", href: "/contact" },
      { num: "02", label: "Retrieval-Augmented Generation (RAG)", href: "/contact" },
      { num: "03", label: "Deterministic Guardrails & Evaluation", href: "/contact" },
      { num: "04", label: "Multi-Modal Ingest & Vector Embeddings", href: "/contact" },
      { num: "05", label: "Real-Time Inference & Quantization", href: "/contact" },
      { num: "06", label: "Autonomous System Verification", href: "/contact" },
    ],
  },
  {
    id: "generative-ai",
    title: "Generative AI",
    image: "/images/cards/gen_ai_research.jpg",
    items: [
      { num: "01", label: "Domain-Adapted LLM Fine-Tuning", href: "/contact" },
      { num: "02", label: "Context-Grounded Enterprise Synthesis", href: "/contact" },
      { num: "03", label: "Automated Code Generation & Refactoring", href: "/contact" },
      { num: "04", label: "Structured JSON Output Extraction", href: "/contact" },
      { num: "05", label: "Enterprise Knowledge Graph Search", href: "/contact" },
      { num: "06", label: "Multi-Modal Reasoning Systems", href: "/contact" },
    ],
  },
  {
    id: "ai-agents",
    title: "AI Agents",
    image: "/images/cards/learn.jpg",
    items: [
      { num: "01", label: "Multi-Agent Coordination & Routing", href: "/contact" },
      { num: "02", label: "Tool Invocation & API Execution", href: "/contact" },
      { num: "03", label: "Persistent State & Memory Vector Arch", href: "/contact" },
      { num: "04", label: "Self-Correction & Output Verification", href: "/contact" },
      { num: "05", label: "Human-in-the-Loop Safeguards", href: "/contact" },
      { num: "06", label: "Autonomous Squad Workflows", href: "/contact" },
    ],
  },
  {
    id: "data-engineering",
    title: "Data Engineering",
    image: "/images/cards/software.jpg",
    items: [
      { num: "01", label: "Real-Time Event Streaming & CDC", href: "/contact" },
      { num: "02", label: "Vector Database Indexing & Hybrid Search", href: "/contact" },
      { num: "03", label: "Automated Schema Validation & Tests", href: "/contact" },
      { num: "04", label: "Distributed Lakehouse Storage", href: "/contact" },
      { num: "05", label: "Semantic Data Layer Embeddings", href: "/contact" },
      { num: "06", label: "Data Quality Observability Pipelines", href: "/contact" },
    ],
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    image: "/images/cards/experience.jpg",
    items: [
      { num: "01", label: "Predictive Telemetry & Forecasting", href: "/contact" },
      { num: "02", label: "Continuous Model Training & MLOps CI/CD", href: "/contact" },
      { num: "03", label: "Model Drift & Performance Telemetry", href: "/contact" },
      { num: "04", label: "Feature Store Design & Serving", href: "/contact" },
      { num: "05", label: "Time-Series Anomaly Detection", href: "/contact" },
      { num: "06", label: "Continuous Evaluation Harness", href: "/contact" },
    ],
  },
  {
    id: "ai-strategy",
    title: "AI Strategy & Governance",
    image: "/images/cards/grow.jpg",
    items: [
      { num: "01", label: "Model Security & Prompt Injection Defense", href: "/contact" },
      { num: "02", label: "Regulatory Compliance & Privacy Guardrails", href: "/contact" },
      { num: "03", label: "AI ROI & Architectural Roadmaps", href: "/contact" },
      { num: "04", label: "Responsible AI & Bias Auditing", href: "/contact" },
      { num: "05", label: "Model Risk Management & Audits", href: "/contact" },
      { num: "06", label: "Enterprise AI Security Governance", href: "/contact" },
    ],
  },
];

export function AiWhatWeDoSection() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const prefersReducedMotion = useReducedMotion();
  const activeOffering = OFFERINGS[activeIndex];

  // Split the 6 items into 2 columns (3 items each)
  const leftColItems = activeOffering.items.slice(0, 3);
  const rightColItems = activeOffering.items.slice(3, 6);

  return (
    <section
      id="what-we-do-capabilities"
      className="relative py-20 sm:py-28 bg-[#F6F7FA] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      {/* ── Ambient Glow for Glassmorphic Depth ── */}
      <div className="absolute top-10 right-10 w-[600px] h-[600px] bg-indigo-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        
        {/* ── Main Unified Offerings Card Container (Reference-Matching Layout) ── */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_50px_0_rgba(31,38,135,0.06)] p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-start">
            
            {/* ── LEFT COLUMN (4 Cols): Header + Intro + Vertical Tabs List ── */}
            <div className="lg:col-span-4 flex flex-col justify-start">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 leading-tight">
                  Our Offerings
                </h2>
                <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed mt-3">
                  Our business solutions and services help accelerate innovation, increase productivity, reduce costs, and optimize asset utilization.
                </p>
              </div>

              {/* Vertical Tabs List */}
              <div className="flex flex-col gap-1.5">
                {OFFERINGS.map((offering, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={offering.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "group relative flex items-center justify-between py-3.5 px-4 sm:px-5 rounded-xl text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                        isActive
                          ? "bg-white shadow-xs font-semibold text-neutral-950"
                          : "hover:bg-white/60 text-neutral-600 hover:text-neutral-900 font-medium"
                      )}
                    >
                      {/* Left Accent Bar on Active Tab */}
                      {isActive && (
                        <motion.div
                          layoutId="activeOfferingBar"
                          className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r-full"
                          transition={{ duration: 0.2 }}
                        />
                      )}

                      <span className="text-base sm:text-lg tracking-tight">
                        {offering.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── RIGHT COLUMN (8 Cols): Top Banner Image + Bottom 2-Column Links Grid ── */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeOffering.id}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-8"
                >
                  {/* Top Horizontal Visual Banner */}
                  <div className="relative w-full aspect-[16/7] sm:aspect-[21/8] lg:aspect-[16/7] overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-200/80 shadow-xs">
                    <Image
                      src={activeOffering.image}
                      alt={activeOffering.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 900px"
                      className="object-cover object-center opacity-90 transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-6 flex items-center gap-2 font-mono text-xs font-semibold text-white uppercase tracking-widest">
                      <span className="text-indigo-400 font-bold">{activeOffering.title}</span>
                      <span>·</span>
                      <span className="text-neutral-300">NOVA Capability</span>
                    </div>
                  </div>

                  {/* Bottom 2-Column Numbered Links Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 pt-2">
                    {/* Left Sub-Column (01 - 03) */}
                    <div className="flex flex-col gap-4">
                      {leftColItems.map((item) => (
                        <Link
                          key={item.num}
                          href={item.href}
                          className="group inline-flex items-baseline gap-2 text-sm sm:text-base font-normal text-neutral-800 hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded"
                        >
                          <span className="font-mono text-xs font-semibold text-indigo-600">
                            {item.num}.
                          </span>
                          <span className="underline underline-offset-4 decoration-neutral-300 group-hover:decoration-indigo-600 transition-colors font-medium">
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>

                    {/* Right Sub-Column (04 - 06) */}
                    <div className="flex flex-col gap-4">
                      {rightColItems.map((item) => (
                        <Link
                          key={item.num}
                          href={item.href}
                          className="group inline-flex items-baseline gap-2 text-sm sm:text-base font-normal text-neutral-800 hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded"
                        >
                          <span className="font-mono text-xs font-semibold text-indigo-600">
                            {item.num}.
                          </span>
                          <span className="underline underline-offset-4 decoration-neutral-300 group-hover:decoration-indigo-600 transition-colors font-medium">
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
