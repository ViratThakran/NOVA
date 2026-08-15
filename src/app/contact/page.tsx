import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — NOVA",
  description: "Get in touch with NOVA.",
};

export default function ContactPage() {
  return (
    <PublicPageShell>
      <PageHeader title="Contact" description="Have a question about programs, internships, or services? Send us a message." />
      <div className="max-w-xl">
        <Card>
          <CardContent className="p-6">
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </PublicPageShell>
  );
}
