import { SiteHeader } from "@/components/marketing/site-header";
import { CustomCursor } from "@/components/marketing/custom-cursor";
import { ScrollProgress } from "@/components/marketing/scroll-progress";
import { HeroSection } from "@/components/marketing/hero-section";
import { WhatIsNovaSection } from "@/components/marketing/what-is-nova-section";
import { WhatWeDoSection } from "@/components/marketing/what-we-do-section";
import { CareersSection } from "@/components/marketing/careers-section";
import { WhoWeAreSection } from "@/components/marketing/who-we-are-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function Home() {
  return (
    <>
      {/* 1. Global Interactive Custom Cursor */}
      <CustomCursor />

      {/* 2. Global Scroll Progress & Contextual Chapter Toast */}
      <ScrollProgress />

      {/* 3. Global Header */}
      <SiteHeader transparent />

      {/* 4. Cinematic Interactive Narrative */}
      <main className="flex flex-col">
        {/* Section 1: Hero with Interactive Looping Asset & Mouse Parallax */}
        <HeroSection />

        {/* Section 2: One Platform. Many Possibilities: Learn, Build, Experience, Grow */}
        <WhatIsNovaSection />

        {/* Section 3: What We Do: Capabilities & Solutions */}
        <WhatWeDoSection />

        {/* Section 4: Careers: Talent & Opportunity Pathways (Interactive Typography) */}
        <CareersSection />

        {/* Section 5: Who We Are: Mission, Vision, Values, Impact (Interactive Principles) */}
        <WhoWeAreSection />

        {/* Section 6: Closing CTA & Final Chapter */}
        <CtaSection />
      </main>

      {/* Global Footer */}
      <SiteFooter />
    </>
  );
}