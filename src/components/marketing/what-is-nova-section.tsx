"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, Compass, Sparkles, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface JourneyCardData {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  linkText: string;
  href: string;
  image: string;
  align: "left" | "right";
  icon: React.ComponentType<{ className?: string }>;
}

const JOURNEY_CARDS: JourneyCardData[] = [
  {
    id: "learn",
    tag: "LEARN",
    title: "A Foundation for Reinvention",
    subtitle: "Challenge-driven engineering labs & systems intuition",
    description: "Challenge-driven engineering labs, systems modeling, and AI fundamentals designed for capability.",
    linkText: "Explore Learning",
    href: "/internship-programs",
    image: "/images/journey/01-learn.png",
    align: "left",
    icon: Sparkles,
  },
  {
    id: "build",
    tag: "BUILD",
    title: "Turn Knowledge Into Real Systems",
    subtitle: "Production web applications, cloud nodes & AI agents",
    description: "Collaborate on production web applications, autonomous agents, and scalable cloud systems.",
    linkText: "Explore Build",
    href: "#what-we-do",
    image: "/images/journey/02-build.png",
    align: "right",
    icon: Compass,
  },
  {
    id: "experience",
    tag: "EXPERIENCE",
    title: "Collaborate in Builder Squads",
    subtitle: "Human collaboration, peer reviews & live deployments",
    description: "Work on real-world problems with verified commits, peer reviews, and live deployments.",
    linkText: "Explore Experience",
    href: "#careers",
    image: "/images/journey/03-experience.png",
    align: "left",
    icon: Users,
  },
  {
    id: "grow",
    tag: "GROW",
    title: "Direct Industry Pathways",
    subtitle: "Partner technology labs, paid residencies & careers",
    description: "Connect directly with partner engineering labs, paid residencies, and high-growth careers.",
    linkText: "Explore Growth Pathways",
    href: "#careers",
    image: "/images/journey/04-grow.png",
    align: "right",
    icon: TrendingUp,
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

  // Card 1 (LEARN: Left)
  const card1Y = useTransform(scrollYProgress, [0.02, 0.22, 0.46], ["120%", "20%", "-140%"]);
  const card1Scale = useTransform(scrollYProgress, [0.02, 0.18, 0.35, 0.46], [0.95, 1.02, 1.0, 0.95]);
  const card1Opacity = useTransform(scrollYProgress, [0.02, 0.08, 0.38, 0.46], [0, 1, 1, 0]);

  // Card 2 (BUILD: Right)
  const card2Y = useTransform(scrollYProgress, [0.18, 0.38, 0.64], ["120%", "36%", "-140%"]);
  const card2Scale = useTransform(scrollYProgress, [0.18, 0.32, 0.50, 0.64], [0.95, 1.02, 1.0, 0.95]);
  const card2Opacity = useTransform(scrollYProgress, [0.15, 0.22, 0.54, 0.64], [0, 1, 1, 0]);

  // Card 3 (EXPERIENCE: Left)
  const card3Y = useTransform(scrollYProgress, [0.38, 0.58, 0.82], ["120%", "20%", "-140%"]);
  const card3Scale = useTransform(scrollYProgress, [0.38, 0.50, 0.68, 0.82], [0.95, 1.02, 1.0, 0.95]);
  const card3Opacity = useTransform(scrollYProgress, [0.35, 0.42, 0.72, 0.82], [0, 1, 1, 0]);

  // Card 4 (GROW: Right)
  const card4Y = useTransform(scrollYProgress, [0.56, 0.78, 1.0], ["120%", "36%", "-100%"]);
  const card4Scale = useTransform(scrollYProgress, [0.56, 0.72, 0.90, 1.0], [0.95, 1.02, 1.0, 0.98]);
  const card4Opacity = useTransform(scrollYProgress, [0.54, 0.62, 0.95, 1.0], [0, 1, 1, 0.9]);

  const cardsData = [
    { card: JOURNEY_CARDS[0], y: card1Y, scale: card1Scale, opacity: card1Opacity, isLeft: true },
    { card: JOURNEY_CARDS[1], y: card2Y, scale: card2Scale, opacity: card2Opacity, isLeft: false },
    { card: JOURNEY_CARDS[2], y: card3Y, scale: card3Scale, opacity: card3Opacity, isLeft: true },
    { card: JOURNEY_CARDS[3], y: card4Y, scale: card4Scale, opacity: card4Opacity, isLeft: false },
  ];

  return (
    <section
      id="platform"
      ref={containerRef}
      className="relative w-full bg-black text-white"
    >
      {/* ============================================================ */}
      {/* DESKTOP PINNED STACKING SCROLL SECTION (Left-Right 4-Card Sequence) */}
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
          {/* 4 CARDS: SEQUENCE LEFT -> RIGHT -> LEFT -> RIGHT */}
          {/* ======================================================== */}
          <div className="absolute inset-0 z-10 pointer-events-none w-full h-full max-w-[1680px] mx-auto px-6 lg:px-12 xl:px-16">
            {cardsData.map(({ card, y, scale, opacity, isLeft }) => {
              const IconComponent = card.icon;
              return (
                <motion.div
                  key={card.id}
                  style={{
                    y: prefersReducedMotion ? (isLeft ? "20%" : "36%") : y,
                    scale: prefersReducedMotion ? 1 : scale,
                    opacity: prefersReducedMotion ? 1 : opacity,
                  }}
                  className={cn(
                    "absolute top-0 w-[520px] lg:w-[580px] xl:w-[640px] 2xl:w-[700px] pointer-events-auto",
                    isLeft ? "left-4 lg:left-8 xl:left-12" : "right-4 lg:right-8 xl:right-12"
                  )}
                >
                  <div className="group relative rounded-none overflow-hidden bg-neutral-950 text-white shadow-[0_30px_80px_rgba(0,0,0,0.85)] border border-white/15 hover:border-white/30 transition-colors duration-300">
                    {/* Real Background Image with Smooth Hover Scale */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                        sizes="(max-width: 1024px) 100vw, 700px"
                        priority
                      />
                      {/* Gradient Scrim: Clear middle to reveal the photograph, rich dark gradient at the bottom for text contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 via-40% to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-60" />
                    </div>

                    {/* Card Foreground Content: Upper (Tag), Middle (Empty), Lower (Text & Link) */}
                    <div className="relative z-10 p-9 sm:p-10 xl:p-12 flex flex-col justify-between min-h-[440px] xl:min-h-[480px]">
                      {/* Upper Part: Tag & Icon as clean text/element without pill container */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-mono font-bold tracking-[0.25em] text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {card.tag}
                        </span>
                        <IconComponent className="h-4 w-4 text-white/90 drop-shadow" />
                      </div>

                      {/* Middle Part: EMPTY (Reveals background photography) */}
                      <div className="flex-1 min-h-[100px] xl:min-h-[140px]" />

                      {/* Lower Part: Headline, Description & Link */}
                      <div className="flex flex-col gap-3 pt-2">
                        <h3 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                          {card.title}
                        </h3>
                        <p className="text-sm sm:text-base xl:text-lg text-neutral-200 font-normal leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                          {card.description}
                        </p>
                        <div className="pt-2">
                          <Link
                            href={card.href}
                            className="group/link inline-flex items-center gap-2.5 text-sm sm:text-base font-bold text-white hover:text-white/80 underline underline-offset-4 decoration-white/40 hover:decoration-white transition-all drop-shadow"
                          >
                            <span>{card.linkText}</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
          {JOURNEY_CARDS.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                className="group relative rounded-none overflow-hidden bg-neutral-950 text-white shadow-xl border border-white/15"
              >
                {/* Background Image on Mobile */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover object-center"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 via-40% to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-60" />
                </div>

                <div className="relative z-10 p-8 sm:p-9 flex flex-col justify-between min-h-[380px]">
                  {/* Upper Part */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold tracking-[0.25em] text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {card.tag}
                    </span>
                    <IconComponent className="h-4 w-4 text-white/90 drop-shadow" />
                  </div>

                  {/* Middle Part (Empty) */}
                  <div className="flex-1 min-h-[80px]" />

                  {/* Lower Part */}
                  <div className="flex flex-col gap-2.5 pt-2">
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                      {card.title}
                    </h3>
                    <p className="text-sm text-neutral-200 leading-relaxed font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {card.description}
                    </p>
                    <div className="pt-1">
                      <Link
                        href={card.href}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-white underline underline-offset-4 decoration-white/40"
                      >
                        <span>{card.linkText}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
