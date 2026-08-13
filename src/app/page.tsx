import { SiteHeader } from "@/components/marketing/site-header";
import { HeroSection } from "@/components/marketing/hero-section";
import { WhatIsNovaSection } from "@/components/marketing/what-is-nova-section";
import { EcosystemSection } from "@/components/marketing/ecosystem-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <WhatIsNovaSection />
        <EcosystemSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
