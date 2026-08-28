import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Zap, Users, ShieldCheck, Code2, Sparkles, Layers, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";
import { CareersPathwayExplorer } from "@/components/marketing/careers-pathway-explorer";
import { CareerHero } from "@/components/marketing/careers/career-hero";

export const metadata: Metadata = {
  title: "Careers & Pathways | NOVA Builder Ecosystem",
  description:
    "Build real production software, work in paired engineering squads, and launch your trajectory through verified proof of work.",
};

const ECOSYSTEM_SIGNALS = [
  { label: "Active Residencies", value: "23+", note: "Database-backed roles" },
  { label: "Squad Structure", value: "4-6", note: "Paired with Staff Leads" },
  { label: "Commit Verification", value: "100%", note: "Inspectable PRs & tests" },
  { label: "Placement Pipeline", value: "Direct", note: "Enterprise & startup partners" },
];

export default function CareersOverviewPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white selection:text-black">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — CAREERS EDITORIAL HERO */}
        <CareerHero
          chapter="01 / CAREERS AT NOVA"
          headline="Careers at NOVA"
          description="Ship real systems, join production squads, and build your engineering trajectory."
          primaryCtaLabel="Explore internships"
          primaryCtaHref="/internships"
        >
          <Link
            href="/careers/why-nova"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-sm font-medium transition-all"
          >
            <span>Why choose NOVA</span>
            <ArrowUpRight className="h-4 w-4 text-neutral-400" />
          </Link>
        </CareerHero>

        {/* 02 — THE THREE CAREERS DESTINATION PILLARS */}
        <section
          data-chapter="02 / ECOSYSTEM DESTINATIONS"
          className="py-20 sm:py-28 bg-[#000000] text-white border-b border-white/[0.08]"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-14">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  COMPLETE DESTINATIONS
                </span>
                <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
                  The Careers Ecosystem
                </h2>
              </div>
              <p className="text-sm text-[#8E8E93] max-w-md font-normal leading-relaxed">
                Three interconnected categories providing direct opportunities, structured learning tracks, and full transparency into life inside NOVA squads.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Category 1: OPPORTUNITIES */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between gap-8">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-xs font-medium text-neutral-300 uppercase tracking-wider">
                      01 / OPPORTUNITIES
                    </span>
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-medium text-white">Live Residencies &amp; Roles</h3>
                  <p className="text-sm text-[#8E8E93] leading-relaxed font-normal">
                    Direct access to open engineering residencies, 1 to 6-month tracks, and partner talent matching.
                  </p>
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06] text-xs font-mono">
                    <Link href="/internships" className="flex items-center justify-between py-1.5 text-neutral-400 hover:text-white group">
                      <span>• Open Residencies (Live DB)</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white" />
                    </Link>
                    <Link href="/internship-programs" className="flex items-center justify-between py-1.5 text-neutral-400 hover:text-white group">
                      <span>• 1, 3, 6-Month Tracks</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white" />
                    </Link>
                    <Link href="/what-we-do/talent-solutions" className="flex items-center justify-between py-1.5 text-neutral-400 hover:text-white group">
                      <span>• Placement &amp; Squad Matching</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white" />
                    </Link>
                  </div>
                </div>
                <Link
                  href="/internships"
                  className="w-full text-center py-3 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white border border-white/15 text-xs font-mono font-medium uppercase tracking-wider transition-all"
                >
                  Browse Open Residencies →
                </Link>
              </div>

              {/* Category 2: LEARNING & GROWTH */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between gap-8">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-xs font-medium text-neutral-300 uppercase tracking-wider">
                      02 / LEARNING &amp; GROWTH
                    </span>
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-medium text-white">Curriculum &amp; Community</h3>
                  <p className="text-sm text-[#8E8E93] leading-relaxed font-normal">
                    Master modern architectures through hands-on labs, comprehensive course catalogs, and collaborative community.
                  </p>
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06] text-xs font-mono">
                    <Link href="/courses" className="flex items-center justify-between py-1.5 text-neutral-400 hover:text-white group">
                      <span>• Course Catalog</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white" />
                    </Link>
                    <Link href="/programs" className="flex items-center justify-between py-1.5 text-neutral-400 hover:text-white group">
                      <span>• Flagship Learning Programs</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white" />
                    </Link>
                    <Link href="/who-we-are/our-people" className="flex items-center justify-between py-1.5 text-neutral-400 hover:text-white group">
                      <span>• Builder Collective &amp; Mentors</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white" />
                    </Link>
                  </div>
                </div>
                <Link
                  href="/courses"
                  className="w-full text-center py-3 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white border border-white/15 text-xs font-mono font-medium uppercase tracking-wider transition-all"
                >
                  Explore Course Catalog →
                </Link>
              </div>

              {/* Category 3: LIFE AT NOVA */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between gap-8">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-xs font-medium text-neutral-300 uppercase tracking-wider">
                      03 / LIFE AT NOVA
                    </span>
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-medium text-white">Culture &amp; Verification</h3>
                  <p className="text-sm text-[#8E8E93] leading-relaxed font-normal">
                    Inspect life inside paired builder squads, learn why partners trust our proof of work, and see the hiring trajectory.
                  </p>
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06] text-xs font-mono">
                    <Link href="/careers/why-nova" className="flex items-center justify-between py-1.5 text-neutral-400 hover:text-white group">
                      <span>• Why NOVA (Proof of Work)</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white" />
                    </Link>
                    <Link href="/careers/squad-life" className="flex items-center justify-between py-1.5 text-neutral-400 hover:text-white group">
                      <span>• Squad Life &amp; Mentorship</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white" />
                    </Link>
                    <Link href="/careers/hiring-process" className="flex items-center justify-between py-1.5 text-neutral-400 hover:text-white group">
                      <span>• 4-Stage Placement Flow</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white" />
                    </Link>
                  </div>
                </div>
                <Link
                  href="/careers/why-nova"
                  className="w-full text-center py-3 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white border border-white/15 text-xs font-mono font-medium uppercase tracking-wider transition-all"
                >
                  Discover Life at NOVA →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 03 — INTERACTIVE CAREER PATHWAY EXPLORER */}
        <section
          data-chapter="03 / PATHWAY EXPLORER"
          className="py-20 sm:py-28 bg-[#000000] text-white border-b border-white/[0.08]"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  CAREER PATHWAYS
                </span>
                <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
                  Explore Your Trajectory
                </h2>
              </div>
              <p className="text-sm text-[#8E8E93] max-w-md font-normal leading-relaxed">
                Select any pathway below to explore how NOVA accelerates your growth from hands-on labs to production squad placement.
              </p>
            </div>

            {/* Interactive Client Component */}
            <CareersPathwayExplorer />
          </div>
        </section>

        {/* 04 — WHAT YOU CAN DO HERE (The 4-Step Builder Journey) */}
        <section
          data-chapter="04 / WHAT YOU CAN DO HERE"
          className="py-20 sm:py-28 bg-[#000000] text-white border-b border-white/[0.08]"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 flex flex-col gap-16">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                THE BUILDER JOURNEY
              </span>
              <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
                What You Can Do Here
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-8 rounded-3xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between min-h-[280px]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-neutral-400">01</span>
                    <Code2 className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-white">Learn by Doing</h3>
                  <p className="text-xs sm:text-sm text-[#8E8E93] font-normal leading-relaxed">
                    Skip static lectures. Master cloud infrastructure, AI models, and modern systems through hands-on labs.
                  </p>
                </div>
                <Link href="/courses" className="text-xs font-mono font-medium text-neutral-400 hover:text-white uppercase">
                  Browse Courses →
                </Link>
              </div>

              <div className="p-8 rounded-3xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between min-h-[280px]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-neutral-400">02</span>
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-white">Build in Squads</h3>
                  <p className="text-xs sm:text-sm text-[#8E8E93] font-normal leading-relaxed">
                    Work alongside resident builders and senior architects inside paired squads executing agile sprints.
                  </p>
                </div>
                <Link href="/careers/squad-life" className="text-xs font-mono font-medium text-neutral-400 hover:text-white uppercase">
                  Explore Squad Life →
                </Link>
              </div>

              <div className="p-8 rounded-3xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between min-h-[280px]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-neutral-400">03</span>
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-white">Prove with Commits</h3>
                  <p className="text-xs sm:text-sm text-[#8E8E93] font-normal leading-relaxed">
                    Turn your execution into a publicly inspectable proof-of-work portfolio backed by real test suites.
                  </p>
                </div>
                <Link href="/careers/why-nova" className="text-xs font-mono font-medium text-neutral-400 hover:text-white uppercase">
                  Proof of Work →
                </Link>
              </div>

              <div className="p-8 rounded-3xl bg-[#08080C] border border-white/[0.08] hover:border-white/20 hover:bg-[#0E0E14] transition-all flex flex-col justify-between min-h-[280px]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-neutral-400">04</span>
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-white">Connect &amp; Launch</h3>
                  <p className="text-xs sm:text-sm text-[#8E8E93] font-normal leading-relaxed">
                    Transition directly into paid residencies, partner engineering teams, and enterprise placement.
                  </p>
                </div>
                <Link href="/careers/hiring-process" className="text-xs font-mono font-medium text-neutral-400 hover:text-white uppercase">
                  Hiring Flow →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 05 — INSTITUTIONAL CLOSING CTA */}
        <section className="py-24 sm:py-32 bg-[#050508] text-white overflow-hidden relative border-t border-white/[0.08]">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-12 lg:px-20 xl:px-28 text-center flex flex-col items-center gap-8">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              JOIN THE ECOSYSTEM
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white max-w-3xl leading-tight">
              Start Building Your Track Record Today
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/internships"
                className="rounded-xl bg-[#EDEDED] hover:bg-white text-black px-7 py-3.5 text-sm font-medium transition-all"
              >
                Browse Open Residencies
              </Link>
              <Link
                href="/careers/why-nova"
                className="rounded-xl bg-white/[0.06] hover:bg-white/10 text-white border border-white/15 px-7 py-3.5 text-sm font-medium transition-all"
              >
                Why Choose NOVA
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
