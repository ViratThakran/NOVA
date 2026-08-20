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
  title: "Software & Technology | NOVA Capabilities",
  description:
    "Full-lifecycle software engineering, distributed backend systems, low-latency microservices, and modern API architectures tailored for mission-critical operations.",
};

const SIGNALS = [
  { metric: "72%", label: "Developer Productivity Gap", description: "Of engineering teams report that legacy code and technical debt directly reduce new feature velocity by more than a third each quarter." },
  { metric: "8×", label: "Microservice Adoption Rate", description: "Organizations that have adopted microservice architectures release production features 8× more frequently than monolithic-first teams." },
  { metric: "4.5×", label: "API Economy Growth", description: "Enterprise API ecosystems are growing at 4.5× the rate of traditional software, with public APIs now driving 35% of enterprise revenue for technology companies." },
  { metric: "99.9%", label: "Uptime Expectation", description: "Modern SLAs for mission-critical software products now demand three-nines uptime as an industry baseline — not a premium feature." },
];

const OFFERINGS = [
  {
    id: "backend-engineering",
    title: "Backend Engineering",
    image: "/images/cards/software.jpg",
    items: [
      { num: "01", label: "Distributed Microservice Architecture" },
      { num: "02", label: "High-Throughput REST & GraphQL APIs" },
      { num: "03", label: "Event-Driven & Message Queue Systems" },
      { num: "04", label: "Database Design & Query Optimization" },
      { num: "05", label: "Real-Time WebSocket & gRPC Services" },
      { num: "06", label: "Monolith-to-Microservice Migration" },
    ],
  },
  {
    id: "frontend-engineering",
    title: "Frontend Engineering",
    image: "/images/cards/experience.jpg",
    items: [
      { num: "01", label: "React & Next.js Web Application Engineering" },
      { num: "02", label: "Design System Implementation" },
      { num: "03", label: "Performance & Core Web Vitals Optimization" },
      { num: "04", label: "Accessible Component Architecture" },
      { num: "05", label: "Micro-Frontend Orchestration" },
      { num: "06", label: "Server-Side Rendering & Edge Functions" },
    ],
  },
  {
    id: "system-architecture",
    title: "System Architecture",
    image: "/images/cards/build.jpg",
    items: [
      { num: "01", label: "Domain-Driven Design Workshops" },
      { num: "02", label: "Event Sourcing & CQRS Patterns" },
      { num: "03", label: "Scalability & Load Capacity Planning" },
      { num: "04", label: "Technical Debt Audit & Remediation" },
      { num: "05", label: "Architecture Decision Records (ADR)" },
      { num: "06", label: "Third-Party Integration Design" },
    ],
  },
  {
    id: "api-platform",
    title: "API Platform",
    image: "/images/cards/grow.jpg",
    items: [
      { num: "01", label: "API Gateway Design & Rate Limiting" },
      { num: "02", label: "OpenAPI Specification & Developer Portal" },
      { num: "03", label: "SDK & Client Library Generation" },
      { num: "04", label: "OAuth 2.0 & JWT Authentication" },
      { num: "05", label: "API Versioning & Deprecation Strategy" },
      { num: "06", label: "Monetization & Usage Analytics" },
    ],
  },
  {
    id: "mobile-development",
    title: "Mobile Development",
    image: "/images/cards/products.jpg",
    items: [
      { num: "01", label: "React Native Cross-Platform Engineering" },
      { num: "02", label: "Native iOS & Android Integration" },
      { num: "03", label: "Offline-First Data Sync Architecture" },
      { num: "04", label: "Push Notification & Deep Linking" },
      { num: "05", label: "App Store Optimization & Release Pipeline" },
      { num: "06", label: "Mobile Performance Profiling" },
    ],
  },
  {
    id: "quality-engineering",
    title: "Quality Engineering",
    image: "/images/cards/gen_ai_research.jpg",
    items: [
      { num: "01", label: "Automated Unit & Integration Testing" },
      { num: "02", label: "End-to-End Browser Test Suites" },
      { num: "03", label: "Contract & API Testing (Pact)" },
      { num: "04", label: "Performance & Load Testing" },
      { num: "05", label: "Static Analysis & Code Coverage" },
      { num: "06", label: "Shift-Left Security Testing (SAST/DAST)" },
    ],
  },
];

const STORIES = [
  {
    id: "backend-replatform",
    tag: "BACKEND ENGINEERING · NOVA CASE",
    title: "Replatforming a monolith into 40 independent services in 5 months",
    synopsis: "We executed a zero-downtime strangler-fig migration of a PHP monolith into 40 domain-aligned Node.js microservices, with automated contract testing and GitOps delivery from the first sprint.",
    stat: "40 services · 5 months · 99.98% uptime",
    image: "/images/cards/software.jpg",
  },
  {
    id: "api-platform",
    tag: "API PLATFORM · NOVA CASE",
    title: "Building a public API platform serving 8M requests per day",
    synopsis: "Designed and shipped a multi-tenant REST + GraphQL API gateway with auto-generated SDKs, OAuth 2.0 scoped access, and a developer portal that reduced third-party integration time from weeks to hours.",
    stat: "8M req/day · 120ms P99 latency",
    image: "/images/cards/build.jpg",
  },
  {
    id: "frontend-performance",
    tag: "FRONTEND · NOVA CASE",
    title: "Taking Core Web Vitals from failing to perfect across 300 pages",
    synopsis: "A comprehensive frontend audit and reengineering project delivering sub-2s LCP, zero CLS, and 98/100 Lighthouse scores — directly contributing to a 31% improvement in conversion rate.",
    stat: "LCP < 1.8s · +31% conversion",
    image: "/images/cards/experience.jpg",
  },
];

const PROJECTS = [
  {
    id: "distributed-system",
    tag: "NOVA SOLUTION ARCHITECTURE · 01",
    title: "A fully distributed order processing engine for 10M+ daily transactions",
    synopsis: "Event-sourced CQRS architecture built on Kafka, PostgreSQL, and Redis that processes over 10M transactions per day with deterministic guarantees and full audit trail.",
    architecture: "Kafka · PostgreSQL · Redis · Node.js · gRPC",
    image: "/images/cards/software.jpg",
  },
  {
    id: "multi-tenant-saas",
    tag: "NOVA SOLUTION ARCHITECTURE · 02",
    title: "A horizontally scalable multi-tenant SaaS backend from scratch",
    synopsis: "Complete SaaS platform backend featuring row-level security, tenant isolation, feature flags, metered billing integration, and zero-downtime schema migrations across Postgres.",
    architecture: "Next.js · Postgres · Stripe · Resend · Terraform",
    image: "/images/cards/grow.jpg",
  },
  {
    id: "design-system",
    tag: "NOVA SOLUTION ARCHITECTURE · 03",
    title: "A design system and component library used across 6 products",
    synopsis: "A Storybook-driven, fully accessible design system with 140+ tested components, automated visual regression, Figma token synchronization, and semantic versioning pipeline.",
    architecture: "React · Storybook · Radix UI · CSS Variables",
    image: "/images/cards/products.jpg",
  },
];

const STACK_LAYERS = [
  { layer: "LANGUAGES", detail: "TypeScript, Python, Go, Rust — selected per system constraint" },
  { layer: "RUNTIMES", detail: "Node.js (Fastify), Bun, Deno, Python (FastAPI), Go stdlib" },
  { layer: "DATA STORES", detail: "PostgreSQL, Redis, MongoDB, ClickHouse, S3-compatible stores" },
  { layer: "MESSAGING", detail: "Apache Kafka, RabbitMQ, BullMQ, Server-Sent Events, WebSockets" },
  { layer: "DELIVERY", detail: "Docker, Kubernetes, GitHub Actions, ArgoCD, Terraform" },
];

const TECHS = [
  { name: "TypeScript", category: "Primary Language" },
  { name: "Node.js / Fastify", category: "Backend Runtime" },
  { name: "React 19", category: "UI Framework" },
  { name: "Next.js App Router", category: "Full-Stack Framework" },
  { name: "PostgreSQL", category: "Primary Database" },
  { name: "Redis", category: "Cache & Queues" },
  { name: "Apache Kafka", category: "Event Streaming" },
  { name: "GraphQL", category: "API Query Layer" },
  { name: "Prisma / Drizzle", category: "ORM" },
  { name: "Docker", category: "Containerization" },
];

const RELATED = [
  { number: "01", title: "AI & Data", description: "Intelligence systems powered by well-structured data.", href: "/what-we-do/ai-intelligence" },
  { number: "02", title: "Cloud & Infrastructure", description: "The resilient foundation for scalable software systems.", href: "/what-we-do/cloud" },
  { number: "04", title: "Digital Products", description: "Products built around real people and real outcomes.", href: "/what-we-do/digital-products" },
  { number: "06", title: "Automation", description: "Eliminating repetitive friction from engineering workflows.", href: "/what-we-do/automation" },
];

export default function SoftwareTechnologyPage() {
  const capability = CAPABILITIES.find((c) => c.slug === "software-technology");
  if (!capability) notFound();

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-violet-500 selection:text-white">
      <SiteHeader transparent />
      <ChapterProgress />
      <main className="flex flex-col">
        <CapabilityHero capability={capability} />
        <SharedSignalsSection id="sw-signals" chapter="02 / MARKET SIGNALS" heading="Software & technology now" subtext="The pace of software delivery has become the primary determinant of enterprise competitive advantage." signals={SIGNALS} accent="violet" />
        <SharedOfferingsSection id="sw-offerings" chapter="03 / CAPABILITY CATALOGUE" subtext="Full-lifecycle engineering from backend systems to user-facing interfaces and everything in between." offerings={OFFERINGS} accent="violet" />
        <SharedInActionSection id="sw-action" chapter="04 / ENGINEERING IN ACTION" heading="Systems built to last under pressure" subtext="How NOVA engineers complex software systems that perform in production, at scale." stories={STORIES} accent="violet" />
        <SharedRealWorldSection id="sw-real-world" chapter="05 / REAL-WORLD PROOF" heading="Software & technology in the real world" subtext="Selected engineering solutions and production systems built by NOVA." projects={PROJECTS} accent="violet" />
        <SharedTechSection id="sw-tech" chapter="06 / TECHNOLOGY ECOSYSTEM" heading="Our engineering stack" subtext="Pragmatic technology choices — selected for performance, maintainability, and team velocity." stackLabel="Engineering Architecture Layers" stackLayers={STACK_LAYERS} techsLabel="Production Technologies" techs={TECHS} accent="violet" />
        <SharedRelatedSection id="sw-related" chapter="07 / DIRECTORY" heading="Explore more of NOVA" subtext="Discover our interconnected capabilities across AI, cloud, digital products, and talent." related={RELATED} accent="violet" />
        <CapabilityCta />
      </main>
      <SiteFooter />
    </div>
  );
}
