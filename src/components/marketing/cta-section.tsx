import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function CtaSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto flex w-full max-w-content flex-col items-start gap-8 px-4 py-16 sm:px-6 sm:py-24 lg:px-8 xl:px-12">
        <Reveal className="flex flex-col gap-8">
          <h2 className="max-w-2xl text-h1 text-text">Build what&apos;s next.</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/get-started" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Get Started
            </Link>
            <Link href="#platform" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Explore NOVA
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
