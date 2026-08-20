import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";

export const metadata: Metadata = {
  title: "Our People | Who We Are",
  description:
    "Meet the community of engineers, technical leads, and resident builders driving the NOVA ecosystem.",
};

const ROLES = [
  {
    role: "RESIDENT BUILDERS",
    title: "Ambitious Engineers & Masters",
    description:
      "Passionate developers, students, and practitioners working in live sandboxes, contributing to production repositories, and advancing through real engineering sprints.",
  },
  {
    role: "TECHNICAL LEADS",
    title: "Senior Architects & Mentors",
    description:
      "Experienced engineering leaders who review code, guide architectural decisions, and maintain rigorous software quality standards across all squads.",
  },
  {
    role: "PARTNER ENGINEERS",
    title: "Enterprise Ecosystem Squads",
    description:
      "Engineers from hiring partner organizations and technology firms who collaborate directly with NOVA squads on specialized production initiatives.",
  },
];

export default function OurPeoplePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-indigo-600 selection:text-white">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — EDITORIAL HERO (Dark #060608 with Photo Feature) */}
        <section
          data-chapter="01 / OUR PEOPLE"
          className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-[#060608] text-white border-b border-white/10 overflow-hidden"
        >
          <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-[0.28em] text-indigo-400 uppercase">
                  <Users className="h-4 w-4" />
                  <span>WHO WE ARE · OUR PEOPLE</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-white uppercase leading-[0.92]">
                  ENGINEERS, LEADS,<br />AND RESIDENT<br />BUILDERS.
                </h1>

                <p className="text-base sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                  A global collective united by curiosity, rigor, and a shared dedication to shipping real software.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs font-mono text-indigo-300">
                    BUILDERS · MENTORS · COMMUNITY
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
                <Image
                  src="/images/cards/experience.jpg"
                  alt="NOVA Builders & Mentors"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  COLLABORATIVE CRAFT · PEER REVIEWS · GLOBAL SQUADS
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — ROLES IN THE ECOSYSTEM (Light #F8F9FC) */}
        <section
          data-chapter="02 / COMMUNITY COMPOSITION"
          className="py-20 sm:py-28 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-14">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
                THE BUILDER COLLECTIVE
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase leading-none">
                Who Makes Up NOVA
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {ROLES.map((r, idx) => (
                <div
                  key={r.role}
                  className="p-8 sm:p-10 rounded-3xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between gap-6 min-h-[300px]"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-600">0{idx + 1}</span>
                      <span className="font-mono text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
                        {r.role}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-950 tracking-tight">{r.title}</h3>
                    <p className="text-xs sm:text-sm text-neutral-600 font-normal leading-relaxed">
                      {r.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 03 — MENTORSHIP & CRAFT (Dark #0A0A0E) */}
        <section
          data-chapter="03 / MENTORSHIP & CRAFT"
          className="py-20 sm:py-28 bg-[#0A0A0E] text-white border-b border-white/10"
        >
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 flex flex-col gap-6">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                  PEER CULTURE
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                  Generous Knowledge Sharing
                </h2>
                <p className="text-base text-neutral-300 font-normal leading-relaxed">
                  Our community thrives on transparent feedback and continuous learning. Senior mentors work side-by-side with rising builders, reviewing architecture, discussing design trade-offs, and elevating technical craftsmanship.
                </p>
                <div className="p-6 rounded-2xl bg-[#121216] border border-white/10 border-l-4 border-l-indigo-400">
                  <p className="text-sm font-semibold text-white italic leading-relaxed">
                    &ldquo;Mentorship inside NOVA is active and hands-on — code is reviewed line-by-line, and architectural decisions are debated openly.&rdquo;
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 relative aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <Image
                  src="/images/cards/grow.jpg"
                  alt="Mentorship & Peer Review"
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 font-mono text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  LINE-BY-LINE CODE REVIEWS · OPEN MENTORSHIP · SHARED GROWTH
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 04 — RELATED PAGES (Light #F6F7FA) */}
        <section className="py-16 bg-[#F6F7FA] border-b border-neutral-200 text-neutral-950">
          <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-neutral-300 pb-3">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-neutral-500 uppercase">
                PEOPLE &amp; CULTURE
              </span>
              <Link href="/who-we-are" className="text-xs font-mono font-semibold text-indigo-600 hover:underline uppercase">
                All Destinations →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Link href="/who-we-are/leadership" className="group p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600">06</span>
                  <h3 className="text-base font-bold text-neutral-950 group-hover:text-indigo-600 transition-colors">Leadership</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">Stewardship &amp; direction.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-600">Explore →</span>
              </Link>

              <Link href="/who-we-are/culture" className="group p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600">07</span>
                  <h3 className="text-base font-bold text-neutral-950 group-hover:text-indigo-600 transition-colors">Culture</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">First principles &amp; environment.</p>
                </div>
                <span className="pt-4 text-xs font-mono font-semibold text-indigo-600">Explore →</span>
              </Link>

              <Link href="/who-we-are/locations" className="group p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600">08</span>
                  <h3 className="text-base font-bold text-neutral-950 group-hover:text-indigo-600 transition-colors">Locations</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">Distributed global squads.</p>
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
              JOIN THE COMMUNITY
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
