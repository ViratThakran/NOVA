"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const STACK_LAYERS = [
  { layer: "COMPUTE", detail: "Kubernetes, ECS, Lambda, GPU Nodes, Spot Fleets" },
  { layer: "NETWORKING", detail: "VPC, CDN, Load Balancers, Service Mesh, DNS" },
  { layer: "STORAGE", detail: "Object Storage, Block Volumes, Managed Databases" },
  { layer: "SECURITY", detail: "IAM, Secrets, WAF, Zero-Trust, Compliance Policies" },
  { layer: "OBSERVABILITY", detail: "Metrics, Tracing, Logs, SLOs, Alerting & AIOps" },
];

const TECHS = [
  { name: "AWS / GCP / Azure", category: "Cloud Providers" },
  { name: "Kubernetes & EKS", category: "Container Orchestration" },
  { name: "Terraform & Pulumi", category: "Infrastructure as Code" },
  { name: "ArgoCD & Flux", category: "GitOps Delivery" },
  { name: "Istio & Linkerd", category: "Service Mesh" },
  { name: "Prometheus & Grafana", category: "Metrics & Alerting" },
  { name: "OpenTelemetry", category: "Distributed Tracing" },
  { name: "HashiCorp Vault", category: "Secret Management" },
  { name: "Cloudflare", category: "Edge & CDN" },
  { name: "GitHub Actions", category: "CI/CD Automation" },
];

export function CloudTechnologySection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="cloud-technology"
      className="relative py-24 sm:py-32 bg-[#F5F7FA] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-indigo-200/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-sky-600 uppercase">
            06 / TECHNOLOGY ECOSYSTEM
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 capitalize leading-tight">
            Built across the cloud stack
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed mt-2">
            From compute provisioning to edge delivery — engineered across every layer of the modern cloud.
          </p>
        </div>

        <div className="mb-20">
          <span className="block text-[11px] font-mono font-semibold tracking-widest text-neutral-500 uppercase mb-6">
            Infrastructure Architecture Flow
          </span>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STACK_LAYERS.map((item, index) => (
              <motion.div
                key={item.layer}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="relative flex flex-col justify-between p-6 rounded-2xl bg-white/75 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_0_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_0_rgba(14,165,233,0.08)] hover:border-sky-400/60 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-sky-600">0{index + 1}</span>
                    {index < STACK_LAYERS.length - 1 && (
                      <ArrowRight className="hidden md:block h-3.5 w-3.5 text-neutral-400" />
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight text-neutral-950 mb-2">{item.layer}</h3>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-[11px] font-mono font-semibold tracking-widest text-neutral-500 uppercase mb-6">
            Core Production Technologies
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {TECHS.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
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
