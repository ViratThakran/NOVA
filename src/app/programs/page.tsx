import Link from "next/link";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Programs — NOVA",
  description: "How NOVA works — discover, learn, build, prove, connect, and grow.",
};

export default function ProgramsPage() {
  return (
    <PublicPageShell>
      <PageHeader
        title="Programs"
        description="One progression, six stages — from first discovering NOVA to growing inside it."
      />
      <EmptyState
        title="A dedicated Programs page is coming soon"
        description="For now, the homepage covers how NOVA works."
        action={
          <Link href="/#programs" className={buttonVariants({ variant: "outline", size: "sm" })}>
            See the homepage overview
          </Link>
        }
      />
    </PublicPageShell>
  );
}
