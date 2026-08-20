"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Safe ScrollTrigger registration for Next.js SSR
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface StepItem {
  number: string;
  tag: string;
  headline: string;
  body: string;
  href?: string;
  linkText?: string;
}

const TALENT_STEPS: StepItem[] = [
  {
    number: "01",
    tag: "ENGINEERING INTERNSHIPS",
    headline: "Production residencies with live service commits alongside senior staff engineers.",
    body: "We embed builders directly into live codebases, distributed architectures, and mission-critical cloud pipelines from day one.",
    href: "/internship-programs",
    linkText: "Explore Engineering Internships",
  },
  {
    number: "02",
    tag: "COLLABORATIVE SQUADS",
    headline: "Agile cross-functional squads executing high-throughput architecture challenges.",
    body: "Work on real problems with real teams. Turn your code into a concrete track record of verified commits, peer reviews, and live deployments.",
    href: "/internship-programs",
    linkText: "Explore Collaborative Squads",
  },
  {
    number: "03",
    tag: "SYSTEM RESIDENCIES",
    headline: "Deep-dive into distributed database sharding, autonomous intelligence, and edge systems.",
    body: "Master scalable backends, low-latency microservices, and robust cloud infrastructure through intensive engineering immersion.",
    href: "/internship-programs",
    linkText: "Explore System Residencies",
  },
  {
    number: "04",
    tag: "INDUSTRY PLACEMENT",
    headline: "Fast-track pipeline into full-time roles at partner technology companies and high-growth startups.",
    body: "Connect verified capability and shipping experience directly with premier engineering organizations worldwide.",
    href: "/internship-programs",
    linkText: "Explore Industry Placement",
  },
  {
    number: "05",
    tag: "STAFF ARCHITECT MENTORSHIP",
    headline: "1-on-1 architectural roadmaps, code reviews, and career guidance from industry veterans.",
    body: "Receive targeted system design breakdowns, production war-room reviews, and strategic guidance from experienced engineering leaders.",
    href: "/internship-programs",
    linkText: "Explore Staff Mentorship",
  },
  {
    number: "06",
    tag: "GLOBAL FELLOWSHIP",
    headline: "Lifetime network of founders, engineers, and researchers shipping software worldwide.",
    body: "Collaborate with an elite international collective of builders shaping the future of autonomous systems and distributed computing.",
    href: "/internship-programs",
    linkText: "Explore Global Fellowship",
  },
  {
    number: "07",
    tag: "SYSTEMS BOOTCAMP",
    headline: "Intensive hands-on training covering modern full-stack, DevOps, and cloud primitives.",
    body: "Build practical mastery across container orchestration, serverless microservices, real-time streaming, and CI/CD automation.",
    href: "/internship-programs",
    linkText: "Explore Systems Bootcamp",
  },
  {
    number: "08",
    tag: "APPLIED AI RESEARCH",
    headline: "Develop custom reasoning models, fine-tuned agent loops, and evaluation frameworks.",
    body: "Bridge theoretical machine learning with production inference, multi-agent coordination, and high-performance neural compute.",
    href: "/internship-programs",
    linkText: "Explore Applied AI Research",
  },
];

/**
 * Word-Splitting Helper: Splits paragraph string into individual <span class="word"> elements
 */
function splitWords(text: string) {
  return text.split(" ").map((word, wordIdx) => (
    <span
      key={wordIdx}
      className="word inline-block mr-[0.28em] text-white/20 will-change-[opacity,color]"
    >
      {word}
    </span>
  ));
}

export function CareersSection() {
  const triggerWrapperRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [activeStepIndex, setActiveStepIndex] = React.useState(0);

  React.useEffect(() => {
    if (!triggerWrapperRef.current) return;

    cardRefs.current = cardRefs.current.slice(0, TALENT_STEPS.length);

    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      const totalSteps = cards.length;
      if (totalSteps === 0) return;

      // ─────────────────────────────────────────────────────────────────
      // 1. INITIAL STATE (Step 0 visible, Steps 1..7 hidden at y: 40px)
      // ─────────────────────────────────────────────────────────────────
      cards.forEach((card, i) => {
        gsap.set(card, {
          autoAlpha: i === 0 ? 1 : 0,
          y: i === 0 ? 0 : 40,
          pointerEvents: i === 0 ? "auto" : "none",
        });

        // Initialize words to dimmed opacity (0.2)
        const words = card.querySelectorAll<HTMLElement>(".word");
        gsap.set(words, {
          opacity: 0.2,
          color: "rgba(255, 255, 255, 0.2)",
        });
      });

      // ─────────────────────────────────────────────────────────────────
      // 2. MASTER PINNED SCROLLTRIGGER TIMELINE
      // ─────────────────────────────────────────────────────────────────
      const mainTl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerWrapperRef.current,
          start: "top top",
          end: "+=4200",   // Generous scroll height buffer for 8 steps
          pin: true,       // GSAP native pinning
          scrub: 1,        // 1-second smooth inertia lag
          anticipatePin: 1,
          onUpdate: (self) => {
            const currentIdx = Math.min(
              totalSteps - 1,
              Math.max(0, Math.floor(self.progress * totalSteps))
            );
            setActiveStepIndex(currentIdx);
          },
        },
      });

      // ─────────────────────────────────────────────────────────────────
      // 3. MASTER TIMELINE: WORD SCRUBBING + IN-PLACE CARD SWAPPING
      // ─────────────────────────────────────────────────────────────────
      cards.forEach((card, index) => {
        const words = card.querySelectorAll<HTMLElement>(".word");
        const stepLabel = `step_${index}`;

        mainTl.addLabel(stepLabel);

        // A. Word Scrubbing: Progressively illuminate each word from 0.2 -> 1.0
        if (words.length > 0) {
          mainTl.to(
            words,
            {
              opacity: 1,
              color: "#ffffff",
              stagger: 0.08,
              duration: 1.8,
              ease: "none",
            },
            stepLabel
          );
        }

        // B. Hold reading window
        mainTl.to({}, { duration: 0.6 });

        // C. Card Cross-Fade: Outgoing slides up (y: -40), Incoming rises up (y: 40 -> 0)
        if (index < totalSteps - 1) {
          const nextCard = cards[index + 1];
          const transLabel = `trans_${index}_to_${index + 1}`;

          mainTl.addLabel(transLabel);

          // Animate outgoing card out
          mainTl.to(
            card,
            {
              autoAlpha: 0,
              y: -40,
              duration: 0.8,
              ease: "power2.inOut",
              onStart: () => {
                card.style.pointerEvents = "none";
              },
              onReverseComplete: () => {
                card.style.pointerEvents = "auto";
              },
            },
            transLabel
          );

          // Animate incoming card in with 20% overlap
          mainTl.fromTo(
            nextCard,
            {
              autoAlpha: 0,
              y: 40,
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              onStart: () => {
                nextCard.style.pointerEvents = "auto";
              },
              onReverseComplete: () => {
                nextCard.style.pointerEvents = "none";
              },
            },
            "<+=0.2"
          );
        }
      });
    }, triggerWrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative w-full overflow-visible bg-[#09090b]">
      {/* ─── Top Boundary Transition ─── */}
      <div className="w-full bg-[#FAFAFA] flex flex-col pointer-events-none select-none" aria-hidden="true">
        <div className="h-[1.5px] bg-[#09090b]" />
        <div className="h-[3px] bg-[#FAFAFA]" />
        <div className="h-[3.5px] bg-[#09090b]" />
        <div className="h-[4px] bg-[#FAFAFA]" />
        <div className="h-[8px] bg-[#09090b]" />
        <div className="h-[5px] bg-[#FAFAFA]" />
        <div className="h-[16px] bg-[#09090b]" />
      </div>

      {/* ─── Pinned Scroll Trigger Wrapper (.scroll-section-wrapper) ─── */}
      <section
        ref={triggerWrapperRef}
        id="careers"
        aria-label="Talent and Opportunity Pathways"
        className="scroll-section-wrapper relative w-full h-screen bg-[#09090b] text-white flex flex-col justify-between px-6 sm:px-12 lg:px-20 xl:px-28 pt-24 sm:pt-28 pb-12 sm:pb-16 overflow-hidden select-none"
      >
        {/* Header: Fixed Top Subtitle & Dynamic Step Counter */}
        <div className="mx-auto w-full max-w-[1360px] flex items-center justify-between">
          <span className="text-xs sm:text-sm font-mono tracking-wider uppercase text-white/45">
            Build your next chapter with NOVA
          </span>

          {/* Dynamic Step Counter (01 / 08, 02 / 08, etc.) */}
          <div className="flex items-center gap-2 font-mono text-xs text-white/40">
            <span className="text-white font-semibold text-sm sm:text-base transition-colors duration-300">
              {TALENT_STEPS[activeStepIndex]?.number ?? "01"}
            </span>
            <span>/</span>
            <span>0{TALENT_STEPS.length}</span>
          </div>
        </div>

        {/* ─── Shared Relative Container for Absolute Overlapping Cards ─── */}
        <div className="pathways-container relative w-full max-w-[1360px] my-auto h-[380px] sm:h-[340px] flex items-center">
          {TALENT_STEPS.map((step, idx) => (
            <div
              key={step.number}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={`step-card absolute top-0 left-0 w-full h-full flex flex-col justify-center will-change-transform ${
                idx === 0 ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"
              }`}
            >
              {/* Clean Plain Text Step Number & Topic Tag */}
              <div className="flex items-center gap-3 font-mono text-xs sm:text-sm tracking-widest uppercase mb-4 sm:mb-6 select-none">
                <span className="text-white/80 font-bold">
                  {step.number}
                </span>
                <span className="text-white/30">/</span>
                <span className="text-white/55 font-medium tracking-wider">
                  {step.tag}
                </span>
              </div>

              {/* Step Headline */}
              <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal tracking-[-0.03em] text-white leading-[1.12] mb-5 sm:mb-7 max-w-5xl">
                {step.headline}
              </h2>

              {/* Word-by-Word Scrubbing Paragraph Copy */}
              <p className="text-lg sm:text-2xl lg:text-[28px] font-light leading-relaxed text-zinc-500 max-w-4xl tracking-normal">
                {splitWords(step.body)}
              </p>

              {/* Action Link */}
              {step.href && (
                <div className="mt-7 sm:mt-9">
                  <Link
                    href={step.href}
                    className="group inline-flex items-center gap-2 text-sm sm:text-base font-normal text-white/70 hover:text-white transition-colors duration-200"
                  >
                    <span className="border-b border-white/20 group-hover:border-white transition-colors pb-0.5">
                      {step.linkText || "Explore Pathway"}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-white/40 group-hover:text-white transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Bottom Boundary Transition ─── */}
      <div className="w-full bg-[#09090b] flex flex-col pointer-events-none select-none" aria-hidden="true">
        <div className="h-[16px] bg-[#09090b]" />
        <div className="h-[5px] bg-[#f0efeb]" />
        <div className="h-[8px] bg-[#09090b]" />
        <div className="h-[4px] bg-[#f0efeb]" />
        <div className="h-[3.5px] bg-[#09090b]" />
        <div className="h-[3px] bg-[#f0efeb]" />
        <div className="h-[1.5px] bg-[#09090b]" />
      </div>
    </div>
  );
}