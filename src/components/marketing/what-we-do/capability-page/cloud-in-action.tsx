"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

const STORIES = [
  {
    id: "zero-downtime",
    tag: "CLOUD ENGINEERING · NOVA CASE",
    title: "Zero-downtime cloud at 100,000 req/sec",
    synopsis:
      "How we architected a multi-region Kubernetes deployment with automated failover, circuit-breaking service mesh, and blue-green delivery pipelines that eliminated downtime across a 40-node production cluster.",
    stat: "99.997% uptime · 8-region active-active",
    image: "/images/cards/software.jpg",
  },
  {
    id: "infrastructure-cost",
    tag: "COST ENGINEERING · NOVA CASE",
    title: "Reducing cloud spend by 42% without degrading performance",
    synopsis:
      "A rigorous cost-optimization engagement combining spot instance orchestration, intelligent autoscaling policies, resource right-sizing, and storage tiering that cut monthly cloud spend in half.",
    stat: "42% cost reduction · 0 SLA breaches",
    image: "/images/cards/grow.jpg",
  },
  {
    id: "migration",
    tag: "CLOUD MIGRATION · NOVA CASE",
    title: "Migrating 200 services to cloud-native without a rewrite",
    synopsis:
      "A strangler-fig migration strategy converting a 12-year-old monolith into 200 independently deployable microservices running on Kubernetes, with Terraform IaC and GitOps delivery from day one.",
    stat: "200 services · 6 months · 0 incidents",
    image: "/images/cards/build.jpg",
  },
];

export function CloudInActionSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="cloud-in-action"
      className="relative py-24 sm:py-32 bg-[#08080A] text-white border-b border-white/[0.08] overflow-hidden"
    >
      <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-sky-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[400px] bg-indigo-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-sky-400 uppercase">
            04 / CLOUD IN ACTION
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white capitalize leading-tight">
            Infrastructure that performs under pressure
          </h2>
          <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed mt-2">
            Real architectural work, real production systems, real results.
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
                    className="object-cover object-center opacity-80 transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
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
                  <span className="text-xs font-mono text-sky-400 tracking-widest uppercase">
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
