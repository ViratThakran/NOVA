import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Target } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";

export const metadata: Metadata = {
  title: "Our Mission | Who We Are",
  description:
    "Discover NOVA's core mission: removing artificial barriers to technical mastery and enabling builders worldwide to prove their value through real software.",
};

const PRINCIPLES = [
  {
    num: "01",
    title: "Universal Access to Mastery",
    tagline: "OPPORTUNITY WITHOUT BOUNDARIES",
    description:
      "We believe high-leverage technical knowledge and production experience should not be gated by geography or legacy academic pedigree. Anyone with curiosity and discipline should have a clear path to mastery.",
  },
  {
    num: "02",
    title: "Verifiable Proof over Credentials",
    tagline: "INSPECTABLE CODE COMMITS",
    description:
      "Static resume claims take a back seat to demonstrable capability. We evaluate builders through inspectable pull requests, test coverage, and system uptime in live sandbox environments.",
  },
  {
    num: "03",
    title: "Direct Economic Mobility",
    tagline: "FROM LEARNING TO PRODUCTION SQUADS",
    description:
      "Learning should lead directly to opportunity. NOVA connects proven builders directly into paid residencies, partner engineering teams, and full-time placement opportunities.",
  },
];

export default function OurMissionPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-indigo-600 selection:text-white">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — EDITORIAL HERO (Dark #060608 with Photo Feature) */}
        <section
          data-chapter="01 / OUR MISSION"
          className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-[#060608] text-white border-b border-white/10 overflow-hidden"
        >
          <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
                  <Target className="h-4 w-4" />
                  <span>WHO WE ARE · OUR MISSION</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-white uppercase leading-[0.92]">
                  REMOVING ARTIFICIAL<br />BARRIERS TO<br />TECHNICAL MASTERY.
                </h1>

                <p className="text-base sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  We exist to empower ambitious builders worldwide by turning potential into capability and capability into meaningful economic opportunity.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs font-mono text-indigo-300">
                    PURPOSE · ACCESS · MOBILITY
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
                <Image
                  src="/images/cards/experience.jpg"
                  alt="NOVA Mission in Action"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  REAL SOFTWARE · REAL MENTORSHIP · REAL MOBILITY
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — CORE MISSION STATEMENT (Light #F8F9FC) */}
        <section
          data-chapter="02 / STATEMENT OF PURPOSE"
          className="py-20 sm:py-28 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-12">
            <div className="max-w-4xl flex flex-col gap-6">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
                STATEMENT OF PURPOSE
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase leading-tight">
                &ldquo;WE BELIEVE POTENTIAL SHOULD NEVER DEPEND ON WHERE SOMEONE STARTS.&rdquo;
              </h2>
              <p className="text-base sm:text-lg text-neutral-700 font-normal leading-relaxed">
                Traditional education creates an artificial gap between learning and production engineering. NOVA was founded to bridge that gap permanently — giving builders access to live environments, senior mentorship, and authentic proof-of-work.
              </p>
            </div>
          </div>
        </section>

        {/* 03 — MISSION PRINCIPLES (Dark #0A0A0E) */}
        <section
          data-chapter="03 / GUIDING PRINCIPLES"
          className="py-20 sm:py-28 bg-[#0A0A0E] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-14">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                GUIDING PRINCIPLES
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                How Mission Drives Action
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {PRINCIPLES.map((p) => (
                <div
                  key={p.num}
                  className="p-8 sm:p-10 rounded-3xl bg-[#121216] border border-white/10 flex flex-col justify-between gap-6"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-400">{p.num}</span>
                      <span className="font-mono text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                        {p.tagline}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{p.title}</h3>
                    <p className="text-sm text-neutral-300 font-normal leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04 — RELATED WHO WE ARE PAGES (Light #F6F7FA) */}
        <section className="py-16 bg-[#F6F7FA] border-b border-neutral-200 text-neutral-950">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-neutral-300 pb-3">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-neutral-500 uppercase">
                MORE ABOUT NOVA
              </span>
              <Link href="/who-we-are" className="text-xs font-mono font-semibold text-indigo-600 hover:underline uppercase">
                All Destinations →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Link href="/who-we-are/about" className="group p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600">01</span>
                  <h3 className="text-base font-bold text-neutral-950 group-hover:text-indigo-600 transition-colors">About NOVA</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">Our identity, purpose, and ecosystem.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-600">Explore →</span>
              </Link>

              <Link href="/who-we-are/our-story" className="group p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600">02</span>
                  <h3 className="text-base font-bold text-neutral-950 group-hover:text-indigo-600 transition-colors">Our Story</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">Origins, evolution &amp; trajectory.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-600">Explore →</span>
              </Link>

              <Link href="/who-we-are/how-we-work" className="group p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600">04</span>
                  <h3 className="text-base font-bold text-neutral-950 group-hover:text-indigo-600 transition-colors">How We Work</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">Engineering methodology &amp; craft.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-600">Explore →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 05 — INSTITUTIONAL CLOSING CTA (Dark #070709) */}
        <section className="py-24 sm:py-32 bg-[#070709] text-white overflow-hidden relative">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center gap-8">
            <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
              JOIN THE MISSION
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white max-w-3xl leading-tight">
              Connect with NOVA &amp; Build What&apos;s Next
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/who-we-are/about"
                className="rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 px-6 py-3.5 text-sm font-bold uppercase transition-all shadow-md"
              >
                About NOVA
              </Link>
              <Link
                href="/who-we-are"
                className="rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-sm font-bold uppercase transition-all"
              >
                Who We Are Directory
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
