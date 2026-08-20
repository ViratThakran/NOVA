"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface IndustrySolution {
  id: string;
  title: string;
  image: string;
  tagline: string;
  items: { num: string; label: string; href?: string }[];
}

const SOLUTIONS: IndustrySolution[] = [
  {
    id: "capital-markets",
    title: "Capital Markets & Trading",
    image: "/images/cards/software.jpg",
    tagline: "Low-latency order matching, FIX gateways, and algorithmic execution engines",
    items: [
      { num: "01", label: "Sub-Millisecond Order Matching Engines", href: "/contact" },
      { num: "02", label: "FIX Protocol / FAST Gateways & Normalization", href: "/contact" },
      { num: "03", label: "Smart Order Routing (SOR) & Dark Pool Liquidity", href: "/contact" },
      { num: "04", label: "Real-Time Level-2/3 Market Data Feeds", href: "/contact" },
      { num: "05", label: "Pre-Trade Risk Controls & Credit Checks", href: "/contact" },
      { num: "06", label: "Direct Market Access (DMA) Infrastructure", href: "/contact" },
    ],
  },
  {
    id: "core-banking",
    title: "Core Banking & Modern Ledgers",
    image: "/images/cards/build.jpg",
    tagline: "Event-sourced, immutable ledgers and modern real-time account systems",
    items: [
      { num: "01", label: "Event-Sourced Double-Entry Ledger Architecture", href: "/contact" },
      { num: "02", label: "Real-Time Balance Calculation & Shadow Ledgers", href: "/contact" },
      { num: "03", label: "ISO 20022 Financial Messaging Transformation", href: "/contact" },
      { num: "04", label: "Multi-Currency Deposit & Lending Engines", href: "/contact" },
      { num: "05", label: "Open Banking APIs & PSD2/PSD3 Compliance", href: "/contact" },
      { num: "06", label: "Mainframe Core Migration & Strangler-Fig Patterns", href: "/contact" },
    ],
  },
  {
    id: "risk-fraud",
    title: "Risk Intelligence & Anti-Fraud",
    image: "/images/cards/gen_ai_research.jpg",
    tagline: "Real-time graph reasoning, anomaly scoring, and automated AML pipelines",
    items: [
      { num: "01", label: "Graph-Based Money Laundering (AML) Detection", href: "/contact" },
      { num: "02", label: "Real-Time Transaction Fraud Scoring (<15ms)", href: "/contact" },
      { num: "03", label: "Synthetic Identity & Account Takeover Defense", href: "/contact" },
      { num: "04", label: "Monte Carlo Value-at-Risk (VaR) Simulators", href: "/contact" },
      { num: "05", label: "Credit Risk Scoring & Alternative Data Models", href: "/contact" },
      { num: "06", label: "Automated Suspicious Activity Report (SAR) Filing", href: "/contact" },
    ],
  },
  {
    id: "wealth-quant",
    title: "Wealth Tech & Quantitative Analytics",
    image: "/images/cards/grow.jpg",
    tagline: "Portfolio rebalancing algorithms, factor modeling, and robotic advisory systems",
    items: [
      { num: "01", label: "Automated Tax-Loss Harvesting & Rebalancing", href: "/contact" },
      { num: "02", label: "Multi-Asset Factor Risk & Attribution Engines", href: "/contact" },
      { num: "03", label: "Quantitative Backtesting & Strategy Execution", href: "/contact" },
      { num: "04", label: "High-Net-Worth Client Portal & Reporting", href: "/contact" },
      { num: "05", label: "Robo-Advisory Decision Loops & Risk Profiling", href: "/contact" },
      { num: "06", label: "ESG Screening & Regulatory Sustainability Feeds", href: "/contact" },
    ],
  },
  {
    id: "payments-clearing",
    title: "Payments & Global Clearing",
    image: "/images/cards/experience.jpg",
    tagline: "High-throughput tokenized payment rails and cross-border settlement",
    items: [
      { num: "01", label: "High-Throughput Card Authorization Switches", href: "/contact" },
      { num: "02", label: "FedNow / SEPA Instant Payment Rail Integration", href: "/contact" },
      { num: "03", label: "PCI-DSS Level 1 Tokenization & Vaulting", href: "/contact" },
      { num: "04", label: "Cross-Border Foreign Exchange (FX) Routing", href: "/contact" },
      { num: "05", label: "Dispute & Chargeback Automation Workflows", href: "/contact" },
      { num: "06", label: "Stablecoin & Digital Asset Settlement Gateways", href: "/contact" },
    ],
  },
  {
    id: "regtech-audit",
    title: "RegTech & Deterministic Audit",
    image: "/images/cards/learn.jpg",
    tagline: "Continuous compliance verification, immutable logging, and supervisory analytics",
    items: [
      { num: "01", label: "Automated Basel III/IV & Dodd-Frank Reporting", href: "/contact" },
      { num: "02", label: "Zero-Knowledge Cryptographic Audit Proofs", href: "/contact" },
      { num: "03", label: "Real-Time Communications & Trade Surveillance", href: "/contact" },
      { num: "04", label: "Automated Know-Your-Customer (KYC) Verification", href: "/contact" },
      { num: "05", label: "Immutable Append-Only Audit Trail Architecture", href: "/contact" },
      { num: "06", label: "Policy-as-Code for Capital Allocation Rules", href: "/contact" },
    ],
  },
];

export function FinancialSolutionsSection() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const prefersReducedMotion = useReducedMotion();
  const active = SOLUTIONS[activeIndex];
  const left = active.items.slice(0, 3);
  const right = active.items.slice(3, 6);

  return (
    <section
      id="industry-solutions"
      className="relative py-20 sm:py-28 bg-[#F6F7FA] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className="absolute top-10 right-10 w-[600px] h-[600px] bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_50px_0_rgba(16,185,129,0.06)] p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-start">

            {/* LEFT: Header + Tabs */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="mb-8">
                <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-emerald-600 uppercase mb-3 block">
                  03 / INDUSTRY SOLUTIONS
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 leading-tight">
                  Financial Capabilities Matrix
                </h2>
                <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed mt-3">
                  Purpose-built architectures for institutional capital markets, banking infrastructure, and fintech leaders.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                {SOLUTIONS.map((solution, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={solution.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "group relative flex items-center py-3.5 px-4 sm:px-5 rounded-xl text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
                        isActive
                          ? "bg-white shadow-xs font-semibold text-neutral-950"
                          : "hover:bg-white/60 text-neutral-600 hover:text-neutral-900 font-medium"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeFinancialSolutionBar"
                          className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-600 rounded-r-full"
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      <span className="text-base sm:text-lg tracking-tight">{solution.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Visual Banner + 2-Column Links */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-8"
                >
                  <div className="relative w-full aspect-[16/7] sm:aspect-[21/8] overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-200/80 shadow-xs">
                    <Image
                      src={active.image}
                      alt={active.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 900px"
                      className="object-cover object-center opacity-90 transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono text-xs font-semibold text-white uppercase tracking-widest">
                        <span className="text-emerald-400 font-bold">{active.title}</span>
                        <span>·</span>
                        <span className="text-neutral-300">Financial Systems</span>
                      </div>
                      <span className="text-xs text-neutral-300 hidden sm:inline font-normal">{active.tagline}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 pt-2">
                    <div className="flex flex-col gap-4">
                      {left.map((item) => (
                        <Link
                          key={item.num}
                          href={item.href ?? "/contact"}
                          className="group inline-flex items-baseline gap-2 text-sm sm:text-base font-normal text-neutral-800 hover:text-emerald-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded"
                        >
                          <span className="font-mono text-xs font-semibold text-emerald-600">{item.num}.</span>
                          <span className="underline underline-offset-4 decoration-neutral-300 group-hover:decoration-emerald-600 transition-colors font-medium">
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="flex flex-col gap-4">
                      {right.map((item) => (
                        <Link
                          key={item.num}
                          href={item.href ?? "/contact"}
                          className="group inline-flex items-baseline gap-2 text-sm sm:text-base font-normal text-neutral-800 hover:text-emerald-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded"
                        >
                          <span className="font-mono text-xs font-semibold text-emerald-600">{item.num}.</span>
                          <span className="underline underline-offset-4 decoration-neutral-300 group-hover:decoration-emerald-600 transition-colors font-medium">
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
