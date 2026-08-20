"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, Compass, Sparkles, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface JourneyCardData {
  id: string;
  number: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  linkText: string;
  href: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  align: "left" | "right" | "center-left" | "center-right";
}

const JOURNEY_CARDS: JourneyCardData[] = [
  {
    id: "learn",
    number: "01",
    tag: "LEARN",
    title: "A Foundation for Reinvention",
    subtitle: "Challenge-driven engineering labs & systems intuition",
    description:
      "Move beyond passive tutorials. NOVA learning focuses on challenge-driven engineering labs, systems modeling, AI fundamentals, and technical intuition designed to build genuine capability.",
    linkText: "Explore Learning",
    href: "/internship-programs",
    bgColor: "bg-[#0052FF]", // Vibrant Electric Blue matching Screenshot 1
    textColor: "text-white",
    accentColor: "border-white/30",
    align: "left",
  },
  {
    id: "build",
    number: "02",
    tag: "BUILD",
    title: "Turn Knowledge Into Real Systems",
    subtitle: "Production web applications, cloud nodes & AI agents",
    description:
      "Collaborate on production web applications, autonomous agents, and automated cloud systems. You ship software engineered for real-world reliability and scale.",
    linkText: "Explore Build",
    href: "#what-we-do",
    bgColor: "bg-[#E60028]", // Vibrant Crimson Red matching Screenshot 2 & 4
    textColor: "text-white",
    accentColor: "border-white/30",
    align: "right",
  },
  {
    id: "experience",
    number: "03",
    tag: "EXPERIENCE",
    title: "Collaborate in Builder Squads",
    subtitle: "Human collaboration, peer reviews & live deployments",
    description:
      "Work on real problems with real teams. Turn your code and system builds into a concrete track record with verified commits and production reviews.",
    linkText: "Explore Experience",
    href: "#careers",
    bgColor: "bg-[#5B068A]", // Deep Royal Violet matching Screenshot 4 & 5
    textColor: "text-white",
    accentColor: "border-white/30",
    align: "center-left",
  },
  {
    id: "grow",
    number: "04",
    tag: "GROW",
    title: "Direct Industry Pathways",
    subtitle: "Partner technology labs, paid residencies & careers",
    description:
      "The NOVA ecosystem connects proven builders directly with partner engineering organizations, paid internships, and high-growth opportunities worldwide.",
    linkText: "Explore Growth Pathways",
    href: "#careers",
    bgColor: "bg-[#0D9488]", // Vibrant Emerald / Teal for Growth
    textColor: "text-white",
    accentColor: "border-white/30",
    align: "center-right",
  },
];

export function WhatIsNovaSection() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Scroll progress through the extended 4-card pinned track
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Card 1 (01 / LEARN: Blue - Left)
  const card1Y = useTransform(scrollYProgress, [0.03, 0.25, 0.52], ["120%", "30%", "-140%"]);
  const card1Scale = useTransform(scrollYProgress, [0.03, 0.2, 0.38, 0.52], [0.92, 1.04, 1.0, 0.92]);
  const card1Opacity = useTransform(scrollYProgress, [0.02, 0.08, 0.42, 0.52], [0, 1, 1, 0]);

  // Card 2 (02 / BUILD: Red - Right)
  const card2Y = useTransform(scrollYProgress, [0.18, 0.42, 0.68], ["120%", "20%", "-140%"]);
  const card2Scale = useTransform(scrollYProgress, [0.18, 0.35, 0.55, 0.68], [0.92, 1.04, 1.0, 0.92]);
  const card2Opacity = useTransform(scrollYProgress, [0.15, 0.22, 0.58, 0.68], [0, 1, 1, 0]);

  // Card 3 (03 / EXPERIENCE: Purple - Center-Left)
  const card3Y = useTransform(scrollYProgress, [0.38, 0.62, 0.86], ["120%", "28%", "-140%"]);
  const card3Scale = useTransform(scrollYProgress, [0.38, 0.52, 0.72, 0.86], [0.92, 1.04, 1.0, 0.92]);
  const card3Opacity = useTransform(scrollYProgress, [0.35, 0.42, 0.76, 0.86], [0, 1, 1, 0]);

  // Card 4 (04 / GROW: Teal - Center-Right)
  const card4Y = useTransform(scrollYProgress, [0.58, 0.82, 1.0], ["120%", "22%", "-120%"]);
  const card4Scale = useTransform(scrollYProgress, [0.58, 0.75, 0.9, 1.0], [0.92, 1.05, 1.0, 0.95]);
  const card4Opacity = useTransform(scrollYProgress, [0.55, 0.62, 0.95, 1.0], [0, 1, 1, 0.8]);

  return (
    <section
      id="platform"
      ref={containerRef}
      className="relative w-full bg-black text-white"
    >
      {/* ============================================================ */}
      {/* DESKTOP PINNED STACKING SCROLL SECTION (4-Card Sequence) */}
      {/* ============================================================ */}
      <div className="hidden lg:block h-[420vh] relative">
        {/* Sticky Pinned Viewport Container */}
        <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden">
          {/* Stationary Pinned Title in Center */}
          <div className="absolute z-0 flex flex-col items-center text-center px-8 max-w-5xl pointer-events-none select-none">
            <span className="text-xs sm:text-sm font-mono font-bold tracking-[0.3em] text-neutral-500 uppercase mb-4">
              02 / THE CONTINUOUS JOURNEY
            </span>

            <h2 className="text-6xl sm:text-7xl xl:text-8xl font-extrabold tracking-tight text-white leading-[0.98] uppercase drop-shadow-2xl">
              ONE PLATFORM.
              <br />
              <span className="text-neutral-400">MANY POSSIBILITIES.</span>
            </h2>

            <p className="mt-6 text-lg sm:text-xl text-neutral-400 font-normal leading-relaxed max-w-2xl">
              A unified pathway connecting technical learning, product building, verified experience, and career opportunity.
            </p>
          </div>

          {/* ======================================================== */}
          {/* 4 STACKING & SCALING CARDS (01 LEARN, 02 BUILD, 03 EXPERIENCE, 04 GROW) */}
          {/* ======================================================== */}
          <div className="absolute inset-0 z-10 pointer-events-none w-full h-full max-w-[1560px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-20">
            {/* Card 1: 01 / LEARN (Electric Blue - Left) */}
            <motion.div
              style={{
                y: prefersReducedMotion ? "30%" : card1Y,
                scale: prefersReducedMotion ? 1 : card1Scale,
                opacity: prefersReducedMotion ? 1 : card1Opacity,
              }}
              className="absolute left-10 xl:left-20 top-0 w-[420px] xl:w-[460px] pointer-events-auto"
            >
              <div className="group relative rounded-3xl overflow-hidden bg-[#0052FF] text-white p-8 xl:p-10 shadow-[0_30px_70px_rgba(0,82,255,0.35)] border border-white/20 -rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="absolute inset-0 pointer-events-none opacity-25">
                  <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                    <circle cx="150" cy="180" r="100" stroke="white" strokeWidth="1.5" />
                    <circle cx="150" cy="180" r="50" stroke="white" strokeWidth="1.5" />
                    <path d="M0 100 Q 200 150, 400 100" stroke="white" strokeWidth="1.5" />
                    <path d="M50 0 Q 150 250, 350 400" stroke="white" strokeWidth="1.5" />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-between min-h-[360px] xl:min-h-[400px]">
                  <div className="flex items-center justify-between border-b border-white/20 pb-4">
                    <span className="text-xs font-mono font-bold tracking-widest text-white/80 uppercase">
                      01 / LEARN
                    </span>
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>

                  <div className="flex flex-col gap-3 my-auto pt-4">
                    <h3 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-snug">
                      A Foundation for Reinvention
                    </h3>
                    <p className="text-sm xl:text-base text-white/90 font-normal leading-relaxed">
                      Move beyond passive tutorials. Challenge-driven labs, systems modeling, and AI fundamentals designed to build genuine capability.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                    <Link
                      href="/internship-programs"
                      className="group/link inline-flex items-center gap-2 text-sm font-bold text-white hover:text-white/80 underline underline-offset-4 decoration-white/40 hover:decoration-white transition-all"
                    >
                      <span>Explore Learning</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: 02 / BUILD (Crimson Red - Right) */}
            <motion.div
              style={{
                y: prefersReducedMotion ? "20%" : card2Y,
                scale: prefersReducedMotion ? 1 : card2Scale,
                opacity: prefersReducedMotion ? 1 : card2Opacity,
              }}
              className="absolute right-10 xl:right-20 top-0 w-[420px] xl:w-[460px] pointer-events-auto"
            >
              <div className="group relative rounded-3xl overflow-hidden bg-[#E60028] text-white p-8 xl:p-10 shadow-[0_30px_70px_rgba(230,0,40,0.35)] border border-white/20 rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="absolute inset-0 pointer-events-none opacity-25">
                  <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                    <path
                      d="M50 200 C 100 100, 300 100, 350 200 C 400 300, 200 380, 50 200 Z"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <path d="M0 150 L 400 150" stroke="white" strokeWidth="1.5" />
                    <path d="M250 0 L 250 400" stroke="white" strokeWidth="1.5" />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-between min-h-[360px] xl:min-h-[400px]">
                  <div className="flex items-center justify-between border-b border-white/20 pb-4">
                    <span className="text-xs font-mono font-bold tracking-widest text-white/80 uppercase">
                      02 / BUILD
                    </span>
                    <Compass className="h-4 w-4 text-white" />
                  </div>

                  <div className="flex flex-col gap-3 my-auto pt-4">
                    <h3 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-snug">
                      Turn Knowledge Into Real Systems
                    </h3>
                    <p className="text-sm xl:text-base text-white/90 font-normal leading-relaxed">
                      Collaborate on production web applications, autonomous agents, and automated cloud systems engineered for real-world scale.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                    <Link
                      href="#what-we-do"
                      className="group/link inline-flex items-center gap-2 text-sm font-bold text-white hover:text-white/80 underline underline-offset-4 decoration-white/40 hover:decoration-white transition-all"
                    >
                      <span>Explore Build</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 3: 03 / EXPERIENCE (Deep Royal Violet - Center-Left) */}
            <motion.div
              style={{
                y: prefersReducedMotion ? "28%" : card3Y,
                scale: prefersReducedMotion ? 1 : card3Scale,
                opacity: prefersReducedMotion ? 1 : card3Opacity,
              }}
              className="absolute left-1/4 -translate-x-12 top-0 w-[420px] xl:w-[460px] pointer-events-auto"
            >
              <div className="group relative rounded-3xl overflow-hidden bg-[#5B068A] text-white p-8 xl:p-10 shadow-[0_30px_70px_rgba(91,6,138,0.45)] border border-white/20 -rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="absolute inset-0 pointer-events-none opacity-25">
                  <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                    <circle cx="200" cy="200" r="180" stroke="white" strokeWidth="1.5" />
                    <circle cx="200" cy="200" r="120" stroke="white" strokeWidth="1.5" />
                    <circle cx="200" cy="200" r="60" stroke="white" strokeWidth="1.5" />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-between min-h-[360px] xl:min-h-[400px]">
                  <div className="flex items-center justify-between border-b border-white/20 pb-4">
                    <span className="text-xs font-mono font-bold tracking-widest text-white/80 uppercase">
                      03 / EXPERIENCE
                    </span>
                    <Users className="h-4 w-4 text-white" />
                  </div>

                  <div className="flex flex-col gap-3 my-auto pt-4">
                    <h3 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-snug">
                      Collaborate in Builder Squads
                    </h3>
                    <p className="text-sm xl:text-base text-white/90 font-normal leading-relaxed">
                      Work on real problems with real teams. Turn your code into a concrete track record of verified commits, peer reviews, and live deployments.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                    <Link
                      href="#careers"
                      className="group/link inline-flex items-center gap-2 text-sm font-bold text-white hover:text-white/80 underline underline-offset-4 decoration-white/40 hover:decoration-white transition-all"
                    >
                      <span>Explore Experience</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 4: 04 / GROW (Vibrant Teal / Emerald - Center-Right) */}
            <motion.div
              style={{
                y: prefersReducedMotion ? "22%" : card4Y,
                scale: prefersReducedMotion ? 1 : card4Scale,
                opacity: prefersReducedMotion ? 1 : card4Opacity,
              }}
              className="absolute right-1/4 translate-x-12 top-0 w-[420px] xl:w-[460px] pointer-events-auto"
            >
              <div className="group relative rounded-3xl overflow-hidden bg-[#0D9488] text-white p-8 xl:p-10 shadow-[0_30px_70px_rgba(13,148,136,0.45)] border border-white/20 rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="absolute inset-0 pointer-events-none opacity-25">
                  <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                    <path d="M0 400 L 400 0" stroke="white" strokeWidth="1.5" />
                    <path d="M100 400 L 400 100" stroke="white" strokeWidth="1.5" />
                    <circle cx="300" cy="100" r="70" stroke="white" strokeWidth="1.5" />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-between min-h-[360px] xl:min-h-[400px]">
                  <div className="flex items-center justify-between border-b border-white/20 pb-4">
                    <span className="text-xs font-mono font-bold tracking-widest text-white/80 uppercase">
                      04 / GROW
                    </span>
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>

                  <div className="flex flex-col gap-3 my-auto pt-4">
                    <h3 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-snug">
                      Direct Industry Pathways
                    </h3>
                    <p className="text-sm xl:text-base text-white/90 font-normal leading-relaxed">
                      Connect proven capability directly with partner engineering organizations, paid internships, and high-growth opportunities worldwide.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                    <Link
                      href="#careers"
                      className="group/link inline-flex items-center gap-2 text-sm font-bold text-white hover:text-white/80 underline underline-offset-4 decoration-white/40 hover:decoration-white transition-all"
                    >
                      <span>Explore Growth Pathways</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MOBILE STACKED VIEW (Clean 4-Card Vertical Stack) */}
      {/* ============================================================ */}
      <div className="lg:hidden py-20 px-6 sm:px-10 flex flex-col gap-10">
        <div className="flex flex-col text-left gap-3">
          <span className="text-xs font-mono font-bold tracking-[0.25em] text-neutral-500 uppercase">
            02 / THE CONTINUOUS JOURNEY
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase leading-tight">
            ONE PLATFORM.
            <br />
            <span className="text-neutral-400">MANY POSSIBILITIES.</span>
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed font-normal">
            A unified pathway connecting technical learning, product building, verified experience, and career opportunity.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {JOURNEY_CARDS.map((card) => (
            <div
              key={card.id}
              className={cn(
                "relative rounded-3xl overflow-hidden p-7 flex flex-col justify-between min-h-[300px] shadow-xl border border-white/20",
                card.bgColor,
                card.textColor
              )}
            >
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <span className="text-xs font-mono font-bold tracking-widest text-white/80 uppercase">
                  {card.number} / {card.tag}
                </span>
                <Sparkles className="h-4 w-4 text-white" />
              </div>

              <div className="flex flex-col gap-2 my-auto py-4">
                <h3 className="text-2xl font-bold tracking-tight text-white leading-snug">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal">
                  {card.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/20">
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white underline underline-offset-4 decoration-white/40"
                >
                  <span>{card.linkText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
