import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { JOURNEY_STEPS } from "./content";

export function HowItWorksSection() {
  return (
    <section id="programs" className="scroll-mt-16 border-b border-border bg-surface">
      <div className="mx-auto w-full max-w-content px-4 py-20 sm:px-6 sm:py-24 lg:px-8 xl:px-12">
        <Reveal className="max-w-2xl">
          <h2 className="text-h2 text-text">How NOVA works</h2>
          <p className="mt-4 text-body text-text-muted">
            One progression, six stages — from first discovering NOVA to growing inside it.
          </p>
        </Reveal>

        <div className="relative mt-16">
          {/* connecting line: vertical through the marker column on mobile, horizontal across the row on desktop */}
          <div
            aria-hidden="true"
            className="absolute left-4 top-2 bottom-2 w-px bg-border lg:left-0 lg:right-0 lg:top-4 lg:bottom-auto lg:h-px lg:w-auto"
          />

          <ol className="relative flex flex-col gap-8 lg:flex-row lg:gap-0">
            {JOURNEY_STEPS.map((step, index) => {
              const isLast = index === JOURNEY_STEPS.length - 1;
              return (
                <li key={step.label} className="lg:flex-1">
                  <Reveal delay={index * 90} className="relative flex gap-4 lg:flex-col lg:gap-0 lg:pr-6">
                    <div className="relative z-10 flex w-8 shrink-0 items-start justify-center pt-1 lg:h-8 lg:w-auto lg:items-center lg:pt-0 lg:pb-5">
                      <span
                        className={cn(
                          "rounded-full",
                          isLast
                            ? "h-5 w-5 bg-primary shadow-[0_0_0_4px_rgb(var(--color-primary)/0.15)]"
                            : "h-3 w-3 border-2 border-primary bg-surface"
                        )}
                      />
                    </div>
                    <div>
                      <span className="text-caption font-medium text-text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="mt-1 text-body font-semibold text-text">{step.label}</h3>
                      <p className="mt-1 text-small text-text-muted">{step.description}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
