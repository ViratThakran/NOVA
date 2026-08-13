import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = {
  title: "Contact — NOVA",
  description: "Contact NOVA.",
};

export default function ContactPage() {
  return (
    <PublicPageShell>
      <PageHeader title="Contact" description="Get in touch with NOVA." />
      <EmptyState
        title="Contact functionality is coming soon"
        description="There isn't a working contact form or published contact address yet."
      />
    </PublicPageShell>
  );
}
