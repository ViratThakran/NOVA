import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck, CheckCircle2, Zap, Compass } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";

export const metadata: Metadata = {
  title: "Hiring Process & Placement Flow | Careers at NOVA",
  description:
    "Explore how candidates move from domain discovery to hands-on execution, proof-of-work verification, and direct placement with hiring partners.",
};

const HIRING_STAGES = [
  {
    stage: "STAGE 01",
    name: "DISCOVERY & DOMAIN MAPPING",
    title: "Select Your Track",
    description: "Explore domain tracks across AI & Intelligence, Cloud Infrastructure, Data Engineering, Software Systems, or specialized Industry Solutions.",
  },
  {
    stage: "STAGE 02",
    name: "CHALLENGE EXECUTION",
    title: "Build in Live Squads",
    description: "Execute real engineering challenges inside paired builder squads under the guidance of senior staff architects.",
  },
  {
    stage: "STAGE 03",
    name: "SKILLS VERIFICATION",
    title: "Inspectable Proof of Work",
    description: "Your commits, pull requests, and test suite coverage are compiled into a publicly inspectable proof-of-work track record.",
  },
  {
    stage: "STAGE 04",
    name: "DIRECT PLACEMENT",
    title: "Fast-Track Opportunity",
    description: "Verified builders transition directly into paid residencies, partner engineering teams, and full-time enterprise placements.",
  },
];

export default function HiringProcessPage() {
  return (
    <div className="min-h-screen bg-[#07070A] text-white selection:bg-indigo-600 selection:text-white">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — HERO (Dark #07070A with Placement Photo) */}
        <section
          data-chapter="01 / HIRING PROCESS"
          className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-[#07070A] text-white border-b border-white/10 overflow-hidden"
        >
          <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-[0.28em] text-cyan-400 uppercase">
                  <ShieldCheck className="h-4 w-4" />
                  <span>CAREERS · HIRING PROCESS &amp; PLACEMENT</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-white uppercase leading-[0.92]">
                  DISCOVERY, SKILLS,<br />VERIFICATION, AND<br />PLACEMENT.
                </h1>

                <p className="text-base sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  A transparent pipeline designed to measure real software capability, eliminate generic resume screens, and connect proven builders directly to opportunity.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs font-mono text-cyan-300">
                    DISCOVERY · SKILLS · VERIFICATION · PLACEMENT
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
                <Image
                  src="/images/cards/gen_placement.jpg"
                  alt="NOVA Placement Flow"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  VERIFIED PROOF OF WORK · DIRECT PLACEMENT
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — THE 4-STAGE PLACEMENT FLOW */}
        <section
          data-chapter="02 / PLACEMENT FLOW"
          className="py-20 sm:py-28 bg-[#0C0C12] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-14">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                TRANSPARENT PIPELINE
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                The 4-Stage Trajectory
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HIRING_STAGES.map((s, idx) => (
                <div
                  key={s.stage}
                  className="p-8 rounded-3xl bg-[#12121A] border border-white/10 flex flex-col justify-between gap-6 min-h-[320px]"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-400">{s.stage}</span>
                      <span className="font-mono text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
                        0{idx + 1}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                      {s.name}
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-tight">{s.title}</h3>
                    <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 03 — WHY PARTNERS TRUST VERIFICATION */}
        <section
          data-chapter="03 / PROOF OF WORK VERIFICATION"
          className="py-20 sm:py-28 bg-[#09090D] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 flex flex-col gap-6">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-cyan-400 uppercase">
                  VERIFICATION RIGOR
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                  Why Partners Trust NOVA
                </h2>
                <p className="text-base text-neutral-300 font-normal leading-relaxed">
                  Hiring partners bypass generic resume screens because every candidate from NOVA is evaluated against real software commits, passing test suites, and peer review feedback.
                </p>
                <div className="p-6 rounded-2xl bg-[#14141E] border border-white/10 border-l-4 border-l-cyan-400">
                  <p className="text-sm font-semibold text-white italic leading-relaxed">
                    &ldquo;Companies hire from NOVA because our builders have already demonstrated their ability to ship maintainable code inside production environments.&rdquo;
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 relative aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <Image
                  src="/images/cards/gen_bootcamp.jpg"
                  alt="Skills Verification"
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  AUTOMATED TEST SUITES · INSPECTABLE PULL REQUESTS
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 04 — RELATED PAGES & CLOSING CTA */}
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
              <Link href="/careers/why-nova" className="group p-6 rounded-2xl bg-[#151520] border border-white/10 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">01</span>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">Why NOVA</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">Proof of work over credentials.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-400">Explore →</span>
              </Link>

              <Link href="/careers/squad-life" className="group p-6 rounded-2xl bg-[#151520] border border-white/10 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">02</span>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">Squad Life</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">Production squads &amp; code reviews.</p>
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

        {/* CLOSING CTA */}
        <section className="py-24 sm:py-32 bg-[#050508] text-white overflow-hidden relative">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center gap-8">
            <span className="text-xs font-mono font-semibold tracking-[0.24em] text-cyan-400 uppercase">
              ENTER THE PIPELINE
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white max-w-3xl leading-tight">
              Ready to Prove Your Execution Capability?
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/internships"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 text-sm font-bold uppercase transition-all shadow-lg shadow-indigo-600/30"
              >
                Browse Residencies
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
