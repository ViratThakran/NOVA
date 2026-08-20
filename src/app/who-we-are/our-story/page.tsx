import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Compass } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";

export const metadata: Metadata = {
  title: "Our Story | Who We Are",
  description:
    "Trace our origins from an initial challenge to bridge passive learning and live engineering, through key development milestones, to our global future trajectory.",
};

const STAGES = [
  {
    phase: "STAGE 01 — THE INCEPTION",
    title: "Identifying the Capability Gap",
    description:
      "We recognized that traditional technical credentials failed to reflect actual production software capability, leaving aspiring engineers trapped in tutorial hell.",
    quote: "Real engineering capability is forged by confronting real system failures, not by watching video lectures.",
  },
  {
    phase: "STAGE 02 — PLATFORM ARCHITECTURE",
    title: "Building the Sandbox Engine",
    description:
      "We architected containerized code execution environments with real-time feedback loops, allowing builders to execute tests against live production repositories.",
    quote: "Every lesson culminates in an executable commit evaluated against real test suites.",
  },
  {
    phase: "STAGE 03 — ECOSYSTEM EXPANSION",
    title: "Capabilities & Industry Sectors",
    description:
      "Expanded core tracks across AI & Intelligence, Cloud Infrastructure, Data Engineering, Software Systems, and specialized Industry Solutions.",
    quote: "Connecting domain-grounded intelligence with resilient software architectures.",
  },
  {
    phase: "STAGE 04 — GLOBAL NETWORK",
    title: "The Next Era",
    description:
      "Connecting verified builders with enterprise engineering teams, paid residencies, and production opportunities worldwide.",
    quote: "A global ecosystem where capability unlocks direct economic mobility.",
  },
];

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-indigo-600 selection:text-white">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — EDITORIAL HERO WITH HUMAN PHOTOGRAPHY (Dark #060608) */}
        <section
          data-chapter="01 / OUR STORY"
          className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-[#060608] text-white border-b border-white/10 overflow-hidden"
        >
          <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Editorial Headline & Statement */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
                  <Compass className="h-4 w-4" />
                  <span>WHO WE ARE · OUR STORY</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-white uppercase leading-[0.92]">
                  OUR JOURNEY,<br />OUR BELIEFS,<br />AND OUR FUTURE.
                </h1>

                <p className="text-base sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  Born from a conviction that traditional learning was failing ambitious minds, NOVA grew into a global collective where real work and shared craftsmanship define who we are.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs font-mono text-indigo-300">
                    ORIGINS · EVOLUTION · CULTURE
                  </span>
                </div>
              </div>

              {/* Right Column: Feature Photo Card */}
              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
                <Image
                  src="/images/cards/grow.jpg"
                  alt="NOVA Growth Trajectory"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  FROM PASSIVE LEARNING TO LIVE PRODUCTION EXECUTION
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — THE ORIGIN & THE PROBLEM (Light #F8F9FC / Narrative Split) */}
        <section
          data-chapter="02 / THE ORIGIN"
          className="py-20 sm:py-28 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
                  THE INITIAL FRUSTRATION
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase leading-none">
                  THE ORIGIN
                </h2>
                <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs border-l-4 border-l-indigo-600">
                  <p className="text-sm sm:text-base font-semibold text-neutral-900 italic leading-relaxed">
                    &ldquo;Tutorial hell left aspiring engineers with passive knowledge but little confidence when confronted with complex, distributed codebases.&rdquo;
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6 text-base sm:text-lg text-neutral-700 leading-relaxed font-normal">
                <p>
                  NOVA began with a simple observation: while demand for capable software engineers continued to grow globally, traditional education and online video courses were failing to prepare builders for the reality of production environments.
                </p>
                <p>
                  Aspiring engineers spent hundreds of hours watching video lectures and completing toy tutorials, but struggled when tasked with setting up local development environments, diagnosing build failures, or contributing to live microservices.
                </p>
                <p>
                  We set out to build a platform where learning looks identical to engineering — where skills are developed through execution, peer review, and verifiable software contributions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 03 — TIMELINE STAGES (Dark #0A0A0E / Timeline Flow) */}
        <section
          data-chapter="03 / EVOLUTIONARY STAGES"
          className="py-20 sm:py-28 bg-[#0A0A0E] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-14">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                STAGES OF DEVELOPMENT
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                Evolutionary Milestones
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {STAGES.map((stage, idx) => (
                <div
                  key={stage.phase}
                  className="p-8 sm:p-10 rounded-3xl bg-[#121216] border border-white/10 flex flex-col justify-between gap-6"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-400">{stage.phase}</span>
                      <span className="font-mono text-2xl font-black text-neutral-700">0{idx + 1}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{stage.title}</h3>
                    <p className="text-sm sm:text-base text-neutral-400 font-normal leading-relaxed">
                      {stage.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs font-mono text-neutral-300 italic">&ldquo;{stage.quote}&rdquo;</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04 — WHERE WE ARE HEADING (Light #F6F7FA / Full-Width Editorial) */}
        <section
          data-chapter="04 / WHERE WE ARE HEADING"
          className="py-20 sm:py-28 bg-[#F6F7FA] text-neutral-950 border-b border-neutral-200"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 flex flex-col gap-6">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
                  FORWARD TRAJECTORY
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase leading-none">
                  WHERE WE ARE HEADING
                </h2>
                <p className="text-base sm:text-lg text-neutral-700 font-normal leading-relaxed">
                  Today, NOVA is expanding into a comprehensive platform connecting learning, software execution, and enterprise capability across high-consequence industries.
                </p>
                <p className="text-base sm:text-lg text-neutral-700 font-normal leading-relaxed">
                  Our goal remains clear: to build the definitive global ecosystem where any curious mind can acquire technical mastery and apply it to meaningful software.
                </p>
              </div>

              <div className="lg:col-span-6 relative aspect-[16/10] rounded-3xl overflow-hidden shadow-xl border border-neutral-200">
                <Image
                  src="/images/cards/experience.jpg"
                  alt="NOVA Global Community"
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-white uppercase tracking-wider">
                  GLOBAL BUILDER ECOSYSTEM · VERIFIABLE ECONOMIC MOBILITY
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 05 — INSTITUTIONAL CLOSING CTA (Dark #070709) */}
        <section className="py-24 sm:py-32 bg-[#070709] text-white overflow-hidden relative">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center gap-8">
            <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
              JOIN THE STORY
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white max-w-3xl leading-tight">
              Explore Who We Are &amp; Join the Collective
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/who-we-are/about"
                className="rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 px-6 py-3.5 text-sm font-bold uppercase transition-all shadow-md"
              >
                About NOVA →
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
