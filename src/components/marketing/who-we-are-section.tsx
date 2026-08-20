"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { HeartHandshake, ArrowUpRight } from "lucide-react";

interface Step {
  dot: string;
  title: string;
  description: string;
  image: string;
  href: string;
}

const STEPS: Step[] = [
  {
    dot: ".01",
    title: "Mission",
    description:
      "We exist to remove the artificial barriers between technical education and real-world engineering. By providing challenge-driven labs and live project squads, we empower builders worldwide to prove their value through real software.",
    image: "/images/cards/learn.jpg",
    href: "/about",
  },
  {
    dot: ".02",
    title: "Vision",
    description:
      "We believe static credentials take a back seat to inspectable code commits and production deployments. The future belongs to engineers who can design, ship, and scale resilient architectures.",
    image: "/images/cards/build.jpg",
    href: "/about",
  },
  {
    dot: ".03",
    title: "People",
    description:
      "We unite curious engineers, technical leads, and partner technology organizations. Our community is built on rigorous peer review, generous mentorship, and the highest standards of craft.",
    image: "/images/cards/experience.jpg",
    href: "/about",
  },
  {
    dot: ".04",
    title: "Impact",
    description:
      "We route proven builders directly into paid industry residencies, production squad roles, and venture opportunities — unlocking economic mobility through demonstrated execution.",
    image: "/images/cards/grow.jpg",
    href: "/about",
  },
];

const ACCORDION_STYLE = `
  .wwa-track {
    display: flex;
    gap: 16px;
    align-items: stretch;
    height: 520px;
    width: 100%;
  }

  .wwa-panel {
    flex: 1 1 0;
    min-width: 0;
    border-radius: 20px;
    background: #ffffff;
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    overflow: hidden;
    cursor: pointer;
    transition: flex 0.45s cubic-bezier(0.25, 1, 0.5, 1),
                box-shadow 0.3s ease,
                border-color 0.3s ease;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px 20px 20px;
  }

  .wwa-panel.wwa-active {
    flex: 3.2 1 0;
    box-shadow: 0 10px 32px rgba(0,0,0,0.07);
    border-color: rgba(0,0,0,0.12);
  }

  .wwa-panel:hover {
    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
  }

  /* ── Title ── */
  .wwa-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #0a0a0a;
    line-height: 1.3;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wwa-active .wwa-title {
    white-space: normal;
  }

  /* ── Expandable content block ── */
  .wwa-body {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    transform: translateY(8px);
    transition: opacity 0.35s ease 0.12s, transform 0.35s ease 0.12s, max-height 0.4s ease;
    pointer-events: none;
    margin-top: 10px;
  }

  .wwa-active .wwa-body {
    opacity: 1;
    max-height: 220px;
    transform: translateY(0);
    pointer-events: auto;
  }

  /* ── Bottom image ── */
  .wwa-image-wrap {
    position: relative;
    border-radius: 14px;
    overflow: hidden;
    flex-shrink: 0;
    height: 190px;
    width: 100%;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.35s ease 0.15s, transform 0.35s ease 0.15s;
  }

  .wwa-active .wwa-image-wrap {
    opacity: 1;
    transform: translateY(0);
  }

  .wwa-image-wrap img {
    transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .wwa-active:hover .wwa-image-wrap img {
    transform: scale(1.03);
  }

  /* ── Big step number ── */
  .wwa-num {
    font-size: clamp(2.5rem, 4vw, 4.5rem);
    font-weight: 900;
    color: #0a0a0a;
    line-height: 1;
    letter-spacing: -0.04em;
    user-select: none;
    align-self: flex-end;
    transition: opacity 0.3s ease, color 0.3s ease;
  }

  /* In active state, number sits over the image */
  .wwa-active .wwa-num {
    position: absolute;
    bottom: 24px;
    right: 24px;
    color: #ffffff;
    font-size: clamp(2.5rem, 3.5vw, 4rem);
    z-index: 10;
    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  }

  .wwa-bottom {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    position: relative;
  }
`;

export function WhoWeAreSection() {
  const [activeIdx, setActiveIdx] = React.useState<number>(0);

  return (
    <section
      id="who-we-are"
      className="scroll-mt-16 bg-[#F7F7F8] py-16 sm:py-24 border-b border-neutral-200 text-neutral-900 overflow-hidden"
    >
      <style>{ACCORDION_STYLE}</style>

      <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-10 sm:gap-12">

        {/* ── Section Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-300/80 pb-8">
          <div className="flex flex-col gap-3.5 max-w-2xl">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-[0.28em] text-neutral-500 uppercase">
              <HeartHandshake className="h-3.5 w-3.5 text-indigo-500" />
              <span>05 / WHO WE ARE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[50px] font-black tracking-tight text-neutral-950 uppercase leading-[0.94]">
              THE PEOPLE &amp;<br />THE PURPOSE.
            </h2>
          </div>
          <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed max-w-xs sm:pb-1 font-normal">
            An open ecosystem engineered to cultivate technical mastery, foster builder culture, and connect demonstrated capability with ambitious teams worldwide.
          </p>
        </div>

        {/* ── Desktop 4-Panel Accordion (lg+) ── */}
        <div className="hidden lg:block">
          <div
            className="wwa-track"
            onMouseLeave={() => setActiveIdx(0)}
          >
            {STEPS.map((step, idx) => {
              const isActive = activeIdx === idx;
              return (
                <div
                  key={step.dot}
                  className={`wwa-panel${isActive ? " wwa-active" : ""}`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => setActiveIdx(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveIdx(idx);
                    }
                  }}
                  aria-expanded={isActive}
                >
                  {/* ── Top: Title + expandable description ── */}
                  <div>
                    <p className="wwa-title">{step.title}</p>
                    <div className="wwa-body">
                      <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                        {step.description}
                      </p>
                      <Link
                        href={step.href}
                        className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold font-mono tracking-wider text-neutral-600 hover:text-neutral-950 transition-colors uppercase"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Read more</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>

                  {/* ── Bottom: image (active) or big number (collapsed) ── */}
                  <div className="wwa-bottom">
                    {/* Image — only visible when active */}
                    <div className="wwa-image-wrap">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        sizes="480px"
                        className="object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    </div>

                    {/* Step number */}
                    <span className="wwa-num">{step.dot}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tablet & Mobile: Vertical cards (<lg) ── */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-5">
          {STEPS.map((step) => (
            <div
              key={step.dot}
              className="rounded-2xl bg-white border border-neutral-200/80 p-6 flex flex-col justify-between gap-4 shadow-xs"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-neutral-900">{step.title}</h3>
                  <span className="text-3xl font-black text-neutral-900 leading-none font-mono">{step.dot}</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">{step.description}</p>
              </div>
              <div className="relative h-44 rounded-xl overflow-hidden mt-2">
                <Image
                  src={step.image}
                  alt={step.title}
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
  );
}