import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Layers } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";

export const metadata: Metadata = {
  title: "How We Work | Who We Are",
  description:
    "Explore NOVA's engineering methodology, peer review standards, and collaborative production squad framework.",
};

const WORK_STEPS = [
  {
    step: "01",
    phase: "DISCOVER",
    title: "Domain & Capability Mapping",
    description: "Builders identify high-impact technical paths across AI, cloud infrastructure, systems engineering, and data analytics.",
  },
  {
    step: "02",
    phase: "LEARN",
    title: "Challenge-Driven Instruction",
    description: "Acquire first-principles technical mastery through hands-on labs simulating real production constraints.",
  },
  {
    step: "03",
    phase: "BUILD",
    title: "Production Squad Execution",
    description: "Collaborate inside paired builder squads under the guidance of senior technical leads to ship executable code.",
  },
  {
    step: "04",
    phase: "PROVE",
    title: "Inspectable Proof-of-Work",
    description: "Every commit, pull request, and test coverage report is verified to form an immutable public track record.",
  },
  {
    step: "05",
    phase: "CONNECT",
    title: "Direct Placement & Mobility",
    description: "Proven builders transition directly into paid residencies, partner engineering teams, and enterprise placement.",
  },
];

export default function HowWeWorkPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-indigo-600 selection:text-white">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — EDITORIAL HERO (Dark #060608 with Photo Feature) */}
        <section
          data-chapter="01 / HOW WE WORK"
          className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-[#060608] text-white border-b border-white/10 overflow-hidden"
        >
          <div className="absolute top-1/4 right-10 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
                  <Layers className="h-4 w-4" />
                  <span>WHO WE ARE · HOW WE WORK</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-white uppercase leading-[0.92]">
                  CRAFT, TRANSPARENCY,<br />AND REAL-WORLD<br />EXECUTION.
                </h1>

                <p className="text-base sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  Our methodology replaces passive tutorial learning with structured production squads, rigorous code reviews, and inspectable proof-of-work.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs font-mono text-indigo-300">
                    METHODOLOGY · SQUADS · CRAFT
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
                <Image
                  src="/images/cards/build.jpg"
                  alt="NOVA Engineering Squad"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  PAIRED SQUADS · CODE REVIEWS · LIVE DEPLOYMENTS
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — SEQUENTIAL PROGRESSION METHODOLOGY (Light #F8F9FC) */}
        <section
          data-chapter="02 / METHODOLOGY PROGRESSION"
          className="py-20 sm:py-28 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-14">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
                THE 5-PHASE METHODOLOGY
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase leading-none">
                How Builders Advance
              </h2>
            </div>

            {/* Horizontal Step Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {WORK_STEPS.map((s) => (
                <div
                  key={s.step}
                  className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between min-h-[280px]"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-600">{s.step}</span>
                      <span className="font-mono text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                        {s.phase}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-neutral-950 leading-snug">{s.title}</h3>
                    <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 03 — SQUAD FRAMEWORK & QUALITY STANDARDS (Dark #0A0A0E) */}
        <section
          data-chapter="03 / SQUAD FRAMEWORK"
          className="py-20 sm:py-28 bg-[#0A0A0E] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 flex flex-col gap-6">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                  QUALITY &amp; CRAFT
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                  Production Squad Standards
                </h2>
                <p className="text-base text-neutral-300 font-normal leading-relaxed">
                  Every squad operates like a high-velocity engineering team. Pull requests undergo automated linting, test suite validation, and architectural review by lead mentors before merge.
                </p>
                <div className="p-6 rounded-2xl bg-[#121216] border border-white/10 border-l-4 border-l-indigo-400">
                  <p className="text-sm font-semibold text-white italic leading-relaxed">
                    &ldquo;Code reviews focus on architectural clarity, performance optimization, and maintainability — teaching builders how software is engineered at enterprise scale.&rdquo;
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 relative aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <Image
                  src="/images/cards/learn.jpg"
                  alt="Code Review & Mentorship"
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  HIGH-VERACITY TESTS · CONTINUOUS INTEGRATION · PEER MENTORSHIP
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 04 — RELATED PAGES (Light #F6F7FA) */}
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

              <Link href="/who-we-are/our-mission" className="group p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600">03</span>
                  <h3 className="text-base font-bold text-neutral-950 group-hover:text-indigo-600 transition-colors">Our Mission</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">Connecting potential with opportunity.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-600">Explore →</span>
              </Link>

              <Link href="/who-we-are/our-people" className="group p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600">05</span>
                  <h3 className="text-base font-bold text-neutral-950 group-hover:text-indigo-600 transition-colors">Our People</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">Engineers, leads &amp; resident builders.</p>
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
              EXPERIENCE THE METHODOLOGY
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
