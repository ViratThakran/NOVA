"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShowcaseCard {
  id: string;
  category: string;
  readTime: string;
  title: string;
  description: string;
  image: string;
  linkText: string;
  href: string;
}

const SHOWCASE_CARDS: ShowcaseCard[] = [
  {
    id: "ai",
    category: "AI & TECHNOLOGY",
    readTime: "5 min read • Systems Brief",
    title: "How AI is changing the way we build.",
    description:
      "From passive copilots to autonomous engineering workflows: the architectural shift from writing syntax to designing constraints and verification loops.",
    image: "/images/cards/ai.jpg",
    linkText: "Read Perspective",
    href: "/about",
  },
  {
    id: "work",
    category: "FUTURE OF WORK",
    readTime: "4 min read • Industry Perspective",
    title: "Agentic commerce: How to build agent-aware digital ecosystems.",
    description:
      "As software agents interact directly with services, modern architectures must support autonomous negotiation, verification, and zero-trust orchestration.",
    image: "/images/cards/grow.jpg",
    linkText: "Learn More",
    href: "/about",
  },
  {
    id: "learning",
    category: "LEARNING & SYSTEMS",
    readTime: "6 min read • Pedagogy & Execution",
    title: "Learning is changing: Why sandbox tutorials fail and real execution succeeds.",
    description:
      "Passive video courses teach syntax, not resilience. Challenge-driven labs, collaborative squads, and live deployments cultivate genuine engineering instinct.",
    image: "/images/cards/learn.jpg",
    linkText: "Read Article",
    href: "/about",
  },
];

export function WhatWeThinkSection() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const [activeIdx, setActiveIdx] = React.useState<number>(1);
  const prefersReducedMotion = useReducedMotion();

  // Unified natural page scroll animation
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const scrollScale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.96, 1.02, 1.02, 0.96]);
  const premiumEase = [0.22, 1, 0.36, 1] as const;

  return (
    <section
      id="what-we-think"
      ref={sectionRef}
      className="scroll-mt-16 bg-white py-24 sm:py-32 text-neutral-950"
    >
      <div className="mx-auto flex w-full max-w-[1560px] flex-col items-center gap-12 sm:gap-16 px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* Centered Editorial Header with NOVA Copy */}
        <div className="flex flex-col items-center text-center max-w-3xl gap-3 sm:gap-4">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-neutral-500">
            05 / PERSPECTIVES & RESEARCH
          </span>

          <motion.h2
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: premiumEase }}
            className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-950"
          >
            We Think About{" "}
            <span className="text-[#6D54D4]">
              What&apos;s Next
            </span>
          </motion.h2>

          <motion.p
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: premiumEase }}
            className="text-xs sm:text-sm text-neutral-600 font-normal leading-relaxed max-w-2xl px-4"
          >
            Ideas, research and perspectives on technology, people, learning and the future we&apos;re building.
          </motion.p>

          {/* Centered Dark Button ("Explore Research ↗") */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: premiumEase }}
            className="pt-2"
          >
            <Link
              href="/about"
              className="group inline-flex items-center gap-1.5 rounded-lg bg-[#18181B] hover:bg-black text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-md transition-all duration-200 active:scale-[0.98]"
            >
              <span>Explore Research</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* 3-Card Bento Grid with Dominant Image + Overlapping Floating White Text Card */}
        <motion.div
          style={{ scale: prefersReducedMotion ? 1 : scrollScale }}
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start pt-4"
        >
          {SHOWCASE_CARDS.map((card, idx) => {
            const isActive = activeIdx === idx;
            return (
              <motion.div
                key={card.id}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => setActiveIdx(idx)}
                data-cursor-text="EXPLORE"
                animate={
                  prefersReducedMotion
                    ? {}
                    : {
                        y: isActive ? -18 : 8,
                        scale: isActive ? 1.03 : 0.97,
                      }
                }
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 26,
                  mass: 0.8,
                }}
                className={cn(
                  "group relative flex flex-col rounded-[28px] overflow-visible cursor-pointer transition-all duration-300",
                  isActive
                    ? "z-10"
                    : "opacity-90 hover:opacity-100 z-0"
                )}
              >
                {/* 1. Tall Dominant Visual Container (Top 75% of card) */}
                <div
                  className={cn(
                    "relative w-full rounded-[28px] overflow-hidden bg-neutral-900 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.12)] transition-all duration-500",
                    isActive ? "h-[300px] sm:h-[360px] lg:h-[400px]" : "h-[270px] sm:h-[320px] lg:h-[350px]"
                  )}
                >
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    priority
                    className={cn(
                      "object-cover object-center transition-transform duration-700 ease-out",
                      isActive ? "scale-[1.04]" : "scale-100"
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                  {/* Overlaid Category Pill */}
                  <div className="absolute top-5 left-5 z-10">
                    <span className="rounded-lg bg-neutral-950/80 text-white px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">
                      {card.category}
                    </span>
                  </div>
                </div>

                {/* 2. Floating Overlapping White Card (Positioned near bottom, overlapping the image) */}
                <div
                  className={cn(
                    "relative -mt-16 sm:-mt-20 mx-3 sm:mx-4 flex flex-col justify-between p-6 sm:p-7 bg-white rounded-[22px] border border-neutral-100/90 transition-all duration-300 gap-3 min-h-[170px] sm:min-h-[190px]",
                    isActive
                      ? "shadow-[0_25px_60px_-15px_rgba(109,84,212,0.22)] border-neutral-200"
                      : "shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)]"
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-mono text-neutral-400 font-medium">
                      {card.readTime}
                    </span>

                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#0F172A] leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#475569] leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-1">
                    <Link
                      href={card.href}
                      className="group/link inline-flex items-center gap-1 text-xs font-semibold text-[#0F172A] hover:text-[#6D54D4] underline underline-offset-4 decoration-neutral-300 hover:decoration-[#6D54D4] transition-colors"
                    >
                      <span>{card.linkText}</span>
                      <ArrowUpRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
