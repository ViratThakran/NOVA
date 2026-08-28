"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SystemToken {
  text: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  opacity: number; // 0.08 - 0.5
  size?: number; // 9 - 13
  weight?: string;
  delay?: number;
}

const SYSTEM_TOKENS: SystemToken[] = [
  { text: "--squad-concurrency-limit", x: 42, y: 8, opacity: 0.18, size: 10 },
  { text: "--color-background-muted", x: 55, y: 5, opacity: 0.28, size: 11 },
  { text: "--easing-emphasized", x: 68, y: 9, opacity: 0.42, size: 12, weight: "font-medium" },
  { text: "--z-index-nav", x: 52, y: 15, opacity: 0.32, size: 11 },
  { text: "--radius-sm", x: 74, y: 12, opacity: 0.35, size: 11 },
  { text: "--color-text-inverse", x: 44, y: 18, opacity: 0.16, size: 10 },
  { text: "--breakpoint-lg", x: 38, y: 22, opacity: 0.2, size: 10 },
  { text: "--font-weight-semibold", x: 58, y: 22, opacity: 0.25, size: 10 },
  { text: "--font-weight-medium", x: 70, y: 23, opacity: 0.38, size: 11 },
  { text: "--z-index-modal", x: 35, y: 28, opacity: 0.18, size: 10 },
  { text: "--font-size-body-md", x: 62, y: 29, opacity: 0.45, size: 12, weight: "font-semibold" },
  { text: "--font-size-body-sm", x: 76, y: 31, opacity: 0.32, size: 11 },
  { text: "--color-surface-default", x: 65, y: 38, opacity: 0.48, size: 13, weight: "font-medium" },
  { text: "--easing-emphasized", x: 62, y: 48, opacity: 0.4, size: 12 },
  { text: "--easing-standard", x: 78, y: 45, opacity: 0.35, size: 11 },
  { text: "--duration-medium", x: 88, y: 49, opacity: 0.28, size: 10 },
  { text: "--radius-full", x: 66, y: 55, opacity: 0.3, size: 10 },
  { text: "--radius-md", x: 75, y: 53, opacity: 0.36, size: 11 },
  { text: "--radius-sm", x: 89, y: 55, opacity: 0.25, size: 10 },
  { text: "--space-xs", x: 56, y: 60, opacity: 0.22, size: 10 },
  { text: "--letter-spacing-tight", x: 71, y: 62, opacity: 0.42, size: 11 },
  { text: "--line-height-default", x: 82, y: 65, opacity: 0.3, size: 10 },
  { text: "--font-size-body-md", x: 55, y: 68, opacity: 0.28, size: 10 },
  { text: "--font-size-body-sm", x: 67, y: 70, opacity: 0.35, size: 11 },
  { text: "--color-accent-emphasis", x: 79, y: 73, opacity: 0.46, size: 12, weight: "font-medium" },
  { text: "--color-text-primary", x: 54, y: 75, opacity: 0.2, size: 10 },
  { text: "--container-max-width", x: 63, y: 78, opacity: 0.32, size: 11 },
  { text: "--breakpoint-lg", x: 74, y: 82, opacity: 0.28, size: 10 },
  { text: "--radius-sm", x: 61, y: 84, opacity: 0.24, size: 10 },
  { text: "--color-text-secondary", x: 92, y: 22, opacity: 0.18, size: 10 },
  { text: "--easing-standard", x: 94, y: 28, opacity: 0.22, size: 10 },
  { text: "--duration-shadow-md", x: 93, y: 34, opacity: 0.25, size: 10 },
  { text: "--space-2xl", x: 95, y: 40, opacity: 0.18, size: 9 },
  { text: "--font-weight-regular", x: 95, y: 48, opacity: 0.2, size: 10 },
  { text: "--color-text-inverse", x: 91, y: 61, opacity: 0.28, size: 10 },
  { text: "--color-text-muted", x: 93, y: 65, opacity: 0.22, size: 10 },
  { text: "--duration-fast", x: 92, y: 70, opacity: 0.25, size: 10 },
  { text: "--space-2xl", x: 91, y: 77, opacity: 0.2, size: 10 },
  { text: "--line-height-tight", x: 88, y: 80, opacity: 0.26, size: 10 },
  { text: "--color-border-subtle", x: 82, y: 85, opacity: 0.34, size: 11 },
  { text: "--easing-emphasized", x: 78, y: 90, opacity: 0.3, size: 10 },
  { text: "--space-xl", x: 84, y: 93, opacity: 0.22, size: 10 },
  { text: "--font-size-heading-lg", x: 73, y: 96, opacity: 0.18, size: 9 },
];

export function TokenCloudVisual() {
  const prefersReducedMotion = useReducedMotion();
  const [mouseOffset, setMouseOffset] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x: x * 15, y: y * 15 });
  }, []);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Subtle radial falloff mask so tokens dissolve cleanly */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10 w-[45%]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />

      {/* Scattered Token Points */}
      <div className="relative w-full h-full">
        {SYSTEM_TOKENS.map((token, index) => {
          const depth = 0.5 + (index % 5) * 0.2;
          const translateX = prefersReducedMotion ? 0 : mouseOffset.x * depth;
          const translateY = prefersReducedMotion ? 0 : mouseOffset.y * depth;

          return (
            <motion.span
              key={`${token.text}-${index}`}
              initial={{ opacity: 0 }}
              animate={{
                opacity: token.opacity,
                x: translateX,
                y: translateY,
              }}
              transition={{
                opacity: { duration: 0.8, delay: 0.02 * (index % 10) },
                x: { duration: 0.3, ease: "easeOut" },
                y: { duration: 0.3, ease: "easeOut" },
              }}
              className={`absolute font-mono tracking-tight text-white whitespace-nowrap will-change-transform ${
                token.weight || "font-normal"
              }`}
              style={{
                left: `${token.x}%`,
                top: `${token.y}%`,
                fontSize: `${token.size || 11}px`,
                transform: "translate(-50%, -50%)",
                textShadow: "0 0 1px rgba(255,255,255,0.4)",
              }}
            >
              {token.text}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
