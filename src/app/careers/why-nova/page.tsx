import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Zap, ShieldCheck, CheckCircle2, Terminal, Cpu, GitPullRequest, Award } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";

export const metadata: Metadata = {
  title: "Why NOVA | Proof of Work & Engineering Mastery",
  description:
    "Discover why NOVA replaces passive tutorial courses with live production sandboxes, paired squad reviews, and inspectable proof-of-work.",
};

const WHY_PILLARS = [
  {
    num: "01",
    title: "Inspectable Code Commits",
    icon: GitPullRequest,
    accent: "from-cyan-500/20 to-indigo-500/10",
    description:
      "Static resume claims take a back seat to demonstrable capability. We evaluate builders through inspectable pull requests, test coverage, and live system uptime.",
  },
  {
    num: "02",
    title: "Production Sandboxes",
    icon: Terminal,
    accent: "from-violet-500/20 to-fuchsia-500/10",
    description:
      "Work inside real containerized environments simulating live production constraints, CI/CD automated test harnesses, and microservice architectures.",
  },
  {
    num: "03",
    title: "Paired Squad Culture",
    icon: Cpu,
    accent: "from-indigo-500/20 to-cyan-500/10",
    description:
      "Collaborate in active builder squads mentored by experienced technical leads who review code line-by-line and debate architectural trade-offs.",
  },
  {
    num: "04",
    title: "Direct Placement Pipeline",
    icon: Award,
    accent: "from-fuchsia-500/20 to-indigo-500/10",
    description:
      "Skip generic recruiter black holes. Verified proof-of-work connects proven builders directly with enterprise hiring managers and startup founders.",
  },
];

import { CareerHero } from "@/components/marketing/careers/career-hero";

export default function WhyNovaPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white selection:text-black">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — HERO */}
        <CareerHero
          chapter="01 / WHY NOVA"
          headline="Why Choose NOVA"
          description="Proof of work over passive courses. Live sandboxes, real PRs, and verified outcomes."
          primaryCtaLabel="Explore internships"
          primaryCtaHref="/internships"
        >
          <Link
            href="/careers/squad-life"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-sm font-medium transition-all"
          >
            <span>Inside squad life</span>
            <ArrowUpRight className="h-4 w-4 text-neutral-400" />
          </Link>
        </CareerHero>

        {/* 02 — THE EXPERIENCE PARADOX NARRATIVE & COMPARISON */}
        <section
          data-chapter="02 / THE PARADOX"
          className="py-20 sm:py-28 bg-[#000000] text-white border-b border-white/[0.08]"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  THE FUNDAMENTAL PROBLEM
                </span>
                <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
                  The Experience Paradox
                </h2>
                <div className="p-6 rounded-2xl bg-[#08080C] border border-white/[0.08]">
                  <p className="text-sm sm:text-base font-normal text-white italic leading-relaxed">
                    &ldquo;You cannot get a software engineering role without production experience, yet you cannot acquire production experience without a role.&rdquo;
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6 text-base sm:text-lg text-[#8E8E93] leading-relaxed font-normal">
                <p>
                  Most aspiring engineers spend hundreds of hours completing toy video tutorials that teach syntax but fail to convey the realities of production engineering — continuous integration, distributed system debugging, and code reviews.
                </p>
                <p>
                  NOVA dissolves this paradox. We place builders inside containerized production environments where they work on real repositories, execute tests against live microservices, and receive line-by-line feedback from senior leads.
                </p>
                <p>
                  When you complete a track with NOVA, you don&apos;t show employers a static resume claim. You share an inspectable portfolio of pull requests, passing test suites, and deployed architecture.
                </p>
              </div>
            </div>

            {/* Comparison Grid: Traditional vs NOVA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
              <div className="p-8 rounded-3xl bg-[#08080C] border border-white/[0.08] flex flex-col gap-5">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  TRADITIONAL / BOOTCAMP PATH
                </span>
                <ul className="flex flex-col gap-3 text-sm text-[#8E8E93]">
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-500 font-bold">✕</span>
                    <span>Passive video lectures without production pressure</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-500 font-bold">✕</span>
                    <span>Isolated toy projects with zero peer code review</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-500 font-bold">✕</span>
                    <span>Generic certificates ignored by hiring managers</span>
                  </li>
                </ul>
              </div>

              <div className="p-8 rounded-3xl bg-[#08080C] border border-white/20 flex flex-col gap-5">
                <span className="text-xs font-mono text-white uppercase tracking-wider">
                  THE NOVA PRODUCTION SQUAD MODEL
                </span>
                <ul className="flex flex-col gap-3 text-sm text-neutral-200">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-white shrink-0 mt-0.5" />
                    <span>Real live sandboxes with containerized microservices</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-white shrink-0 mt-0.5" />
                    <span>Paired engineering sprints &amp; line-by-line staff reviews</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-white shrink-0 mt-0.5" />
                    <span>Inspectable pull requests &amp; verified commit records</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 03 — 4 PILLARS OF WHY NOVA */}
        <section
          data-chapter="03 / CORE PILLARS"
          className="py-20 sm:py-28 bg-[#000000] text-white border-b border-white/[0.08]"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-14">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                WHY BUILDERS CHOOSE NOVA
              </span>
              <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
                Four Pillars of Proof
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {WHY_PILLARS.map((p) => {
                const IconComponent = p.icon;
                return (
                  <div
                    key={p.num}
                    className="p-8 sm:p-10 rounded-3xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between gap-6"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-medium text-neutral-400">{p.num}</span>
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white">
                          <IconComponent className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-medium text-white tracking-tight">{p.title}</h3>
                      <p className="text-sm text-[#8E8E93] font-normal leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 04 — ECOSYSTEM TRAVERSAL */}
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
              <Link href="/careers/squad-life" className="group p-6 rounded-2xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-medium text-neutral-500">01</span>
                  <h3 className="text-base font-medium text-white group-hover:text-white transition-colors">Squad Life</h3>
                  <p className="text-xs text-[#8E8E93] leading-relaxed font-normal">Production squads &amp; code reviews.</p>
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
                  <p className="text-xs text-[#8E8E93] leading-relaxed font-normal">Live database-backed opportunities.</p>
                </div>
                <span className="pt-4 text-xs font-mono text-neutral-400 group-hover:text-white">Explore →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 05 — CLOSING CTA */}
        <section className="py-24 sm:py-32 bg-[#050508] text-white overflow-hidden relative">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 text-center flex flex-col items-center gap-8">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              READY TO BUILD?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white max-w-3xl leading-tight">
              Start Your Track Record with NOVA
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
