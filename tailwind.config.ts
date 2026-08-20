import type { Config } from "tailwindcss";

// NOVA Design System — Tailwind theme extension.
// Colors read from CSS custom properties (see src/app/globals.css) using the
// `rgb(var(--x) / <alpha-value>)` pattern so opacity modifiers (bg-primary/10)
// work. Components should always use these semantic keys — never raw hex —
// so the palette stays centralized in one place.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          elevated: "rgb(var(--color-surface-elevated) / <alpha-value>)",
        },
        border: "rgb(var(--color-border) / <alpha-value>)",
        text: {
          DEFAULT: "rgb(var(--color-text) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          light: "rgb(var(--color-primary-light) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
        },
        accent: {
          violet: "rgb(var(--color-accent-violet) / <alpha-value>)",
          cyan: "rgb(var(--color-accent-cyan) / <alpha-value>)",
          emerald: "rgb(var(--color-accent-emerald) / <alpha-value>)",
          amber: "rgb(var(--color-accent-amber) / <alpha-value>)",
          rose: "rgb(var(--color-accent-rose) / <alpha-value>)",
        },
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
        info: "rgb(var(--color-info) / <alpha-value>)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        card: "var(--radius-card)",
        modal: "var(--radius-modal)",
        pill: "var(--radius-pill)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["clamp(3rem, 2rem + 7vw, 8rem)", { lineHeight: "0.98", letterSpacing: "-0.025em", fontWeight: "700" }],
        hero: ["clamp(4rem, 3rem + 3vw, 5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "700" }],
        h1: ["clamp(2.5rem, 2rem + 1.5vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.015em", fontWeight: "700" }],
        h2: ["clamp(2rem, 1.75rem + 1vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["clamp(1.5rem, 1.375rem + 0.5vw, 1.75rem)", { lineHeight: "1.2", letterSpacing: "-0.005em", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.6" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.01em" }],
      },
      maxWidth: {
        content: "1280px",
      },
      keyframes: {
        "nova-draw": {
          from: { strokeDashoffset: "1" },
          to: { strokeDashoffset: "0" },
        },
        "nova-fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "nova-draw": "nova-draw 1.4s ease-out forwards",
        "nova-fade-up": "nova-fade-up 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
