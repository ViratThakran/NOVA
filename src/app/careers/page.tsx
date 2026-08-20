import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Zap, Users, ShieldCheck, Code2, Sparkles, Layers, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";
import { CareersSubNav } from "@/components/marketing/careers-sub-nav";
import { CareersPathwayExplorer } from "@/components/marketing/careers-pathway-explorer";

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
    <div className="min-h-screen bg-[#07070A] text-white selection:bg-indigo-600 selection:text-white">
      <SiteHeader transparent />
      <CareersSubNav activeHref="/careers" />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — ENERGETIC HUMAN HERO */}
        <section
          data-chapter="01 / CAREERS AT NOVA"
          className="relative pt-24 pb-20 sm:pt-32 sm:pb-28 bg-[#07070A] text-white border-b border-white/10 overflow-hidden"
        >
          {/* Ambient Lighting Accents */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Headline & Positioning */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs font-mono font-bold tracking-[0.24em] text-cyan-300 uppercase w-fit">
                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                  <span>FOR BUILDERS WHO SHIP REAL SOFTWARE</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-white uppercase leading-[0.92]">
                  BUILD WHAT&apos;S NEXT.<br />
                  <span className="bg-gradient-to-r from-white via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
                    PROVE YOUR CRAFT.
                  </span><br />
                  LAUNCH YOUR CAREER.
                </h1>

                <p className="text-base sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  NOVA dissolves the divide between technical learning and production execution. Work in paired engineering squads, ship code to live environments, and turn your output into verified opportunity.
                </p>

                {/* Signals Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-white/10 my-2">
                  {ECOSYSTEM_SIGNALS.map((sig) => (
                    <div key={sig.label} className="flex flex-col">
                      <span className="text-xl sm:text-2xl font-black text-white font-mono">{sig.value}</span>
                      <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">{sig.label}</span>
                      <span className="text-[10px] text-neutral-400">{sig.note}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    href="/internships"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30"
                  >
                    <span>Explore Open Residencies</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/careers/why-nova"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all"
                  >
                    <span>Why Choose NOVA</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Squad Visual */}
              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-950/50">
                <Image
                  src="/images/cards/gen_squads.jpg"
                  alt="NOVA Engineering Squad"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07070A] via-[#07070A]/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-1 text-white">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-300">
                    PRODUCTION SQUADS · PAIRED MENTORSHIP
                  </span>
                  <p className="text-xs text-neutral-300 font-normal">
                    Collaborate inside real squads with automated CI/CD and line-by-line code reviews.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — THE THREE CAREERS DESTINATION PILLARS */}
        <section
          data-chapter="02 / ECOSYSTEM DESTINATIONS"
          className="py-20 sm:py-28 bg-[#09090E] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-14">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-8">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                  COMPLETE DESTINATIONS
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                  The Careers Ecosystem
                </h2>
              </div>
              <p className="text-sm text-neutral-400 max-w-md font-normal leading-relaxed">
                Three interconnected categories providing direct opportunities, structured learning tracks, and full transparency into life inside NOVA squads.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Category 1: OPPORTUNITIES */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#11111A] border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-8">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      01 / OPPORTUNITIES
                    </span>
                    <Zap className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white uppercase">Live Residencies &amp; Roles</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed font-normal">
                    Direct access to open engineering residencies, 1 to 6-month tracks, and partner talent matching.
                  </p>
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-xs font-mono">
                    <Link href="/internships" className="flex items-center justify-between py-1.5 text-neutral-300 hover:text-cyan-300 group">
                      <span>• Open Residencies (Live DB)</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-cyan-300" />
                    </Link>
                    <Link href="/internship-programs" className="flex items-center justify-between py-1.5 text-neutral-300 hover:text-cyan-300 group">
                      <span>• 1, 3, 6-Month Tracks</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-cyan-300" />
                    </Link>
                    <Link href="/what-we-do/talent-solutions" className="flex items-center justify-between py-1.5 text-neutral-300 hover:text-cyan-300 group">
                      <span>• Placement &amp; Squad Matching</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-cyan-300" />
                    </Link>
                  </div>
                </div>
                <Link
                  href="/internships"
                  className="w-full text-center py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold uppercase tracking-wider transition-all"
                >
                  Browse Open Residencies →
                </Link>
              </div>

              {/* Category 2: LEARNING & GROWTH */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#11111A] border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-8">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/30 font-mono text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      02 / LEARNING &amp; GROWTH
                    </span>
                    <BookOpen className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white uppercase">Curriculum &amp; Community</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed font-normal">
                    Master modern architectures through hands-on labs, comprehensive course catalogs, and collaborative community.
                  </p>
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-xs font-mono">
                    <Link href="/courses" className="flex items-center justify-between py-1.5 text-neutral-300 hover:text-emerald-300 group">
                      <span>• Course Catalog</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-emerald-300" />
                    </Link>
                    <Link href="/programs" className="flex items-center justify-between py-1.5 text-neutral-300 hover:text-emerald-300 group">
                      <span>• Flagship Learning Programs</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-emerald-300" />
                    </Link>
                    <Link href="/who-we-are/our-people" className="flex items-center justify-between py-1.5 text-neutral-300 hover:text-emerald-300 group">
                      <span>• Builder Collective &amp; Mentors</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-emerald-300" />
                    </Link>
                  </div>
                </div>
                <Link
                  href="/courses"
                  className="w-full text-center py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider transition-all"
                >
                  Explore Course Catalog →
                </Link>
              </div>

              {/* Category 3: LIFE AT NOVA */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#11111A] border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-8">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-md bg-indigo-950/80 border border-indigo-500/30 font-mono text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      03 / LIFE AT NOVA
                    </span>
                    <Users className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white uppercase">Culture &amp; Verification</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed font-normal">
                    Inspect life inside paired builder squads, learn why partners trust our proof of work, and see the hiring trajectory.
                  </p>
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-xs font-mono">
                    <Link href="/careers/why-nova" className="flex items-center justify-between py-1.5 text-neutral-300 hover:text-indigo-300 group">
                      <span>• Why NOVA (Proof of Work)</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-indigo-300" />
                    </Link>
                    <Link href="/careers/squad-life" className="flex items-center justify-between py-1.5 text-neutral-300 hover:text-indigo-300 group">
                      <span>• Squad Life &amp; Mentorship</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-indigo-300" />
                    </Link>
                    <Link href="/careers/hiring-process" className="flex items-center justify-between py-1.5 text-neutral-300 hover:text-indigo-300 group">
                      <span>• 4-Stage Placement Flow</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-indigo-300" />
                    </Link>
                  </div>
                </div>
                <Link
                  href="/careers/why-nova"
                  className="w-full text-center py-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold uppercase tracking-wider transition-all"
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
          className="py-20 sm:py-28 bg-[#0C0C12] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-8">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                  CAREER PATHWAYS
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                  EXPLORE YOUR TRAJECTORY
                </h2>
              </div>
              <p className="text-sm text-neutral-400 max-w-md font-normal leading-relaxed">
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
          className="py-20 sm:py-28 bg-[#07070A] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-16">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-cyan-400 uppercase">
                THE BUILDER JOURNEY
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                What You Can Do Here
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-8 rounded-3xl bg-[#111118] border border-white/10 flex flex-col justify-between min-h-[280px]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">01</span>
                    <Code2 className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase">Learn by Doing</h3>
                  <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                    Skip static lectures. Master cloud infrastructure, AI models, and modern systems through hands-on labs.
                  </p>
                </div>
                <Link href="/courses" className="text-xs font-mono font-bold text-cyan-400 hover:underline uppercase">
                  Browse Courses →
                </Link>
              </div>

              <div className="p-8 rounded-3xl bg-[#111118] border border-white/10 flex flex-col justify-between min-h-[280px]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">02</span>
                    <Users className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase">Build in Squads</h3>
                  <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                    Work alongside resident builders and senior architects inside paired squads executing agile sprints.
                  </p>
                </div>
                <Link href="/careers/squad-life" className="text-xs font-mono font-bold text-cyan-400 hover:underline uppercase">
                  Explore Squad Life →
                </Link>
              </div>

              <div className="p-8 rounded-3xl bg-[#111118] border border-white/10 flex flex-col justify-between min-h-[280px]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">03</span>
                    <ShieldCheck className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase">Prove with Commits</h3>
                  <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                    Turn your execution into a publicly inspectable proof-of-work portfolio backed by real test suites.
                  </p>
                </div>
                <Link href="/careers/why-nova" className="text-xs font-mono font-bold text-cyan-400 hover:underline uppercase">
                  Proof of Work →
                </Link>
              </div>

              <div className="p-8 rounded-3xl bg-[#111118] border border-white/10 flex flex-col justify-between min-h-[280px]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">04</span>
                    <Zap className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase">Connect &amp; Launch</h3>
                  <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                    Transition directly into paid residencies, partner engineering teams, and enterprise placement.
                  </p>
                </div>
                <Link href="/careers/hiring-process" className="text-xs font-mono font-bold text-cyan-400 hover:underline uppercase">
                  Hiring Flow →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 05 — INSTITUTIONAL CLOSING CTA */}
        <section className="py-24 sm:py-32 bg-[#050508] text-white overflow-hidden relative border-t border-white/10">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center gap-8">
            <span className="text-xs font-mono font-semibold tracking-[0.24em] text-cyan-400 uppercase">
              JOIN THE ECOSYSTEM
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white max-w-3xl leading-tight">
              Start Building Your Track Record Today
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/internships"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30"
              >
                Browse Open Residencies
              </Link>
              <Link
                href="/careers/why-nova"
                className="rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all"
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
