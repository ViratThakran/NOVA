import { Film } from "lucide-react";

// The hero's video/poster slot — deliberately left empty per instruction,
// pending the real Runway-generated asset (see the hero shot list). This is
// not a broken placeholder: the gradient is the actual planned color
// treatment (cool blue/near-black, keyed to --color-primary) from the hero
// storyboard, so the layout and mood are final — only the footage itself is
// missing. Swap this component for a <video>/poster pair once the asset
// exists; nothing else in HeroSection needs to change.
export function HeroMediaPlaceholder() {
  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden bg-[#05060a]"
      role="img"
      aria-label="NOVA hero visual — placeholder, pending final video"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 100%, rgb(var(--color-primary) / 0.35), transparent 60%)," +
            "radial-gradient(90% 70% at 85% 0%, rgb(var(--color-primary-light) / 0.18), transparent 55%)," +
            "linear-gradient(180deg, #05060a 0%, #0a0c14 55%, #05060a 100%)",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_100%)]" />

      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur-sm sm:bottom-6 sm:right-6">
        <Film className="h-3.5 w-3.5 text-white/70" aria-hidden="true" />
        <span className="text-caption font-medium text-white/70">Hero visual — pending generation</span>
      </div>
    </div>
  );
}
