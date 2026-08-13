import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { ECOSYSTEM_PILLARS } from "./content";

// Students and Companies flank Technology, which renders as the visibly
// larger, filled node — a deliberate composition (not three equal cards)
// that shows Technology as the thing connecting the other two, echoing the
// line-and-node language introduced in the hero.
const students = ECOSYSTEM_PILLARS.find((p) => p.id === "students")!;
const companies = ECOSYSTEM_PILLARS.find((p) => p.id === "companies")!;
const technology = ECOSYSTEM_PILLARS.find((p) => p.id === "technology")!;
const ORDERED_PILLARS = [students, technology, companies];

export function EcosystemSection() {
  return (
    <section id="ecosystem" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto w-full max-w-content px-4 py-20 sm:px-6 sm:py-24 lg:px-8 xl:px-12">
        <Reveal className="max-w-2xl">
          <h2 className="text-h2 text-text">The NOVA ecosystem</h2>
          <p className="mt-4 text-body text-text-muted">
            Two sides, connected by one platform — each one making the other work.
          </p>
        </Reveal>

        <div className="relative mt-16">
          {/* connecting line: vertical through the marker column on mobile, horizontal across the row on desktop */}
          <div
            aria-hidden="true"
            className="absolute left-6 top-2 bottom-2 w-px bg-border lg:left-0 lg:right-0 lg:top-3 lg:bottom-auto lg:h-px lg:w-auto"
          />

          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-0">
            {ORDERED_PILLARS.map((pillar, index) => {
              const isTechnology = pillar.id === "technology";
              return (
                <Reveal
                  key={pillar.id}
                  id={pillar.id}
                  delay={index * 100}
                  className="relative flex scroll-mt-16 gap-4 lg:flex-1 lg:flex-col lg:items-center lg:gap-0 lg:px-6 lg:text-center"
                >
                  <div className="relative z-10 flex w-12 shrink-0 items-start justify-center pt-1 lg:h-6 lg:w-auto lg:items-center lg:pt-0 lg:pb-6">
                    <span
                      className={cn(
                        "rounded-full",
                        isTechnology
                          ? "h-6 w-6 bg-primary shadow-[0_0_0_4px_rgb(var(--color-primary)/0.15)]"
                          : "h-4 w-4 border-2 border-primary bg-background"
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="text-h3 text-text">{pillar.label}</h3>
                    <p className={cn("mt-2 text-small text-text-muted", isTechnology && "lg:mx-auto lg:max-w-xs")}>
                      {pillar.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
