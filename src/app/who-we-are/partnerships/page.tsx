import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";

export const metadata: Metadata = {
  title: "Partnerships | Who We Are",
  description:
    "Explore NOVA's collaborative network: enterprise hiring partners, technology organizations, and academic institutions.",
};

const PARTNERSHIP_TYPES = [
  {
    num: "01",
    type: "ENTERPRISE PARTNERS",
    title: "Direct Talent & Project Squads",
    description:
      "Collaborating with enterprise technology organizations to deploy proven NOVA builder squads directly onto live software initiatives.",
  },
  {
    num: "02",
    type: "HIRING NETWORKS",
    title: "Verified Skills Placement",
    description:
      "Connecting hiring managers and recruitment leads directly with candidate profiles verified through inspectable pull requests.",
  },
  {
    num: "03",
    type: "ACADEMIC LABS",
    title: "Curriculum & Research Alignment",
    description:
      "Partnering with university computer science departments to supplement theoretical coursework with live production sandboxes.",
  },
  {
    num: "04",
    type: "OPEN INFRASTRUCTURE",
    title: "Open-Source Collaborations",
    description:
      "Contributing code, developer tooling, and sandbox infrastructure back to the global open-source software community.",
  },
];

export default function PartnershipsPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-indigo-600 selection:text-white">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — EDITORIAL HERO (Dark #060608 with Photo Feature) */}
        <section
          data-chapter="01 / PARTNERSHIPS"
          className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-[#060608] text-white border-b border-white/10 overflow-hidden"
        >
          <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
                  <HeartHandshake className="h-4 w-4" />
                  <span>WHO WE ARE · PARTNERSHIPS</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-white uppercase leading-[0.92]">
                  ENTERPRISE,<br />ACADEMIA, AND<br />ECOSYSTEM.
                </h1>

                <p className="text-base sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  Collaborating with technology enterprises, hiring partners, and academic institutions to connect learning with real production execution.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs font-mono text-indigo-300">
                    ENTERPRISE · ACADEMIA · ECOSYSTEM
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
                <Image
                  src="/images/cards/experience.jpg"
                  alt="NOVA Partnership Ecosystem"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  STRATEGIC COLLABORATION · SHARED GROWTH
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — PARTNERSHIP TYPES (Light #F8F9FC) */}
        <section
          data-chapter="02 / PARTNERSHIP NETWORK"
          className="py-20 sm:py-28 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-14">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
                COLLABORATION MODELS
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase leading-none">
                How We Partner
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {PARTNERSHIP_TYPES.map((pt) => (
                <div
                  key={pt.num}
                  className="p-8 sm:p-10 rounded-3xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between gap-6"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-600">{pt.num}</span>
                      <span className="font-mono text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
                        {pt.type}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-neutral-950 tracking-tight">{pt.title}</h3>
                    <p className="text-sm text-neutral-600 font-normal leading-relaxed">
                      {pt.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 03 — ECOSYSTEM VALUE (Dark #0A0A0E) */}
        <section
          data-chapter="03 / ECOSYSTEM SYNERGY"
          className="py-20 sm:py-28 bg-[#0A0A0E] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-12">
            <div className="max-w-4xl flex flex-col gap-6">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                MUTUAL SUCCESS
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-tight">
                &ldquo;PARTNERSHIPS INSIDE NOVA ARE BUILT ON VERIFIED CAPABILITY AND SHARED VALUE.&rdquo;
              </h2>
              <p className="text-base sm:text-lg text-neutral-300 font-normal leading-relaxed">
                Whether deploying embedded builder squads, sourcing skill-verified candidates, or integrating sandbox environments into academic curriculums, NOVA creates high-conviction outcomes for all ecosystem partners.
              </p>
            </div>
          </div>
        </section>

        {/* 04 — RELATED PAGES (Light #F6F7FA) */}
        <section className="py-16 bg-[#F6F7FA] border-b border-neutral-200 text-neutral-950">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-neutral-300 pb-3">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-neutral-500 uppercase">
                IMPACT &amp; TRUST
              </span>
              <Link href="/who-we-are" className="text-xs font-mono font-semibold text-indigo-600 hover:underline uppercase">
                All Destinations →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Link href="/who-we-are/our-impact" className="group p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600">09</span>
                  <h3 className="text-base font-bold text-neutral-950 group-hover:text-indigo-600 transition-colors">Our Impact</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">Careers launched, code shipped.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-600">Explore →</span>
              </Link>

              <Link href="/who-we-are/sustainability" className="group p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600">10</span>
                  <h3 className="text-base font-bold text-neutral-950 group-hover:text-indigo-600 transition-colors">Sustainability</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">Resilient &amp; efficient systems.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-600">Explore →</span>
              </Link>

              <Link href="/who-we-are/responsible-technology" className="group p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600">11</span>
                  <h3 className="text-base font-bold text-neutral-950 group-hover:text-indigo-600 transition-colors">Responsible Tech</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">Ethics, safety &amp; transparent AI.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-600">Explore →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 05 — INSTITUTIONAL CLOSING CTA (Dark #070709) */}
        <section className="py-24 sm:py-32 bg-[#070709] text-white overflow-hidden relative">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center gap-8">
            <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
              PARTNER WITH NOVA
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white max-w-3xl leading-tight">
              Connect with NOVA &amp; Build What&apos;s Next
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/contact"
                className="rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 px-6 py-3.5 text-sm font-bold uppercase transition-all shadow-md"
              >
                Partner Contact
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
