"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  Layers,
  ChevronRight,
  Compass,
  Cpu,
  GraduationCap,
  Briefcase,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/marketing/site-header";
import { CustomCursor } from "@/components/marketing/custom-cursor";
import { SiteFooter } from "@/components/marketing/site-footer";

/* -------------------------------------------------------------------------- */
/*                               Data Structures                              */
/* -------------------------------------------------------------------------- */

interface ShowcaseCard {
  id: string;
  category: string;
  readTime: string;
  title: string;
  description: string;
  image: string;
  linkText: string;
  href: string;
}

const SHOWCASE_CARDS: ShowcaseCard[] = [
  {
    id: "ai",
    category: "AI & TECHNOLOGY",
    readTime: "5 min read • Systems Brief",
    title: "How AI is changing the way we build.",
    description:
      "From passive copilots to autonomous engineering workflows: the architectural shift from writing syntax to designing constraints and verification loops.",
    image: "/images/cards/ai.jpg",
    linkText: "Read Perspective",
    href: "/about",
  },
  {
    id: "work",
    category: "FUTURE OF WORK",
    readTime: "4 min read • Industry Perspective",
    title: "Agentic commerce: How to build agent-aware digital ecosystems.",
    description:
      "As software agents interact directly with services, modern architectures must support autonomous negotiation, verification, and zero-trust orchestration.",
    image: "/images/cards/grow.jpg",
    linkText: "Learn More",
    href: "/about",
  },
  {
    id: "learning",
    category: "LEARNING & SYSTEMS",
    readTime: "6 min read • Pedagogy & Execution",
    title: "Learning is changing: Why sandbox tutorials fail and real execution succeeds.",
    description:
      "Passive video courses teach syntax, not resilience. Challenge-driven labs, collaborative squads, and live deployments cultivate genuine engineering instinct.",
    image: "/images/cards/learn.jpg",
    linkText: "Read Article",
    href: "/about",
  },
];

interface PerspectiveArticle {
  id: string;
  number: string;
  category: string;
  topicId: string;
  title: string;
  subtitle: string;
  readTime: string;
  date: string;
  author: string;
  summary: string;
  takeaways: string[];
  image: string;
  href: string;
}

const PERSPECTIVE_ARTICLES: PerspectiveArticle[] = [
  {
    id: "p1",
    number: "01",
    category: "AI & TECHNOLOGY",
    topicId: "ai",
    title: "From Syntax Generation to Constraint Modeling: The Modern Engineer's Cognitive Stack",
    subtitle: "How engineering evolves from line-by-line syntax writing to architecting verification loops, property invariants, and deterministic agent scaffolds.",
    readTime: "8 min read",
    date: "August 2026",
    author: "NOVA Systems Group",
    summary:
      "As code generation approaches instantaneous zero-cost commodity, the true differentiator of engineering teams shifts upward: defining formal specifications, constraint envelopes, and automated evaluation suites.",
    takeaways: [
      "Deterministic verification over speculative generations",
      "Property-based invariant testing in autonomous agent pipelines",
      "Zero-trust execution environments for distributed squads",
    ],
    image: "/images/cards/software.jpg",
    href: "/about",
  },
  {
    id: "p2",
    number: "02",
    category: "LEARNING & SYSTEMS",
    topicId: "learning",
    title: "The Death of Sandbox Code: Why Production Realities Cannot Be Simulated",
    subtitle: "Passive tutorials cultivate fragility. High-conviction engineering instinct only emerges when builders debug flaky network partitions and live state conflicts.",
    readTime: "6 min read",
    date: "July 2026",
    author: "NOVA Academy & Pedagogy",
    summary:
      "When educational sandboxes conceal concurrency bugs, latency spikes, and telemetry anomalies, students develop false confidence. Genuine mastery demands real repository accountability.",
    takeaways: [
      "Replacing simulated toy tasks with verified production commits",
      "Peer review as the fundamental cognitive engine of mastery",
      "Developing intuitive architectural taste under live constraints",
    ],
    image: "/images/cards/build.jpg",
    href: "/about",
  },
  {
    id: "p3",
    number: "03",
    category: "FUTURE OF WORK",
    topicId: "work",
    title: "Agentic Commerce and the Emergence of Machine-to-Machine Value Systems",
    subtitle: "Designing API ecosystems and data services for autonomous agents negotiating micro-transactions, rate allocations, and verifiable cryptographic attestations.",
    readTime: "7 min read",
    date: "June 2026",
    author: "NOVA Research Labs",
    summary:
      "When software agents act as autonomous economic participants, digital infrastructure must adapt: transitioning from human authentication cookies to cryptographic provenance and deterministic rate markets.",
    takeaways: [
      "Zero-downtime service meshes for autonomous agent coordination",
      "Cryptographic provenance of multi-agent generated deliverables",
      "Human-in-the-loop escalation gates with zero latency penalties",
    ],
    image: "/images/cards/products.jpg",
    href: "/about",
  },
];

interface TopicFilter {
  id: string;
  label: string;
  count: number;
  description: string;
}

const TOPICS: TopicFilter[] = [
  {
    id: "all",
    label: "ALL TOPICS",
    count: 7,
    description: "Complete index of NOVA research dispatches, architecture briefs, and editorial perspectives.",
  },
  {
    id: "ai",
    label: "AI & TECHNOLOGY",
    count: 3,
    description: "Autonomous reasoning architectures, deterministic agent scaffolds, and scalable systems engineering.",
  },
  {
    id: "work",
    label: "FUTURE OF WORK",
    count: 2,
    description: "Builder squads, agile coordination models, agentic workflows, and the new engineering organization.",
  },
  {
    id: "learning",
    label: "LEARNING & SYSTEMS",
    count: 2,
    description: "Challenge-driven pedagogy, track records vs. credentials, and production apprentice frameworks.",
  },
  {
    id: "products",
    label: "DIGITAL PRODUCTS",
    count: 2,
    description: "High-density UI/UX ergonomics, edge web infrastructure, and design systems for enterprise scale.",
  },
];

interface EditorialFeedItem {
  id: string;
  number: string;
  topicId: string;
  category: string;
  title: string;
  format: string;
  readTime: string;
  date: string;
  href: string;
}

const EDITORIAL_FEED: EditorialFeedItem[] = [
  {
    id: "f1",
    number: "01",
    topicId: "ai",
    category: "AI & TECHNOLOGY",
    title: "How AI is changing the way we build.",
    format: "Systems Brief",
    readTime: "5 min read",
    date: "Aug 2026",
    href: "/about",
  },
  {
    id: "f2",
    number: "02",
    topicId: "work",
    category: "FUTURE OF WORK",
    title: "Agentic commerce: How to build agent-aware digital ecosystems.",
    format: "Industry Analysis",
    readTime: "4 min read",
    date: "Aug 2026",
    href: "/about",
  },
  {
    id: "f3",
    number: "03",
    topicId: "learning",
    category: "LEARNING & SYSTEMS",
    title: "Learning is changing: Why sandbox tutorials fail and real execution succeeds.",
    format: "Pedagogy",
    readTime: "6 min read",
    date: "Jul 2026",
    href: "/about",
  },
  {
    id: "f4",
    number: "04",
    topicId: "products",
    category: "DIGITAL PRODUCTS",
    title: "Designing technology around people: The ergonomics of interface density.",
    format: "Interface Architecture",
    readTime: "7 min read",
    date: "Jul 2026",
    href: "/about",
  },
  {
    id: "f5",
    number: "05",
    topicId: "ai",
    category: "AI & TECHNOLOGY",
    title: "Autonomous systems and deterministic guardrails in production.",
    format: "Reliability Brief",
    readTime: "5 min read",
    date: "Jun 2026",
    href: "/about",
  },
  {
    id: "f6",
    number: "06",
    topicId: "learning",
    category: "LEARNING & SYSTEMS",
    title: "Why verifiable track records beat static credentials in the builder era.",
    format: "Culture & Craft",
    readTime: "4 min read",
    date: "Jun 2026",
    href: "/about",
  },
  {
    id: "f7",
    number: "07",
    topicId: "products",
    category: "DIGITAL PRODUCTS",
    title: "Edge-native state synchronization: Lessons from distributed collaborative workspaces.",
    format: "Technical Report",
    readTime: "8 min read",
    date: "May 2026",
    href: "/about",
  },
];

/* -------------------------------------------------------------------------- */
/*                             Main Page Component                            */
/* -------------------------------------------------------------------------- */

export function WhatWeThinkView() {
  const prefersReducedMotion = useReducedMotion();
  const premiumEase = [0.22, 1, 0.36, 1] as const;

  // Preserved Showcase State
  const [activeShowcaseIdx, setActiveShowcaseIdx] = React.useState<number>(1);
  const showcaseSectionRef = React.useRef<HTMLElement>(null);

  const { scrollYProgress: showcaseScroll } = useScroll({
    target: showcaseSectionRef,
    offset: ["start end", "end start"],
  });
  const scrollScale = useTransform(showcaseScroll, [0, 0.4, 0.6, 1], [0.96, 1.02, 1.02, 0.96]);

  // Perspectives Section State
  const [activePerspectiveIdx, setActivePerspectiveIdx] = React.useState<number>(0);
  const activePerspective = PERSPECTIVE_ARTICLES[activePerspectiveIdx];

  // Topics Filter State
  const [selectedTopic, setSelectedTopic] = React.useState<string>("all");

  const filteredFeed = React.useMemo(() => {
    if (selectedTopic === "all") return EDITORIAL_FEED;
    return EDITORIAL_FEED.filter((item) => item.topicId === selectedTopic);
  }, [selectedTopic]);

  const activeTopicObj = TOPICS.find((t) => t.id === selectedTopic) || TOPICS[0];

  return (
    <>
      <CustomCursor />
      <SiteHeader transparent={false} />

      <main className="flex flex-col min-h-screen bg-white text-neutral-950 pt-16 selection:bg-[#6D54D4]/15 selection:text-[#6D54D4]">
        {/* ------------------------------------------------------------------ */}
        {/* 01 / EDITORIAL HERO & MASTHEAD                                     */}
        {/* ------------------------------------------------------------------ */}
        <section
          aria-label="Editorial Masthead"
          className="relative w-full border-b border-neutral-200/90 bg-gradient-to-b from-neutral-50/70 via-white to-white pt-16 sm:pt-24 pb-14 sm:pb-20 overflow-hidden"
        >
          {/* Subtle Ambient Radial Top Glow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(109,84,212,0.12),transparent)]" />

          <div className="relative z-10 mx-auto flex w-full max-w-[1560px] flex-col gap-8 sm:gap-12 px-6 sm:px-10 lg:px-16 xl:px-20">
            {/* Masthead Eyebrow & Issue Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-[#6D54D4] animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-neutral-500">
                  01 / NOVA RESEARCH &amp; EDITORIAL WORLD
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-400 font-medium">
                <span>ISSUE 04 • QUARTERLY DISPATCH</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline text-neutral-500">OPEN ACCESS PERSPECTIVES</span>
              </div>
            </div>

            {/* Main Headline & Narrative Introduction */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
              <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
                <motion.h1
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: premiumEase }}
                  className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-black tracking-tight text-neutral-950 uppercase leading-[0.93]"
                >
                  WE THINK ABOUT{" "}
                  <span className="bg-gradient-to-r from-[#6D54D4] via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                    WHAT&apos;S NEXT.
                  </span>
                </motion.h1>

                <motion.p
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: premiumEase }}
                  className="text-base sm:text-lg md:text-xl text-neutral-600 font-normal leading-relaxed max-w-2xl"
                >
                  Research, ideas and perspectives on technology, people, learning and the future we&apos;re building.
                </motion.p>
              </div>

              {/* Quick Navigation Action Chips */}
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: premiumEase }}
                className="lg:col-span-4 flex flex-col gap-3 justify-end items-start lg:items-end"
              >
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
                  EDITORIAL CHAPTERS
                </span>
                <nav aria-label="Page Sections" className="flex flex-wrap gap-2 lg:justify-end">
                  <a
                    href="#featured-perspectives"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-mono font-medium text-neutral-700 hover:border-[#6D54D4] hover:text-[#6D54D4] hover:bg-neutral-50 transition-all shadow-sm"
                  >
                    <span>02 / FEATURED</span>
                    <ChevronRight className="h-3 w-3 text-neutral-400" />
                  </a>
                  <a
                    href="#editorial-perspectives"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-mono font-medium text-neutral-700 hover:border-[#6D54D4] hover:text-[#6D54D4] hover:bg-neutral-50 transition-all shadow-sm"
                  >
                    <span>03 / PERSPECTIVES</span>
                    <ChevronRight className="h-3 w-3 text-neutral-400" />
                  </a>
                  <a
                    href="#research-topics"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-mono font-medium text-neutral-700 hover:border-[#6D54D4] hover:text-[#6D54D4] hover:bg-neutral-50 transition-all shadow-sm"
                  >
                    <span>04 / TOPICS</span>
                    <ChevronRight className="h-3 w-3 text-neutral-400" />
                  </a>
                  <a
                    href="#latest-thinking"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-mono font-medium text-neutral-700 hover:border-[#6D54D4] hover:text-[#6D54D4] hover:bg-neutral-50 transition-all shadow-sm"
                  >
                    <span>05 / FEED</span>
                    <ChevronRight className="h-3 w-3 text-neutral-400" />
                  </a>
                </nav>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 02 / FEATURED STORY & PRESERVED 3-CARD BENTO SHOWCASE              */}
        {/* ------------------------------------------------------------------ */}
        <section
          id="featured-perspectives"
          ref={showcaseSectionRef}
          aria-labelledby="featured-heading"
          className="scroll-mt-20 bg-white py-20 sm:py-28 text-neutral-950 border-b border-neutral-200/90"
        >
          <div className="mx-auto flex w-full max-w-[1560px] flex-col items-center gap-12 sm:gap-16 px-6 sm:px-10 lg:px-16 xl:px-20">
            {/* Centered Editorial Section Header */}
            <div className="flex flex-col items-center text-center max-w-3xl gap-3 sm:gap-4">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-neutral-500">
                02 / FEATURED EDITORIAL STORIES
              </span>

              <motion.h2
                id="featured-heading"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: premiumEase }}
                className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-950"
              >
                Featured Perspectives &amp;{" "}
                <span className="text-[#6D54D4]">
                  Research
                </span>
              </motion.h2>

              <motion.p
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: premiumEase }}
                className="text-xs sm:text-sm text-neutral-600 font-normal leading-relaxed max-w-2xl px-4"
              >
                Selected dispatches examining the structural changes across software development, intelligent agents, and education.
              </motion.p>
            </div>

            {/* Preserved 3-Card Bento Grid with Dominant Image + Overlapping Floating White Text Card */}
            <motion.div
              style={{ scale: prefersReducedMotion ? 1 : scrollScale }}
              className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start pt-4"
            >
              {SHOWCASE_CARDS.map((card, idx) => {
                const isActive = activeShowcaseIdx === idx;
                return (
                  <motion.article
                    key={card.id}
                    onMouseEnter={() => setActiveShowcaseIdx(idx)}
                    onClick={() => setActiveShowcaseIdx(idx)}
                    data-cursor-text="EXPLORE"
                    animate={
                      prefersReducedMotion
                        ? {}
                        : {
                            y: isActive ? -18 : 8,
                            scale: isActive ? 1.03 : 0.97,
                          }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 26,
                      mass: 0.8,
                    }}
                    className={cn(
                      "group relative flex flex-col rounded-[28px] overflow-visible cursor-pointer transition-all duration-300",
                      isActive
                        ? "z-10"
                        : "opacity-90 hover:opacity-100 z-0"
                    )}
                  >
                    {/* 1. Tall Dominant Visual Container (Top portion of card) */}
                    <div
                      className={cn(
                        "relative w-full rounded-[28px] overflow-hidden bg-neutral-900 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.12)] transition-all duration-500",
                        isActive ? "h-[300px] sm:h-[360px] lg:h-[400px]" : "h-[270px] sm:h-[320px] lg:h-[350px]"
                      )}
                    >
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        priority
                        className={cn(
                          "object-cover object-center transition-transform duration-700 ease-out",
                          isActive ? "scale-[1.04]" : "scale-100"
                        )}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                      {/* Overlaid Category Pill */}
                      <div className="absolute top-5 left-5 z-10">
                        <span className="rounded-lg bg-neutral-950/80 text-white px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">
                          {card.category}
                        </span>
                      </div>
                    </div>

                    {/* 2. Floating Overlapping White Card */}
                    <div
                      className={cn(
                        "relative -mt-16 sm:-mt-20 mx-3 sm:mx-4 flex flex-col justify-between p-6 sm:p-7 bg-white rounded-[22px] border border-neutral-100/90 transition-all duration-300 gap-3 min-h-[170px] sm:min-h-[190px]",
                        isActive
                          ? "shadow-[0_25px_60px_-15px_rgba(109,84,212,0.22)] border-neutral-200"
                          : "shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)]"
                      )}
                    >
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-mono text-neutral-400 font-medium">
                          {card.readTime}
                        </span>

                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#0F172A] leading-snug">
                          {card.title}
                        </h3>
                        <p className="text-xs sm:text-[13px] text-[#475569] leading-relaxed font-normal">
                          {card.description}
                        </p>
                      </div>

                      <div className="pt-1">
                        <Link
                          href={card.href}
                          className="group/link inline-flex items-center gap-1 text-xs font-semibold text-[#0F172A] hover:text-[#6D54D4] underline underline-offset-4 decoration-neutral-300 hover:decoration-[#6D54D4] transition-colors"
                        >
                          <span>{card.linkText}</span>
                          <ArrowUpRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 03 / PERSPECTIVES (HORIZONTAL EDITORIAL INTERACTION)               */}
        {/* ------------------------------------------------------------------ */}
        <section
          id="editorial-perspectives"
          aria-labelledby="perspectives-heading"
          className="scroll-mt-20 bg-[#FAFAFC] py-20 sm:py-32 border-b border-neutral-200/90 text-neutral-950 overflow-hidden"
        >
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-12 sm:gap-16 px-6 sm:px-10 lg:px-16 xl:px-20">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-200 pb-8">
              <div className="flex flex-col gap-3 max-w-2xl">
                <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-[#6D54D4]">
                  03 / DEEP DIVE PERSPECTIVES
                </span>
                <h2
                  id="perspectives-heading"
                  className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase leading-none"
                >
                  SYSTEMS &amp; ARCHITECTURAL ESSAYS
                </h2>
                <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed mt-1">
                  In-depth architectural analysis written by engineers and researchers at NOVA.
                </p>
              </div>

              <span className="text-xs font-mono text-neutral-400">
                ACTIVE PERSPECTIVE {activePerspective.number} OF 0{PERSPECTIVE_ARTICLES.length}
              </span>
            </div>

            {/* Horizontal Split Editorial Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* Left Column (Col 5): Horizontal Story Track Selector */}
              <div className="lg:col-span-5 flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
                {PERSPECTIVE_ARTICLES.map((article, idx) => {
                  const isSelected = activePerspectiveIdx === idx;
                  return (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => setActivePerspectiveIdx(idx)}
                      onMouseEnter={() => setActivePerspectiveIdx(idx)}
                      data-cursor-text="READ"
                      className={cn(
                        "group relative flex flex-col gap-2 p-5 sm:p-6 text-left transition-all duration-200",
                        isSelected
                          ? "bg-white shadow-sm"
                          : "hover:bg-white/60 text-neutral-700"
                      )}
                    >
                      {/* Active Indicator Accent Line */}
                      {isSelected && (
                        <motion.div
                          layoutId="activePerspectiveIndicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-[#6D54D4]"
                          transition={{ duration: 0.25, ease: premiumEase }}
                        />
                      )}

                      <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                        <span className={cn("font-bold", isSelected ? "text-[#6D54D4]" : "text-neutral-500")}>
                          {article.number} / {article.category}
                        </span>
                        <span>{article.readTime}</span>
                      </div>

                      <h3
                        className={cn(
                          "text-base sm:text-lg font-bold tracking-tight leading-snug transition-colors",
                          isSelected ? "text-neutral-950" : "text-neutral-700 group-hover:text-neutral-950"
                        )}
                      >
                        {article.title}
                      </h3>

                      <span className="text-xs text-neutral-500 font-mono">
                        {article.author} • {article.date}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column (Col 7): Spatial Editorial Reading Stage */}
              <div className="lg:col-span-7 relative flex flex-col rounded-3xl border border-neutral-200 bg-white p-6 sm:p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.06)] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePerspective.id}
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0, x: -20 } : { opacity: 0, x: -20 }}
                    transition={{ duration: 0.35, ease: premiumEase }}
                    className="flex flex-col gap-6"
                  >
                    {/* Visual Container */}
                    <div className="relative h-48 sm:h-64 w-full rounded-2xl overflow-hidden bg-neutral-900 shadow-md">
                      <Image
                        src={activePerspective.image}
                        alt={activePerspective.title}
                        fill
                        className="object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-white text-xs font-mono">
                        <span className="font-bold uppercase tracking-wider text-indigo-300">
                          {activePerspective.category}
                        </span>
                        <span>{activePerspective.date}</span>
                      </div>
                    </div>

                    {/* Excerpt Details */}
                    <div className="flex flex-col gap-3">
                      <h3 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight leading-tight">
                        {activePerspective.title}
                      </h3>
                      <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
                        {activePerspective.subtitle}
                      </p>
                    </div>

                    {/* Key Engineering Invariants / Bullet Takeaways */}
                    <div className="flex flex-col gap-2 rounded-xl bg-neutral-50 p-4 border border-neutral-100">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                        KEY ARCHITECTURAL TAKEAWAYS
                      </span>
                      <ul className="flex flex-col gap-1.5 text-xs sm:text-sm text-neutral-700">
                        {activePerspective.takeaways.map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#6D54D4]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Read Full Article Button */}
                    <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                      <span className="text-xs font-mono text-neutral-400">
                        Published by {activePerspective.author}
                      </span>
                      <Link
                        href={activePerspective.href}
                        className="group/btn inline-flex items-center gap-2 rounded-xl bg-neutral-950 hover:bg-[#6D54D4] text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
                      >
                        <span>Read Perspective</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 04 / TOPICS (TYPOGRAPHY & HORIZONTAL INTERACTION)                  */}
        {/* ------------------------------------------------------------------ */}
        <section
          id="research-topics"
          aria-labelledby="topics-heading"
          className="scroll-mt-20 bg-white py-16 sm:py-24 border-b border-neutral-200/90 text-neutral-950"
        >
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-8 sm:gap-12 px-6 sm:px-10 lg:px-16 xl:px-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-neutral-500">
                  04 / RESEARCH TOPICS
                </span>
                <h2 id="topics-heading" className="text-2xl sm:text-4xl font-extrabold tracking-tight uppercase">
                  EXPLORE BY TOPIC
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#6D54D4]" />
                <span>FILTER EDITORIAL FEED</span>
              </div>
            </div>

            {/* Horizontal Typography & Tab Selector (NO CARDS!) */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {TOPICS.map((topic) => {
                  const isSelected = selectedTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setSelectedTopic(topic.id)}
                      className={cn(
                        "group relative shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 select-none",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D54D4]",
                        isSelected
                          ? "bg-neutral-950 text-white shadow-sm"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-950"
                      )}
                    >
                      <span>{topic.label}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-mono font-bold",
                          isSelected ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-600"
                        )}
                      >
                        {topic.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Topic Description Banner */}
              <motion.div
                key={activeTopicObj.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between rounded-xl bg-neutral-50 px-5 py-3 border border-neutral-100 text-xs sm:text-sm text-neutral-600"
              >
                <span>{activeTopicObj.description}</span>
                <span className="font-mono text-neutral-400 text-xs shrink-0 hidden sm:inline">
                  Showing {filteredFeed.length} publications
                </span>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 05 / LATEST THINKING (EDITORIAL FEED / LIST WITH HORIZONTAL HOVER) */}
        {/* ------------------------------------------------------------------ */}
        <section
          id="latest-thinking"
          aria-labelledby="feed-heading"
          className="scroll-mt-20 bg-white py-16 sm:py-24 border-b border-neutral-200/90 text-neutral-950"
        >
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-8 sm:gap-12 px-6 sm:px-10 lg:px-16 xl:px-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-neutral-500">
                  05 / LATEST THINKING
                </span>
                <h2 id="feed-heading" className="text-2xl sm:text-4xl font-extrabold tracking-tight uppercase">
                  EDITORIAL FEED &amp; DISPATCHES
                </h2>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                CHRONOLOGICAL ARCHIVE • 2026
              </span>
            </div>

            {/* Clean Horizontal Editorial Rows with Hover Shift */}
            <div className="flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
              {filteredFeed.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  data-cursor-text="READ"
                  className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 py-5 sm:py-6 px-3 sm:px-5 transition-all duration-200 hover:bg-neutral-50/90 rounded-xl"
                >
                  {/* Left: Number + Category + Title */}
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-8 flex-1">
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-mono text-xs font-bold text-neutral-400 group-hover:text-[#6D54D4] transition-colors">
                        {item.number}
                      </span>
                      <span className="rounded-md bg-neutral-100 group-hover:bg-neutral-200/80 px-2.5 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-700 transition-colors">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-neutral-950 group-hover:text-[#6D54D4] group-hover:translate-x-1.5 transition-all duration-200">
                      {item.title}
                    </h3>
                  </div>

                  {/* Right: Metadata + Format + Arrow */}
                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 text-xs font-mono text-neutral-400">
                    <span className="hidden lg:inline text-neutral-500">{item.format}</span>
                    <span>{item.readTime}</span>
                    <span className="hidden sm:inline">{item.date}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white group-hover:border-[#6D54D4] group-hover:bg-[#6D54D4] group-hover:text-white transition-all shadow-sm">
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 06 / FINAL EDITORIAL CLOSING CTA                                   */}
        {/* ------------------------------------------------------------------ */}
        <section
          aria-label="Closing Call to Action"
          className="relative w-full bg-[#070709] text-white py-24 sm:py-36 overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[400px] w-[700px] rounded-full bg-radial from-[#6D54D4]/20 via-indigo-600/5 to-transparent blur-3xl opacity-70" />
          </div>

          <div className="relative z-10 mx-auto max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: premiumEase }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-6"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#6D54D4]" />
              <span className="text-xs font-mono font-semibold uppercase tracking-[0.25em] text-neutral-300">
                06 / THE HORIZON
              </span>
            </motion.div>

            {/* Convergent Heading */}
            <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight uppercase leading-[0.94] max-w-5xl flex flex-wrap justify-center gap-x-4 sm:gap-x-6">
              <motion.span
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: premiumEase }}
                className="inline-block text-white"
              >
                EXPLORE
              </motion.span>
              <motion.span
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, ease: premiumEase }}
                className="inline-block bg-gradient-to-r from-white via-indigo-200 to-[#6D54D4] bg-clip-text text-transparent"
              >
                WHAT&apos;S NEXT.
              </motion.span>
            </h2>

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, ease: premiumEase }}
              className="mt-6 sm:mt-8 max-w-xl text-sm sm:text-base md:text-lg text-neutral-400 font-normal leading-relaxed"
            >
              Research, perspectives, and ideas from the NOVA ecosystem. Join thousands of engineers, student squads, and partner labs building the future.
            </motion.p>

            {/* Action Suite */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4, ease: premiumEase }}
              className="mt-8 sm:mt-10 flex flex-wrap justify-center items-center gap-4"
            >
              <Link
                href="/#platform"
                className="group inline-flex items-center gap-2 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 px-7 py-3.5 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] hover:translate-y-[-1px]"
              >
                <span>Explore NOVA Ecosystem</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/get-started"
                className="group inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 px-7 py-3.5 text-sm sm:text-base font-medium backdrop-blur-md transition-all duration-200 hover:translate-y-[-1px] active:scale-[0.98]"
              >
                <span>Join Builder Community</span>
                <Sparkles className="h-4 w-4 text-indigo-300 opacity-70 transition-all duration-200 group-hover:opacity-100 group-hover:scale-110" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* 07 / GLOBAL SITE FOOTER */}
      <SiteFooter />
    </>
  );
}
