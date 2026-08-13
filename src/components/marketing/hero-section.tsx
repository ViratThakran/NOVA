import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { HeroVisual } from "./hero-visual";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid w-full max-w-content items-center gap-16 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-8 lg:py-28 xl:px-12">
        <div className="flex flex-col gap-8">
          <p className="text-caption font-medium uppercase tracking-[0.2em] text-primary">
            Learning · Work · Technology · Talent
          </p>
          <h1 className="max-w-2xl text-hero text-text">Build what&apos;s next.</h1>
          <p className="max-w-xl text-body text-text-muted sm:text-lg">
            NOVA connects learning, real-world work, technology, talent, and opportunity in one
            ecosystem — so what you build actually counts.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="#platform" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Explore NOVA
            </Link>
            <Link href="#companies" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Work with NOVA
            </Link>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
