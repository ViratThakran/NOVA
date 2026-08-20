import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";

export const metadata: Metadata = {
  title: "About NOVA | Who We Are",
  description:
    "Discover what NOVA is, why NOVA exists, and what makes our platform and builder collective fundamentally different.",
};

export default function AboutNovaPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-indigo-600 selection:text-white">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — EDITORIAL HERO WITH HUMAN PHOTOGRAPHY (Dark #060608) */}
        <section
          data-chapter="01 / ABOUT NOVA"
          className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-[#060608] text-white border-b border-white/10 overflow-hidden"
        >
          <div className="absolute top-1/3 left-10 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Editorial Headline & Statement */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
                  <Sparkles className="h-4 w-4" />
                  <span>WHO WE ARE · ABOUT NOVA</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-white uppercase leading-[0.92]">
                  AN INSTITUTION<br />BUILT TO UNLOCK<br />HUMAN POTENTIAL.
                </h1>

                <p className="text-base sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  NOVA exists to bridge the gap between curiosity and real-world mastery. We bring together passionate people, collaborative mentorship, and pathways to lasting impact.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs font-mono text-indigo-300">
                    IDENTITY · PURPOSE · COMMUNITY
                  </span>
                </div>
              </div>

              {/* Right Column: Documentary Photo Card */}
              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
                <Image
                  src="/images/cards/build.jpg"
                  alt="Production Code Review"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  REAL PRODUCTION SANDBOXES · AUTOMATED TEST SUITES · CODE REVIEWS
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — WHAT NOVA IS (Light #F8F9FC / Editorial Split) */}
        <section
          data-chapter="02 / WHAT NOVA IS"
          className="py-20 sm:py-28 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
                  OUR IDENTITY
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase leading-none">
                  WHAT IS NOVA?
                </h2>
                <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs border-l-4 border-l-indigo-600">
                  <p className="text-base font-semibold text-neutral-900 italic leading-relaxed">
                    &ldquo;Static credentials take a back seat to inspectable code commits and production deployments.&rdquo;
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6 text-base sm:text-lg text-neutral-700 leading-relaxed font-normal">
                <p>
                  NOVA is not a traditional IT consultancy, nor is it a passive online video course catalog. It is an integrated technology ecosystem designed to cultivate engineering mastery and deploy proven builders directly into high-impact software initiatives.
                </p>
                <p>
                  Through interactive sandboxes, production-grade repositories, and peer-led engineering squads, NOVA provides individuals with the environment needed to develop verifiable capability.
                </p>
                <p>
                  For partner organizations, NOVA represents a direct pipeline to talent and engineering solutions grounded in real production work rather than unverified resumes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 03 — WHY NOVA EXISTS (Dark #0A0A0E / Asymmetric Layout) */}
        <section
          data-chapter="03 / WHY NOVA EXISTS"
          className="py-20 sm:py-28 bg-[#0A0A0E] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-16">
            <div className="flex flex-col gap-3 max-w-3xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                THE EXPERIENCE PARADOX
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                WHY NOVA EXISTS
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 flex flex-col gap-6 text-base sm:text-lg text-neutral-300 leading-relaxed font-normal">
                <p>
                  The modern software industry presents a fundamental contradiction: aspiring builders cannot get engineering roles without production experience, yet cannot acquire production experience without an engineering role.
                </p>
                <p>
                  NOVA eliminates this paradox by creating a controlled production environment where builders solve real technical challenges, submit pull requests against live architectures, and receive rigorous code reviews from senior leads.
                </p>
              </div>

              <div className="lg:col-span-6 relative aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <Image
                  src="/images/cards/learn.jpg"
                  alt="Interactive Sandbox Environment"
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-white uppercase tracking-wider">
                  HANDS-ON LABS · PRODUCTION RUNTIMES · PEER MENTORSHIP
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 04 — WHAT MAKES NOVA DIFFERENT (Light #F6F7FA / 4 Structural Pillars) */}
        <section
          data-chapter="04 / OUR DIFFERENCE"
          className="py-20 sm:py-28 bg-[#F6F7FA] text-neutral-950 border-b border-neutral-200"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-14">
            <div className="flex flex-col gap-2 max-w-2xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
                KEY DIFFERENTIATORS
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-950 uppercase">
                What Makes NOVA Different
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between min-h-[240px]">
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-xs font-bold text-indigo-600">01</span>
                  <h3 className="text-lg font-bold text-neutral-950">Challenge-Driven Labs</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    Hands-on engineering environments that simulate live production environments and real system constraints.
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between min-h-[240px]">
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-xs font-bold text-indigo-600">02</span>
                  <h3 className="text-lg font-bold text-neutral-950">Peer-Led Squads</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    Collaborative builder teams mentored by experienced technical leads across active software projects.
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between min-h-[240px]">
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-xs font-bold text-indigo-600">03</span>
                  <h3 className="text-lg font-bold text-neutral-950">Inspectable Portfolios</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    Publicly verifiable proof-of-work portfolios demonstrating real problem-solving over theory.
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between min-h-[240px]">
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-xs font-bold text-indigo-600">04</span>
                  <h3 className="text-lg font-bold text-neutral-950">Economic Mobility</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    Direct pathways into paid residencies, full-time engineering placements, and partner project teams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 05 — INSTITUTIONAL CLOSING CTA (Dark #070709) */}
        <section className="py-24 sm:py-32 bg-[#070709] text-white overflow-hidden relative">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center gap-8">
            <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
              CONTINUE THE JOURNEY
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white max-w-3xl leading-tight">
              Read Our Story &amp; Evolution
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/who-we-are/our-story"
                className="rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 px-6 py-3.5 text-sm font-bold uppercase transition-all shadow-md"
              >
                Read Our Story →
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
