"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CapabilityAccent, getAccent } from "./capability-theme";
import { cn } from "@/lib/utils";

export interface OfferingSubItem {
  num: string;
  label: string;
  href?: string;
}

export interface CapabilityOffering {
  id: string;
  title: string;
  image: string;
  items: OfferingSubItem[];
}

interface Props {
  id: string;
  chapter: string;
  heading?: string;
  subtext: string;
  offerings: CapabilityOffering[];
  accent: CapabilityAccent;
}

export function SharedOfferingsSection({ id, chapter, heading = "Our Offerings", subtext, offerings, accent }: Props) {
  const a = getAccent(accent);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const prefersReducedMotion = useReducedMotion();
  const active = offerings[activeIndex];
  const left = active.items.slice(0, 3);
  const right = active.items.slice(3, 6);

  return (
    <section
      id={id}
      className="relative py-20 sm:py-28 bg-[#F6F7FA] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className={cn("absolute top-10 right-10 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none", a.orb1)} />
      <div className={cn("absolute bottom-10 left-10 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none", a.orb2)} />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_50px_0_rgba(31,38,135,0.06)] p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-start">

            {/* LEFT */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="mb-8">
                <span className={cn("text-[11px] font-mono font-semibold tracking-[0.24em] uppercase mb-3 block", a.text)}>
                  {chapter}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 leading-tight">
                  {heading}
                </h2>
                <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed mt-3">{subtext}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                {offerings.map((offering, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={offering.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "group relative flex items-center py-3.5 px-4 sm:px-5 rounded-xl text-left transition-all duration-200",
                        a.focusRing, "focus-visible:outline-none",
                        isActive
                          ? "bg-white shadow-xs font-semibold text-neutral-950"
                          : "hover:bg-white/60 text-neutral-600 hover:text-neutral-900 font-medium"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId={`activeTab-${id}`}
                          className={cn("absolute left-0 top-2 bottom-2 w-1 rounded-r-full", a.tabBg)}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      <span className="text-base sm:text-lg tracking-tight">{offering.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-8"
                >
                  <div className="relative w-full aspect-[16/7] sm:aspect-[21/8] overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-200/80 shadow-xs">
                    <Image
                      src={active.image}
                      alt={active.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 900px"
                      className="object-cover object-center opacity-90 transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-6 flex items-center gap-2 font-mono text-xs font-semibold text-white uppercase tracking-widest">
                      <span className={a.statText}>{active.title}</span>
                      <span>·</span>
                      <span className="text-neutral-300">NOVA Capability</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 pt-2">
                    {[left, right].map((col, ci) => (
                      <div key={ci} className="flex flex-col gap-4">
                        {col.map((item) => (
                          <Link
                            key={item.num}
                            href={item.href ?? "/contact"}
                            className={cn(
                              "group inline-flex items-baseline gap-2 text-sm sm:text-base font-normal text-neutral-800 transition-colors",
                              "focus-visible:outline-none rounded",
                              a.focusRing,
                              `hover:${a.text.replace("text-", "text-")}`
                            )}
                          >
                            <span className={cn("font-mono text-xs font-semibold", a.linkColor)}>{item.num}.</span>
                            <span className={cn("underline underline-offset-4 decoration-neutral-300 font-medium transition-colors", a.underlineHover)}>
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
