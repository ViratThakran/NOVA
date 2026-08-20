import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAPABILITIES } from "@/data/capabilities";
import { SiteHeader } from "@/components/marketing/site-header";
import { ChapterProgress } from "@/components/marketing/what-we-do/capability-page/chapter-progress";
import { CapabilityHero } from "@/components/marketing/what-we-do/capability-page/capability-hero";
import { CloudNowSection } from "@/components/marketing/what-we-do/capability-page/cloud-now";
import { CloudWhatWeDoSection } from "@/components/marketing/what-we-do/capability-page/cloud-what-we-do";
import { CloudInActionSection } from "@/components/marketing/what-we-do/capability-page/cloud-in-action";
import { CloudRealWorldSection } from "@/components/marketing/what-we-do/capability-page/cloud-real-world";
import { CloudTechnologySection } from "@/components/marketing/what-we-do/capability-page/cloud-technology";
import { CloudRelatedSection } from "@/components/marketing/what-we-do/capability-page/cloud-related";
import { CapabilityCta } from "@/components/marketing/what-we-do/capability-page/capability-cta";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Cloud & Infrastructure | NOVA Capabilities",
  description:
    "Modern cloud architecture, serverless microservices, and distributed Kubernetes deployments built for high-throughput concurrency and zero-downtime reliability.",
};

export default function CloudPage() {
  const capability = CAPABILITIES.find((c) => c.slug === "cloud");

  if (!capability) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-sky-500 selection:text-white">
      <SiteHeader transparent />
      <ChapterProgress />
      <main className="flex flex-col">
        {/* 01 — HERO (Dark) */}
        <CapabilityHero capability={capability} />

        {/* 02 — CLOUD NOW (Light / Glassmorphic) */}
        <CloudNowSection />

        {/* 03 — WHAT WE DO (Light Surface / Offerings) */}
        <CloudWhatWeDoSection />

        {/* 04 — CLOUD IN ACTION (Dark) */}
        <CloudInActionSection />

        {/* 05 — REAL-WORLD PROOF (Light / Glassmorphic) */}
        <CloudRealWorldSection />

        {/* 06 — TECHNOLOGY ECOSYSTEM (Light Surface / Glassmorphic) */}
        <CloudTechnologySection />

        {/* 07 — RELATED CAPABILITIES (Light / Glassmorphic) */}
        <CloudRelatedSection />

        {/* FINAL CTA (Dark) */}
        <CapabilityCta />
      </main>
      <SiteFooter />
    </div>
  );
}
