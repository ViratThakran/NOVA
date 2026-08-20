"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { HeroCinematicVisual } from "./hero-cinematic-visual";

export function HeroSection() {
  const containerRef = React.useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Subtle mouse depth physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 32, stiffness: 180, mass: 0.5 };
  const headlineX = useSpring(mouseX, springConfig);
  const headlineY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

    mouseX.set(x * 4);
    mouseY.set(y * 4);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const premiumEase = [0.22, 1, 0.36, 1] as const;

  return (
    <section
      id="hero"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[88vh] sm:min-h-[92vh] bg-[#0C0C0C] text-white flex flex-col justify-end pt-20 sm:pt-24 pb-14 sm:pb-20 overflow-hidden"
    >
      {/* Edge-to-Edge Real Looping Hero Video Asset */}
      <HeroCinematicVisual />

      {/* Foreground Hero Typography & Action Layer */}
      <div className="relative z-20 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : headlineX,
            y: prefersReducedMotion ? 0 : headlineY,
          }}
          className="flex flex-col items-start max-w-2xl"
        >
          {/* 1. NOVA Eyebrow: Horizontal slide from left (-20px -> 0) */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.65, ease: premiumEase }}
            className="mb-4 sm:mb-6 flex items-center gap-2"
          >
            <span className="text-xs sm:text-sm font-mono font-bold tracking-[0.25em] text-indigo-400 uppercase">
              NOVA PLATFORM
            </span>
            <span className="h-1 w-1 rounded-full bg-indigo-400" />
            <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
              ENGINEERING & OPPORTUNITY
            </span>
          </motion.div>

          {/* 2. Staggered Headline Reveal with Horizontal Shift (-30px -> 0) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.03] overflow-hidden">
            <motion.span
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.12, ease: premiumEase }}
              className="block"
            >
              BUILD
            </motion.span>
            <motion.span
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.22, ease: premiumEase }}
              className="block text-neutral-300"
            >
              WHAT
            </motion.span>
            <motion.span
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.32, ease: premiumEase }}
              className="block text-white"
            >
              COMES NEXT.
            </motion.span>
          </h1>

          {/* 3. Supporting Copy */}
          <motion.p
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.42, ease: premiumEase }}
            className="mt-5 sm:mt-6 text-base sm:text-lg text-neutral-300 font-normal leading-relaxed max-w-lg"
          >
            Technology, learning and opportunity for people ready to build production systems.
          </motion.p>

          {/* 4. CTA Buttons */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.52, ease: premiumEase }}
            className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3.5 sm:gap-4"
          >
            <Link
              href="#platform"
              className="group inline-flex items-center gap-2 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 px-6 py-3.5 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] hover:translate-y-[-1px]"
            >
              <span>Explore NOVA</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
            </Link>

            <Link
              href="#careers"
              className="group inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 px-6 py-3.5 text-sm sm:text-base font-medium backdrop-blur-md transition-all duration-200 hover:translate-y-[-1px] active:scale-[0.98]"
            >
              <span>Discover Opportunities</span>
              <Sparkles className="h-4 w-4 text-indigo-300 opacity-70 transition-all duration-200 group-hover:opacity-100 group-hover:scale-110" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
