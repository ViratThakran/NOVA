import Link from "next/link";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { ECOSYSTEM_PILLARS } from "@/components/marketing/content";

export const metadata: Metadata = {
  title: "For Companies — NOVA",
  description: "How companies engage with the NOVA ecosystem.",
};

const companiesPillar = ECOSYSTEM_PILLARS.find((p) => p.id === "companies")!;

export default function CompaniesPage() {
  return (
    <PublicPageShell>
      <PageHeader title="For companies" description={companiesPillar.description} />
      <EmptyState
        title="Company tools are coming soon"
        description="A dedicated company platform — profiles, postings, and applicant review — isn't built yet."
        action={
          <Link href="/#companies" className={buttonVariants({ variant: "outline", size: "sm" })}>
            See the homepage overview
          </Link>
        }
      />
    </PublicPageShell>
  );
}
