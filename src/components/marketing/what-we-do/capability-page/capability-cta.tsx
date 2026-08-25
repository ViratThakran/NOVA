"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function CapabilityCta() {
  const prefersReducedMotion = useReducedMotion();
  const premiumEase = [0.22, 1, 0.36, 1] as const;

  return (
    <section className="relative w-full bg-[#070709] text-white pt-24 sm:pt-36 pb-20 sm:pb-28 overflow-hidden border-t border-white/10">
      {/* Atmospheric Silhouette & Ambient Horizontal Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[450px] w-[750px] rounded-full bg-radial from-indigo-600/15 via-cyan-500/5 to-transparent blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center">
        {/* Eyebrow: Clean plain text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: premiumEase }}
          className="mb-6"
        >
          <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-[0.28em] text-neutral-400">
            THE INVITATION
          </span>
        </motion.div>

        {/* Large Statement in Home-Page Visual Language */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight uppercase leading-[0.94] max-w-5xl flex flex-wrap justify-center gap-x-4 sm:gap-x-6">
          <motion.span
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: premiumEase }}
            className="inline-block text-white"
          >
            LET&apos;S
          </motion.span>
          <motion.span
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: premiumEase }}
            className="inline-block text-neutral-300"
          >
            BUILD
          </motion.span>
          <motion.span
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: premiumEase }}
            className="inline-block text-white"
          >
            WHAT&apos;S
          </motion.span>
          <motion.span
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease: premiumEase }}
            className="inline-block bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent"
          >
            NEXT.
          </motion.span>
        </h2>

        {/* Supporting Copy */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5, ease: premiumEase }}
          className="mt-6 sm:mt-8 max-w-xl text-sm sm:text-base md:text-lg text-neutral-400 font-normal leading-relaxed"
        >
          Let&apos;s discuss your engineering roadmap, data architecture, or AI initiatives.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6, ease: premiumEase }}
          className="mt-8 sm:mt-10 flex flex-wrap justify-center items-center gap-4"
        >
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 px-7 py-3.5 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] hover:translate-y-[-1px]"
          >
            <span>Talk to NOVA</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/get-started"
            className="group inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 px-7 py-3.5 text-sm sm:text-base font-medium backdrop-blur-md transition-all duration-200 hover:translate-y-[-1px] active:scale-[0.98]"
          >
            <span>Get Started</span>
            <Sparkles className="h-4 w-4 text-indigo-300 opacity-70 transition-all duration-200 group-hover:opacity-100 group-hover:scale-110" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
