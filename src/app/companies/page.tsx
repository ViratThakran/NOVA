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
        title="Post internships and review applicants"
        description="Companies can manage a profile, post internships, and review applicants from the company platform."
        action={
          <Link href="/login" className={buttonVariants({ variant: "primary", size: "sm" })}>
            Sign in to the company platform
          </Link>
        }
      />
    </PublicPageShell>
  );
}
