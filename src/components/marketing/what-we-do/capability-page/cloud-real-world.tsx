"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const PROJECTS = [
  {
    id: "global-platform",
    tag: "NOVA SOLUTION ARCHITECTURE · 01",
    title: "Building a zero-downtime global delivery platform",
    synopsis:
      "A reference architecture combining active-active multi-region Kubernetes clusters, Cloudflare edge routing, and automated canary deployments that sustains 99.997% uptime across 8 AWS regions.",
    architecture: "EKS · Cloudflare · ArgoCD · Karpenter",
    image: "/images/cards/software.jpg",
    href: "/contact",
  },
  {
    id: "infrastructure-automation",
    tag: "NOVA SOLUTION ARCHITECTURE · 02",
    title: "Fully automated infrastructure provisioning in 12 minutes",
    synopsis:
      "A Terraform + GitOps pipeline that provisions a full production VPC, RDS cluster, EKS node group, observability stack, and security baseline in under 12 minutes from a single git push.",
    architecture: "Terraform · ArgoCD · GitHub Actions · Vault",
    image: "/images/cards/build.jpg",
    href: "/contact",
  },
  {
    id: "observability-platform",
    tag: "NOVA SOLUTION ARCHITECTURE · 03",
    title: "Unified observability across 200 microservices",
    synopsis:
      "An OpenTelemetry-native observability platform correlating distributed traces, logs, and custom metrics across a 200-service mesh with automated SLO alerting and AI-assisted root cause analysis.",
    architecture: "OpenTelemetry · Grafana · Loki · SLO Automation",
    image: "/images/cards/grow.jpg",
    href: "/contact",
  },
];

export function CloudRealWorldSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="cloud-real-world"
      className="relative py-24 sm:py-32 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className="absolute top-1/3 -right-20 w-[550px] h-[550px] bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-sky-600 uppercase">
            05 / REAL-WORLD PROOF
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 capitalize leading-tight">
            Cloud &amp; infrastructure in the real world
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed mt-2">
            Selected solution architectures and engineering demonstrations built by NOVA.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {PROJECTS.map((project, index) => (
            <motion.div
              key={project.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group relative p-8 sm:p-10 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/90 shadow-[0_10px_35px_0_rgba(0,0,0,0.03)] hover:bg-white/85 hover:shadow-[0_16px_48px_0_rgba(14,165,233,0.07)] transition-all duration-300"
            >
              <Link
                href={project.href}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-2xl"
              >
                <div className="lg:col-span-4">
                  <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-200/80 shadow-inner">
                    <Image src={project.image} alt={project.title} fill sizes="(max-width: 1024px) 100vw, 450px" className="object-cover object-center transition-transform duration-700 group-hover:scale-105 opacity-90" />
                  </div>
                </div>
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <span className="text-[11px] font-mono font-semibold tracking-widest text-neutral-500 uppercase">{project.tag}</span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-950 group-hover:text-sky-600 transition-colors duration-200">{project.title}</h3>
                  <p className="text-base sm:text-lg text-neutral-700 leading-relaxed">{project.synopsis}</p>
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-neutral-200/60">
                    <span className="text-xs font-mono text-neutral-500">Architecture: <span className="text-neutral-900 font-medium">{project.architecture}</span></span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 group-hover:translate-x-1.5 transition-transform duration-200">
                      <span>View Solution</span><ArrowRight className="h-4 w-4" />
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
