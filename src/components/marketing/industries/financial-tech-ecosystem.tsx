"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const STACK_LAYERS = [
  { layer: "MARKET DATA", detail: "FIX 4.4/5.0, FAST, ITCH/OUCH, Market Ticks, WebSockets" },
  { layer: "LOW-LATENCY RUNTIMES", detail: "Rust, C++20, Go, DPDK Kernel Bypass, Ring Buffers" },
  { layer: "IMMUTABLE LEDGERS", detail: "PostgreSQL, TigerGraph, ClickHouse, Apache Iceberg" },
  { layer: "RISK & AI MODELS", detail: "PyTorch GNNs, ONNX Runtime, Ray Distributed, Feature Stores" },
  { layer: "SECURITY & VAULTS", detail: "Cloud HSM, HashiCorp Vault, MPC Signing, OPA Policy" },
];

const FINANCIAL_TECHS = [
  { name: "FIX Protocol & FAST", category: "Market Data" },
  { name: "Rust & C++20", category: "Low-Latency Compute" },
  { name: "Apache Kafka", category: "Event Streaming" },
  { name: "PostgreSQL (Event-Sourced)", category: "Immutable Ledgers" },
  { name: "TigerGraph", category: "Graph AML & Fraud" },
  { name: "ClickHouse", category: "Real-Time Tick Analytics" },
  { name: "PyTorch & ONNX", category: "Real-Time ML Scoring" },
  { name: "HashiCorp Vault & HSM", category: "Cryptographic Keys" },
  { name: "ISO 20022", category: "Financial Messaging" },
  { name: "AWS / GCP Financial Zones", category: "Multi-Region Cloud" },
];

export function FinancialTechEcosystemSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="industry-technology"
      className="relative py-24 sm:py-32 bg-[#F5F7FA] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-teal-200/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-emerald-600 uppercase">
            06 / ARCHITECTURE &amp; ECOSYSTEM
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 capitalize leading-tight">
            Built for low-latency &amp; deterministic scale
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed mt-2">
            Every layer of the financial engineering stack — from direct market data feeds to immutable ledgers and cryptographic key management.
          </p>
        </div>

        {/* Financial Flow Pipeline */}
        <div className="mb-20">
          <span className="block text-[11px] font-mono font-semibold tracking-widest text-neutral-500 uppercase mb-6">
            Financial Transaction Architecture Flow
          </span>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STACK_LAYERS.map((item, index) => (
              <motion.div
                key={item.layer}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="relative flex flex-col justify-between p-6 rounded-2xl bg-white/75 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_0_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_0_rgba(16,185,129,0.08)] hover:border-emerald-400/60 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-emerald-600">0{index + 1}</span>
                    {index < STACK_LAYERS.length - 1 && (
                      <ArrowRight className="hidden md:block h-3.5 w-3.5 text-neutral-400" />
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight text-neutral-950 mb-2">
                    {item.layer}
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tech Grid */}
        <div>
          <span className="block text-[11px] font-mono font-semibold tracking-widest text-neutral-500 uppercase mb-6">
            Production Financial Technologies
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {FINANCIAL_TECHS.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.025 }}
                className="flex flex-col p-4 rounded-xl bg-white/65 backdrop-blur-lg border border-white/80 hover:bg-white/90 shadow-[0_4px_20px_0_rgba(0,0,0,0.02)] transition-all duration-200"
              >
                <span className="text-sm sm:text-base font-semibold text-neutral-950">{tech.name}</span>
                <span className="text-xs text-neutral-500 mt-1">{tech.category}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
