import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Compass, ShieldCheck, Sparkles, Users, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ScrollProgress } from "@/components/marketing/scroll-progress";
import { WHO_WE_ARE_GROUPS, getWhoWeArePageBySlug, getAllWhoWeAreItems } from "@/data/who-we-are";

interface WhoWeAreSubPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const allItems = getAllWhoWeAreItems();
  return allItems.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: WhoWeAreSubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = getWhoWeArePageBySlug(slug);

  if (!pageData) {
    const matchedItem = getAllWhoWeAreItems().find((i) => i.slug === slug);
    return {
      title: matchedItem ? `${matchedItem.name} | NOVA` : "Who We Are | NOVA",
    };
  }

  return {
    title: `${pageData.name} | NOVA Who We Are`,
    description: pageData.summary,
  };
}

export default async function WhoWeAreSubPage({ params }: WhoWeAreSubPageProps) {
  const { slug } = await params;
  const pageData = getWhoWeArePageBySlug(slug);

  // Find general info from group structure if specific deep pageData isn't present
  const groupItem = getAllWhoWeAreItems().find((i) => i.slug === slug);

  if (!pageData && !groupItem) {
    notFound();
  }

  const title = pageData?.name || groupItem?.name || "Who We Are";
  const category = pageData?.category || groupItem?.category || "ABOUT NOVA";
  const tagline = pageData?.tagline || groupItem?.tagline || "WHO WE ARE";
  const summary = pageData?.summary || groupItem?.summary || "";
  const heroHeadline = pageData?.heroHeadline || title;
  const heroSubtext = pageData?.heroSubtext || summary;
  const illustrationSrc = pageData?.illustrationSrc || "/images/cards/software.jpg";

  // Find related items in the same category
  const currentGroup = WHO_WE_ARE_GROUPS.find((g) => g.title === category);
  const relatedItems = currentGroup?.items.filter((i) => i.slug !== slug) || [];

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-indigo-600 selection:text-white">
      <SiteHeader transparent />
      <ScrollProgress />

      <main className="flex flex-col">
        {/* 01 — EDITORIAL HERO (Dark #060608) */}
        <section
          data-chapter={`01 / ${title.toUpperCase()}`}
          className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 bg-[#060608] text-white border-b border-white/10 overflow-hidden"
        >
          <div className="absolute top-10 right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="flex flex-col gap-6 max-w-4xl">
              <div className="flex items-center gap-3">
                <Link
                  href="/who-we-are"
                  className="font-mono text-xs font-semibold tracking-widest text-indigo-400 uppercase hover:underline"
                >
                  WHO WE ARE
                </Link>
                <span className="text-neutral-600">/</span>
                <span className="font-mono text-xs font-semibold tracking-widest text-neutral-400 uppercase">
                  {category}
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-[0.94]">
                {heroHeadline}
              </h1>

              <p className="text-lg sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl mt-2">
                {heroSubtext}
              </p>

              <div className="pt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs font-mono text-indigo-300">
                  {tagline}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — NARRATIVE CONTENT / SECTIONS (Light #F8F9FC) */}
        {pageData?.sections && pageData.sections.length > 0 ? (
          <section
            data-chapter="02 / OVERVIEW & PHILOSOPHY"
            className="py-24 sm:py-32 bg-[#F8F9FC] border-b border-neutral-200"
          >
            <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-20">
              {pageData.sections.map((sec, idx) => (
                <div
                  key={sec.heading}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start ${
                    idx % 2 === 1 ? "lg:[direction:rtl]" : ""
                  }`}
                >
                  <div className={`lg:col-span-5 ${idx % 2 === 1 ? "[direction:ltr]" : ""}`}>
                    {sec.subtext && (
                      <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase mb-3 block">
                        {sec.subtext}
                      </span>
                    )}
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 leading-tight">
                      {sec.heading}
                    </h2>
                    {sec.quote && (
                      <div className="mt-6 p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm border-l-4 border-l-indigo-600">
                        <p className="text-base font-semibold text-neutral-900 italic leading-relaxed">
                          &ldquo;{sec.quote}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className={`lg:col-span-7 flex flex-col gap-6 text-base sm:text-lg text-neutral-700 leading-relaxed font-normal ${
                      idx % 2 === 1 ? "[direction:ltr]" : ""
                    }`}
                  >
                    {sec.content.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="py-24 sm:py-32 bg-[#F8F9FC] border-b border-neutral-200">
            <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-8 max-w-3xl">
              <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-600 uppercase">
                {category} · {title.toUpperCase()}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-950">{title}</h2>
              <p className="text-lg text-neutral-700 leading-relaxed font-normal">{summary}</p>
              <div className="pt-6 border-t border-neutral-300">
                <Link
                  href="/who-we-are"
                  className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-neutral-900 hover:text-indigo-600 transition-colors"
                >
                  <span>← Back to Who We Are Overview</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 03 — TIMELINE (If Present, e.g. Our Story) */}
        {pageData?.timeline && (
          <section
            data-chapter="03 / MILESTONES & TRAJECTORY"
            className="py-24 sm:py-32 bg-[#0A0A0E] text-white border-b border-white/10"
          >
            <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-16">
              <div className="flex flex-col gap-3 max-w-2xl">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                  EVOLUTIONARY TRAJECTORY
                </span>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white uppercase">
                  Development Milestones
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {pageData.timeline.map((item, idx) => (
                  <div
                    key={item.phase}
                    className="p-8 rounded-2xl bg-[#121216] border border-white/10 flex flex-col justify-between min-h-[280px]"
                  >
                    <div className="flex flex-col gap-3">
                      <span className="text-[11px] font-mono font-semibold tracking-widest text-indigo-400 uppercase">
                        {item.phase}
                      </span>
                      <h3 className="text-xl font-bold text-white tracking-tight">{item.title}</h3>
                      <p className="text-sm text-neutral-400 font-normal leading-relaxed mt-2">
                        {item.description}
                      </p>
                    </div>
                    <span className="font-mono text-2xl font-black text-neutral-700 self-end mt-4">
                      0{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 04 — PILLARS (If Present, e.g. About NOVA) */}
        {pageData?.pillars && (
          <section
            data-chapter="04 / CORE PILLARS"
            className="py-24 sm:py-32 bg-[#0A0A0E] text-white border-b border-white/10"
          >
            <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-16">
              <div className="flex flex-col gap-3 max-w-2xl">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-indigo-400 uppercase">
                  STRUCTURAL FOUNDATIONS
                </span>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white uppercase">
                  The NOVA Pillars
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {pageData.pillars.map((pillar) => (
                  <div
                    key={pillar.num}
                    className="p-8 rounded-2xl bg-[#121216] border border-white/10 flex flex-col justify-between min-h-[260px]"
                  >
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-mono font-bold text-indigo-400">{pillar.num}</span>
                      <h3 className="text-xl font-bold text-white tracking-tight">{pillar.title}</h3>
                      <p className="text-sm text-neutral-400 font-normal leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 05 — RELATED IN CATEGORY (Light #F6F7FA) */}
        {relatedItems.length > 0 && (
          <section className="py-20 bg-[#F6F7FA] border-b border-neutral-200 text-neutral-950">
            <div className="mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-neutral-300 pb-4">
                <span className="text-xs font-mono font-semibold tracking-[0.24em] text-neutral-500 uppercase">
                  MORE IN {category}
                </span>
                <Link
                  href="/who-we-are"
                  className="text-xs font-mono font-semibold text-indigo-600 hover:underline uppercase"
                >
                  All Destinations →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedItems.map((item) => (
                  <Link
                    key={item.slug}
                    href={item.href}
                    className="group p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">{item.number}</span>
                      <h3 className="text-lg font-bold text-neutral-950 group-hover:text-indigo-600 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-neutral-600 leading-relaxed font-normal">{item.summary}</p>
                    </div>
                    <div className="pt-4 flex items-center justify-between text-xs font-mono font-semibold text-neutral-400 group-hover:text-neutral-950 transition-colors">
                      <span>Explore</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 06 — INSTITUTIONAL CTA (Dark #070709) */}
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
                href="/who-we-are"
                className="rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 px-6 py-3.5 text-sm font-bold uppercase transition-all shadow-md"
              >
                Who We Are Directory
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
