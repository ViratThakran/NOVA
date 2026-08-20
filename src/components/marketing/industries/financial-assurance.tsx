"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, Lock, FileCheck2, Cpu, RefreshCw, KeyRound } from "lucide-react";

const ASSURANCE_PILLARS = [
  {
    icon: ShieldCheck,
    title: "SOC 2 Type II & ISO 27001",
    badge: "COMPLIANCE CERTIFIED",
    description:
      "Continuous control validation and automated compliance telemetry ensuring audited bank-grade data security across compute and storage.",
  },
  {
    icon: Lock,
    title: "PCI-DSS Level 1 & Tokenization",
    badge: "PAYMENT SECURITY",
    description:
      "Zero-exposure cardholder data environments with hardware-backed encryption keys, tokenization vaults, and automated rotation.",
  },
  {
    icon: KeyRound,
    title: "Multi-Party Computation & HSM",
    badge: "CRYPTOGRAPHIC VAULTING",
    description:
      "Threshold signature schemes and Dedicated Cloud HSM key management that eliminate single points of compromise for digital assets and transaction signing.",
  },
  {
    icon: RefreshCw,
    title: "RPO = 0 & RTO < 60s Disaster Recovery",
    badge: "RESILIENCE SLA",
    description:
      "Synchronous cross-region database replication and automated circuit-breaking DNS failover guaranteeing zero data loss during cloud infrastructure outages.",
  },
  {
    icon: FileCheck2,
    title: "Immutable Append-Only Audit",
    badge: "REGULATORY PROVENANCE",
    description:
      "Cryptographically verified transaction logs and tamper-evident event streaming ensuring full auditability for SEC, FINRA, and FCA regulatory reporting.",
  },
  {
    icon: Cpu,
    title: "Deterministic Engine Validation",
    badge: "ALGORITHMIC ASSURANCE",
    description:
      "High-throughput fuzz testing, formal verification harnesses, and historical market re-simulation testing preventing order mismatch anomalies.",
  },
];

export function FinancialAssuranceSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="industry-assurance"
      className="relative py-24 sm:py-32 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className="absolute top-1/3 -right-20 w-[550px] h-[550px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-[500px] h-[500px] bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-emerald-600 uppercase">
            05 / INSTITUTIONAL ASSURANCE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 capitalize leading-tight">
            Bank-grade security &amp; regulatory governance
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed mt-2">
            Engineered from the ground up for strict global regulatory compliance, deterministic uptime, and zero-compromise security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {ASSURANCE_PILLARS.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="group relative p-8 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 shadow-[0_10px_35px_0_rgba(0,0,0,0.03)] hover:shadow-[0_16px_48px_0_rgba(16,185,129,0.08)] hover:bg-white/90 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-neutral-950 mb-3 group-hover:text-emerald-700 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
                <div className="h-0.5 w-8 bg-emerald-600/30 mt-8 group-hover:w-16 group-hover:bg-emerald-600 transition-all duration-300" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
