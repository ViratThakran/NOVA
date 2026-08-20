"use client";

import * as React from "react";
import { motion, useScroll, useSpring, useReducedMotion, AnimatePresence } from "framer-motion";

const CHAPTERS = [
  { id: "hero", label: "01 / NOVA OPENING" },
  { id: "platform", label: "02 / THE NOVA JOURNEY" },
  { id: "what-we-do", label: "03 / WHAT WE DO" },
  { id: "careers", label: "04 / CAREERS & OPPORTUNITY" },
  { id: "who-we-are", label: "05 / WHO WE ARE" },
];

export function ScrollProgress() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 32,
    restDelta: 0.001,
  });

  const [activeChapter, setActiveChapter] = React.useState<string | null>(null);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const match = CHAPTERS.find((ch) => ch.id === entry.target.id);
          if (match) {
            setActiveChapter(match.label);
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = setTimeout(() => {
              setActiveChapter(null);
            }, 2400);
          }
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.3,
    });

    CHAPTERS.forEach((ch) => {
      const el = document.getElementById(ch.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  return (
    <>
      {/* 1.5px Top Accent Progress Line */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          className="fixed left-0 right-0 top-0 z-50 h-[1.5px] origin-left bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
          style={{ scaleX }}
        />
      )}

      {/* Brief Contextual Chapter Indicator */}
      <AnimatePresence>
        {activeChapter && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-40 hidden sm:flex items-center gap-2 rounded-full border border-neutral-800/80 bg-[#121216]/90 backdrop-blur-md px-4 py-1.5 text-xs font-mono font-bold tracking-wider text-neutral-200 shadow-2xl pointer-events-none"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>{activeChapter}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
