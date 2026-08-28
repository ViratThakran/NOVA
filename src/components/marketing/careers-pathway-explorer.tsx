"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, CheckCircle2 } from "lucide-react";

interface PathwayItem {
  number: string;
  tag: string;
  headline: string;
  body: string;
  image: string;
  href: string;
  linkText: string;
}

const PATHWAYS: PathwayItem[] = [
  {
    number: "01",
    tag: "ENGINEERING INTERNSHIPS",
    headline: "Production residencies with live service commits alongside senior staff engineers.",
    body: "Embed directly into live codebases, distributed architectures, and mission-critical cloud pipelines from day one. Build real features backed by automated test suites.",
    image: "/images/cards/gen_internship.jpg",
    href: "/internships",
    linkText: "Explore Engineering Internships",
  },
  {
    number: "02",
    tag: "COLLABORATIVE SQUADS",
    headline: "Agile cross-functional squads executing high-throughput architecture challenges.",
    body: "Work on real problems with real teams. Turn your code into a concrete track record of verified commits, peer reviews, and live production deployments.",
    image: "/images/cards/gen_squads.jpg",
    href: "/careers/squad-life",
    linkText: "Explore Squad Dynamics",
  },
  {
    number: "03",
    tag: "SYSTEM RESIDENCIES",
    headline: "Deep-dive into distributed database sharding, autonomous intelligence, and edge systems.",
    body: "Master scalable backends, low-latency microservices, and robust cloud infrastructure through intensive engineering immersion.",
    image: "/images/cards/gen_residency.jpg",
    href: "/internship-programs",
    linkText: "Explore System Residencies",
  },
  {
    number: "04",
    tag: "INDUSTRY PLACEMENT",
    headline: "Fast-track pipeline into full-time roles at partner technology companies.",
    body: "Connect verified capability and shipping experience directly with premier engineering organizations worldwide, skipping generic resume screens.",
    image: "/images/cards/gen_placement.jpg",
    href: "/what-we-do/talent-solutions",
    linkText: "Explore Talent Solutions",
  },
  {
    number: "05",
    tag: "STAFF ARCHITECT MENTORSHIP",
    headline: "1-on-1 architectural roadmaps, code reviews, and career guidance from industry veterans.",
    body: "Receive targeted system design breakdowns, production war-room reviews, and strategic guidance from experienced engineering leaders.",
    image: "/images/cards/gen_mentorship.jpg",
    href: "/careers/squad-life",
    linkText: "Explore Staff Mentorship",
  },
  {
    number: "06",
    tag: "GLOBAL FELLOWSHIP",
    headline: "Lifetime network of founders, engineers, and researchers shipping software worldwide.",
    body: "Collaborate with an elite international collective of builders shaping the future of autonomous systems and distributed computing.",
    image: "/images/cards/gen_fellowship.jpg",
    href: "/who-we-are/our-people",
    linkText: "Explore Builder Community",
  },
  {
    number: "07",
    tag: "SYSTEMS BOOTCAMP",
    headline: "Intensive hands-on training covering modern full-stack, DevOps, and cloud primitives.",
    body: "Build practical mastery across container orchestration, serverless microservices, real-time streaming, and CI/CD automation.",
    image: "/images/cards/gen_bootcamp.jpg",
    href: "/courses",
    linkText: "Explore Systems Catalog",
  },
  {
    number: "08",
    tag: "APPLIED AI RESEARCH",
    headline: "Develop custom reasoning models, fine-tuned agent loops, and evaluation frameworks.",
    body: "Bridge theoretical machine learning with production inference, multi-agent coordination, and high-performance neural compute.",
    image: "/images/cards/gen_ai_research.jpg",
    href: "/programs",
    linkText: "Explore AI Programs",
  },
];

export function CareersPathwayExplorer() {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const activePathway = PATHWAYS[selectedIndex];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left List of Pathways (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col divide-y divide-white/[0.06] rounded-3xl bg-[#08080C] border border-white/[0.08] overflow-hidden">
        {PATHWAYS.map((p, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={p.number}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`w-full text-left p-4 sm:p-5 flex items-center justify-between transition-all duration-200 ${
                isSelected
                  ? "bg-white/[0.08] text-white border-l-2 border-l-white pl-5"
                  : "hover:bg-white/[0.03] text-neutral-400 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-xs font-medium ${
                    isSelected ? "text-white" : "text-neutral-500"
                  }`}
                >
                  {p.number}
                </span>
                <span className="text-xs sm:text-sm font-medium tracking-tight uppercase line-clamp-1">
                  {p.tag}
                </span>
              </div>
              <ChevronRight
                className={`h-4 w-4 shrink-0 transition-transform ${
                  isSelected ? "text-white translate-x-1" : "text-neutral-600"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Right Feature Card (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6 p-6 sm:p-8 rounded-3xl bg-[#08080C] border border-white/[0.08] min-h-[480px] justify-between">
        <div className="flex flex-col gap-6">
          {/* Header metadata */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-medium text-neutral-400">
                PATHWAY {activePathway.number} / 08
              </span>
              <span className="text-neutral-600">•</span>
              <span className="font-mono text-xs font-medium text-white uppercase">
                {activePathway.tag}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-white/[0.06] px-2.5 py-1 rounded-md text-neutral-300">
              Interactive Selection
            </span>
          </div>

          {/* Headline & Body */}
          <div className="flex flex-col gap-3">
            <h3 className="text-2xl sm:text-3xl font-medium text-white leading-snug">
              {activePathway.headline}
            </h3>
            <p className="text-sm sm:text-base text-[#8E8E93] font-normal leading-relaxed">
              {activePathway.body}
            </p>
          </div>

          {/* Active Image Feature */}
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/[0.08]">
            <Image
              src={activePathway.image}
              alt={activePathway.tag}
              fill
              sizes="(max-width: 1024px) 100vw, 700px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-xs font-mono text-neutral-300 uppercase">
              <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
              <span>Real Production Sandboxes &amp; Verified Pull Requests</span>
            </div>
          </div>
        </div>

        {/* Link Button */}
        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <Link
            href={activePathway.href}
            className="inline-flex items-center gap-2 rounded-xl bg-[#EDEDED] hover:bg-white text-black px-5 py-2.5 text-xs sm:text-sm font-medium transition-all"
          >
            <span>{activePathway.linkText}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <span className="text-xs font-mono text-neutral-500 uppercase">NOVA Pathway Track</span>
        </div>
      </div>
    </div>
  );
}
