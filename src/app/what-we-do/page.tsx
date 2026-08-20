import { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { WhatWeDoHero } from "@/components/marketing/what-we-do/what-we-do-hero";
import { CapabilityDirectory } from "@/components/marketing/what-we-do/capability-directory";
import { IndustryDirectory } from "@/components/marketing/what-we-do/industry-directory";
import { CtaSection } from "@/components/marketing/cta-section";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "What We Do | NOVA Capabilities & Industries",
  description:
    "Explore NOVA's engineering disciplines and industries — from AI & Intelligence, Cloud, and Software to Data, Automation, and Talent Solutions.",
};

export default function WhatWeDoPage() {
  return (
    <div className="min-h-screen bg-[#08080A] text-white selection:bg-indigo-500 selection:text-white">
      <SiteHeader transparent />
      <main>
        <WhatWeDoHero />
        <CapabilityDirectory />
        <IndustryDirectory />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
