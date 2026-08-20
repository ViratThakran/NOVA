"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CloudOffering {
  id: string;
  title: string;
  image: string;
  items: { num: string; label: string; href: string }[];
}

const OFFERINGS: CloudOffering[] = [
  {
    id: "cloud-architecture",
    title: "Cloud Architecture",
    image: "/images/cards/software.jpg",
    items: [
      { num: "01", label: "Multi-Cloud Strategy & Design", href: "/contact" },
      { num: "02", label: "Zero-Downtime Migration Blueprints", href: "/contact" },
      { num: "03", label: "Serverless & Event-Driven Architecture", href: "/contact" },
      { num: "04", label: "High-Availability Failover Systems", href: "/contact" },
      { num: "05", label: "Edge Node Distribution & CDN Strategy", href: "/contact" },
      { num: "06", label: "Cost-Optimized Cloud Cost Modelling", href: "/contact" },
    ],
  },
  {
    id: "kubernetes-containers",
    title: "Kubernetes & Containers",
    image: "/images/cards/build.jpg",
    items: [
      { num: "01", label: "Production Kubernetes Cluster Design", href: "/contact" },
      { num: "02", label: "Helm Chart Authoring & Release Management", href: "/contact" },
      { num: "03", label: "Service Mesh Implementation (Istio/Linkerd)", href: "/contact" },
      { num: "04", label: "Container Security & Image Hardening", href: "/contact" },
      { num: "05", label: "Multi-Cluster Federation & Governance", href: "/contact" },
      { num: "06", label: "Autoscaling & Resource Optimization", href: "/contact" },
    ],
  },
  {
    id: "infrastructure-as-code",
    title: "Infrastructure as Code",
    image: "/images/cards/grow.jpg",
    items: [
      { num: "01", label: "Terraform Module Libraries & State Mgmt", href: "/contact" },
      { num: "02", label: "GitOps Workflows with ArgoCD/Flux", href: "/contact" },
      { num: "03", label: "Pulumi & CDK Infrastructure Engineering", href: "/contact" },
      { num: "04", label: "Policy-as-Code with Open Policy Agent", href: "/contact" },
      { num: "05", label: "Drift Detection & Compliance Automation", href: "/contact" },
      { num: "06", label: "Environment Parity & Configuration Mgmt", href: "/contact" },
    ],
  },
  {
    id: "networking-security",
    title: "Networking & Security",
    image: "/images/cards/experience.jpg",
    items: [
      { num: "01", label: "Zero-Trust Network Architecture", href: "/contact" },
      { num: "02", label: "Private VPC & VPN Gateway Design", href: "/contact" },
      { num: "03", label: "WAF, DDoS Protection & Rate Limiting", href: "/contact" },
      { num: "04", label: "Secret Rotation & Vault Management", href: "/contact" },
      { num: "05", label: "Cloud IAM & RBAC Governance", href: "/contact" },
      { num: "06", label: "Security Posture Auditing & Compliance", href: "/contact" },
    ],
  },
  {
    id: "observability",
    title: "Observability & SRE",
    image: "/images/cards/learn.jpg",
    items: [
      { num: "01", label: "Distributed Tracing (OpenTelemetry)", href: "/contact" },
      { num: "02", label: "Metrics, Logs & Alerting Pipelines", href: "/contact" },
      { num: "03", label: "SLO/SLA Definitions & Error Budgets", href: "/contact" },
      { num: "04", label: "Self-Healing Runbook Automation", href: "/contact" },
      { num: "05", label: "Chaos Engineering & Resilience Testing", href: "/contact" },
      { num: "06", label: "Incident Response & Post-Mortem Workflows", href: "/contact" },
    ],
  },
  {
    id: "data-storage",
    title: "Data & Storage Infrastructure",
    image: "/images/cards/gen_ai_research.jpg",
    items: [
      { num: "01", label: "Distributed Object Storage Architecture", href: "/contact" },
      { num: "02", label: "Database Sharding & Read Replica Design", href: "/contact" },
      { num: "03", label: "Managed Database Fleet Operations", href: "/contact" },
      { num: "04", label: "Backup, Restore & Disaster Recovery", href: "/contact" },
      { num: "05", label: "Data Encryption at Rest & In Transit", href: "/contact" },
      { num: "06", label: "Cold, Warm & Hot Storage Tiering", href: "/contact" },
    ],
  },
];

export function CloudWhatWeDoSection() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const prefersReducedMotion = useReducedMotion();
  const active = OFFERINGS[activeIndex];
  const left = active.items.slice(0, 3);
  const right = active.items.slice(3, 6);

  return (
    <section
      id="cloud-what-we-do"
      className="relative py-20 sm:py-28 bg-[#F6F7FA] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className="absolute top-10 right-10 w-[600px] h-[600px] bg-sky-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_50px_0_rgba(31,38,135,0.06)] p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-start">

            {/* LEFT: Header + Tabs */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="mb-8">
                <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-sky-600 uppercase mb-3 block">
                  03 / CAPABILITY CATALOGUE
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 leading-tight">
                  Our Offerings
                </h2>
                <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed mt-3">
                  End-to-end cloud engineering, infrastructure automation, and resilient architecture for mission-critical systems.
                </p>
              </div>

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
                        "group relative flex items-center py-3.5 px-4 sm:px-5 rounded-xl text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600",
                        isActive
                          ? "bg-white shadow-xs font-semibold text-neutral-950"
                          : "hover:bg-white/60 text-neutral-600 hover:text-neutral-900 font-medium"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeCloudOfferingBar"
                          className="absolute left-0 top-2 bottom-2 w-1 bg-sky-600 rounded-r-full"
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      <span className="text-base sm:text-lg tracking-tight">{offering.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Image + Links */}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-6 flex items-center gap-2 font-mono text-xs font-semibold text-white uppercase tracking-widest">
                      <span className="text-sky-400 font-bold">{active.title}</span>
                      <span>·</span>
                      <span className="text-neutral-300">NOVA Capability</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 pt-2">
                    <div className="flex flex-col gap-4">
                      {left.map((item) => (
                        <Link
                          key={item.num}
                          href={item.href}
                          className="group inline-flex items-baseline gap-2 text-sm sm:text-base font-normal text-neutral-800 hover:text-sky-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded"
                        >
                          <span className="font-mono text-xs font-semibold text-sky-600">{item.num}.</span>
                          <span className="underline underline-offset-4 decoration-neutral-300 group-hover:decoration-sky-600 transition-colors font-medium">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="flex flex-col gap-4">
                      {right.map((item) => (
                        <Link
                          key={item.num}
                          href={item.href}
                          className="group inline-flex items-baseline gap-2 text-sm sm:text-base font-normal text-neutral-800 hover:text-sky-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded"
                        >
                          <span className="font-mono text-xs font-semibold text-sky-600">{item.num}.</span>
                          <span className="underline underline-offset-4 decoration-neutral-300 group-hover:decoration-sky-600 transition-colors font-medium">{item.label}</span>
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
