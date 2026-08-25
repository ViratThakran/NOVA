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
  dot: string;
  number: string;
  category: string;
  topicId: string;
  title: string;
  description: string;
  readTime: string;
  date: string;
  author: string;
  image: string;
  href: string;
}

const PERSPECTIVE_ARTICLES: PerspectiveArticle[] = [
  {
    id: "p1",
    dot: ".01",
    number: "01",
    category: "AI & TECHNOLOGY",
    topicId: "ai",
    title: "Constraint Modeling",
    description:
      "We design autonomous verification loops, property invariants, and deterministic agent scaffolds. By prioritizing constraint modeling over syntax generation, we ensure AI systems remain provably robust.",
    readTime: "8 min read",
    date: "August 2026",
    author: "NOVA Systems Group",
    image: "/images/cards/software.jpg",
    href: "/about",
  },
  {
    id: "p2",
    dot: ".02",
    number: "02",
    category: "LEARNING & SYSTEMS",
    topicId: "learning",
    title: "Production Realities",
    description:
      "We believe sandbox tutorials cultivate fragility. High-conviction engineering instinct only emerges when builders debug live state conflicts, network partitions, and real production commits.",
    readTime: "6 min read",
    date: "July 2026",
    author: "NOVA Academy & Pedagogy",
    image: "/images/cards/build.jpg",
    href: "/about",
  },
  {
    id: "p3",
    dot: ".03",
    number: "03",
    category: "FUTURE OF WORK",
    topicId: "work",
    title: "Agentic Commerce",
    description:
      "We architect API ecosystems and data services for autonomous agents negotiating micro-transactions, rate allocations, and verifiable cryptographic attestations in zero-trust environments.",
    readTime: "7 min read",
    date: "June 2026",
    author: "NOVA Research Labs",
    image: "/images/cards/products.jpg",
    href: "/about",
  },
  {
    id: "p4",
    dot: ".04",
    number: "04",
    category: "SYSTEMS & SCALE",
    topicId: "products",
    title: "Distributed State",
    description:
      "We build edge-native microservices with sub-second synchronization across distributed worker runtimes and global cache nodes without incurring architectural complexity penalties.",
    readTime: "7 min read",
    date: "May 2026",
    author: "NOVA Cloud Architecture",
    image: "/images/cards/grow.jpg",
    href: "/about",
  },
];

const DEEPDIVE_ACCORDION_STYLE = `
  .deepdive-track {
    display: flex;
    gap: 16px;
    align-items: stretch;
    height: 520px;
    width: 100%;
  }

  .deepdive-panel {
    flex: 1 1 0;
    min-width: 0;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    cursor: pointer;
    transition: flex 0.45s cubic-bezier(0.25, 1, 0.5, 1),
                box-shadow 0.3s ease,
                background 0.3s ease,
                border-color 0.3s ease;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px 20px 20px;
  }

  .deepdive-panel.deepdive-active {
    flex: 3.2 1 0;
    background: rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
    border-color: rgba(255, 255, 255, 0.22);
  }

  .deepdive-panel:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.16);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  }

  .deepdive-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.3;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .deepdive-active .deepdive-title {
    white-space: normal;
  }

  .deepdive-body {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    transform: translateY(8px);
    transition: opacity 0.35s ease 0.12s, transform 0.35s ease 0.12s, max-height 0.4s ease;
    pointer-events: none;
    margin-top: 10px;
  }

  .deepdive-active .deepdive-body {
    opacity: 1;
    max-height: 220px;
    transform: translateY(0);
    pointer-events: auto;
  }

  .deepdive-image-wrap {
    position: relative;
    border-radius: 14px;
    overflow: hidden;
    flex-shrink: 0;
    height: 190px;
    width: 100%;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.35s ease 0.15s, transform 0.35s ease 0.15s;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .deepdive-active .deepdive-image-wrap {
    opacity: 1;
    transform: translateY(0);
  }

  .deepdive-image-wrap img {
    transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .deepdive-active:hover .deepdive-image-wrap img {
    transform: scale(1.03);
  }

  .deepdive-num {
    font-size: clamp(2.5rem, 4vw, 4.5rem);
    font-weight: 900;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1;
    letter-spacing: -0.04em;
    user-select: none;
    align-self: flex-end;
    transition: opacity 0.3s ease, color 0.3s ease;
  }

  .deepdive-active .deepdive-num {
    position: absolute;
    bottom: 24px;
    right: 24px;
    color: #ffffff;
    font-size: clamp(2.5rem, 3.5vw, 4rem);
    z-index: 10;
    text-shadow: 0 2px 14px rgba(0, 0, 0, 0.8);
  }

  .deepdive-bottom {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    position: relative;
  }
`;

interface TopicFilter {
  id: string;
  number: string;
  label: string;
  count: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOPICS: TopicFilter[] = [
  {
    id: "all",
    number: "01",
    label: "ALL TOPICS",
    count: 7,
    description: "Complete index of NOVA research dispatches, architecture briefs, and editorial perspectives.",
    icon: Layers,
  },
  {
    id: "ai",
    number: "02",
    label: "AI & TECHNOLOGY",
    count: 3,
    description: "Autonomous reasoning architectures, deterministic agent scaffolds, and scalable systems engineering.",
    icon: Cpu,
  },
  {
    id: "work",
    number: "03",
    label: "FUTURE OF WORK",
    count: 2,
    description: "Builder squads, agile coordination models, agentic workflows, and the new engineering organization.",
    icon: Briefcase,
  },
  {
    id: "learning",
    number: "04",
    label: "LEARNING & SYSTEMS",
    count: 2,
    description: "Challenge-driven pedagogy, track records vs. credentials, and production apprentice frameworks.",
    icon: GraduationCap,
  },
  {
    id: "products",
    number: "05",
    label: "DIGITAL PRODUCTS",
    count: 2,
    description: "High-density UI/UX ergonomics, edge web infrastructure, and design systems for enterprise scale.",
    icon: Compass,
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
      <SiteHeader transparent={true} />

      <main className="flex flex-col min-h-screen bg-[#0a0a0a] text-white pt-16 selection:bg-white selection:text-black font-sans antialiased">
        {/* ------------------------------------------------------------------ */}
        {/* 01 / EDITORIAL HERO & MASTHEAD                                     */}
        {/* ------------------------------------------------------------------ */}
        <section
          aria-label="Editorial Masthead"
          className="relative w-full bg-neutral-950 pt-16 sm:pt-24 pb-14 sm:pb-20 overflow-hidden text-white"
        >
          {/* Cosmic Galaxy Background Image */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <Image
              src="/images/what-we-think-hero.png"
              alt="Cosmic galaxy background"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            {/* Dark gradient overlay to preserve star detail while ensuring text legibility */}
            <div className="absolute inset-0 bg-black/40 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(109,84,212,0.18),transparent)]" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-[1560px] flex-col gap-8 sm:gap-12 px-6 sm:px-10 lg:px-16 xl:px-20">
            {/* Masthead Eyebrow & Issue Indicator (Horizontal border removed) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-[#6D54D4] animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-neutral-300 drop-shadow">
                  01 / NOVA RESEARCH &amp; EDITORIAL WORLD
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-300 font-medium drop-shadow">
                <span>ISSUE 04 • QUARTERLY DISPATCH</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline text-neutral-300">OPEN ACCESS PERSPECTIVES</span>
              </div>
            </div>

            {/* Main Headline & Narrative Introduction */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
              <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
                <motion.h1
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: premiumEase }}
                  className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-black tracking-tight text-white uppercase leading-[0.93] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
                >
                  WE THINK ABOUT{" "}
                  <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                    WHAT&apos;S NEXT.
                  </span>
                </motion.h1>

                <motion.p
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: premiumEase }}
                  className="text-base sm:text-lg md:text-xl text-neutral-200 font-normal leading-relaxed max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
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
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-300 drop-shadow">
                  EDITORIAL CHAPTERS
                </span>
                <nav aria-label="Page Sections" className="flex flex-wrap gap-2 lg:justify-end">
                  <a
                    href="#featured-perspectives"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/40 hover:bg-black/60 hover:border-white/50 px-3.5 py-1.5 text-xs font-mono font-medium text-white transition-all backdrop-blur-md shadow-sm"
                  >
                    <span>02 / FEATURED</span>
                    <ChevronRight className="h-3 w-3 text-neutral-300" />
                  </a>
                  <a
                    href="#editorial-perspectives"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/40 hover:bg-black/60 hover:border-white/50 px-3.5 py-1.5 text-xs font-mono font-medium text-white transition-all backdrop-blur-md shadow-sm"
                  >
                    <span>03 / PERSPECTIVES</span>
                    <ChevronRight className="h-3 w-3 text-neutral-300" />
                  </a>
                  <a
                    href="#research-topics"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/40 hover:bg-black/60 hover:border-white/50 px-3.5 py-1.5 text-xs font-mono font-medium text-white transition-all backdrop-blur-md shadow-sm"
                  >
                    <span>04 / TOPICS</span>
                    <ChevronRight className="h-3 w-3 text-neutral-300" />
                  </a>
                  <a
                    href="#latest-thinking"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/40 hover:bg-black/60 hover:border-white/50 px-3.5 py-1.5 text-xs font-mono font-medium text-white transition-all backdrop-blur-md shadow-sm"
                  >
                    <span>05 / FEED</span>
                    <ChevronRight className="h-3 w-3 text-neutral-300" />
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
          className="scroll-mt-20 bg-[#0e0e12] py-20 sm:py-28 text-white border-b border-white/10"
        >
          <div className="mx-auto flex w-full max-w-[1560px] flex-col items-center gap-12 sm:gap-16 px-6 sm:px-10 lg:px-16 xl:px-20">
            {/* Centered Editorial Section Header */}
            <div className="flex flex-col items-center text-center max-w-3xl gap-3 sm:gap-4">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-neutral-400">
                02 / FEATURED EDITORIAL STORIES
              </span>

              <motion.h2
                id="featured-heading"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: premiumEase }}
                className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase"
              >
                Featured Perspectives &amp;{" "}
                <span className="text-indigo-400">
                  Research
                </span>
              </motion.h2>

              <motion.p
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: premiumEase }}
                className="text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed max-w-2xl px-4"
              >
                Selected dispatches examining the structural changes across software development, intelligent agents, and education.
              </motion.p>
            </div>

            {/* Preserved 3-Card Bento Grid with Glassmorphic Floating Cards */}
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
                    {/* 1. Tall Dominant Visual Container */}
                    <div
                      className={cn(
                        "relative w-full rounded-[28px] overflow-hidden bg-neutral-900 border border-white/10 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.5)] transition-all duration-500",
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                      {/* Overlaid Category Pill */}
                      <div className="absolute top-5 left-5 z-10">
                        <span className="rounded-lg bg-black/70 text-white px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider backdrop-blur-md border border-white/15">
                          {card.category}
                        </span>
                      </div>
                    </div>

                    {/* 2. Floating Overlapping Frosted Glass Card */}
                    <div
                      className={cn(
                        "relative -mt-16 sm:-mt-20 mx-3 sm:mx-4 flex flex-col justify-between p-6 sm:p-7 rounded-[22px] border transition-all duration-300 gap-3 min-h-[170px] sm:min-h-[190px]",
                        isActive
                          ? "bg-[#16161b]/90 backdrop-blur-2xl border-white/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/20"
                          : "bg-[#141418]/80 backdrop-blur-xl border-white/10 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)]"
                      )}
                    >
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-mono text-neutral-400 font-medium">
                          {card.readTime}
                        </span>

                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                          {card.title}
                        </h3>
                        <p className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed font-normal">
                          {card.description}
                        </p>
                      </div>

                      <div className="pt-1">
                        <Link
                          href={card.href}
                          className="group/link inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-indigo-300 underline underline-offset-4 decoration-white/30 hover:decoration-indigo-300 transition-colors"
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
        {/* 03 / PERSPECTIVES (EXPANDING ACCORDION CARDS - GLASSMORPHISM)      */}
        {/* ------------------------------------------------------------------ */}
        <section
          id="editorial-perspectives"
          aria-labelledby="perspectives-heading"
          className="scroll-mt-20 bg-[#0a0a0a] py-16 sm:py-24 border-b border-white/10 text-white overflow-hidden"
        >
          <style>{DEEPDIVE_ACCORDION_STYLE}</style>

          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-10 sm:gap-12 px-6 sm:px-10 lg:px-16 xl:px-20">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-8">
              <div className="flex flex-col gap-3.5 max-w-2xl">
                <div className="text-[11px] font-mono font-bold tracking-[0.28em] text-neutral-400 uppercase">
                  03 / DEEP DIVE PERSPECTIVES
                </div>
                <h2
                  id="perspectives-heading"
                  className="text-3xl sm:text-4xl lg:text-[50px] font-black tracking-tight text-white uppercase leading-[0.94]"
                >
                  SYSTEMS &amp;<br />ARCHITECTURAL ESSAYS.
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-neutral-400 leading-relaxed max-w-xs sm:pb-1 font-normal">
                In-depth architectural analysis and engineering perspectives written by researchers and builders at NOVA.
              </p>
            </div>

            {/* Desktop 4-Panel Expanding Accordion (lg+) */}
            <div className="hidden lg:block">
              <div
                className="deepdive-track"
                onMouseLeave={() => setActivePerspectiveIdx(0)}
              >
                {PERSPECTIVE_ARTICLES.map((article, idx) => {
                  const isActive = activePerspectiveIdx === idx;
                  return (
                    <div
                      key={article.dot}
                      className={`deepdive-panel${isActive ? " deepdive-active" : ""}`}
                      onMouseEnter={() => setActivePerspectiveIdx(idx)}
                      onClick={() => setActivePerspectiveIdx(idx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setActivePerspectiveIdx(idx);
                        }
                      }}
                      aria-expanded={isActive}
                    >
                      {/* Top: Title + expandable description */}
                      <div>
                        <p className="deepdive-title">{article.title}</p>
                        <div className="deepdive-body">
                          <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                            {article.description}
                          </p>
                          <Link
                            href={article.href}
                            className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold font-mono tracking-wider text-white hover:text-indigo-300 transition-colors uppercase"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>Read more</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Bottom: image (active) or big number (collapsed) */}
                      <div className="deepdive-bottom">
                        <div className="deepdive-image-wrap">
                          <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            sizes="480px"
                            className="object-cover object-center"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        </div>

                        <span className="deepdive-num">{article.dot}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tablet & Mobile: Vertical cards (<lg) */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-5">
              {PERSPECTIVE_ARTICLES.map((article) => (
                <div
                  key={article.dot}
                  className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 p-6 flex flex-col justify-between gap-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-bold text-white">{article.title}</h3>
                      <span className="text-3xl font-black text-neutral-300 leading-none font-mono">
                        {article.dot}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
                      {article.description}
                    </p>
                  </div>
                  <div className="relative h-44 rounded-xl overflow-hidden mt-2 border border-white/10">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 04 / TOPICS (SQUARE BOX CARDS GRID - GLASSMORPHISM)                */}
        {/* ------------------------------------------------------------------ */}
        <section
          id="research-topics"
          aria-labelledby="topics-heading"
          className="scroll-mt-20 bg-[#0e0e12] py-16 sm:py-24 border-b border-white/10 text-white"
        >
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-8 sm:gap-10 px-6 sm:px-10 lg:px-16 xl:px-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-neutral-400">
                  04 / RESEARCH TOPICS
                </span>
                <h2 id="topics-heading" className="text-2xl sm:text-4xl font-black tracking-tight uppercase text-white">
                  EXPLORE BY TOPIC
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
                <span>FILTER EDITORIAL FEED</span>
              </div>
            </div>

            {/* Small Square Cards Box Grid with Glassmorphism */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {TOPICS.map((topic) => {
                const isSelected = selectedTopic === topic.id;
                const IconComponent = topic.icon;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopic(topic.id)}
                    className={cn(
                      "group relative flex flex-col justify-between p-4 sm:p-5 text-left rounded-xl sm:rounded-2xl border transition-all duration-200 select-none min-h-[140px] sm:min-h-[160px]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                      isSelected
                        ? "bg-white/15 backdrop-blur-2xl text-white border-white/40 shadow-xl ring-1 ring-white/30"
                        : "bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl text-neutral-200 border-white/10 hover:border-white/25 hover:shadow-md"
                    )}
                  >
                    {/* Top row: Icon/Number and Count */}
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                          isSelected
                            ? "bg-white/20 border-white/30 text-white"
                            : "bg-white/[0.06] border-white/10 text-neutral-300 group-hover:border-white/25 group-hover:text-white"
                        )}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] font-mono font-bold transition-colors",
                          isSelected
                            ? "bg-white/25 text-white"
                            : "bg-white/10 text-neutral-300 group-hover:bg-white/15"
                        )}
                      >
                        {topic.count}
                      </span>
                    </div>

                    {/* Bottom: Topic Title & Number */}
                    <div className="flex flex-col gap-1.5 pt-2">
                      <span
                        className={cn(
                          "text-[10px] font-mono font-semibold uppercase tracking-wider",
                          isSelected ? "text-neutral-300" : "text-neutral-400"
                        )}
                      >
                        {topic.number} / TOPIC
                      </span>
                      <h3
                        className={cn(
                          "text-xs sm:text-sm font-bold uppercase tracking-tight leading-snug",
                          isSelected ? "text-white" : "text-neutral-200"
                        )}
                      >
                        {topic.label}
                      </h3>
                    </div>

                    {/* Active Accent Indicator */}
                    {isSelected && (
                      <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-400 rounded-full" />
                    )}
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
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-white/[0.03] backdrop-blur-xl px-5 py-3.5 border border-white/10 text-xs sm:text-sm text-neutral-300"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs uppercase text-indigo-400">
                  ACTIVE FILTER:
                </span>
                <span>{activeTopicObj.description}</span>
              </div>
              <span className="font-mono text-neutral-400 text-xs shrink-0">
                Showing {filteredFeed.length} publications
              </span>
            </motion.div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 05 / LATEST THINKING (EDITORIAL FEED - GLASSMORPHISM)              */}
        {/* ------------------------------------------------------------------ */}
        <section
          id="latest-thinking"
          aria-labelledby="feed-heading"
          className="scroll-mt-20 bg-[#0a0a0a] py-16 sm:py-24 border-b border-white/10 text-white"
        >
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-8 sm:gap-12 px-6 sm:px-10 lg:px-16 xl:px-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-neutral-400">
                  05 / LATEST THINKING
                </span>
                <h2 id="feed-heading" className="text-2xl sm:text-4xl font-black tracking-tight uppercase text-white">
                  EDITORIAL FEED &amp; DISPATCHES
                </h2>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                CHRONOLOGICAL ARCHIVE • 2026
              </span>
            </div>

            {/* Clean Horizontal Editorial Rows with Frosted Glass Hover */}
            <div className="flex flex-col divide-y divide-white/10 border-y border-white/10">
              {filteredFeed.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  data-cursor-text="READ"
                  className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 py-5 sm:py-6 px-3 sm:px-5 transition-all duration-200 hover:bg-white/[0.04] backdrop-blur-md rounded-xl"
                >
                  {/* Left: Number + Category + Title */}
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-8 flex-1">
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-mono text-xs font-bold text-neutral-400 group-hover:text-white transition-colors">
                        {item.number}
                      </span>
                      <span className="rounded-md bg-white/[0.08] group-hover:bg-white/[0.14] px-2.5 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-300 group-hover:text-white border border-white/10 transition-colors">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white group-hover:text-neutral-200 group-hover:translate-x-1.5 transition-all duration-200">
                      {item.title}
                    </h3>
                  </div>

                  {/* Right: Metadata + Format + Arrow */}
                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 text-xs font-mono text-neutral-400">
                    <span className="hidden lg:inline text-neutral-400">{item.format}</span>
                    <span>{item.readTime}</span>
                    <span className="hidden sm:inline">{item.date}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-white group-hover:border-white group-hover:bg-white group-hover:text-black transition-all shadow-sm">
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
              className="text-xs font-mono font-semibold uppercase tracking-[0.28em] text-neutral-400 mb-6"
            >
              06 / THE HORIZON
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
