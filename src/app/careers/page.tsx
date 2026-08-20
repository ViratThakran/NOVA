import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles, Zap, Users, ShieldCheck, Compass, Code2 } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";
import { CareersPathwayExplorer } from "@/components/marketing/careers-pathway-explorer";

export const metadata: Metadata = {
  title: "Careers & Pathways | NOVA Builder Ecosystem",
  description:
    "Build real production software, work in paired engineering squads, and launch your trajectory through verified proof of work.",
};

export default function CareersOverviewPage() {
  return (
    <div className="min-h-screen bg-[#07070A] text-white selection:bg-indigo-600 selection:text-white">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — ENERGETIC HUMAN HERO (Dark #07070A with Electric Lighting) */}
        <section
          data-chapter="01 / CAREERS AT NOVA"
          className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-[#07070A] text-white border-b border-white/10 overflow-hidden"
        >
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Energetic Headline & Positioning */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-[0.28em] text-cyan-400 uppercase">
                  <Zap className="h-4 w-4" />
                  <span>FOR BUILDERS WHO WANT TO SHIP REAL SOFTWARE</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-white uppercase leading-[0.92]">
                  BUILD WHAT&apos;S NEXT.<br />PROVE YOUR CRAFT.<br />LAUNCH YOUR CAREER.
                </h1>

                <p className="text-base sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  NOVA removes the artificial divide between technical learning and production execution. Work in paired squads, ship code to live environments, and turn your output into verified opportunity.
                </p>

                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href="/internships"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 text-xs sm:text-sm font-bold uppercase transition-all shadow-lg shadow-indigo-600/30"
                  >
                    <span>Explore Open Residencies</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/careers/why-nova"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-xs sm:text-sm font-bold uppercase transition-all"
                  >
                    <span>Why Choose NOVA</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Active Squad Photography */}
              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-950/50">
                <Image
                  src="/images/cards/gen_squads.jpg"
                  alt="NOVA Engineering Squad"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07070A] via-transparent to-transparent" />
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

        {/* 02 — INTERACTIVE CAREER PATHWAY EXPERIENCE */}
        <section
          data-chapter="02 / PATHWAY EXPLORER"
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

        {/* 03 — WHAT CAN I DO HERE? (High-Energy Pillar Grid) */}
        <section
          data-chapter="03 / WHAT YOU CAN DO HERE"
          className="py-20 sm:py-28 bg-[#09090D] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-16">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-cyan-400 uppercase">
                THE BUILDER TRAJECTORY
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                What You Can Do Here
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-8 rounded-3xl bg-[#12121A] border border-white/10 flex flex-col justify-between min-h-[280px]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">01</span>
                    <Code2 className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase">Learn by Doing</h3>
                  <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                    Skip static lectures. Master cloud infrastructure, AI reasoning models, and modern systems through hands-on labs.
                  </p>
                </div>
                <Link href="/courses" className="text-xs font-mono font-bold text-cyan-400 hover:underline uppercase">
                  Browse Courses →
                </Link>
              </div>

              <div className="p-8 rounded-3xl bg-[#12121A] border border-white/10 flex flex-col justify-between min-h-[280px]">
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

              <div className="p-8 rounded-3xl bg-[#12121A] border border-white/10 flex flex-col justify-between min-h-[280px]">
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

              <div className="p-8 rounded-3xl bg-[#12121A] border border-white/10 flex flex-col justify-between min-h-[280px]">
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

        {/* 04 — REAL OPPORTUNITY DISCOVERY */}
        <section
          data-chapter="04 / OPPORTUNITIES"
          className="py-20 sm:py-28 bg-[#0F0F16] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-8">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                  DIRECT DESTINATIONS
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                  Open Opportunities
                </h2>
              </div>
              <p className="text-sm text-neutral-400 max-w-md font-normal leading-relaxed">
                Connect directly to NOVA&apos;s live database of open internships, 1 to 6-month tracks, and structured programs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Internships */}
              <Link
                href="/internships"
                className="group p-8 rounded-3xl bg-[#161622] border border-white/10 hover:border-indigo-500/50 shadow-xl transition-all flex flex-col justify-between min-h-[300px]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">01 / RESIDENCIES</span>
                    <ArrowUpRight className="h-5 w-5 text-neutral-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors uppercase">
                    Open Internships
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                    Browse active engineering and product residencies with NOVA and our ecosystem partners.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono font-bold text-indigo-400">
                  <span>Browse Open Roles →</span>
                  <span className="text-neutral-500 font-normal">Live System</span>
                </div>
              </Link>

              {/* Card 2: Internship Programs */}
              <Link
                href="/internship-programs"
                className="group p-8 rounded-3xl bg-[#161622] border border-white/10 hover:border-indigo-500/50 shadow-xl transition-all flex flex-col justify-between min-h-[300px]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">02 / TRACKS</span>
                    <ArrowUpRight className="h-5 w-5 text-neutral-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors uppercase">
                    Internship Programs
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                    Structured 1, 3, and 6-month commitment tracks across AI, cloud, software systems, and data.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono font-bold text-indigo-400">
                  <span>Explore Tracks →</span>
                  <span className="text-neutral-500 font-normal">1, 3, 6 Months</span>
                </div>
              </Link>

              {/* Card 3: Learning Programs */}
              <Link
                href="/programs"
                className="group p-8 rounded-3xl bg-[#161622] border border-white/10 hover:border-indigo-500/50 shadow-xl transition-all flex flex-col justify-between min-h-[300px]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">03 / CURRICULUM</span>
                    <ArrowUpRight className="h-5 w-5 text-neutral-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors uppercase">
                    Flagship Programs
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                    Intensive engineering sprints taking you from fundamentals to a demonstrable production skill set.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono font-bold text-indigo-400">
                  <span>View Programs →</span>
                  <span className="text-neutral-500 font-normal">All Domains</span>
                </div>
              </Link>
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
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 text-sm font-bold uppercase transition-all shadow-lg shadow-indigo-600/30"
              >
                Browse Residencies
              </Link>
              <Link
                href="/get-started"
                className="rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-sm font-bold uppercase transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
