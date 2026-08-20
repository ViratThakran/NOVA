import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Zap, ShieldCheck, CheckCircle2, Terminal, Cpu, GitPullRequest, Award } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";
import { CareersSubNav } from "@/components/marketing/careers-sub-nav";

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

export default function WhyNovaPage() {
  return (
    <div className="min-h-screen bg-[#07070A] text-white selection:bg-fuchsia-600 selection:text-white">
      <SiteHeader transparent />
      <CareersSubNav activeHref="/careers/why-nova" />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — HERO (Dark with Violet / Fuchsia Accents) */}
        <section
          data-chapter="01 / WHY NOVA"
          className="relative pt-24 pb-20 sm:pt-32 sm:pb-28 bg-[#07070A] text-white border-b border-white/10 overflow-hidden"
        >
          {/* Ambient Lighting */}
          <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-fuchsia-600/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-mono font-bold tracking-[0.24em] text-violet-300 uppercase w-fit">
                  <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
                  <span>LIFE AT NOVA · WHY CHOOSE US</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-white uppercase leading-[0.92]">
                  THE EXPERIENCE PARADOX,<br />
                  <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-300 bg-clip-text text-transparent">
                    SOLVED PERMANENTLY.
                  </span>
                </h1>

                <p className="text-base sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  Traditional credentials leave ambitious minds trapped in tutorial limbo. NOVA provides live sandboxes, paired squads, and inspectable code commits needed to prove real engineering capability.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    href="/internships"
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-lg shadow-violet-600/30"
                  >
                    <span>Explore Open Residencies</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/careers/squad-life"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all"
                  >
                    <span>Inside Squad Life</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-violet-500/30 shadow-2xl shadow-violet-950/50">
                <Image
                  src="/images/cards/gen_residency.jpg"
                  alt="NOVA Production Sandbox"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07070A] via-[#07070A]/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-violet-300 uppercase tracking-wider">
                  REAL PRODUCTION SANDBOXES · AUTOMATED TEST HARNESSES
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — THE EXPERIENCE PARADOX NARRATIVE & COMPARISON */}
        <section
          data-chapter="02 / THE PARADOX"
          className="py-20 sm:py-28 bg-[#0C0C12] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-violet-400 uppercase">
                  THE FUNDAMENTAL PROBLEM
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                  THE EXPERIENCE PARADOX
                </h2>
                <div className="p-6 rounded-2xl bg-[#14141E] border border-violet-500/30 border-l-4 border-l-violet-400 shadow-xl">
                  <p className="text-sm sm:text-base font-semibold text-white italic leading-relaxed">
                    &ldquo;You cannot get a software engineering role without production experience, yet you cannot acquire production experience without a role.&rdquo;
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6 text-base sm:text-lg text-neutral-300 leading-relaxed font-normal">
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
              <div className="p-8 rounded-3xl bg-[#101016] border border-red-500/20 flex flex-col gap-5">
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                  TRADITIONAL / BOOTCAMP PATH
                </span>
                <ul className="flex flex-col gap-3 text-sm text-neutral-300">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>Passive video lectures without production pressure</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>Isolated toy projects with zero peer code review</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>Generic certificates ignored by hiring managers</span>
                  </li>
                </ul>
              </div>

              <div className="p-8 rounded-3xl bg-[#12121E] border border-violet-500/30 flex flex-col gap-5">
                <span className="text-xs font-mono font-bold text-violet-300 uppercase tracking-wider">
                  THE NOVA PRODUCTION SQUAD MODEL
                </span>
                <ul className="flex flex-col gap-3 text-sm text-neutral-200">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Real live sandboxes with containerized microservices</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Paired engineering sprints &amp; line-by-line staff reviews</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
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
          className="py-20 sm:py-28 bg-[#09090D] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-14">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-violet-400 uppercase">
                WHY BUILDERS CHOOSE NOVA
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                Four Pillars of Proof
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {WHY_PILLARS.map((p) => {
                const IconComponent = p.icon;
                return (
                  <div
                    key={p.num}
                    className="p-8 sm:p-10 rounded-3xl bg-[#12121A] border border-white/10 hover:border-violet-500/40 transition-all flex flex-col justify-between gap-6"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-violet-400">{p.num}</span>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
                          <IconComponent className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">{p.title}</h3>
                      <p className="text-sm text-neutral-400 font-normal leading-relaxed">
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
        <section className="py-16 bg-[#0E0E14] border-b border-white/10 text-white">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-neutral-400 uppercase">
                EXPLORE LIFE AT NOVA
              </span>
              <Link href="/careers" className="text-xs font-mono font-semibold text-violet-400 hover:underline uppercase">
                Careers Overview →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Link href="/careers/squad-life" className="group p-6 rounded-2xl bg-[#151520] border border-white/10 hover:border-violet-500/50 transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-violet-400">01</span>
                  <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">Squad Life</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">Production squads &amp; code reviews.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-violet-400">Explore →</span>
              </Link>

              <Link href="/careers/hiring-process" className="group p-6 rounded-2xl bg-[#151520] border border-white/10 hover:border-violet-500/50 transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-violet-400">02</span>
                  <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">Hiring Process</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">Skills verification &amp; placement flow.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-violet-400">Explore →</span>
              </Link>

              <Link href="/internships" className="group p-6 rounded-2xl bg-[#151520] border border-white/10 hover:border-violet-500/50 transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-violet-400">03</span>
                  <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">Open Residencies</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">Live database-backed opportunities.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-violet-400">Explore →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 05 — CLOSING CTA */}
        <section className="py-24 sm:py-32 bg-[#050508] text-white overflow-hidden relative">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center gap-8">
            <span className="text-xs font-mono font-semibold tracking-[0.24em] text-violet-400 uppercase">
              READY TO BUILD?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white max-w-3xl leading-tight">
              Start Your Track Record with NOVA
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/internships"
                className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all shadow-lg shadow-violet-600/30"
              >
                Browse Open Roles
              </Link>
              <Link
                href="/careers"
                className="rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all"
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
