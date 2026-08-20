import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Zap, ShieldCheck, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";

export const metadata: Metadata = {
  title: "Why NOVA | Proof of Work & Engineering Mastery",
  description:
    "Discover why NOVA replaces passive tutorial video courses with live production sandboxes, paired squad reviews, and inspectable proof-of-work.",
};

const WHY_PILLARS = [
  {
    num: "01",
    title: "Inspectable Code Commits",
    description:
      "Static resume claims take a back seat to demonstrable capability. We evaluate builders through inspectable pull requests, test coverage, and live system uptime.",
  },
  {
    num: "02",
    title: "Production Sandboxes",
    description:
      "Work inside real containerized environments simulating live production constraints, CI/CD automated test harnesses, and microservice architectures.",
  },
  {
    num: "03",
    title: "Paired Squad Culture",
    description:
      "Collaborate in active builder squads mentored by experienced technical leads who review code line-by-line and debate architectural trade-offs.",
  },
  {
    num: "04",
    title: "Direct Placement Pipeline",
    description:
      "Skip generic recruiter black holes. Verified proof-of-work connects proven builders directly with enterprise hiring managers and startup founders.",
  },
];

export default function WhyNovaPage() {
  return (
    <div className="min-h-screen bg-[#07070A] text-white selection:bg-indigo-600 selection:text-white">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — HERO (Dark #07070A) */}
        <section
          data-chapter="01 / WHY NOVA"
          className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-[#07070A] text-white border-b border-white/10 overflow-hidden"
        >
          <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-[0.28em] text-cyan-400 uppercase">
                  <Zap className="h-4 w-4" />
                  <span>CAREERS · WHY CHOOSE NOVA</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-white uppercase leading-[0.92]">
                  THE EXPERIENCE PARADOX,<br />SOLVED PERMANENTLY.
                </h1>

                <p className="text-base sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  Traditional education leaves ambitious minds trapped in tutorial hell. NOVA provides the live environments, peer squads, and proof-of-work needed to prove real capability.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs font-mono text-cyan-300">
                    PROOF OF WORK · PRODUCTION SQUADS · MOBILITY
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
                <Image
                  src="/images/cards/gen_residency.jpg"
                  alt="NOVA Production Sandbox"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  REAL PRODUCTION SANDBOXES · AUTOMATED TEST HARNESSES
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — THE EXPERIENCE PARADOX NARRATIVE */}
        <section
          data-chapter="02 / THE PARADOX"
          className="py-20 sm:py-28 bg-[#0C0C12] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                  THE FUNDAMENTAL PROBLEM
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                  THE EXPERIENCE PARADOX
                </h2>
                <div className="p-6 rounded-2xl bg-[#14141E] border border-white/10 border-l-4 border-l-cyan-400">
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
          </div>
        </section>

        {/* 03 — 4 PILLARS OF WHY NOVA */}
        <section
          data-chapter="03 / CORE PILLARS"
          className="py-20 sm:py-28 bg-[#09090D] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-14">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-cyan-400 uppercase">
                WHY BUILDERS CHOOSE NOVA
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                Four Pillars of Proof
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {WHY_PILLARS.map((p) => (
                <div
                  key={p.num}
                  className="p-8 sm:p-10 rounded-3xl bg-[#12121A] border border-white/10 flex flex-col justify-between gap-6"
                >
                  <div className="flex flex-col gap-4">
                    <span className="font-mono text-xs font-bold text-cyan-400">{p.num}</span>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{p.title}</h3>
                    <p className="text-sm text-neutral-400 font-normal leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04 — RELATED DESTINATIONS */}
        <section className="py-16 bg-[#0E0E14] border-b border-white/10 text-white">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-neutral-400 uppercase">
                EXPLORE CAREERS
              </span>
              <Link href="/careers" className="text-xs font-mono font-semibold text-cyan-400 hover:underline uppercase">
                Careers Overview →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Link href="/careers/squad-life" className="group p-6 rounded-2xl bg-[#151520] border border-white/10 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">01</span>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">Squad Life</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">Production squads &amp; code reviews.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-400">Explore →</span>
              </Link>

              <Link href="/careers/hiring-process" className="group p-6 rounded-2xl bg-[#151520] border border-white/10 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">02</span>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">Hiring Process</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">Skills verification &amp; placement flow.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-400">Explore →</span>
              </Link>

              <Link href="/internships" className="group p-6 rounded-2xl bg-[#151520] border border-white/10 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">03</span>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">Open Residencies</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">Live database-backed opportunities.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-400">Explore →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 05 — CLOSING CTA */}
        <section className="py-24 sm:py-32 bg-[#050508] text-white overflow-hidden relative">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center gap-8">
            <span className="text-xs font-mono font-semibold tracking-[0.24em] text-cyan-400 uppercase">
              READY TO BUILD?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white max-w-3xl leading-tight">
              Start Your Track Record with NOVA
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/internships"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 text-sm font-bold uppercase transition-all shadow-lg shadow-indigo-600/30"
              >
                Browse Open Roles
              </Link>
              <Link
                href="/careers"
                className="rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-sm font-bold uppercase transition-all"
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
