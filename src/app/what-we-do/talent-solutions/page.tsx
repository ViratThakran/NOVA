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
  title: "Talent Solutions | NOVA Capabilities",
  description:
    "Connecting technology teams directly with proven engineers, agile squads, and resident builders with verified repository commits and live shipping capability.",
};

const SIGNALS = [
  { metric: "4.3M", label: "Global Tech Talent Gap", description: "There is a global shortfall of 4.3M qualified technology professionals — with demand accelerating as AI and cloud adoption outpaces the pipeline of available engineers." },
  { metric: "47%", label: "Misaligned Hiring", description: "Of technical hires in the first year fail to meet expectations — caused by overreliance on credentials and insufficient validation of actual engineering output quality." },
  { metric: "18 weeks", label: "Average Time-to-Hire", description: "Enterprise technology hiring cycles average 18 weeks from job post to accepted offer — a duration that in fast-moving markets often means a missed product cycle entirely." },
  { metric: "3.2×", label: "Embedded Team Velocity", description: "Engineering teams augmented with pre-vetted NOVA builder squads ramp to full productivity 3.2× faster than traditional contractor placements or graduate hires." },
];

const OFFERINGS = [
  {
    id: "engineering-squads",
    title: "Engineering Squads",
    image: "/images/cards/gen_squads.jpg",
    items: [
      { num: "01", label: "Full-Stack Embedded Builder Squads" },
      { num: "02", label: "Backend & Infrastructure Engineers" },
      { num: "03", label: "Frontend & Mobile Specialists" },
      { num: "04", label: "Data & ML Engineering Teams" },
      { num: "05", label: "DevOps & Platform Engineers" },
      { num: "06", label: "QA Automation Specialists" },
    ],
  },
  {
    id: "fractional-leadership",
    title: "Fractional Engineering Leadership",
    image: "/images/cards/experience.jpg",
    items: [
      { num: "01", label: "Fractional CTO & VP Engineering" },
      { num: "02", label: "Technical Architecture Consulting" },
      { num: "03", label: "Engineering Process & Culture Advisory" },
      { num: "04", label: "Hiring & Team Building Strategy" },
      { num: "05", label: "Technical Due Diligence for Investors" },
      { num: "06", label: "CTO-in-Residence Engagements" },
    ],
  },
  {
    id: "staff-augmentation",
    title: "Staff Augmentation",
    image: "/images/cards/gen_internship.jpg",
    items: [
      { num: "01", label: "Project-Based Specialist Placement" },
      { num: "02", label: "Sprint-Level Team Augmentation" },
      { num: "03", label: "Embedded Tech Leads & Senior ICs" },
      { num: "04", label: "Contract-to-Hire Pathways" },
      { num: "05", label: "Remote-First Builder Deployment" },
      { num: "06", label: "Multi-Timezone Coverage Models" },
    ],
  },
  {
    id: "talent-programs",
    title: "Talent Development Programs",
    image: "/images/cards/gen_bootcamp.jpg",
    items: [
      { num: "01", label: "NOVA Residency (Junior → Senior Pathway)" },
      { num: "02", label: "Technical Bootcamp Design & Delivery" },
      { num: "03", label: "Mentorship Programme Architecture" },
      { num: "04", label: "Engineering Fellowship Cohorts" },
      { num: "05", label: "Internship Pipeline & Early-Talent Sourcing" },
      { num: "06", label: "Career Progression Framework Design" },
    ],
  },
  {
    id: "hiring-advisory",
    title: "Hiring & Team Building",
    image: "/images/cards/gen_placement.jpg",
    items: [
      { num: "01", label: "Technical Interview Design & Calibration" },
      { num: "02", label: "Engineering Hiring Strategy Consulting" },
      { num: "03", label: "Take-Home & Live Assessment Systems" },
      { num: "04", label: "Talent Sourcing & Candidate Pipelines" },
      { num: "05", label: "Offer Benchmarking & Compensation Data" },
      { num: "06", label: "Diversity & Inclusion Hiring Programs" },
    ],
  },
  {
    id: "mentorship",
    title: "Mentorship & Growth",
    image: "/images/cards/gen_mentorship.jpg",
    items: [
      { num: "01", label: "1:1 Senior Engineer Mentorship" },
      { num: "02", label: "Open Source Contribution Programs" },
      { num: "03", label: "Code Review & PR Culture Coaching" },
      { num: "04", label: "Technical Writing & Documentation" },
      { num: "05", label: "Conference Talk & Content Coaching" },
      { num: "06", label: "Engineering Blog & Thought Leadership" },
    ],
  },
];

const STORIES = [
  {
    id: "squad-deployment",
    tag: "ENGINEERING SQUADS · NOVA CASE",
    title: "An embedded squad that shipped a fintech MVP in 9 weeks",
    synopsis: "NOVA placed a 5-person full-stack squad — lead engineer, two backend engineers, a frontend specialist, and a DevOps engineer — inside a fintech startup, who shipped a fully tested, production-deployed MVP in 9 weeks.",
    stat: "5-person squad · 9-week MVP · 0 post-launch regressions",
    image: "/images/cards/gen_squads.jpg",
  },
  {
    id: "fractional-cto",
    tag: "FRACTIONAL LEADERSHIP · NOVA CASE",
    title: "A fractional CTO that rebuilt an engineering culture in 6 months",
    synopsis: "A NOVA Fractional CTO embedded with a Series B startup, restructuring their engineering org, introducing Agile ceremonies, implementing code review culture, and hiring 8 senior engineers — reducing churn from 4 departures/quarter to 0.",
    stat: "8 hires · 0 attrition · 3× sprint velocity",
    image: "/images/cards/experience.jpg",
  },
  {
    id: "residency-cohort",
    tag: "TALENT DEVELOPMENT · NOVA CASE",
    title: "60% of NOVA Residency graduates placed as full-time engineers in 8 weeks",
    synopsis: "A structured 16-week engineering residency combining mentorship, live project work, and NOVA code reviews that prepared junior developers to contribute at senior level — with 60% placed as full-time engineers within 8 weeks of graduation.",
    stat: "16-week program · 60% placed in 8 weeks",
    image: "/images/cards/gen_residency.jpg",
  },
];

const PROJECTS = [
  {
    id: "hiring-system",
    tag: "NOVA SOLUTION ARCHITECTURE · 01",
    title: "A structured technical hiring system that cut bad hires to near zero",
    synopsis: "A repeatable interview and assessment architecture combining take-home projects, live pairing sessions, and calibrated rubrics that dramatically improved signal quality and reduced first-year attrition to under 5%.",
    architecture: "Assessment Design · Rubric Calibration · Structured Interviewing",
    image: "/images/cards/gen_placement.jpg",
  },
  {
    id: "squad-model",
    tag: "NOVA SOLUTION ARCHITECTURE · 02",
    title: "A self-organizing squad model that ships production features weekly",
    synopsis: "An embedded squad structure with a dedicated tech lead, clear domain ownership, async-first communication, weekly demo cadence, and shared on-call rotation — deployed across 12 companies with consistent velocity outcomes.",
    architecture: "Squad Topology · Tech Lead Model · Domain Ownership",
    image: "/images/cards/gen_squads.jpg",
  },
  {
    id: "mentorship-program",
    tag: "NOVA SOLUTION ARCHITECTURE · 03",
    title: "A mentorship programme that measurably accelerated junior engineer growth",
    synopsis: "A 6-month structured mentorship program combining weekly 1:1 sessions, deliberate code review coaching, open source contribution goals, and bi-monthly cohort showcases — with measurable skill-level assessments at each milestone.",
    architecture: "1:1 Mentorship · Code Review Culture · Open Source Contribution",
    image: "/images/cards/gen_mentorship.jpg",
  },
];

const STACK_LAYERS = [
  { layer: "DISCOVER", detail: "Talent sourcing, assessment design, pipeline architecture" },
  { layer: "EVALUATE", detail: "Technical interviews, live pairing, take-home projects, rubrics" },
  { layer: "PLACE", detail: "Embedded squads, staff augmentation, fractional leadership" },
  { layer: "GROW", detail: "Residency cohorts, mentorship programs, fellowship tracks" },
  { layer: "RETAIN", detail: "Culture design, career framework, on-call, team health checks" },
];

const TECHS = [
  { name: "Engineering Squads", category: "Embedded Teams" },
  { name: "Fractional CTO", category: "Exec Leadership" },
  { name: "NOVA Residency", category: "Talent Development" },
  { name: "Staff Augmentation", category: "Flexible Scaling" },
  { name: "Technical Interviews", category: "Assessment Systems" },
  { name: "Code Review Culture", category: "Engineering Quality" },
  { name: "Mentorship Programs", category: "Career Growth" },
  { name: "Engineering Fellowships", category: "Cohort Programs" },
  { name: "Hiring Advisory", category: "Team Building" },
  { name: "CTO-in-Residence", category: "Leadership Coaching" },
];

const RELATED = [
  { number: "01", title: "AI & Data", description: "AI engineers and data scientists available for placement.", href: "/what-we-do/ai-intelligence" },
  { number: "03", title: "Software & Technology", description: "Software engineers and architects on-demand.", href: "/what-we-do/software-technology" },
  { number: "02", title: "Cloud & Infrastructure", description: "DevOps and platform engineering specialists.", href: "/what-we-do/cloud" },
  { number: "04", title: "Digital Products", description: "Product designers and frontend engineers.", href: "/what-we-do/digital-products" },
];

export default function TalentSolutionsPage() {
  const capability = CAPABILITIES.find((c) => c.slug === "talent-solutions");
  if (!capability) notFound();

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-purple-500 selection:text-white">
      <SiteHeader transparent />
      <ChapterProgress />
      <main className="flex flex-col">
        <CapabilityHero capability={capability} />
        <SharedSignalsSection id="ts-signals" chapter="02 / MARKET SIGNALS" heading="Talent solutions now" subtext="Finding engineers who can actually ship in production — not just interview well — is the hardest problem in technology." signals={SIGNALS} accent="purple" />
        <SharedOfferingsSection id="ts-offerings" chapter="03 / CAPABILITY CATALOGUE" subtext="From embedded builder squads to fractional CTOs and structured mentorship programs — connecting builders with organizations that need them." offerings={OFFERINGS} accent="purple" />
        <SharedInActionSection id="ts-action" chapter="04 / TALENT IN ACTION" heading="What the right builders can do" subtext="Real placements, real programs, real engineering outcomes." stories={STORIES} accent="purple" />
        <SharedRealWorldSection id="ts-real-world" chapter="05 / REAL-WORLD PROOF" heading="Talent solutions in the real world" subtext="Selected talent architectures and builder programs designed and deployed by NOVA." projects={PROJECTS} accent="purple" />
        <SharedTechSection id="ts-tech" chapter="06 / ENGAGEMENT MODEL" heading="How we work with talent" subtext="A structured methodology that moves beyond CVs and certifications to validated engineering capability." stackLabel="Talent Lifecycle" stackLayers={STACK_LAYERS} techsLabel="What We Offer" techs={TECHS} accent="purple" />
        <SharedRelatedSection id="ts-related" chapter="07 / DIRECTORY" heading="Explore more of NOVA" subtext="Every NOVA capability is backed by the same network of verified builders." related={RELATED} accent="purple" />
        <CapabilityCta />
      </main>
      <SiteFooter />
    </div>
  );
}
