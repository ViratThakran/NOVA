import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export interface ComingSoonPageProps {
  title: string;
  description: string;
}

// Shared shell for routes that are real, intentional destinations but whose
// functionality hasn't shipped yet (e.g. /login, /get-started) — not a
// generic 404, and not a fake login form.
export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-start gap-4 p-8">
            <span className="text-caption font-medium uppercase tracking-[0.2em] text-primary">
              Coming next
            </span>
            <h1 className="text-h2 text-text">{title}</h1>
            <p className="text-body text-text-muted">{description}</p>
            <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-2 gap-2" })}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to NOVA
            </Link>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
