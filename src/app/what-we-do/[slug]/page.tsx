import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAPABILITIES } from "@/data/capabilities";
import { SiteHeader } from "@/components/marketing/site-header";
import { ChapterProgress } from "@/components/marketing/what-we-do/capability-page/chapter-progress";
import { CapabilityHero } from "@/components/marketing/what-we-do/capability-page/capability-hero";
import { CapabilityStack } from "@/components/marketing/what-we-do/capability-page/capability-stack";
import { CapabilityServices } from "@/components/marketing/what-we-do/capability-page/capability-services";
import { CapabilityAction } from "@/components/marketing/what-we-do/capability-page/capability-action";
import { CapabilityOutcomes } from "@/components/marketing/what-we-do/capability-page/capability-outcomes";
import { CapabilityProcess } from "@/components/marketing/what-we-do/capability-page/capability-process";
import { CapabilityTechnology } from "@/components/marketing/what-we-do/capability-page/capability-technology";
import { CapabilityInsights } from "@/components/marketing/what-we-do/capability-page/capability-insights";
import { CapabilityCta } from "@/components/marketing/what-we-do/capability-page/capability-cta";
import { SiteFooter } from "@/components/marketing/site-footer";

interface CapabilityPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return CAPABILITIES.map((cap) => ({
    slug: cap.slug,
  }));
}

export async function generateMetadata({ params }: CapabilityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const capability = CAPABILITIES.find((c) => c.slug === slug);

  if (!capability) {
    return {
      title: "Capability Not Found | NOVA",
    };
  }

  return {
    title: `${capability.title} | NOVA Capabilities`,
    description: capability.heroDescription,
  };
}

export default async function CapabilityDynamicPage({
  params,
}: CapabilityPageProps) {
  const { slug } = await params;
  const capability = CAPABILITIES.find((c) => c.slug === slug);

  if (!capability) {
    notFound();
  }

  // Gracefully fallback to flagship AI structure for capabilities not yet built
  const aiData = CAPABILITIES[0];
  const enrichedCapability = {
    ...capability,
    stackSteps: capability.stackSteps.length > 0 ? capability.stackSteps : aiData.stackSteps,
    services: capability.services.length > 0 ? capability.services : aiData.services,
    actionItems: capability.actionItems.length > 0 ? capability.actionItems : aiData.actionItems,
    outcomes: capability.outcomes.length > 0 ? capability.outcomes : aiData.outcomes,
    process: capability.process.length > 0 ? capability.process : aiData.process,
    techCategories: capability.techCategories.length > 0 ? capability.techCategories : aiData.techCategories,
    insights: capability.insights.length > 0 ? capability.insights : aiData.insights,
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white selection:bg-indigo-500 selection:text-white">
      <SiteHeader transparent />
      <ChapterProgress />
      <main>
        <CapabilityHero capability={enrichedCapability} />
        <CapabilityStack capability={enrichedCapability} />
        <CapabilityServices capability={enrichedCapability} />
        <CapabilityAction capability={enrichedCapability} />
        <CapabilityOutcomes capability={enrichedCapability} />
        <CapabilityProcess capability={enrichedCapability} />
        <CapabilityTechnology capability={enrichedCapability} />
        <CapabilityInsights capability={enrichedCapability} />
        <CapabilityCta />
      </main>
      <SiteFooter />
    </div>
  );
}
