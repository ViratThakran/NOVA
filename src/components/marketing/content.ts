// Centralized landing-page copy, navigation hierarchy, and editorial architecture.
// Designed with enterprise clarity, editorial confidence, and precise information hierarchy.

export const NAV_ITEMS = [
  { href: "/#what-we-do", label: "What We Do" },
  { href: "/#who-we-are", label: "Who We Are" },
  { href: "/what-we-think", label: "What We Think" },
  { href: "/#careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
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

export const MEGA_NAV_SECTIONS = [
  {
    id: "what-we-do",
    label: "What We Do",
    href: "/what-we-do",
    summary: "From AI and software to cloud, data, automation, and talent, NOVA helps organizations build what comes next.",
    groups: [
      {
        title: "CAPABILITIES",
        items: [
          {
            label: "AI & Intelligence",
            href: "/what-we-do/ai-intelligence",
            description: "Systems that reason, learn and act",
          },
          {
            label: "Cloud & Infrastructure",
            href: "/what-we-do/cloud",
            description: "The foundation for scalable digital systems",
          },
          {
            label: "Software & Technology",
            href: "/what-we-do/software-technology",
            description: "Engineering reliable systems from architecture to deployment",
          },
          {
            label: "Digital Products",
            href: "/what-we-do/digital-products",
            description: "Products designed around real people and real outcomes",
          },
          {
            label: "Data & Analytics",
            href: "/what-we-do/data-analytics",
            description: "Turning complex data into useful decisions",
          },
          {
            label: "Automation",
            href: "/what-we-do/automation",
            description: "Removing repetitive work and accelerating operations",
          },
          {
            label: "Talent Solutions",
            href: "/what-we-do/talent-solutions",
            description: "Connecting organizations with capable builders",
          },
        ],
      },
      {
        title: "INDUSTRIES",
        items: [
          {
            label: "Technology & Software",
            href: "/industries/technology",
            description: "Scalable cloud platforms & developer tooling",
          },
          {
            label: "Financial Services",
            href: "/industries/financial-services",
            description: "Risk intelligence & low-latency transaction processing",
          },
          {
            label: "Healthcare",
            href: "/industries/healthcare",
            description: "Intelligent clinical decision support & health data pipelines",
          },
          {
            label: "Automotive",
            href: "/industries/automotive",
            description: "Connected vehicle platforms & SDV telemetry",
          },
          {
            label: "Manufacturing",
            href: "/industries/manufacturing",
            description: "Edge computer vision inspection & predictive telemetry",
          },
          {
            label: "Retail & Commerce",
            href: "/industries/retail-commerce",
            description: "Real-time inventory intelligence & headless commerce",
          },
          {
            label: "Energy",
            href: "/industries/energy",
            description: "Smart grid telemetry & renewable dispatch forecasting",
          },
          {
            label: "Education",
            href: "/industries/education",
            description: "Challenge-driven adaptive learning systems & skills verification",
          },
        ],
      },
    ],
    cta: { label: "Explore All Capabilities & Industries", href: "/what-we-do" },
  },
  {
    id: "who-we-are",
    label: "Who We Are",
    href: "/who-we-are",
    summary: "An ambitious technology organization and platform connecting learning, technology, people, and opportunity.",
    groups: [
      {
        title: "ABOUT NOVA",
        items: [
          { label: "About NOVA", href: "/who-we-are/about", description: "Our identity, purpose, and ecosystem" },
          { label: "Our Story", href: "/who-we-are/our-story", description: "Origins, evolution & trajectory" },
          { label: "Our Mission", href: "/who-we-are/our-mission", description: "Connecting potential with opportunity" },
          { label: "How We Work", href: "/who-we-are/how-we-work", description: "Engineering methodology & craft" },
        ],
      },
      {
        title: "PEOPLE & CULTURE",
        items: [
          { label: "Our People", href: "/who-we-are/our-people", description: "Engineers, leads & resident builders" },
          { label: "Leadership", href: "/who-we-are/leadership", description: "Stewardship & architectural vision" },
          { label: "Culture", href: "/who-we-are/culture", description: "First principles & proof of work" },
          { label: "Locations", href: "/who-we-are/locations", description: "Global hubs & distributed squads" },
        ],
      },
      {
        title: "IMPACT & TRUST",
        items: [
          { label: "Our Impact", href: "/who-we-are/our-impact", description: "Careers launched, code shipped" },
          { label: "Sustainability", href: "/who-we-are/sustainability", description: "Resilient & energy-efficient systems" },
          { label: "Responsible Technology", href: "/who-we-are/responsible-technology", description: "Ethics, safety & transparent AI" },
          { label: "Partnerships", href: "/who-we-are/partnerships", description: "Enterprise & academic network" },
        ],
      },
    ],
    cta: { label: "Explore Who We Are Overview", href: "/who-we-are" },
  },
  {
    id: "careers",
    label: "Careers",
    href: "/#careers",
    summary: "Build real skills, work on real technology, and launch your career in an ecosystem built for builders.",
    groups: [
      {
        title: "OPPORTUNITIES",
        items: [
          { label: "Internships", href: "/internships", description: "Hands-on product & engineering roles" },
          { label: "Internship Programs", href: "/internship-programs", description: "Outcome-driven mastery tracks" },
          { label: "Programs", href: "/programs", description: "Structured engineering sprints" },
          { label: "Jobs & Placements", href: "/#careers", description: "Full-time roles across our network" },
        ],
      },
      {
        title: "LEARNING & GROWTH",
        items: [
          { label: "Courses", href: "/courses", description: "Modular high-density technical modules" },
          { label: "Projects", href: "/#careers", description: "Live production proof-of-work builds" },
          { label: "For Companies", href: "/companies", description: "Engage proven talent with real track records" },
          { label: "Hire Talent", href: "/contact", description: "Partner with embedded builder squads" },
        ],
      },
    ],
    cta: { label: "Explore All Careers & Programs", href: "/internships" },
  },
] as const;

export const INTRO_WORDS = [
  {
    word: "LEARN",
    subtitle: "Acquire high-leverage technical mastery through focused, real-world instruction.",
  },
  {
    word: "BUILD",
    subtitle: "Apply capabilities directly to production-grade software, AI, and systems.",
  },
  {
    word: "EXPERIENCE",
    subtitle: "Develop authentic track records that speak louder than certifications.",
  },
  {
    word: "GROW",
    subtitle: "Accelerate your trajectory within an interconnected ecosystem of opportunity.",
  },
] as const;

export const ECOSYSTEM_NODES = [
  {
    id: "technology",
    title: "TECHNOLOGY",
    statement: "Technology enables people.",
    description: "The intelligent infrastructure underneath it all — AI engines, dev platforms, and scalable services that power modern execution.",
  },
  {
    id: "learning",
    title: "LEARNING",
    statement: "Learning creates capability.",
    description: "Hands-on, rigorous engineering curriculum designed to build genuine capability rather than passive understanding.",
  },
  {
    id: "people",
    title: "PEOPLE",
    statement: "Experience creates confidence.",
    description: "Ambitious students, developers, mentors, and teams collaborating on real problems that demand real solutions.",
  },
  {
    id: "opportunity",
    title: "OPPORTUNITY",
    statement: "Opportunity creates careers.",
    description: "Direct pathways to internships, enterprise services, company hiring, and long-term professional growth.",
  },
] as const;

export const WHAT_WE_DO_CAPABILITIES = [
  {
    number: "01",
    title: "AI & INTELLIGENCE",
    description: "We build intelligent systems that turn complex problems into useful products.",
    tags: ["AI Development", "Machine Learning", "AI Agents", "Generative AI"],
  },
  {
    number: "02",
    title: "DIGITAL PRODUCTS",
    description: "Websites, applications and platforms designed to be used in the real world.",
    tags: ["Web & Cloud Platforms", "Mobile Applications", "Systems Engineering", "Full-Stack"],
  },
  {
    number: "03",
    title: "DATA & ANALYTICS",
    description: "Turn raw telemetry and distributed information into better, high-conviction decisions.",
    tags: ["Data Warehousing", "ETL Pipelines", "Predictive Analytics", "Stream Processing"],
  },
  {
    number: "04",
    title: "AUTOMATION",
    description: "Build operational systems and orchestration pipelines that work reliably for you.",
    tags: ["Workflow Engines", "CI/CD Orchestration", "Process Automation", "Governance"],
  },
  {
    number: "05",
    title: "PRODUCT DESIGN",
    description: "User interfaces, design systems, and product architectures executed with restraint and precision.",
    tags: ["Design Systems", "UI / UX Architecture", "Interaction Design", "Prototyping"],
  },
  {
    number: "06",
    title: "TALENT SOLUTIONS",
    description: "Connecting organizations with verified builders who have demonstrably shipped real production work.",
    tags: ["Talent Matching", "Track-Record Verification", "Apprenticeships", "Team Scaling"],
  },
] as const;

export const CAREER_DOORWAYS = [
  {
    id: "internships",
    title: "INTERNSHIPS",
    category: "Real Experience",
    description: "Immersive engineering and product roles on live projects with real deliverables, accountability, and mentorship.",
    points: ["Work on live software systems", "Paired with senior technical leads", "Verified portfolio upon completion"],
  },
  {
    id: "programs",
    title: "PROGRAMS",
    category: "Structured Mastery",
    description: "Outcome-driven, multi-week intensive curriculums covering modern software engineering, AI, and systems architecture.",
    points: ["Cohort-based engineering sprints", "Deep conceptual + practical labs", "Direct project reviews"],
  },
  {
    id: "courses",
    title: "COURSES",
    category: "Focused Skills",
    description: "Modular, high-density technical modules designed to master specific frameworks, databases, and architectural patterns.",
    points: ["Self-paced technical modules", "Code-first interactive assignments", "Continuous competency tracking"],
  },
  {
    id: "projects",
    title: "PROJECTS",
    category: "Proof of Work",
    description: "Open-source and enterprise builds where builders demonstrate execution capability on real-world constraints.",
    points: ["Production repositories", "Architectural documentation", "Demonstrable track records"],
  },
  {
    id: "jobs",
    title: "JOBS",
    category: "Full-Time Roles",
    description: "Direct placement opportunities across high-growth startups, established engineering firms, and the NOVA ecosystem.",
    points: ["Verified skills bypass resume screens", "Direct interviews with hiring teams", "Competitive compensations"],
  },
  {
    id: "opportunities",
    title: "OPPORTUNITIES",
    category: "Career Launch",
    description: "Direct talent pipelines connecting verified builders to innovative startups, technology leaders, and enterprise partners.",
    points: ["Direct candidate placement", "Skill-verified profiles", "Zero resume black-hole"],
  },
] as const;

export const EDITORIAL_STORIES = [
  {
    id: "story-1",
    category: "AI & TECHNOLOGY",
    title: "How AI is changing the way we build.",
    subtitle: "Moving beyond passive code generation into autonomous orchestration, verified human-in-the-loop approvals, and deterministic agents.",
    readTime: "5 min read",
    tag: "Architecture",
  },
  {
    id: "story-2",
    category: "FUTURE OF WORK",
    title: "The skills that will define the next generation of builders.",
    subtitle: "Why deep first-principles thinking, architectural taste, and verified proof-of-work matter more than static credentials.",
    readTime: "4 min read",
    tag: "Perspectives",
  },
  {
    id: "story-3",
    category: "EDUCATION",
    title: "Learning is changing. So should we.",
    subtitle: "Deconstructing lecture-based academia in favor of an apprenticeship ecosystem grounded in production realities.",
    readTime: "6 min read",
    tag: "Ecosystem",
  },
] as const;

export const WHO_WE_ARE_PILLARS = [
  {
    id: "mission",
    title: "MISSION",
    statement: "Democratize high-tier engineering experience.",
    description: "We believe potential should not depend on where someone starts. NOVA exists to connect ambitious individuals with high-leverage knowledge, technology, and opportunity.",
  },
  {
    id: "vision",
    title: "VISION",
    statement: "The definitive global builder ecosystem.",
    description: "A world where organizations and individuals collaborate seamlessly — turning curiosity into capability and capability into transformative technology.",
  },
  {
    id: "values",
    title: "VALUES",
    statement: "Craft, transparency, and relentless action.",
    description: "We value engineering rigor over hype, transparent disclosure over opaque claims, and demonstrable proof over theoretical pedigree.",
  },
  {
    id: "people",
    title: "PEOPLE",
    statement: "Built by builders, for builders.",
    description: "A community of engineers, product leaders, designers, and researchers dedicated to solving difficult problems and shipping real software.",
  },
  {
    id: "impact",
    title: "IMPACT",
    statement: "Measurable progress for talent and enterprise.",
    description: "Bridging the critical gap between education and industry, empowering thousands of builders and powering software for organizations worldwide.",
  },
] as const;

export const FOOTER_LINKS = {
  navigation: [
    { label: "What We Do", href: "/#what-we-do" },
    { label: "Who We Are", href: "/#who-we-are" },
    { label: "What We Think", href: "/what-we-think" },
    { label: "Careers", href: "/#careers" },
  ],
  solutions: [
    { label: "AI & Machine Learning", href: "/#what-we-do" },
    { label: "Software & Technology", href: "/#what-we-do" },
    { label: "Data & Analytics", href: "/#what-we-do" },
    { label: "Automation", href: "/#what-we-do" },
    { label: "Digital Products", href: "/#what-we-do" },
    { label: "Talent Solutions", href: "/#what-we-do" },
  ],
  careers: [
    { label: "Internships", href: "/#careers" },
    { label: "Programs", href: "/#careers" },
    { label: "Courses", href: "/#careers" },
    { label: "Projects", href: "/#careers" },
    { label: "For Companies", href: "/#careers" },
  ],
  company: [
    { label: "About NOVA", href: "/#who-we-are" },
    { label: "Our Mission", href: "/#who-we-are" },
    { label: "Ecosystem", href: "/#ecosystem" },
    { label: "Contact", href: "/contact" },
    { label: "Get Started", href: "/get-started" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Security & Governance", href: "#" },
  ],
} as const;
