"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CapabilityData } from "@/data/capabilities";

interface CapabilityHeroProps {
  capability: CapabilityData;
}

export function CapabilityHero({ capability }: CapabilityHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLElement>(null);

  // Subtle scroll parallax for the hero visual
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const visualY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const visualOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);

  // Editorial heading override per capability (replaces all-caps slogans with editorial tone)
  const HEADING_OVERRIDES: Record<string, string> = {
    "ai-intelligence": "AI and data",
    "cloud": "Cloud & infrastructure",
    "software-technology": "Software & technology",
    "digital-products": "Digital products",
    "data-analytics": "Data & analytics",
    "automation": "Automation",
    "talent-solutions": "Talent solutions",
  };
  const headingText = HEADING_OVERRIDES[capability.slug] ?? capability.heroHeadline.replace(/\n/g, " ");
  const descriptionText = capability.heroDescription;

  // Illustration asset per capability
  const ILLUSTRATION_MAP: Record<string, string> = {
    "ai-intelligence": "/images/cards/ai.jpg",
    "cloud": "/images/cards/build.jpg",
    "software-technology": "/images/cards/software.jpg",
    "digital-products": "/images/cards/products.jpg",
    "data-analytics": "/images/cards/gen_ai_research.jpg",
    "automation": "/images/cards/grow.jpg",
    "talent-solutions": "/images/cards/experience.jpg",
  };
  const illustrationSrc = ILLUSTRATION_MAP[capability.slug] ?? "/images/cards/ai.jpg";

  return (
    <section
      ref={containerRef}
      className="relative min-h-[75vh] lg:min-h-[82vh] flex items-center justify-center pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20 bg-[#060608] text-white overflow-hidden"
    >
      {/* Ambient background atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_30%_50%,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_75%_50%,rgba(139,92,246,0.05),transparent_70%)] pointer-events-none" />

      <div className="relative mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 my-auto">
        {/* 50/50 Horizontal Composition */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-8 lg:gap-14 xl:gap-20 items-center">
          
          {/* ── LEFT: Large AI & Data Illustration (Seamless Blend into Black) ── */}
          <div className="lg:col-span-6 w-full flex items-center justify-center order-1">
            <motion.div
              style={prefersReducedMotion ? {} : { y: visualY, opacity: visualOpacity }}
              initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[740px] xl:max-w-[800px] aspect-[16/10] flex items-center justify-center select-none"
            >
              {/* Soft circular aura centered on the neural core */}
              <div
                className="absolute inset-0 m-auto w-96 h-96 rounded-full bg-indigo-500/22 blur-[100px] pointer-events-none"
                aria-hidden="true"
              />

              {/* Seamless Elliptical Feather Mask — dissolves all edges into solid black */}
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(ellipse 68% 64% at 50% 50%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0) 72%)",
                  maskImage:
                    "radial-gradient(ellipse 68% 64% at 50% 50%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0) 72%)",
                }}
              >
                <Image
                  src={illustrationSrc}
                  alt={`${capability.title} Intelligence Illustration`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                  className="object-contain object-center scale-135 transition-transform duration-700 hover:scale-140"
                  style={{ mixBlendMode: "screen" }}
                />
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT: Editorial Heading & Explanation ── */}
          <div className="lg:col-span-6 w-full flex flex-col justify-center order-2">
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-xl flex flex-col gap-6 sm:gap-7"
            >
              {/* Main Capability Heading — Primary visual focus */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.06]">
                {headingText}
              </h1>

              {/* Editorial Explanation Paragraph */}
              <p className="text-base sm:text-lg lg:text-xl text-neutral-300 font-normal leading-relaxed">
                {descriptionText}
              </p>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
