"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionStory {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  href: string;
  imageOnLeft: boolean;
}

const ACTION_STORIES: ActionStory[] = [
  {
    id: "intelligent-operations",
    category: "AUTONOMOUS SYSTEMS",
    title: "Intelligent Operations",
    subtitle: "AI systems that sense, reason and respond in real time.",
    description:
      "Modern enterprise operations demand speed beyond human triage. We engineer continuous telemetry pipelines coupled with autonomous agent evaluators that monitor anomalies, resolve operational incidents, and optimize mission-critical workflows with zero manual friction.",
    image: "/images/cards/ai.jpg",
    href: "/contact",
    imageOnLeft: true,
  },
  {
    id: "generative-knowledge",
    category: "ENTERPRISE SYNTHESIS",
    title: "Generative AI in Practice",
    subtitle: "Turning enterprise knowledge into useful AI-powered experiences.",
    description:
      "Enterprise data is often trapped across siloed repositories and legacy documentation. We deploy grounded generative reasoning layers that synthesize cross-system knowledge, accelerate engineering delivery, and empower teams with contextual insights instantly.",
    image: "/images/cards/gen_ai_research.jpg",
    href: "/contact",
    imageOnLeft: false,
  },
  {
    id: "data-intelligence",
    category: "DECISION ARCHITECTURES",
    title: "Data Intelligence",
    subtitle: "Transforming complex data into decisions people can act on.",
    description:
      "Raw telemetry is useless without actionable clarity. By combining streaming feature extraction, predictive analytics, and intuitive interfaces, we transform distributed data oceans into real-time decision intelligence that executives and engineers trust.",
    image: "/images/cards/software.jpg",
    href: "/contact",
    imageOnLeft: true,
  },
];

export function AiInActionSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="ai-in-action"
      className="relative py-24 sm:py-32 bg-[#060608] text-white border-t border-white/[0.08]"
    >
      <div className="relative mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* Section Header */}
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-24">
          <span className="text-[11px] font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
            04 / APPLICATIONS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white capitalize leading-tight">
            AI in action
          </h2>
          <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed mt-2">
            Real systems deployed across mission-critical enterprise environments.
          </p>
        </div>

        {/* 3 Horizontal Asymmetrical Stories */}
        <div className="flex flex-col gap-20 sm:gap-28 lg:gap-36">
          {ACTION_STORIES.map((story, index) => (
            <motion.div
              key={story.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-20 items-center"
            >
              {/* Visual Container */}
              <div
                className={cn(
                  "lg:col-span-6 w-full",
                  story.imageOnLeft ? "lg:order-1" : "lg:order-2"
                )}
              >
                <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl bg-neutral-900 border border-white/[0.08] group">
                  <Image
                    src={story.image}
                    alt={story.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 700px"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060608]/80 via-transparent to-transparent" />
                </div>
              </div>

              {/* Story Content */}
              <div
                className={cn(
                  "lg:col-span-6 flex flex-col gap-4 sm:gap-6",
                  story.imageOnLeft ? "lg:order-2" : "lg:order-1"
                )}
              >
                <span className="text-[11px] font-mono font-bold tracking-[0.26em] text-indigo-400 uppercase">
                  {story.category}
                </span>

                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                    {story.title}
                  </h3>
                  <p className="text-lg sm:text-xl font-medium text-neutral-300">
                    {story.subtitle}
                  </p>
                </div>

                <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed">
                  {story.description}
                </p>

                <div className="pt-2">
                  <Link
                    href={story.href}
                    className="group/link inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-white hover:text-indigo-300 transition-colors duration-200"
                  >
                    <span>Explore Application</span>
                    <ArrowRight className="h-4 w-4 text-indigo-400 group-hover/link:translate-x-1.5 transition-transform duration-200" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
