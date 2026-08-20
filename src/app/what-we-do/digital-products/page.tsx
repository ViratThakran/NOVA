import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAPABILITIES } from "@/data/capabilities";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ChapterProgress } from "@/components/marketing/what-we-do/capability-page/chapter-progress";
import { CapabilityHero } from "@/components/marketing/what-we-do/capability-page/capability-hero";
import { CapabilityCta } from "@/components/marketing/what-we-do/capability-page/capability-cta";
import { SharedSignalsSection } from "@/components/marketing/what-we-do/capability-page/shared-signals-section";
import { SharedOfferingsSection } from "@/components/marketing/what-we-do/capability-page/shared-offerings-section";
import { SharedInActionSection } from "@/components/marketing/what-we-do/capability-page/shared-in-action-section";
import { SharedRealWorldSection } from "@/components/marketing/what-we-do/capability-page/shared-real-world-section";
import { SharedTechSection } from "@/components/marketing/what-we-do/capability-page/shared-tech-section";
import { SharedRelatedSection } from "@/components/marketing/what-we-do/capability-page/shared-related-section";

export const metadata: Metadata = {
  title: "Digital Products | NOVA Capabilities",
  description:
    "User-centric product design, high-fidelity interfaces, design systems, and edge-native responsive web applications built to transform visitors into engaged power users.",
};

const SIGNALS = [
  { metric: "88%", label: "UX Revenue Link", description: "Of design leaders report a direct correlation between exceptional UX investment and improved customer retention and revenue growth." },
  { metric: "2.4×", label: "Conversion Lift", description: "Products that score in the top quartile for usability convert visitors to active users at 2.4× the rate of average-scoring competitors." },
  { metric: "47%", label: "Abandoned Due to UX", description: "Of users permanently abandon a product after a single poor experience — making first-impression design a critical revenue lever." },
  { metric: "0.1s", label: "Perceived Response Threshold", description: "Users perceive interactions under 100ms as instantaneous. Beyond 300ms, perceived quality drops sharply — animation latency directly kills trust." },
];

const OFFERINGS = [
  {
    id: "product-strategy",
    title: "Product Strategy",
    image: "/images/cards/products.jpg",
    items: [
      { num: "01", label: "Product Vision & Roadmap Definition" },
      { num: "02", label: "Jobs-To-Be-Done Research & Synthesis" },
      { num: "03", label: "Competitive Analysis & Positioning" },
      { num: "04", label: "Feature Prioritization Frameworks" },
      { num: "05", label: "OKR Alignment & Metric Definition" },
      { num: "06", label: "Go-To-Market & Launch Strategy" },
    ],
  },
  {
    id: "ux-design",
    title: "UX & Interaction Design",
    image: "/images/cards/experience.jpg",
    items: [
      { num: "01", label: "User Research, Interviews & Synthesis" },
      { num: "02", label: "Information Architecture & User Flows" },
      { num: "03", label: "Wireframing & Rapid Prototyping" },
      { num: "04", label: "Usability Testing & Iteration" },
      { num: "05", label: "Micro-Animation & Interaction Design" },
      { num: "06", label: "Accessibility Audit & WCAG Compliance" },
    ],
  },
  {
    id: "design-systems",
    title: "Design Systems",
    image: "/images/cards/learn.jpg",
    items: [
      { num: "01", label: "Component Library Architecture" },
      { num: "02", label: "Design Token System (Color, Type, Space)" },
      { num: "03", label: "Figma Component Library with Variants" },
      { num: "04", label: "Storybook Documentation & Testing" },
      { num: "05", label: "Design-to-Code Handoff Workflow" },
      { num: "06", label: "Versioning & Multi-Brand Theming" },
    ],
  },
  {
    id: "web-apps",
    title: "Web Applications",
    image: "/images/cards/build.jpg",
    items: [
      { num: "01", label: "React & Next.js Application Engineering" },
      { num: "02", label: "Progressive Web App (PWA) Development" },
      { num: "03", label: "Performance & Core Web Vitals Tuning" },
      { num: "04", label: "Internationalization & Localization" },
      { num: "05", label: "A/B Testing & Feature Flag Integration" },
      { num: "06", label: "Analytics & Event Tracking Architecture" },
    ],
  },
  {
    id: "mobile-apps",
    title: "Mobile Applications",
    image: "/images/cards/gen_fellowship.jpg",
    items: [
      { num: "01", label: "React Native Cross-Platform Products" },
      { num: "02", label: "Native iOS / Android Feature Engineering" },
      { num: "03", label: "Gesture, Haptic & Animation Systems" },
      { num: "04", label: "Offline-First Architecture & Sync" },
      { num: "05", label: "App Store Review & Release Optimization" },
      { num: "06", label: "Mobile Analytics & Crash Reporting" },
    ],
  },
  {
    id: "growth-conversion",
    title: "Growth & Conversion",
    image: "/images/cards/grow.jpg",
    items: [
      { num: "01", label: "Conversion Rate Optimization (CRO)" },
      { num: "02", label: "Landing Page & Campaign Engineering" },
      { num: "03", label: "Onboarding Flow Design & A/B Testing" },
      { num: "04", label: "Retention & Re-engagement Engineering" },
      { num: "05", label: "Product-Led Growth (PLG) Architecture" },
      { num: "06", label: "Customer Journey Instrumentation" },
    ],
  },
];

const STORIES = [
  {
    id: "design-system-build",
    tag: "DESIGN SYSTEMS · NOVA CASE",
    title: "A design system adopted across 6 products in 3 months",
    synopsis: "We built a 140-component Storybook-driven design system with auto-generated Figma components, WCAG AA accessibility audits, and semantic versioning that halved design-to-production handoff time.",
    stat: "140 components · 6 products · 50% faster delivery",
    image: "/images/cards/products.jpg",
  },
  {
    id: "mobile-relaunch",
    tag: "MOBILE PRODUCT · NOVA CASE",
    title: "A React Native app relaunch that tripled daily active users",
    synopsis: "A full product redesign and engineering rebuild of a failing consumer app — replacing sluggish native code with a gesture-first React Native architecture delivering 60fps interactions and a 4.8★ App Store rating.",
    stat: "3× DAU · 4.8★ App Store · 60fps",
    image: "/images/cards/experience.jpg",
  },
  {
    id: "conversion-optimization",
    tag: "GROWTH ENGINEERING · NOVA CASE",
    title: "Improving onboarding completion from 34% to 79% in 8 weeks",
    synopsis: "A focused user research + rapid iteration engagement that redesigned an 11-step onboarding flow into a progressive 4-step experience — doubling activation and directly impacting MRR.",
    stat: "34% → 79% onboarding · +2.1× MRR",
    image: "/images/cards/grow.jpg",
  },
];

const PROJECTS = [
  {
    id: "saas-dashboard",
    tag: "NOVA SOLUTION ARCHITECTURE · 01",
    title: "A real-time SaaS analytics dashboard with sub-second data refresh",
    synopsis: "A React dashboard pulling live WebSocket telemetry, rendering 80+ chart types via Recharts and D3, with role-based views and Tableau-level data density at consumer-grade interaction speed.",
    architecture: "Next.js · Recharts · D3.js · WebSocket · Zustand",
    image: "/images/cards/learn.jpg",
  },
  {
    id: "ecomm-platform",
    tag: "NOVA SOLUTION ARCHITECTURE · 02",
    title: "A headless e-commerce storefront converting at 7.3% on mobile",
    synopsis: "Next.js App Router storefront with edge-rendered product pages, a custom cart engine, optimistic UI updates, and Stripe checkout — delivering 98/100 Lighthouse scores and 7.3% mobile conversion.",
    architecture: "Next.js · Stripe · Sanity · Framer Motion · Edge Functions",
    image: "/images/cards/build.jpg",
  },
  {
    id: "design-tokens",
    tag: "NOVA SOLUTION ARCHITECTURE · 03",
    title: "A multi-brand token system powering 4 separate brand identities",
    synopsis: "A Style Dictionary-driven design token architecture supporting 4 distinct brand themes from a single component library — with automated Figma sync, dark mode, and per-brand custom properties.",
    architecture: "Style Dictionary · Figma API · CSS Variables · Storybook",
    image: "/images/cards/products.jpg",
  },
];

const STACK_LAYERS = [
  { layer: "RESEARCH", detail: "User interviews, synthesis, journey mapping, usability testing" },
  { layer: "DESIGN", detail: "Figma, Framer, Protopie — high-fidelity interactive prototypes" },
  { layer: "ENGINEERING", detail: "React 19, Next.js, React Native, TypeScript, Framer Motion" },
  { layer: "TESTING", detail: "Playwright E2E, Chromatic visual regression, axe-core accessibility" },
  { layer: "ANALYTICS", detail: "PostHog, Mixpanel, Hotjar, LaunchDarkly feature flags" },
];

const TECHS = [
  { name: "Figma", category: "Design Tool" },
  { name: "React 19", category: "UI Framework" },
  { name: "Next.js", category: "App Framework" },
  { name: "React Native", category: "Mobile" },
  { name: "Framer Motion", category: "Animations" },
  { name: "Radix UI", category: "Accessible Primitives" },
  { name: "Storybook", category: "Component Docs" },
  { name: "Tailwind CSS", category: "Styling" },
  { name: "PostHog", category: "Analytics" },
  { name: "Playwright", category: "E2E Testing" },
];

const RELATED = [
  { number: "01", title: "AI & Data", description: "Intelligent features powered by production-grade AI.", href: "/what-we-do/ai-intelligence" },
  { number: "03", title: "Software & Technology", description: "The engineering systems behind every product.", href: "/what-we-do/software-technology" },
  { number: "06", title: "Automation", description: "Streamlining product delivery pipelines end-to-end.", href: "/what-we-do/automation" },
  { number: "07", title: "Talent Solutions", description: "Embedded product engineers and design squads.", href: "/what-we-do/talent-solutions" },
];

export default function DigitalProductsPage() {
  const capability = CAPABILITIES.find((c) => c.slug === "digital-products");
  if (!capability) notFound();

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-rose-500 selection:text-white">
      <SiteHeader transparent />
      <ChapterProgress />
      <main className="flex flex-col">
        <CapabilityHero capability={capability} />
        <SharedSignalsSection id="dp-signals" chapter="02 / MARKET SIGNALS" heading="Digital products now" subtext="The gap between exceptional and average digital experiences has become a direct line to revenue and retention." signals={SIGNALS} accent="rose" />
        <SharedOfferingsSection id="dp-offerings" chapter="03 / CAPABILITY CATALOGUE" subtext="From research and strategy through design systems, web apps, and mobile — end-to-end digital product delivery." offerings={OFFERINGS} accent="rose" />
        <SharedInActionSection id="dp-action" chapter="04 / PRODUCTS IN ACTION" heading="Products people actually use" subtext="Design and engineering decisions that moved real metrics for real users." stories={STORIES} accent="rose" />
        <SharedRealWorldSection id="dp-real-world" chapter="05 / REAL-WORLD PROOF" heading="Digital products in the real world" subtext="Selected product builds and design engineering demonstrations from NOVA." projects={PROJECTS} accent="rose" />
        <SharedTechSection id="dp-tech" chapter="06 / TECHNOLOGY ECOSYSTEM" heading="Our product stack" subtext="Tools selected for design fidelity, engineering velocity, and measurable user impact." stackLabel="Product Development Flow" stackLayers={STACK_LAYERS} techsLabel="Production Technologies" techs={TECHS} accent="rose" />
        <SharedRelatedSection id="dp-related" chapter="07 / DIRECTORY" heading="Explore more of NOVA" subtext="Discover how our capabilities connect across AI, software, cloud, and talent." related={RELATED} accent="rose" />
        <CapabilityCta />
      </main>
      <SiteFooter />
    </div>
  );
}
