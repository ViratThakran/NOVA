// Centralized landing-page copy. Keeping this separate from the section
// components means the journey steps aren't duplicated between the
// typographic treatment in "What is NOVA?" and the explained progression
// in "How NOVA Works" — both read from the same source.

// Abbreviated 5-node chain used by the hero's abstract ecosystem diagram —
// deliberately distinct from JOURNEY_STEPS below (which is the full 6-stage
// model used in "How NOVA Works"): the hero visual is a mark, not a map.
export const HERO_VISUAL_STEPS = ["Learn", "Build", "Prove", "Connect", "Grow"] as const;

export const NAV_ITEMS = [
  { href: "/platform", label: "Platform" },
  { href: "/programs", label: "Programs" },
  { href: "/services", label: "Services" },
  { href: "/companies", label: "Companies" },
  { href: "/about", label: "About" },
] as const;

export const JOURNEY_STEPS = [
  {
    label: "Discover",
    description: "Find the paths, people, and technology shaping what's next.",
  },
  {
    label: "Learn",
    description: "Build real skills inside NOVA's learning environment.",
  },
  {
    label: "Build",
    description: "Apply what you've learned to real, hands-on work.",
  },
  {
    label: "Prove",
    description: "Turn that work into a track record that speaks for itself.",
  },
  {
    label: "Connect",
    description: "Meet the companies and teams building what's next.",
  },
  {
    label: "Grow",
    description: "Keep advancing as NOVA's ecosystem grows with you.",
  },
] as const;

export const ECOSYSTEM_PILLARS = [
  {
    id: "students",
    label: "Students",
    description:
      "Learn by doing. Students move through real work — not simulations — and leave with a track record, not just a certificate.",
  },
  {
    id: "companies",
    label: "Companies",
    description:
      "Find talent that has already done the work. Companies engage with people who've proven their skills inside NOVA, not just claimed them.",
  },
  {
    id: "technology",
    label: "Technology",
    description:
      "The platform underneath it all. NOVA's technology connects learning, work, and opportunity into a single, coherent system.",
  },
] as const;
