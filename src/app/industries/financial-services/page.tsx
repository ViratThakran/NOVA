import { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { IndustryProgress } from "@/components/marketing/industries/industry-progress";
import { IndustryHero } from "@/components/marketing/industries/industry-hero";
import { FinancialSignalsSection } from "@/components/marketing/industries/financial-signals";
import { FinancialSolutionsSection } from "@/components/marketing/industries/financial-solutions";
import { FinancialInActionSection } from "@/components/marketing/industries/financial-in-action";
import { FinancialAssuranceSection } from "@/components/marketing/industries/financial-assurance";
import { FinancialTechEcosystemSection } from "@/components/marketing/industries/financial-tech-ecosystem";
import { IndustryRelatedCapabilities } from "@/components/marketing/industries/industry-related-capabilities";
import { IndustryCta } from "@/components/marketing/industries/industry-cta";

export const metadata: Metadata = {
  title: "Financial Services | NOVA Industry Solutions",
  description:
    "Engineering high-throughput transaction systems, real-time risk intelligence, and cloud-native ledger infrastructure built for zero-downtime capital operations.",
};

export default function FinancialServicesPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-emerald-500 selection:text-white">
      <SiteHeader transparent />
      <IndustryProgress />
      <main className="flex flex-col">
        {/* 01 — HERO (Dark #060608) */}
        <IndustryHero
          number="02 / FINANCIAL SERVICES"
          title="Financial services"
          tagline="CAPITAL MARKETS · BANKING · FINTECH"
          description="Engineering high-throughput transaction systems, real-time risk intelligence, and cloud-native ledger infrastructure built for zero-downtime capital operations."
          illustrationSrc="/images/cards/grow.jpg"
          accent="emerald"
          metrics={[
            { label: "Execution Latency", value: "< 4.2ms P99" },
            { label: "System Availability", value: "99.999% SLA" },
            { label: "Transaction Scale", value: "250K+ ops/sec" },
            { label: "Compliance Benchmark", value: "SOC2 & ISO 27001" },
          ]}
        />

        {/* 02 — INDUSTRY SIGNALS (Light #F8F9FC / Glassmorphic) */}
        <FinancialSignalsSection />

        {/* 03 — INDUSTRY SOLUTIONS (Light Surface #F6F7FA / Interactive Tabbed Matrix) */}
        <FinancialSolutionsSection />

        {/* 04 — FINANCIAL SYSTEMS IN ACTION (Dark #08080A / Narrative Case Studies) */}
        <FinancialInActionSection />

        {/* 05 — INSTITUTIONAL ASSURANCE & GOVERNANCE (Light #F8F9FC / Bank-grade Compliance) */}
        <FinancialAssuranceSection />

        {/* 06 — ARCHITECTURE & FINANCIAL TECH ECOSYSTEM (Light Surface #F5F7FA / Stack & Tech Grid) */}
        <FinancialTechEcosystemSection />

        {/* 07 — SUPPORTING CAPABILITIES DIRECTORY (Light #F8F9FB) */}
        <IndustryRelatedCapabilities
          industryName="Financial Services"
          accent="emerald"
        />

        {/* 08 — CLOSING INSTITUTIONAL CTA (Dark #070709) */}
        <IndustryCta
          subtext="Let's discuss your transaction volume, risk architecture, or core banking modernization."
        />
      </main>
      <SiteFooter />
    </div>
  );
}
