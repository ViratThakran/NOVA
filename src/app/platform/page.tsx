import Link from "next/link";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Platform — NOVA",
  description: "The NOVA platform connects learning, real-world work, technology, and talent.",
};

export default function PlatformPage() {
  return (
    <PublicPageShell>
      <PageHeader
        title="The NOVA platform"
        description="A single ecosystem where what you learn turns into what you build, and what you build turns into what comes next."
      />
      <EmptyState
        title="A dedicated Platform page is coming soon"
        description="For now, the homepage covers what the NOVA platform is."
        action={
          <Link href="/#platform" className={buttonVariants({ variant: "outline", size: "sm" })}>
            See the homepage overview
          </Link>
        }
      />
    </PublicPageShell>
  );
}
