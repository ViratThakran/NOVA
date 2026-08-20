import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAPABILITIES } from "@/data/capabilities";
import { SiteHeader } from "@/components/marketing/site-header";
import { ChapterProgress } from "@/components/marketing/what-we-do/capability-page/chapter-progress";
import { CapabilityHero } from "@/components/marketing/what-we-do/capability-page/capability-hero";
import { AiDataNowSection } from "@/components/marketing/what-we-do/capability-page/ai-data-now";
import { AiWhatWeDoSection } from "@/components/marketing/what-we-do/capability-page/ai-what-we-do";
import { AiInActionSection } from "@/components/marketing/what-we-do/capability-page/ai-in-action";
import { AiRealWorldSection } from "@/components/marketing/what-we-do/capability-page/ai-real-world";
import { AiTechnologyEcosystemSection } from "@/components/marketing/what-we-do/capability-page/ai-technology-ecosystem";
import { AiRelatedCapabilitiesSection } from "@/components/marketing/what-we-do/capability-page/ai-related-capabilities";
import { CapabilityCta } from "@/components/marketing/what-we-do/capability-page/capability-cta";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "AI & Data | NOVA Capabilities",
  description:
    "Intelligence starts with the right data. NOVA combines AI, advanced analytics, and intelligent systems to help organizations turn information into decisions.",
};

export default function AiIntelligencePage() {
  const capability = CAPABILITIES.find((c) => c.slug === "ai-intelligence");

  if (!capability) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-indigo-500 selection:text-white">
      <SiteHeader transparent />
      <ChapterProgress />
      <main className="flex flex-col">
        {/* 01 — HERO (Dark) */}
        <CapabilityHero capability={capability} />

        {/* 02 — AI & DATA NOW (Light) */}
        <AiDataNowSection />

        {/* 03 — WHAT WE DO (Light / Surface) */}
        <AiWhatWeDoSection />

        {/* 04 — AI IN ACTION (Dark) */}
        <AiInActionSection />

        {/* 05 — AI & DATA IN THE REAL WORLD (Light) */}
        <AiRealWorldSection />

        {/* 06 — TECHNOLOGY ECOSYSTEM (Light / Surface) */}
        <AiTechnologyEcosystemSection />

        {/* 07 — RELATED CAPABILITIES (Light) */}
        <AiRelatedCapabilitiesSection />

        {/* FINAL CTA (Dark) */}
        <CapabilityCta />
      </main>
      <SiteFooter />
    </div>
  );
}
