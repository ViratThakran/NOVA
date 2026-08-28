"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TexturedHighlightProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Global SVG filter definition for rough, chalky, distressed text effect.
 * Renders once in the DOM so any element with filter="url(#rough-chalk-filter)" gets the effect.
 */
export function TexturedNoiseFilter() {
  return (
    <svg
      aria-hidden="true"
      className="absolute -top-[9999px] -left-[9999px] h-0 w-0 pointer-events-none opacity-0"
    >
      <defs>
        {/* Fine-grain stipple / rough chalk filter */}
        <filter id="rough-chalk-filter" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          {/* Dense fractal noise for internal grain */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="4"
            seed="12"
            result="fineNoise"
          />
          {/* Edge displacement turbulence for jagged / rough contours */}
          <feTurbulence
            type="turbulence"
            baseFrequency="0.06"
            numOctaves="3"
            seed="8"
            result="edgeDistort"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="edgeDistort"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displacedGraphic"
          />
          {/* Contrast curve to create discrete chalk specks */}
          <feColorMatrix
            in="fineNoise"
            type="matrix"
            values="
              0 0 0 0 1
              0 0 0 0 1
              0 0 0 0 1
              0 0 0 24 -9
            "
            result="chalkMask"
          />
          {/* Cut out the noise from the text */}
          <feComposite
            in="displacedGraphic"
            in2="chalkMask"
            operator="in"
            result="erodedText"
          />
          {/* Soft chalk dust aura */}
          <feGaussianBlur
            in="erodedText"
            stdDeviation="0.4"
            result="softAura"
          />
          <feMerge>
            <feMergeNode in="softAura" />
            <feMergeNode in="erodedText" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

/**
 * Renders a word or short phrase with a signature artisanal rough/chalk texture,
 * exactly matching the reference design.
 */
export function TexturedHighlight({ children, className }: TexturedHighlightProps) {
  return (
    <span
      className={cn(
        "relative inline-block font-black tracking-normal text-white select-none whitespace-nowrap",
        "before:absolute before:inset-0 before:content-[attr(data-text)] before:text-white/20 before:blur-[1px] before:pointer-events-none",
        className
      )}
      style={{
        filter: "url(#rough-chalk-filter)",
        textShadow: "0 0 2px rgba(255,255,255,0.8), 0 0 12px rgba(255,255,255,0.3)",
      }}
      data-text={typeof children === "string" ? children : undefined}
    >
      <TexturedNoiseFilter />
      <span className="relative z-10">{children}</span>
    </span>
  );
}
