/**
 * Industry page theme system with Tailwind-safe literal classes.
 */

export type IndustryAccent =
  | "emerald"
  | "cyan"
  | "amber"
  | "blue"
  | "violet"
  | "rose"
  | "teal"
  | "purple"
  | "sky";

interface IndustryAccentClasses {
  text: string;
  textDark: string;
  metricHover: string;
  barBg: string;
  barHoverBg: string;
  tabBg: string;
  linkColor: string;
  underlineHover: string;
  orb1: string;
  orb2: string;
  orbDark1: string;
  orbDark2: string;
  focusRing: string;
  statText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

const ACCENT_MAP: Record<IndustryAccent, IndustryAccentClasses> = {
  emerald: {
    text: "text-emerald-600",
    textDark: "text-emerald-400",
    metricHover: "group-hover:text-emerald-600",
    barBg: "bg-emerald-600/40",
    barHoverBg: "group-hover:bg-emerald-600",
    tabBg: "bg-emerald-600",
    linkColor: "text-emerald-600",
    underlineHover: "group-hover:decoration-emerald-600",
    orb1: "bg-emerald-200/25",
    orb2: "bg-teal-200/20",
    orbDark1: "bg-emerald-900/20",
    orbDark2: "bg-teal-900/15",
    focusRing: "focus-visible:ring-emerald-600",
    statText: "text-emerald-400",
    badgeBg: "bg-emerald-500/10",
    badgeBorder: "border-emerald-500/20",
    badgeText: "text-emerald-400",
  },
  cyan: {
    text: "text-cyan-600",
    textDark: "text-cyan-400",
    metricHover: "group-hover:text-cyan-600",
    barBg: "bg-cyan-600/40",
    barHoverBg: "group-hover:bg-cyan-600",
    tabBg: "bg-cyan-600",
    linkColor: "text-cyan-600",
    underlineHover: "group-hover:decoration-cyan-600",
    orb1: "bg-cyan-200/25",
    orb2: "bg-sky-200/20",
    orbDark1: "bg-cyan-900/20",
    orbDark2: "bg-sky-900/15",
    focusRing: "focus-visible:ring-cyan-600",
    statText: "text-cyan-400",
    badgeBg: "bg-cyan-500/10",
    badgeBorder: "border-cyan-500/20",
    badgeText: "text-cyan-400",
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
    badgeBg: "bg-teal-500/10",
    badgeBorder: "border-teal-500/20",
    badgeText: "text-teal-400",
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
    orb2: "bg-blue-200/20",
    orbDark1: "bg-sky-900/20",
    orbDark2: "bg-blue-900/15",
    focusRing: "focus-visible:ring-sky-600",
    statText: "text-sky-400",
    badgeBg: "bg-sky-500/10",
    badgeBorder: "border-sky-500/20",
    badgeText: "text-sky-400",
  },
  blue: {
    text: "text-blue-600",
    textDark: "text-blue-400",
    metricHover: "group-hover:text-blue-600",
    barBg: "bg-blue-600/40",
    barHoverBg: "group-hover:bg-blue-600",
    tabBg: "bg-blue-600",
    linkColor: "text-blue-600",
    underlineHover: "group-hover:decoration-blue-600",
    orb1: "bg-blue-200/25",
    orb2: "bg-indigo-200/20",
    orbDark1: "bg-blue-900/20",
    orbDark2: "bg-indigo-900/15",
    focusRing: "focus-visible:ring-blue-600",
    statText: "text-blue-400",
    badgeBg: "bg-blue-500/10",
    badgeBorder: "border-blue-500/20",
    badgeText: "text-blue-400",
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
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/20",
    badgeText: "text-amber-400",
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
    badgeBg: "bg-rose-500/10",
    badgeBorder: "border-rose-500/20",
    badgeText: "text-rose-400",
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
    badgeBg: "bg-violet-500/10",
    badgeBorder: "border-violet-500/20",
    badgeText: "text-violet-400",
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
    badgeBg: "bg-purple-500/10",
    badgeBorder: "border-purple-500/20",
    badgeText: "text-purple-400",
  },
};

export function getIndustryAccent(color: IndustryAccent): IndustryAccentClasses {
  return ACCENT_MAP[color] ?? ACCENT_MAP.emerald;
}
