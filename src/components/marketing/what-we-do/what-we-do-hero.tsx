"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Layers, Sparkles } from "lucide-react";

export function WhatWeDoHero() {
  const prefersReducedMotion = useReducedMotion();
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative min-h-[80vh] flex flex-col justify-between pt-28 sm:pt-36 pb-16 bg-[#08080A] text-white overflow-hidden border-b border-white/10"
    >
      {/* Background Architectural Grid & Particle Field */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none opacity-40" />

      {/* Floating Interactive Matrix Shape */}
      <motion.div
        aria-hidden="true"
        animate={
          prefersReducedMotion
            ? {}
            : {
                x: mousePos.x * 25,
                y: mousePos.y * 25,
                rotateX: mousePos.y * -15,
                rotateY: mousePos.x * 15,
              }
        }
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
        className="absolute right-[-10%] top-[15%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none hidden lg:block"
      />

      <div className="relative mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="max-w-4xl flex flex-col gap-6 sm:gap-8">
          {/* Eyebrow badge */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-[0.25em] text-indigo-400 uppercase"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>WHAT WE DO — CAPABILITY DIRECTORY</span>
          </motion.div>

          {/* Large Editorial Headline */}
          <motion.h1
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl xl:text-[80px] font-black tracking-tight uppercase leading-[0.92] text-white"
          >
            BUILDING THE SYSTEMS,
            <br />
            PRODUCTS AND PEOPLE
            <br />
            THAT MOVE BUSINESS FORWARD.
          </motion.h1>

          {/* Supporting Copy */}
          <motion.p
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-xl text-neutral-300 max-w-2xl font-normal leading-relaxed"
          >
            NOVA combines technology, product engineering, data, automation and talent to help organizations build what comes next.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <a
              href="#capabilities"
              className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 px-6 py-3.5 text-sm sm:text-base font-semibold shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              <span>Explore our capabilities</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="#industries"
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 px-6 py-3.5 text-sm sm:text-base font-medium transition-all duration-200"
            >
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Explore industries</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
