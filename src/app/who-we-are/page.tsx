import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, HeartHandshake } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";
import { WHO_WE_ARE_GROUPS } from "@/data/who-we-are";

export const metadata: Metadata = {
  title: "Who We Are | NOVA Enterprise Directory & Identity",
  description:
    "An ambitious technology organization and platform connecting learning, real-world software execution, and economic opportunity.",
};

export default function WhoWeAreOverviewPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-indigo-600 selection:text-white">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — EDITORIAL SPLIT HERO (Dark #060608 with Human Photography) */}
        <section
          data-chapter="01 / WHO NOVA IS"
          className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-[#060608] text-white border-b border-white/10 overflow-hidden"
        >
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Editorial Headline & Statement */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
                  <HeartHandshake className="h-4 w-4" />
                  <span>PEOPLE · PURPOSE · CULTURE</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-white uppercase leading-[0.92]">
                  A GLOBAL COMMUNITY<br />OF BUILDERS, MENTORS,<br />AND VISIONARIES.
                </h1>

                <p className="text-base sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  NOVA is an ambitious organization and collective dedicated to connecting human potential, learning, and real opportunity across the world.
                </p>

                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href="/who-we-are/about"
                    className="inline-flex items-center gap-2 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 px-5 py-3 text-xs sm:text-sm font-bold uppercase transition-all shadow-md"
                  >
                    <span>Read About NOVA</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/who-we-are/our-story"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-5 py-3 text-xs sm:text-sm font-bold uppercase transition-all"
                  >
                    <span>Discover Our Story</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Human Community Photo Feature */}
              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
                <Image
                  src="/images/cards/experience.jpg"
                  alt="NOVA Builder Community"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-1 text-white">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    OUR PEOPLE &amp; SQUADS
                  </span>
                  <p className="text-xs text-neutral-300 font-normal">
                    Paired engineering mentorship, active pull requests, and verified proof-of-work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — EDITORIAL STATEMENT & PHILOSOPHY (Light #F8F9FC) */}
        <section
          data-chapter="02 / THE NOVA PURPOSE"
          className="py-20 sm:py-28 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 flex flex-col gap-6">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
                  OUR PHILOSOPHY
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase leading-none">
                  DEMOCRATIZING HIGH-TIER ENGINEERING
                </h2>
                <p className="text-base sm:text-lg text-neutral-700 font-normal leading-relaxed">
                  We believe technical opportunity should not depend on geography or static academic pedigree. Real capability is forged by building, breaking, and shipping production software against authentic engineering constraints.
                </p>
                <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs border-l-4 border-l-indigo-600">
                  <p className="text-sm sm:text-base font-semibold text-neutral-900 italic leading-relaxed">
                    &ldquo;NOVA removes the artificial divide between learning and working, creating a seamless trajectory from first commit to production squad execution.&rdquo;
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 relative aspect-[16/10] rounded-3xl overflow-hidden shadow-xl border border-neutral-200">
                <Image
                  src="/images/cards/grow.jpg"
                  alt="NOVA Ecosystem Trajectory"
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white font-mono text-xs font-semibold uppercase tracking-wider">
                  LEARN · BUILD · PROVE · CONNECT
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 03 — ORGANIZATIONAL DIRECTORY (Dark Surface #0A0A0E) */}
        <section
          data-chapter="03 / ORGANIZATIONAL DIRECTORY"
          className="py-20 sm:py-28 bg-[#0A0A0E] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-8">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                  ORGANIZATIONAL DIRECTORY
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                  EXPLORE WHO WE ARE
                </h2>
              </div>
              <p className="text-sm text-neutral-400 max-w-md font-normal leading-relaxed">
                Select any destination below to deep-dive into NOVA&apos;s identity, culture, and governance structure.
              </p>
            </div>

            {/* 3 Editorial Category Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {WHO_WE_ARE_GROUPS.map((group, groupIdx) => (
                <div
                  key={group.title}
                  className="flex flex-col p-8 rounded-3xl bg-[#121216] border border-white/10 shadow-xl justify-between min-h-[460px]"
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        0{groupIdx + 1}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        {group.title}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                        {group.title}
                      </h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">{group.description}</p>
                    </div>

                    <div className="flex flex-col divide-y divide-white/5 pt-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.slug}
                          href={item.href}
                          className="group/item flex items-center justify-between py-3 px-2 hover:bg-white/5 rounded-xl transition-all"
                        >
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-indigo-400">
                                {item.number}
                              </span>
                              <span className="text-sm font-bold text-white group-hover/item:text-indigo-300 transition-colors">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400 line-clamp-1">
                              {item.summary}
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-neutral-500 group-hover/item:text-white group-hover/item:translate-x-1 transition-all shrink-0 ml-2" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04 — FEATURED INITIAL ROUTES (Light #F6F7FA) */}
        <section
          data-chapter="04 / FEATURED DESTINATIONS"
          className="py-20 sm:py-28 bg-[#F6F7FA] text-neutral-950 border-b border-neutral-200"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-10">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
                PRIMARY DESTINATIONS
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 uppercase">
                Start Here
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* About NOVA Card */}
              <Link
                href="/who-we-are/about"
                className="group relative p-8 sm:p-10 rounded-3xl bg-white border border-neutral-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between min-h-[320px]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600">01 / ABOUT NOVA</span>
                    <ArrowUpRight className="h-5 w-5 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-neutral-950 group-hover:text-indigo-600 transition-colors">
                    About NOVA
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                    Discover what NOVA is, why NOVA exists, and what makes our platform and builder collective fundamentally different from traditional technical education.
                  </p>
                </div>
                <div className="pt-6 border-t border-neutral-200 flex items-center justify-between text-xs font-mono font-bold uppercase text-neutral-900">
                  <span>Read About NOVA →</span>
                  <span className="text-neutral-400 font-normal">Dedicated Route</span>
                </div>
              </Link>

              {/* Our Story Card */}
              <Link
                href="/who-we-are/our-story"
                className="group relative p-8 sm:p-10 rounded-3xl bg-white border border-neutral-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between min-h-[320px]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600">02 / OUR STORY</span>
                    <ArrowUpRight className="h-5 w-5 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-neutral-950 group-hover:text-indigo-600 transition-colors">
                    Our Story
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                    Trace our origins from an initial challenge to bridge passive learning and live engineering, through key development milestones, to our global future trajectory.
                  </p>
                </div>
                <div className="pt-6 border-t border-neutral-200 flex items-center justify-between text-xs font-mono font-bold uppercase text-neutral-900">
                  <span>Read Our Story →</span>
                  <span className="text-neutral-400 font-normal">Dedicated Route</span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* 05 — INSTITUTIONAL CLOSING CTA (Dark #070709) */}
        <section className="py-24 sm:py-32 bg-[#070709] text-white overflow-hidden relative">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center gap-8">
            <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
              JOIN THE ECOSYSTEM
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
                href="/what-we-do"
                className="rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 text-sm font-bold uppercase transition-all"
              >
                Explore What We Do
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
