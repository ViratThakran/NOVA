"use client";

import * as React from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const CHAPTER_STAGES = [
  { id: "hero", label: "01 / HERO" },
  { id: "stack", label: "02 / STACK" },
  { id: "services", label: "03 / SERVICES" },
  { id: "action", label: "04 / IN ACTION" },
  { id: "outcomes", label: "05 / IMPACT" },
  { id: "process", label: "06 / LIFECYCLE" },
  { id: "technology", label: "07 / ECOSYSTEM" },
  { id: "insights", label: "08 / INSIGHTS" },
];

export function ChapterProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      {/* Top Thin Progress Line */}
      <motion.div
        className="fixed top-16 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 origin-left z-30 pointer-events-none"
        style={prefersReducedMotion ? { width: "100%" } : { scaleX }}
      />
    </>
  );
}
