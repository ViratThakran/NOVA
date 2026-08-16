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
          <div className="flex flex-wrap gap-2">
            <Link href="/company/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
              Create a company account
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Sign in
            </Link>
          </div>
        }
      />
    </PublicPageShell>
  );
}
