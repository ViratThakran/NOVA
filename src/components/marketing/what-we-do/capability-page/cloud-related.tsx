"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const RELATED = [
  { number: "01", title: "AI & Data", description: "Intelligence systems powered by clean, structured data.", href: "/what-we-do/ai-intelligence" },
  { number: "03", title: "Software & Technology", description: "Engineering reliable systems from architecture to deployment.", href: "/what-we-do/software-technology" },
  { number: "04", title: "Digital Products", description: "Products designed around real people and measurable outcomes.", href: "/what-we-do/digital-products" },
  { number: "06", title: "Automation", description: "Eliminating repetitive friction and accelerating operations.", href: "/what-we-do/automation" },
  { number: "07", title: "Talent Solutions", description: "Connecting organizations with proven engineering squads.", href: "/what-we-do/talent-solutions" },
];

export function CloudRelatedSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="cloud-related"
      className="relative py-24 sm:py-32 bg-[#F8F9FB] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-indigo-200/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-3 max-w-2xl mb-14 sm:mb-18">
          <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-sky-600 uppercase">
            07 / DIRECTORY
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 capitalize leading-tight">
            Explore more of NOVA
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed mt-2">
            Discover our interconnected capabilities across AI, software, digital products, and talent.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {RELATED.map((cap, index) => (
            <motion.div
              key={cap.title}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                href={cap.href}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-7 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_6px_24px_0_rgba(0,0,0,0.03)] hover:bg-white/90 hover:shadow-[0_12px_36px_0_rgba(14,165,233,0.08)] hover:border-sky-400/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                <div className="flex items-start sm:items-center gap-4 sm:gap-8">
                  <span className="text-xs font-mono font-bold text-neutral-400 group-hover:text-sky-600 transition-colors duration-200 pt-1 sm:pt-0">{cap.number}</span>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                    <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 group-hover:text-sky-600 transition-colors duration-200">{cap.title}</span>
                    <span className="text-sm text-neutral-500 group-hover:text-neutral-700 transition-colors duration-200">{cap.description}</span>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 flex items-center gap-2 self-end sm:self-auto text-sky-600 font-medium text-sm">
                  <span className="hidden sm:inline opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200">Explore</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
