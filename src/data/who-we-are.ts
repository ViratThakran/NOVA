export interface WhoWeAreItem {
  slug: string;
  number: string;
  name: string;
  href: string;
  category: "ABOUT NOVA" | "PEOPLE & CULTURE" | "IMPACT & TRUST";
  tagline: string;
  summary: string;
}

export interface WhoWeArePageData extends WhoWeAreItem {
  heroHeadline: string;
  heroSubtext: string;
  illustrationSrc?: string;
  sections: {
    heading: string;
    subtext?: string;
    content: string[];
    quote?: string;
  }[];
  timeline?: {
    phase: string;
    title: string;
    description: string;
  }[];
  pillars?: {
    num: string;
    title: string;
    description: string;
  }[];
}

export const WHO_WE_ARE_GROUPS = [
  {
    title: "ABOUT NOVA",
    description: "The core identity, origins, and engineering philosophy behind our organization.",
    items: [
      {
        slug: "about",
        number: "01",
        name: "About NOVA",
        href: "/who-we-are/about",
        category: "ABOUT NOVA" as const,
        tagline: "ORGANIZATION · PLATFORM · ECOSYSTEM",
        summary: "An ambitious technology organization and platform connecting learning, software execution, and economic opportunity.",
      },
      {
        slug: "our-story",
        number: "02",
        name: "Our Story",
        href: "/who-we-are/our-story",
        category: "ABOUT NOVA" as const,
        tagline: "ORIGINS · EVOLUTION · TRAJECTORY",
        summary: "From an initial challenge to bridge static technical education and real-world engineering to a global builder ecosystem.",
      },
      {
        slug: "our-mission",
        number: "03",
        name: "Our Mission",
        href: "/who-we-are/our-mission",
        category: "ABOUT NOVA" as const,
        tagline: "PURPOSE · ACCESS · MOBILITY",
        summary: "Removing artificial barriers to technical mastery by enabling builders worldwide to prove their value through real software.",
      },
      {
        slug: "how-we-work",
        number: "04",
        name: "How We Work",
        href: "/who-we-are/how-we-work",
        category: "ABOUT NOVA" as const,
        tagline: "CRAFT · TRANSPARENCY · EXECUTION",
        summary: "Our engineering methodology, peer review standards, and collaborative production squad framework.",
      },
    ],
  },
  {
    title: "PEOPLE & CULTURE",
    description: "The human-centered community of engineers, mentors, and technical leads.",
    items: [
      {
        slug: "our-people",
        number: "05",
        name: "Our People",
        href: "/who-we-are/our-people",
        category: "PEOPLE & CULTURE" as const,
        tagline: "BUILDERS · LEADS · RESIDENTS",
        summary: "A global collective of ambitious builders, technical leads, and partner engineering teams.",
      },
      {
        slug: "leadership",
        number: "06",
        name: "Leadership",
        href: "/who-we-are/leadership",
        category: "PEOPLE & CULTURE" as const,
        tagline: "STEWARDSHIP · ARCHITECTURE · DIRECTION",
        summary: "Guiding the architectural standards, platform vision, and educational integrity of NOVA.",
      },
      {
        slug: "culture",
        number: "07",
        name: "Culture",
        href: "/who-we-are/culture",
        category: "PEOPLE & CULTURE" as const,
        tagline: "FIRST PRINCIPLES · RIGOR · MENTORSHIP",
        summary: "A culture grounded in production proof-of-work, generous knowledge sharing, and craftsmanship.",
      },
      {
        slug: "locations",
        number: "08",
        name: "Locations",
        href: "/who-we-are/locations",
        category: "PEOPLE & CULTURE" as const,
        tagline: "DISTRIBUTED · SQUADS · GLOBAL",
        summary: "Operating remotely across global timezones with localized production hubs and partner networks.",
      },
    ],
  },
  {
    title: "IMPACT & TRUST",
    description: "Measuring outcomes, ethical software practices, and enterprise partnerships.",
    items: [
      {
        slug: "our-impact",
        number: "09",
        name: "Our Impact",
        href: "/who-we-are/our-impact",
        category: "IMPACT & TRUST" as const,
        tagline: "CAREERS · REPOSITORIES · MOBILITY",
        summary: "Tracking tangible outcomes — production code committed, residencies awarded, and careers accelerated.",
      },
      {
        slug: "sustainability",
        number: "10",
        name: "Sustainability",
        href: "/who-we-are/sustainability",
        category: "IMPACT & TRUST" as const,
        tagline: "EFFICIENT CODE · LONG-TERM SYSTEMS",
        summary: "Building energy-conscious compute infrastructure and resilient, maintainable software architectures.",
      },
      {
        slug: "responsible-technology",
        number: "11",
        name: "Responsible Technology",
        href: "/who-we-are/responsible-technology",
        category: "IMPACT & TRUST" as const,
        tagline: "GOVERNANCE · DATA PRIVACY · SAFETY",
        summary: "Adhering to ethical AI deployment, transparent algorithms, and uncompromising security standards.",
      },
      {
        slug: "partnerships",
        number: "12",
        name: "Partnerships",
        href: "/who-we-are/partnerships",
        category: "IMPACT & TRUST" as const,
        tagline: "ENTERPRISE · ACADEMIA · ECOSYSTEM",
        summary: "Collaborating with technology enterprises, research institutions, and hiring partners worldwide.",
      },
    ],
  },
];

export const WHO_WE_ARE_PAGES: Record<string, WhoWeArePageData> = {
  about: {
    slug: "about",
    number: "01",
    name: "About NOVA",
    href: "/who-we-are/about",
    category: "ABOUT NOVA",
    tagline: "ORGANIZATION · PLATFORM · ECOSYSTEM",
    summary: "An ambitious technology organization and platform connecting learning, software execution, and economic opportunity.",
    heroHeadline: "An organization engineered for builders.",
    heroSubtext:
      "NOVA is a unified technology platform and builder collective. We exist to bridge the divide between theoretical technical education and production-grade software execution.",
    illustrationSrc: "/images/cards/build.jpg",
    sections: [
      {
        heading: "What is NOVA?",
        subtext: "AN ECOSYSTEM OF LEARNING, TECHNOLOGY, AND OPPORTUNITY",
        content: [
          "NOVA is not a traditional consultancy, nor a passive online course catalog. It is an integrated technology ecosystem designed to cultivate engineering mastery and deploy proven builders directly into high-impact software initiatives.",
          "Through interactive sandboxes, production-grade repositories, and peer-led engineering squads, NOVA provides individuals with the environment needed to develop verifiable capability.",
          "For partner organizations, NOVA represents a direct pipeline to talent and engineering solutions grounded in real production work rather than unverified resumes.",
        ],
        quote: "Static credentials take a back seat to inspectable code commits and production deployments.",
      },
      {
        heading: "Why NOVA Exists",
        subtext: "RESOLVING THE EXPERIENCE PARADOX",
        content: [
          "The modern software industry presents a fundamental contradiction: aspiring builders cannot get engineering roles without production experience, yet cannot acquire production experience without an engineering role.",
          "NOVA eliminates this paradox by creating a controlled production environment where builders solve real technical challenges, submit pull requests against live architectures, and receive rigorous code reviews from senior leads.",
        ],
      },
      {
        heading: "What Makes NOVA Different",
        subtext: "VERIFIABLE PROOF OF WORK OVER CREDENTIALS",
        content: [
          "We measure progress strictly through inspectable software execution — code quality, test coverage, system uptime, and architectural clarity.",
          "Every participant in the NOVA ecosystem builds an immutable digital portfolio demonstrating real problem-solving across cloud infrastructure, artificial intelligence, data engineering, and modern web platforms.",
        ],
      },
    ],
    pillars: [
      {
        num: "01",
        title: "Challenge-Driven Labs",
        description: "Hands-on engineering environments that simulate live production environments and real system constraints.",
      },
      {
        num: "02",
        title: "Peer-Led Squads",
        description: "Collaborative builder teams mentored by experienced technical leads across active software projects.",
      },
      {
        num: "03",
        title: "Inspectable Track Records",
        description: "Publicly verifiable proof-of-work portfolios demonstrating mastery over theory.",
      },
      {
        num: "04",
        title: "Direct Economic Mobility",
        description: "Seamless transitions into paid residencies, full-time engineering placements, and partner project teams.",
      },
    ],
  },

  "our-story": {
    slug: "our-story",
    number: "02",
    name: "Our Story",
    href: "/who-we-are/our-story",
    category: "ABOUT NOVA",
    tagline: "ORIGINS · EVOLUTION · TRAJECTORY",
    summary: "From an initial challenge to bridge static technical education and real-world engineering to a global builder ecosystem.",
    heroHeadline: "How NOVA came to be.",
    heroSubtext:
      "A journey born from a shared frustration with passive learning and unverified claims in software engineering.",
    illustrationSrc: "/images/cards/grow.jpg",
    sections: [
      {
        heading: "The Origin",
        subtext: "A FRUSTRATION WITH PASSIVE LEARNING",
        content: [
          "NOVA began with a simple observation: while demand for capable software engineers continued to grow globally, traditional education and online video courses were failing to prepare builders for the reality of production environments.",
          "Tutorial hell left aspiring engineers with passive knowledge but little confidence when confronted with complex, distributed codebases, terminal environments, and real deployment failures.",
        ],
        quote: "Real engineering capability is forged by confronting real system failures, not by watching video lectures.",
      },
      {
        heading: "The Breakthrough",
        subtext: "BUILDING THE PRODUCTION RUNTIME",
        content: [
          "We recognized that to truly master software, builders needed access to live production sandboxes, automated test harnesses, and authentic peer code reviews.",
          "We designed the first NOVA learning environment — an integrated workflow where every lesson culminated in a executable commit evaluated against real test suites.",
        ],
      },
      {
        heading: "Where We Are Going",
        subtext: "THE DEFINITIVE BUILDER ECOSYSTEM",
        content: [
          "Today, NOVA is expanding into a comprehensive platform connecting learning, software execution, and enterprise capability.",
          "Our goal remains clear: to build the definitive global ecosystem where any curious mind can acquire technical mastery and apply it to meaningful software.",
        ],
      },
    ],
    timeline: [
      {
        phase: "PHASE 01 — THE INCEPTION",
        title: "Identifying the Gap",
        description: "Recognized that traditional technical credentials failed to reflect actual production software capability.",
      },
      {
        phase: "PHASE 02 — PLATFORM ARCHITECTURE",
        title: "The Sandbox Engine",
        description: "Architected automated, containerized code execution environments with real-time feedback loops.",
      },
      {
        phase: "PHASE 03 — ECOSYSTEM EXPANSION",
        title: "Capabilities & Sectors",
        description: "Expanded core tracks across AI & Intelligence, Cloud, Data, Systems, and Industry Solutions.",
      },
      {
        phase: "PHASE 04 — GLOBAL NETWORK",
        title: "The Next Era",
        description: "Connecting verified builders with enterprise teams and production opportunities worldwide.",
      },
    ],
  },
};

export function getWhoWeArePageBySlug(slug: string): WhoWeArePageData | undefined {
  return WHO_WE_ARE_PAGES[slug];
}

export function getAllWhoWeAreItems(): WhoWeAreItem[] {
  const items: WhoWeAreItem[] = [];
  WHO_WE_ARE_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      items.push(item);
    });
  });
  return items;
}
