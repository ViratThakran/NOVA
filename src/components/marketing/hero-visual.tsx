import { HERO_VISUAL_STEPS } from "./content";

// Node positions in a 400x480 space, sweeping bottom-left to top-right —
// an ascending path rather than a rigid top-down flowchart. The path below
// is a hand-tuned smooth curve through these same points.
const NODES: { x: number; y: number }[] = [
  { x: 46, y: 430 },
  { x: 150, y: 336 },
  { x: 208, y: 218 },
  { x: 322, y: 168 },
  { x: 408, y: 54 },
];

const PATH_D =
  "M46,430 C96,394 118,372 150,336 C182,300 188,256 208,218 C240,158 272,196 322,168 C364,145 384,102 408,54";

export function HeroVisual() {
  return (
    <div
      className="relative mx-auto aspect-[5/6] w-full max-w-sm select-none sm:max-w-md lg:mx-0 lg:max-w-none"
      role="img"
      aria-label="A diagram of the NOVA journey: Learn, Build, Prove, Connect, and Grow, connected by a single ascending path."
    >
      <svg viewBox="0 0 440 480" fill="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {/* faint constellation dots — purely decorative, low opacity */}
        <circle cx="330" cy="330" r="2" className="fill-text-muted/30" />
        <circle cx="120" cy="120" r="2" className="fill-text-muted/30" />
        <circle cx="380" cy="230" r="1.5" className="fill-text-muted/20" />
        <circle cx="60" cy="260" r="1.5" className="fill-text-muted/20" />

        <path
          d={PATH_D}
          className="stroke-primary/50 motion-safe:animate-nova-draw"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          style={{ strokeDashoffset: 0 }}
        />

        {NODES.map((node, index) => {
          const isLast = index === NODES.length - 1;
          return (
            <g
              key={index}
              className="motion-safe:animate-nova-fade-up motion-safe:opacity-0"
              style={{ animationDelay: `${300 + index * 180}ms` }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={isLast ? 7 : 5}
                className={isLast ? "fill-primary" : "fill-background stroke-primary"}
                strokeWidth={isLast ? 0 : 1.5}
              />
              {isLast && <circle cx={node.x} cy={node.y} r="13" className="fill-none stroke-primary/25" strokeWidth="1" />}
            </g>
          );
        })}
      </svg>

      {NODES.map((node, index) => (
        <span
          key={HERO_VISUAL_STEPS[index]}
          className="absolute text-caption font-medium tracking-wide text-text-muted motion-safe:animate-nova-fade-up motion-safe:opacity-0"
          style={{
            left: `${(node.x / 440) * 100}%`,
            top: `${(node.y / 480) * 100}%`,
            transform: `translate(-50%, ${index === NODES.length - 1 ? "-28px" : "12px"})`,
            animationDelay: `${340 + index * 180}ms`,
          }}
        >
          {HERO_VISUAL_STEPS[index]}
        </span>
      ))}
    </div>
  );
}
