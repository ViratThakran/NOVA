"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export function CustomCursor() {
  const [position, setPosition] = React.useState({ x: -100, y: -100 });
  const [cursorText, setCursorText] = React.useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    // Only run on fine-pointer devices (desktop with mouse) and if reduced motion is not requested
    const mediaQuery = window.matchMedia("(pointer: fine)");
    if (!mediaQuery.matches || prefersReducedMotion) return;

    let rafId: number | null = null;
    let targetX = -100;
    let targetY = -100;

    const updatePosition = () => {
      setPosition({ x: targetX, y: targetY });
      rafId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!rafId) {
        rafId = requestAnimationFrame(updatePosition);
      }

      // ONLY show cursor when hovering an element with a designated data-cursor-text attribute
      const target = e.target as HTMLElement | null;
      if (!target) {
        setCursorText(null);
        return;
      }

      const customLabel = target.closest("[data-cursor-text]")?.getAttribute("data-cursor-text");
      setCursorText(customLabel || null);
    };

    const handleMouseLeave = () => setCursorText(null);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden md:block"
    >
      <AnimatePresence>
        {cursorText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{
              type: "spring",
              damping: 24,
              stiffness: 300,
              mass: 0.2,
            }}
            className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full h-12 w-12 bg-indigo-600 text-white text-[9px] font-mono font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center pointer-events-none"
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`,
            }}
          >
            <span className="select-none">{cursorText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
