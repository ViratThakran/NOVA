import Link from "next/link";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About — NOVA",
  description: "About NOVA, a technology organization and platform connecting learning, work, and opportunity.",
};

export default function AboutPage() {
  return (
    <PublicPageShell>
      <PageHeader
        title="About NOVA"
        description="NOVA is a technology organization and platform connecting learning, real-world work, technology, talent, and companies in one ecosystem."
      />
      <EmptyState
        title="A dedicated About page is coming soon"
        description="For now, the homepage covers what NOVA is and how it works."
        action={
          <Link href="/#about" className={buttonVariants({ variant: "outline", size: "sm" })}>
            See the homepage overview
          </Link>
        }
      />
    </PublicPageShell>
  );
}
