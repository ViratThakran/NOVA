"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const STACK_LAYERS = [
  { layer: "AI / MODELS", detail: "Transformers, Custom Fine-Tunes, Agent Orchestration" },
  { layer: "DATA", detail: "Vector DBs, Streaming Ingestion, Semantic Layers" },
  { layer: "CLOUD", detail: "Multi-Region Cloud Services, Serverless Compute" },
  { layer: "INFRASTRUCTURE", detail: "Kubernetes, GPU Clusters, Terraform IaaC" },
  { layer: "APPLICATIONS", detail: "Next.js, High-Density APIs, Autonomous Tools" },
];

const ECOSYSTEM_TECHS = [
  { name: "PyTorch", category: "Deep Learning & Model Training" },
  { name: "LangChain / LangGraph", category: "Agent Orchestration" },
  { name: "OpenAI / Anthropic", category: "Foundational LLMs" },
  { name: "vLLM / TensorRT-LLM", category: "High-Throughput Inference" },
  { name: "PostgreSQL / pgvector", category: "Vector & Relational Storage" },
  { name: "Pinecone / Qdrant", category: "Vector Indexing" },
  { name: "Snowflake / BigQuery", category: "Enterprise Data Warehouse" },
  { name: "Apache Kafka", category: "Real-Time Event Streaming" },
  { name: "Docker & Kubernetes", category: "Container Orchestration" },
  { name: "TypeScript / Next.js", category: "Edge Applications" },
];

export function AiTechnologyEcosystemSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="technology-stack"
      className="relative py-24 sm:py-32 bg-[#F5F7FA] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      {/* ── Ambient Soft Glow Orbs for Glassmorphism ── */}
      <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-indigo-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* Section Header */}
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
            06 / TECHNOLOGY ECOSYSTEM
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 capitalize leading-tight">
            Built across the stack
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed mt-2">
            Engineered across the full system lifecycle—from silicon inference to production interfaces.
          </p>
        </div>

        {/* ── 1. Horizontal Architectural Pipeline in Frosted Glass ── */}
        <div className="mb-20">
          <span className="block text-[11px] font-mono font-semibold tracking-widest text-neutral-500 uppercase mb-6">
            System Architecture Flow
          </span>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STACK_LAYERS.map((item, index) => (
              <motion.div
                key={item.layer}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="relative flex flex-col justify-between p-6 rounded-2xl bg-white/75 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_0_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_0_rgba(99,102,241,0.08)] hover:border-indigo-400/60 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      0{index + 1}
                    </span>
                    {index < STACK_LAYERS.length - 1 && (
                      <ArrowRight className="hidden md:block h-3.5 w-3.5 text-neutral-400" />
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight text-neutral-950 mb-2">
                    {item.layer}
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {item.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── 2. Restrained Technology Grid in Frosted Glass ── */}
        <div>
          <span className="block text-[11px] font-mono font-semibold tracking-widest text-neutral-500 uppercase mb-6">
            Core Production Technologies
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {ECOSYSTEM_TECHS.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="flex flex-col p-4 rounded-xl bg-white/65 backdrop-blur-lg border border-white/80 hover:bg-white/90 shadow-[0_4px_20px_0_rgba(0,0,0,0.02)] transition-all duration-200"
              >
                <span className="text-sm sm:text-base font-semibold text-neutral-950">
                  {tech.name}
                </span>
                <span className="text-xs text-neutral-500 mt-1">
                  {tech.category}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
