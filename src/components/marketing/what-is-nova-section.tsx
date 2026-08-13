import { Reveal } from "./reveal";
import { JOURNEY_STEPS } from "./content";

export function WhatIsNovaSection() {
  return (
    <section id="platform" className="scroll-mt-16 border-b border-border bg-surface">
      <div className="mx-auto w-full max-w-content px-4 py-16 sm:px-6 sm:py-24 lg:px-8 xl:px-12">
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <div className="max-w-md">
            <h2 className="text-h2 text-text">What is NOVA?</h2>
            <p className="mt-4 text-body text-text-muted">
              NOVA is a technology organization and platform connecting learning, real-world
              work, technology, talent, and companies — a single ecosystem where what you learn
              turns into what you build, and what you build turns into what comes next.
            </p>
          </div>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-h3 font-semibold text-text lg:max-w-lg lg:justify-end lg:text-right">
            {JOURNEY_STEPS.map((step, index) => (
              <span key={step.label} className="inline-flex items-center gap-3">
                <span>{step.label}</span>
                {index < JOURNEY_STEPS.length - 1 && (
                  <span className="text-text-muted" aria-hidden="true">
                    →
                  </span>
                )}
              </span>
            ))}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
