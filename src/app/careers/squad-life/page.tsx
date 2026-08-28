import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Users, Code2, ShieldCheck, Zap, GitBranch, Terminal, RefreshCw, MessageSquare } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";

export const metadata: Metadata = {
  title: "Squad Life & Mentorship | Careers at NOVA",
  description:
    "Explore life inside NOVA production squads: paired engineering, line-by-line code reviews, architectural war rooms, and mentor guidance.",
};

const SQUAD_STANDARDS = [
  {
    num: "01",
    title: "Agile Sprint Syncs",
    icon: RefreshCw,
    description:
      "Daily asynchronous standups and blocker resolution, teaching squads how to communicate with precision across distributed workflows.",
  },
  {
    num: "02",
    title: "Line-by-Line Code Reviews",
    icon: GitBranch,
    description:
      "Senior architects review every pull request for architectural clarity, performance bottlenecks, and security vulnerabilities before merge.",
  },
  {
    num: "03",
    title: "Automated CI/CD Validation",
    icon: Terminal,
    description:
      "Every commit triggers high-veracity automated test harnesses, ensuring code is verified against live sandbox microservices.",
  },
  {
    num: "04",
    title: "System Design War Rooms",
    icon: MessageSquare,
    description:
      "Interactive architectural breakdowns where leads and builders dissect real system outages, sharding strategies, and latency trade-offs.",
  },
];

const SPRINT_CADENCE = [
  { step: "DAY 01", title: "Sprint Backlog Ingestion", desc: "Decompose user stories into micro-deliverables and schema migrations." },
  { step: "DAY 03-07", title: "Paired Implementation", desc: "Write features against live containerized mock clusters with active pairing." },
  { step: "DAY 08", title: "Staff PR Review & QA", desc: "Detailed line-by-line feedback on complexity, error handling, and test suites." },
  { step: "DAY 10", title: "Automated Deployment & Demo", desc: "Production release to staging sandbox with retrospective and metrics review." },
];

import { CareerHero } from "@/components/marketing/careers/career-hero";

export default function SquadLifePage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white selection:text-black">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — HERO */}
        <CareerHero
          chapter="01 / SQUAD LIFE"
          headline="Inside Squad Life"
          description="Paired engineering squads, daily sprint reviews, and direct lead mentorship."
          primaryCtaLabel="Explore internships"
          primaryCtaHref="/internships"
        >
          <Link
            href="/careers/hiring-process"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-sm font-medium transition-all"
          >
            <span>Hiring trajectory</span>
            <ArrowUpRight className="h-4 w-4 text-neutral-400" />
          </Link>
        </CareerHero>

        {/* 02 — THE DYNAMICS OF A NOVA SQUAD */}
        <section
          data-chapter="02 / SQUAD DYNAMICS"
          className="py-20 sm:py-28 bg-[#000000] text-white border-b border-white/[0.08]"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  TEAM CULTURE
                </span>
                <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
                  Inside a NOVA Squad
                </h2>
                <div className="p-6 rounded-2xl bg-[#08080C] border border-white/[0.08]">
                  <p className="text-sm sm:text-base font-normal text-white italic leading-relaxed">
                    &ldquo;Code reviews inside NOVA are not rubber stamps. They are rich technical dialogues where architectural trade-offs are debated openly.&rdquo;
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6 text-base sm:text-lg text-[#8E8E93] leading-relaxed font-normal">
                <p>
                  At NOVA, nobody works in isolation. Every builder is paired inside a functional squad consisting of 4 to 6 engineers guided by a staff technical lead.
                </p>
                <p>
                  Squads operate on agile sprint cycles — pulling tasks from live production backlogs, holding asynchronous daily syncs, and committing code to shared repositories with continuous integration pipelines.
                </p>
                <p>
                  This environment instills professional software habits early: clean git hygiene, comprehensive unit testing, clear documentation, and graceful error handling under load.
                </p>
              </div>
            </div>

            {/* Sprint Cadence Breakdown */}
            <div className="flex flex-col gap-6 pt-6">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                TWO-WEEK SPRINT CADENCE
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SPRINT_CADENCE.map((cad) => (
                  <div key={cad.step} className="p-6 rounded-2xl bg-[#08080C] border border-white/[0.08] flex flex-col gap-3">
                    <span className="font-mono text-xs font-medium text-neutral-400">{cad.step}</span>
                    <h4 className="text-base font-medium text-white">{cad.title}</h4>
                    <p className="text-xs text-[#8E8E93] leading-relaxed">{cad.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 03 — SQUAD STANDARDS GRID */}
        <section
          data-chapter="03 / SQUAD CADENCE"
          className="py-20 sm:py-28 bg-[#000000] text-white border-b border-white/[0.08]"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-14">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                PRODUCTION STANDARDS
              </span>
              <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
                Squad Cadence &amp; Quality
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {SQUAD_STANDARDS.map((s) => {
                const IconComponent = s.icon;
                return (
                  <div
                    key={s.num}
                    className="p-8 sm:p-10 rounded-3xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between gap-6"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-medium text-neutral-400">{s.num}</span>
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white">
                          <IconComponent className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-medium text-white tracking-tight">{s.title}</h3>
                      <p className="text-sm text-[#8E8E93] font-normal leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 04 — MENTORSHIP FEATURE */}
        <section
          data-chapter="04 / STAFF MENTORSHIP"
          className="py-20 sm:py-28 bg-[#000000] text-white border-b border-white/[0.08]"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 flex flex-col gap-6">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  ACTIVE MENTORSHIP
                </span>
                <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
                  Staff Architect Guidance
                </h2>
                <p className="text-base text-[#8E8E93] font-normal leading-relaxed">
                  Mentors at NOVA are experienced engineers who work side-by-side with squads. They don&apos;t give lectures — they review architecture, conduct post-mortems, and share high-leverage production patterns.
                </p>
                <div className="p-6 rounded-2xl bg-[#08080C] border border-white/[0.08]">
                  <p className="text-sm font-normal text-white italic leading-relaxed">
                    &ldquo;Mentorship inside NOVA accelerates growth by giving builders direct feedback on real code in real-time.&rdquo;
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 relative aspect-[16/10] rounded-3xl overflow-hidden border border-white/[0.08]">
                <Image
                  src="/images/cards/gen_mentorship.jpg"
                  alt="Staff Architect Mentorship"
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  ACTIVE MENTORSHIP · 1-ON-1 SYSTEM DESIGN REVIEW
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 05 — ECOSYSTEM TRAVERSAL */}
        <section className="py-16 bg-[#000000] border-b border-white/[0.08] text-white">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                EXPLORE LIFE AT NOVA
              </span>
              <Link href="/careers" className="text-xs font-mono text-neutral-400 hover:text-white uppercase">
                Careers Overview →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Link href="/careers/why-nova" className="group p-6 rounded-2xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-medium text-neutral-500">01</span>
                  <h3 className="text-base font-medium text-white group-hover:text-white transition-colors">Why NOVA</h3>
                  <p className="text-xs text-[#8E8E93] leading-relaxed font-normal">Proof of work over credentials.</p>
                </div>
                <span className="pt-4 text-xs font-mono text-neutral-400 group-hover:text-white">Explore →</span>
              </Link>

              <Link href="/careers/hiring-process" className="group p-6 rounded-2xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-medium text-neutral-500">02</span>
                  <h3 className="text-base font-medium text-white group-hover:text-white transition-colors">Hiring Process</h3>
                  <p className="text-xs text-[#8E8E93] leading-relaxed font-normal">Skills verification &amp; placement flow.</p>
                </div>
                <span className="pt-4 text-xs font-mono text-neutral-400 group-hover:text-white">Explore →</span>
              </Link>

              <Link href="/internships" className="group p-6 rounded-2xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-medium text-neutral-500">03</span>
                  <h3 className="text-base font-medium text-white group-hover:text-white transition-colors">Open Residencies</h3>
                  <p className="text-xs text-[#8E8E93] leading-relaxed font-normal">Browse active open roles.</p>
                </div>
                <span className="pt-4 text-xs font-mono text-neutral-400 group-hover:text-white">Explore →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="py-24 sm:py-32 bg-[#050508] text-white overflow-hidden relative">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 text-center flex flex-col items-center gap-8">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              JOIN A SQUAD
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white max-w-3xl leading-tight">
              Ready to Build in a NOVA Squad?
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/internships"
                className="rounded-xl bg-[#EDEDED] hover:bg-white text-black px-7 py-3.5 text-sm font-medium transition-all"
              >
                Browse Open Roles
              </Link>
              <Link
                href="/careers"
                className="rounded-xl bg-white/[0.06] hover:bg-white/10 text-white border border-white/15 px-7 py-3.5 text-sm font-medium transition-all"
              >
                Careers Overview
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
