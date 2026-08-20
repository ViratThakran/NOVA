import { Metadata } from "next";
import { notFound } from "next/navigation";
import { INDUSTRIES, getIndustryBySlug } from "@/data/industries";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { IndustryProgress } from "@/components/marketing/industries/industry-progress";
import { IndustryHero } from "@/components/marketing/industries/industry-hero";
import { IndustrySignalsSection } from "@/components/marketing/industries/industry-signals-section";
import { IndustrySolutionsSection } from "@/components/marketing/industries/industry-solutions-section";
import { IndustryInActionSection } from "@/components/marketing/industries/industry-in-action-section";
import { IndustryAssuranceSection } from "@/components/marketing/industries/industry-assurance-section";
import { IndustryTechSection } from "@/components/marketing/industries/industry-tech-section";
import { IndustryRelatedCapabilities } from "@/components/marketing/industries/industry-related-capabilities";
import { IndustryCta } from "@/components/marketing/industries/industry-cta";

interface IndustryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return INDUSTRIES.map((ind) => ({
    slug: ind.slug,
  }));
}

export async function generateMetadata({ params }: IndustryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const industry = getIndustryBySlug(slug);

  if (!industry) {
    return {
      title: "Industry Solution | NOVA",
    };
  }

  return {
    title: `${industry.title} | NOVA Industry Solutions`,
    description: industry.heroDescription,
  };
}

export default async function IndustryDynamicPage({ params }: IndustryPageProps) {
  const { slug } = await params;
  const industry = getIndustryBySlug(slug);

  if (!industry) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-neutral-900 selection:text-white">
      <SiteHeader transparent />
      <IndustryProgress />
      <main className="flex flex-col">
        {/* 01 — HERO (Dark #060608) */}
        <IndustryHero
          number={industry.number}
          title={industry.title}
          tagline={industry.tagline}
          description={industry.heroDescription}
          illustrationSrc={industry.illustrationSrc}
          accent={industry.accent}
          metrics={industry.metrics}
        />

        {/* 02 — INDUSTRY SIGNALS (Light #F8F9FC / Glassmorphic) */}
        <IndustrySignalsSection
          heading={industry.signals.heading}
          subtext={industry.signals.subtext}
          signals={industry.signals.items}
          accent={industry.accent}
        />

        {/* 03 — INDUSTRY SOLUTIONS (Light Surface #F6F7FA / Interactive Tabbed Matrix) */}
        <IndustrySolutionsSection
          heading={industry.solutions.heading}
          subtext={industry.solutions.subtext}
          industryCategory={industry.solutions.industryCategory}
          solutions={industry.solutions.items}
          accent={industry.accent}
        />

        {/* 04 — SYSTEMS IN ACTION (Dark #08080A / Narrative Case Studies) */}
        <IndustryInActionSection
          heading={industry.action.heading}
          subtext={industry.action.subtext}
          stories={industry.action.cases}
          accent={industry.accent}
        />

        {/* 05 — INSTITUTIONAL ASSURANCE & GOVERNANCE (Light #F8F9FC / Bank-grade Compliance) */}
        <IndustryAssuranceSection
          heading={industry.assurance.heading}
          subtext={industry.assurance.subtext}
          pillars={industry.assurance.pillars}
          accent={industry.accent}
        />

        {/* 06 — ARCHITECTURE & TECH ECOSYSTEM (Light Surface #F5F7FA / Stack & Tech Grid) */}
        <IndustryTechSection
          heading={industry.ecosystem.heading}
          subtext={industry.ecosystem.subtext}
          pipelineLabel={industry.ecosystem.pipelineLabel}
          stackLayers={industry.ecosystem.stackLayers}
          techsLabel={industry.ecosystem.techsLabel}
          techs={industry.ecosystem.techs}
          accent={industry.accent}
        />

        {/* 07 — SUPPORTING CAPABILITIES DIRECTORY (Light #F8F9FB) */}
        <IndustryRelatedCapabilities
          industryName={industry.title}
          accent={industry.accent}
        />

        {/* 08 — CLOSING INSTITUTIONAL CTA (Dark #070709) */}
        <IndustryCta subtext={industry.ctaSubtext} />
      </main>
      <SiteFooter />
    </div>
  );
}
