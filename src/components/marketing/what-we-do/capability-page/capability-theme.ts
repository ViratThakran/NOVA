/**
 * Capability page theme system.
 * All class names must be literal strings (Tailwind JIT requires static analysis).
 */

export type CapabilityAccent =
  | "indigo"
  | "sky"
  | "violet"
  | "rose"
  | "amber"
  | "teal"
  | "purple";

interface AccentClasses {
  text: string;            // text-violet-600
  textDark: string;        // text-violet-400 (for dark sections)
  metricHover: string;     // group-hover:text-violet-600
  barBg: string;           // bg-violet-600/40
  barHoverBg: string;      // group-hover:bg-violet-600
  tabBg: string;           // bg-violet-600
  linkColor: string;       // text-violet-600 (num prefix)
  underlineHover: string;  // group-hover:decoration-violet-600
  orb1: string;            // bg-violet-200/25
  orb2: string;            // bg-purple-200/20 (complementary)
  orbDark1: string;        // bg-violet-900/20
  orbDark2: string;        // bg-indigo-900/15
  focusRing: string;       // focus-visible:ring-violet-600
  statText: string;        // text-violet-400
  sectionHoverShadow: string; // rgba color for box-shadow
}

const ACCENT_MAP: Record<CapabilityAccent, AccentClasses> = {
  indigo: {
    text: "text-indigo-600",
    textDark: "text-indigo-400",
    metricHover: "group-hover:text-indigo-600",
    barBg: "bg-indigo-600/40",
    barHoverBg: "group-hover:bg-indigo-600",
    tabBg: "bg-indigo-600",
    linkColor: "text-indigo-600",
    underlineHover: "group-hover:decoration-indigo-600",
    orb1: "bg-indigo-200/30",
    orb2: "bg-purple-200/25",
    orbDark1: "bg-indigo-900/20",
    orbDark2: "bg-purple-900/15",
    focusRing: "focus-visible:ring-indigo-600",
    statText: "text-indigo-400",
    sectionHoverShadow: "rgba(99,102,241,0.07)",
  },
  sky: {
    text: "text-sky-600",
    textDark: "text-sky-400",
    metricHover: "group-hover:text-sky-600",
    barBg: "bg-sky-600/40",
    barHoverBg: "group-hover:bg-sky-600",
    tabBg: "bg-sky-600",
    linkColor: "text-sky-600",
    underlineHover: "group-hover:decoration-sky-600",
    orb1: "bg-sky-200/25",
    orb2: "bg-indigo-200/20",
    orbDark1: "bg-sky-900/20",
    orbDark2: "bg-indigo-900/15",
    focusRing: "focus-visible:ring-sky-600",
    statText: "text-sky-400",
    sectionHoverShadow: "rgba(14,165,233,0.07)",
  },
  violet: {
    text: "text-violet-600",
    textDark: "text-violet-400",
    metricHover: "group-hover:text-violet-600",
    barBg: "bg-violet-600/40",
    barHoverBg: "group-hover:bg-violet-600",
    tabBg: "bg-violet-600",
    linkColor: "text-violet-600",
    underlineHover: "group-hover:decoration-violet-600",
    orb1: "bg-violet-200/25",
    orb2: "bg-purple-200/20",
    orbDark1: "bg-violet-900/20",
    orbDark2: "bg-purple-900/15",
    focusRing: "focus-visible:ring-violet-600",
    statText: "text-violet-400",
    sectionHoverShadow: "rgba(124,58,237,0.07)",
  },
  rose: {
    text: "text-rose-600",
    textDark: "text-rose-400",
    metricHover: "group-hover:text-rose-600",
    barBg: "bg-rose-600/40",
    barHoverBg: "group-hover:bg-rose-600",
    tabBg: "bg-rose-600",
    linkColor: "text-rose-600",
    underlineHover: "group-hover:decoration-rose-600",
    orb1: "bg-rose-200/25",
    orb2: "bg-pink-200/20",
    orbDark1: "bg-rose-900/20",
    orbDark2: "bg-pink-900/15",
    focusRing: "focus-visible:ring-rose-600",
    statText: "text-rose-400",
    sectionHoverShadow: "rgba(225,29,72,0.07)",
  },
  amber: {
    text: "text-amber-600",
    textDark: "text-amber-400",
    metricHover: "group-hover:text-amber-600",
    barBg: "bg-amber-600/40",
    barHoverBg: "group-hover:bg-amber-600",
    tabBg: "bg-amber-600",
    linkColor: "text-amber-600",
    underlineHover: "group-hover:decoration-amber-600",
    orb1: "bg-amber-200/25",
    orb2: "bg-orange-200/20",
    orbDark1: "bg-amber-900/20",
    orbDark2: "bg-orange-900/15",
    focusRing: "focus-visible:ring-amber-600",
    statText: "text-amber-400",
    sectionHoverShadow: "rgba(217,119,6,0.07)",
  },
  teal: {
    text: "text-teal-600",
    textDark: "text-teal-400",
    metricHover: "group-hover:text-teal-600",
    barBg: "bg-teal-600/40",
    barHoverBg: "group-hover:bg-teal-600",
    tabBg: "bg-teal-600",
    linkColor: "text-teal-600",
    underlineHover: "group-hover:decoration-teal-600",
    orb1: "bg-teal-200/25",
    orb2: "bg-emerald-200/20",
    orbDark1: "bg-teal-900/20",
    orbDark2: "bg-emerald-900/15",
    focusRing: "focus-visible:ring-teal-600",
    statText: "text-teal-400",
    sectionHoverShadow: "rgba(13,148,136,0.07)",
  },
  purple: {
    text: "text-purple-600",
    textDark: "text-purple-400",
    metricHover: "group-hover:text-purple-600",
    barBg: "bg-purple-600/40",
    barHoverBg: "group-hover:bg-purple-600",
    tabBg: "bg-purple-600",
    linkColor: "text-purple-600",
    underlineHover: "group-hover:decoration-purple-600",
    orb1: "bg-purple-200/25",
    orb2: "bg-violet-200/20",
    orbDark1: "bg-purple-900/20",
    orbDark2: "bg-violet-900/15",
    focusRing: "focus-visible:ring-purple-600",
    statText: "text-purple-400",
    sectionHoverShadow: "rgba(147,51,234,0.07)",
  },
};

export function getAccent(color: CapabilityAccent): AccentClasses {
  return ACCENT_MAP[color];
}
