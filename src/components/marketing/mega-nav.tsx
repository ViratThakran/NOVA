"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEGA_NAV_SECTIONS } from "./content";

interface MegaNavProps {
  light?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface MegaNavItem {
  label: string;
  href: string;
  description?: string;
}

type MegaNavSection = (typeof MEGA_NAV_SECTIONS)[number];

// ── Interactive Navigation Link with clean typography & subtle arrow on hover ──
function MegaNavLink({
  item,
  onClose,
  index,
  reduced,
}: {
  item: MegaNavItem;
  onClose: () => void;
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: 0.02 + index * 0.018, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={item.href}
        role="menuitem"
        onClick={onClose}
        className="group/item flex items-center justify-between py-2 px-3 rounded-lg text-[#E5E5EA] hover:text-[#F5F5F5] hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/70 transition-all duration-200"
      >
        <span className="text-[15px] sm:text-[15.5px] font-medium tracking-[-0.01em] transition-transform duration-200 group-hover/item:translate-x-1.5 group-hover/item:text-[#F5F5F5] leading-snug">
          {item.label}
        </span>
        <ArrowRight
          className="h-3.5 w-3.5 text-indigo-400 opacity-0 -translate-x-1.5 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:translate-x-0 group-focus-visible/item:opacity-100 group-focus-visible/item:translate-x-0 shrink-0 ml-2"
          aria-hidden="true"
        />
      </Link>
    </motion.div>
  );
}

// ── 1. WHAT WE DO Full-Width Mega-Menu ──────────────────────────────────────
function WhatWeDoMegaMenu({
  section,
  onClose,
  reduced,
}: {
  section: MegaNavSection;
  onClose: () => void;
  reduced: boolean;
}) {
  const capabilitiesGroup = section.groups.find((g) => g.title === "CAPABILITIES");
  const industriesGroup = section.groups.find((g) => g.title === "INDUSTRIES");

  return (
    <div className="w-full bg-[#1C1C1E] text-[#F5F5F5] border-b border-white/[0.08] shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
      {/* 1px subtle top accent line linking the navbar to mega-menu */}
      <div className="h-px bg-white/[0.08] w-full" aria-hidden="true" />

      {/* Main content surface adhering to NOVA's global max-width container */}
      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 py-8 lg:py-9">
        {/* Two-area layout: CAPABILITIES (left) + INDUSTRIES (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
          {/* ── LEFT SECTION: CAPABILITIES (7 Cols) ── */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Section Header */}
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.03 }}
              className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
                <h3 className="text-[11px] font-mono font-semibold tracking-[0.24em] uppercase text-[#85858A]">
                  CAPABILITIES
                </h3>
              </div>
              <span className="text-[10.5px] font-mono text-[#85858A] uppercase tracking-wider">
                07 Disciplines
              </span>
            </motion.div>

            {/* Capabilities Grid: 2 Columns with refined gaps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 lg:gap-x-10 gap-y-1 sm:gap-y-1.5">
              {capabilitiesGroup?.items.map((item, i) => (
                <MegaNavLink
                  key={item.label}
                  item={item}
                  onClose={onClose}
                  index={i}
                  reduced={!!reduced}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT SECTION: INDUSTRIES (5 Cols, subtle vertical border on left) ── */}
          <div className="lg:col-span-5 flex flex-col lg:border-l lg:border-white/[0.08] lg:pl-10 xl:pl-14">
            {/* Section Header */}
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/70" aria-hidden="true" />
                <h3 className="text-[11px] font-mono font-semibold tracking-[0.24em] uppercase text-[#85858A]">
                  INDUSTRIES
                </h3>
              </div>
              <span className="text-[10.5px] font-mono text-[#85858A] uppercase tracking-wider">
                07 Sectors
              </span>
            </motion.div>

            {/* Industries Grid: 2 Columns with refined gaps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 lg:gap-x-8 gap-y-1 sm:gap-y-1.5">
              {industriesGroup?.items.map((item, i) => (
                <MegaNavLink
                  key={item.label}
                  item={item}
                  onClose={onClose}
                  index={i + 7}
                  reduced={!!reduced}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM ARCHITECTURAL STRIP ── */}
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-7 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <span className="font-mono text-[10.5px] font-medium text-[#85858A] uppercase tracking-widest">
            NOVA CAPABILITY &amp; SECTOR DIRECTORY
          </span>
          <Link
            href={section.cta.href}
            onClick={onClose}
            className="group/all inline-flex items-center gap-1.5 font-medium text-[#A0A0A5] hover:text-[#F5F5F5] transition-colors duration-200"
          >
            <span>{section.cta.label}</span>
            <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover/all:translate-x-1 transition-transform duration-200" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

// ── 2. WHO WE ARE Full-Width Mega-Menu ──────────────────────────────────────
// ── 2. WHO WE ARE Full-Width Mega-Menu ──────────────────────────────────────
function WhoWeAreMegaMenu({
  section,
  onClose,
  reduced,
}: {
  section: MegaNavSection;
  onClose: () => void;
  reduced: boolean;
}) {
  const aboutGroup = section.groups.find((g) => g.title === "ABOUT NOVA");
  const peopleGroup = section.groups.find((g) => g.title === "PEOPLE & CULTURE");
  const impactGroup = section.groups.find((g) => g.title === "IMPACT & TRUST");

  return (
    <div className="w-full bg-[#1C1C1E] text-[#F5F5F5] border-b border-white/[0.08] shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
      {/* 1px top accent line */}
      <div className="h-px bg-white/[0.08] w-full" aria-hidden="true" />

      {/* Main content container */}
      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 py-8 lg:py-9">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
          {/* ── 1. ABOUT NOVA (4 Cols) ── */}
          <div className="lg:col-span-4 flex flex-col">
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.03 }}
              className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
                <h3 className="text-[11px] font-mono font-semibold tracking-[0.24em] uppercase text-[#85858A]">
                  ABOUT NOVA
                </h3>
              </div>
            </motion.div>

            <div className="flex flex-col gap-1">
              {aboutGroup?.items.map((item, i) => (
                <MegaNavLink
                  key={item.label}
                  item={item}
                  onClose={onClose}
                  index={i}
                  reduced={!!reduced}
                />
              ))}
            </div>
          </div>

          {/* ── 2. PEOPLE & CULTURE (4 Cols, subtle divider) ── */}
          <div className="lg:col-span-4 flex flex-col lg:border-l lg:border-white/[0.08] lg:pl-8 xl:pl-10">
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/80" aria-hidden="true" />
                <h3 className="text-[11px] font-mono font-semibold tracking-[0.24em] uppercase text-[#85858A]">
                  PEOPLE &amp; CULTURE
                </h3>
              </div>
            </motion.div>

            <div className="flex flex-col gap-1">
              {peopleGroup?.items.map((item, i) => (
                <MegaNavLink
                  key={item.label}
                  item={item}
                  onClose={onClose}
                  index={i + 4}
                  reduced={!!reduced}
                />
              ))}
            </div>
          </div>

          {/* ── 3. IMPACT & TRUST (4 Cols, subtle divider) ── */}
          <div className="lg:col-span-4 flex flex-col lg:border-l lg:border-white/[0.08] lg:pl-8 xl:pl-10">
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.07 }}
              className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
                <h3 className="text-[11px] font-mono font-semibold tracking-[0.24em] uppercase text-[#85858A]">
                  IMPACT &amp; TRUST
                </h3>
              </div>
            </motion.div>

            <div className="flex flex-col gap-1">
              {impactGroup?.items.map((item, i) => (
                <MegaNavLink
                  key={item.label}
                  item={item}
                  onClose={onClose}
                  index={i + 8}
                  reduced={!!reduced}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM ARCHITECTURAL STRIP ── */}
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-7 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <span className="font-mono text-[10.5px] font-medium text-[#85858A] uppercase tracking-widest">
            NOVA ORGANIZATIONAL DIRECTORY
          </span>
          <Link
            href={section.cta.href}
            onClick={onClose}
            className="group/all inline-flex items-center gap-1.5 font-medium text-[#A0A0A5] hover:text-[#F5F5F5] transition-colors duration-200"
          >
            <span>{section.cta.label}</span>
            <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover/all:translate-x-1 transition-transform duration-200" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

// ── 3. CAREERS Full-Width Mega-Menu ─────────────────────────────────────────
function CareersMegaMenu({
  section,
  onClose,
  reduced,
}: {
  section: MegaNavSection;
  onClose: () => void;
  reduced: boolean;
}) {
  const opportunitiesGroup = section.groups.find((g) => g.title === "OPPORTUNITIES");
  const learningGroup = section.groups.find((g) => g.title === "LEARNING & GROWTH");
  const lifeGroup = section.groups.find((g) => g.title === "LIFE AT NOVA");

  return (
    <div className="w-full bg-[#1C1C1E] text-[#F5F5F5] border-b border-white/[0.08] shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
      {/* 1px top accent line */}
      <div className="h-px bg-white/[0.08] w-full" aria-hidden="true" />

      {/* Main content container */}
      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 py-8 lg:py-9">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
          {/* ── 1. OPPORTUNITIES (4 Cols) ── */}
          <div className="lg:col-span-4 flex flex-col">
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.03 }}
              className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
                <h3 className="text-[11px] font-mono font-semibold tracking-[0.24em] uppercase text-[#85858A]">
                  OPPORTUNITIES
                </h3>
              </div>
            </motion.div>

            <div className="flex flex-col gap-1">
              {opportunitiesGroup?.items.map((item, i) => (
                <MegaNavLink
                  key={item.label}
                  item={item}
                  onClose={onClose}
                  index={i}
                  reduced={!!reduced}
                />
              ))}
            </div>
          </div>

          {/* ── 2. LEARNING & GROWTH (4 Cols, subtle divider) ── */}
          <div className="lg:col-span-4 flex flex-col lg:border-l lg:border-white/[0.08] lg:pl-8 xl:pl-10">
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/80" aria-hidden="true" />
                <h3 className="text-[11px] font-mono font-semibold tracking-[0.24em] uppercase text-[#85858A]">
                  LEARNING &amp; GROWTH
                </h3>
              </div>
            </motion.div>

            <div className="flex flex-col gap-1">
              {learningGroup?.items.map((item, i) => (
                <MegaNavLink
                  key={item.label}
                  item={item}
                  onClose={onClose}
                  index={i + 4}
                  reduced={!!reduced}
                />
              ))}
            </div>
          </div>

          {/* ── 3. LIFE AT NOVA (4 Cols, subtle divider) ── */}
          <div className="lg:col-span-4 flex flex-col lg:border-l lg:border-white/[0.08] lg:pl-8 xl:pl-10">
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.07 }}
              className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
                <h3 className="text-[11px] font-mono font-semibold tracking-[0.24em] uppercase text-[#85858A]">
                  LIFE AT NOVA
                </h3>
              </div>
            </motion.div>

            <div className="flex flex-col gap-1">
              {lifeGroup?.items.map((item, i) => (
                <MegaNavLink
                  key={item.label}
                  item={item}
                  onClose={onClose}
                  index={i + 8}
                  reduced={!!reduced}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM ARCHITECTURAL STRIP ── */}
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-7 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <span className="font-mono text-[10.5px] font-medium text-[#85858A] uppercase tracking-widest">
            NOVA BUILDER TALENT &amp; OPPORTUNITIES
          </span>
          <Link
            href={section.cta.href}
            onClick={onClose}
            className="group/all inline-flex items-center gap-1.5 font-medium text-[#A0A0A5] hover:text-[#F5F5F5] transition-colors duration-200"
          >
            <span>{section.cta.label}</span>
            <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover/all:translate-x-1 transition-transform duration-200" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

// ── Main MegaNav ────────────────────────────────────────────────────────────
export function MegaNav({ light = false, onOpenChange }: MegaNavProps) {
  const pathname = usePathname();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = React.useState<number>(64);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Dynamically measure the exact bottom edge of the desktop navbar
  React.useEffect(() => {
    const updateHeight = () => {
      const headerEl = containerRef.current?.closest("header");
      if (headerEl) {
        setHeaderHeight(headerEl.getBoundingClientRect().height);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const clearTimers = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  }, []);

  const handleOpen = React.useCallback(
    (id: string, immediate = false) => {
      clearTimers();
      if (immediate) {
        setOpenId(id);
        onOpenChange?.(true);
      } else {
        openTimer.current = setTimeout(() => {
          setOpenId(id);
          onOpenChange?.(true);
        }, 60);
      }
    },
    [clearTimers, onOpenChange]
  );

  const handleScheduleClose = React.useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => {
      setOpenId(null);
      onOpenChange?.(false);
    }, 240);
  }, [clearTimers, onOpenChange]);

  const handleImmediateClose = React.useCallback(() => {
    clearTimers();
    setOpenId(null);
    onOpenChange?.(false);
  }, [clearTimers, onOpenChange]);

  const toggleSection = React.useCallback(
    (id: string) => {
      clearTimers();
      setOpenId((curr) => {
        const next = curr === id ? null : id;
        onOpenChange?.(Boolean(next));
        return next;
      });
    },
    [clearTimers, onOpenChange]
  );

  // Close on Escape & return focus to trigger
  React.useEffect(() => {
    if (!openId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        const trigger = containerRef.current?.querySelector<HTMLButtonElement>(`[data-nav-trigger="${openId}"]`);
        handleImmediateClose();
        trigger?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openId, handleImmediateClose]);

  // Close on clicking outside container
  React.useEffect(() => {
    if (!openId) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleImmediateClose();
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [openId, handleImmediateClose]);

  const isWhatWeThinkActive = pathname === "/what-we-think";
  const activeSection = MEGA_NAV_SECTIONS.find((s) => s.id === openId);

  const navItems = [
    { type: "menu" as const, section: MEGA_NAV_SECTIONS.find((s) => s.id === "what-we-do") },
    { type: "menu" as const, section: MEGA_NAV_SECTIONS.find((s) => s.id === "who-we-are") },
    { type: "link" as const, label: "What We Think", href: "/what-we-think" },
    { type: "menu" as const, section: MEGA_NAV_SECTIONS.find((s) => s.id === "careers") },
  ].filter((item) => item.type === "link" || Boolean(item.section));

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center"
      onMouseLeave={handleScheduleClose}
    >
      {/* ── Nav triggers ── */}
      <div className="flex items-center gap-0.5">
        {navItems.map((item) => {
          if (item.type === "link") {
            return (
              <Link
                key={item.href}
                href={item.href!}
                onMouseEnter={handleImmediateClose}
                onFocus={handleImmediateClose}
                className={cn(
                  "group relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60",
                  isWhatWeThinkActive
                    ? light
                      ? "text-white font-semibold"
                      : "text-neutral-950 font-semibold"
                    : light
                    ? "text-[#E5E5EA] hover:text-white"
                    : "text-neutral-600 hover:text-neutral-950"
                )}
              >
                {item.label}
                {isWhatWeThinkActive && (
                  <motion.span
                    layoutId="activeNavLine"
                    className="absolute bottom-0.5 left-3.5 right-3.5 h-px bg-indigo-500"
                    transition={{ duration: 0.18 }}
                  />
                )}
              </Link>
            );
          }

          const section = item.section!;
          const isOpen = openId === section.id;
          const isSectionActive =
            section.id === "what-we-do"
              ? pathname.startsWith("/what-we-do")
              : pathname === section.href;
          const isActive = isOpen || isSectionActive;

          return (
            <button
              key={section.id}
              type="button"
              data-nav-trigger={section.id}
              aria-expanded={isOpen}
              aria-haspopup="true"
              onMouseEnter={() => handleOpen(section.id)}
              onFocus={() => handleOpen(section.id, true)}
              onClick={() => toggleSection(section.id)}
              className={cn(
                "group relative flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60",
                isActive
                  ? light
                    ? "text-white font-semibold"
                    : "text-neutral-950 font-semibold"
                  : light
                  ? "text-[#E5E5EA] hover:text-white"
                  : "text-neutral-600 hover:text-neutral-950"
              )}
            >
              {section.label}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 opacity-50 transition-all duration-200",
                  isOpen ? "rotate-180 opacity-100" : "group-hover:opacity-80"
                )}
                aria-hidden="true"
              />
              {isActive && (
                <motion.span
                  layoutId="activeNavLine"
                  className="absolute bottom-0.5 left-3.5 right-3.5 h-px bg-indigo-500"
                  transition={{ duration: 0.18 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Panel & Backdrop ── */}
      <AnimatePresence>
        {activeSection && (
          <React.Fragment key={activeSection.id}>
            {/* Backdrop Overlay */}
            <motion.div
              key={`backdrop-${activeSection.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleImmediateClose}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs pointer-events-auto"
              style={{ top: `${headerHeight}px` }}
              aria-hidden="true"
            />

            {/* Full-Width Menu Surface */}
            <motion.div
              key={`panel-${activeSection.id}`}
              role="menu"
              aria-label={activeSection.label}
              onMouseEnter={clearTimers}
              onMouseLeave={handleScheduleClose}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ top: `${headerHeight}px` }}
              className="fixed inset-x-0 z-40 w-full"
            >
              {activeSection.id === "what-we-do" && (
                <WhatWeDoMegaMenu
                  section={activeSection}
                  onClose={handleImmediateClose}
                  reduced={!!prefersReducedMotion}
                />
              )}
              {activeSection.id === "who-we-are" && (
                <WhoWeAreMegaMenu
                  section={activeSection}
                  onClose={handleImmediateClose}
                  reduced={!!prefersReducedMotion}
                />
              )}
              {activeSection.id === "careers" && (
                <CareersMegaMenu
                  section={activeSection}
                  onClose={handleImmediateClose}
                  reduced={!!prefersReducedMotion}
                />
              )}
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}
