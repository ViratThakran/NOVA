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
  title: "Automation | NOVA Capabilities",
  description:
    "Eliminating manual bottlenecks through self-verifying automation loops, infrastructure-as-code, and continuous release orchestration across enterprise stacks.",
};

const SIGNALS = [
  { metric: "77%", label: "Manual Bottleneck Cost", description: "Of enterprise engineering teams identify manual deployment and review processes as the top bottleneck in shipping value to production." },
  { metric: "14×", label: "Deployment Frequency", description: "Elite-performing DevOps teams deploy 14× more frequently than low performers — driven entirely by automation, not team size." },
  { metric: "2,604h", label: "Hours Reclaimed Per Year", description: "The average enterprise engineering team reclaims over 2,600 engineer-hours annually when CI/CD, testing, and environment management are fully automated." },
  { metric: "<1hr", label: "Mean Time to Restore", description: "Organizations with mature automation recover from production incidents in under 1 hour, compared to 8+ hours for manually operated systems." },
];

const OFFERINGS = [
  {
    id: "cicd-pipelines",
    title: "CI/CD Pipelines",
    image: "/images/cards/software.jpg",
    items: [
      { num: "01", label: "Multi-Stage Pipeline Architecture" },
      { num: "02", label: "Parallel Build & Test Optimization" },
      { num: "03", label: "Canary & Blue-Green Release Strategy" },
      { num: "04", label: "Branch-Based Preview Environments" },
      { num: "05", label: "Automated Rollback & Gate Policies" },
      { num: "06", label: "Pipeline Security & Secret Scanning" },
    ],
  },
  {
    id: "infrastructure-automation",
    title: "Infrastructure Automation",
    image: "/images/cards/build.jpg",
    items: [
      { num: "01", label: "Terraform Module Development" },
      { num: "02", label: "GitOps with ArgoCD & Flux" },
      { num: "03", label: "Ansible Configuration Management" },
      { num: "04", label: "Drift Detection & Auto-Remediation" },
      { num: "05", label: "Environment Provisioning Pipelines" },
      { num: "06", label: "Cost Governance & Budget Alerts" },
    ],
  },
  {
    id: "test-automation",
    title: "Test Automation",
    image: "/images/cards/learn.jpg",
    items: [
      { num: "01", label: "Automated Unit & Integration Suites" },
      { num: "02", label: "Browser E2E Automation (Playwright)" },
      { num: "03", label: "Visual Regression Testing" },
      { num: "04", label: "API Contract Testing (Pact)" },
      { num: "05", label: "Performance & Load Test Pipelines" },
      { num: "06", label: "Test Coverage Enforcement & Reporting" },
    ],
  },
  {
    id: "workflow-automation",
    title: "Workflow Automation",
    image: "/images/cards/grow.jpg",
    items: [
      { num: "01", label: "Business Process Automation (n8n, Zapier)" },
      { num: "02", label: "Robotic Process Automation (RPA)" },
      { num: "03", label: "Document & Data Entry Automation" },
      { num: "04", label: "Notification & Escalation Pipelines" },
      { num: "05", label: "CRM & ERP Integration Automation" },
      { num: "06", label: "Approval Workflow Orchestration" },
    ],
  },
  {
    id: "monitoring-alerting",
    title: "Monitoring & Alerting",
    image: "/images/cards/gen_ai_research.jpg",
    items: [
      { num: "01", label: "SLO/SLA Monitoring & Error Budgets" },
      { num: "02", label: "PagerDuty & Opsgenie Integration" },
      { num: "03", label: "Custom Metric Dashboards & Runbooks" },
      { num: "04", label: "Log Aggregation & Anomaly Detection" },
      { num: "05", label: "Automated Incident Ticket Creation" },
      { num: "06", label: "Post-Mortem Automation & Tracking" },
    ],
  },
  {
    id: "security-compliance",
    title: "Security & Compliance Automation",
    image: "/images/cards/experience.jpg",
    items: [
      { num: "01", label: "SAST / DAST in Pipeline Gates" },
      { num: "02", label: "Dependency Vulnerability Scanning" },
      { num: "03", label: "Policy-as-Code (OPA / Sentinel)" },
      { num: "04", label: "Automated SOC2 Evidence Collection" },
      { num: "05", label: "Container Image Hardening Checks" },
      { num: "06", label: "Secrets Rotation & Audit Logging" },
    ],
  },
];

const STORIES = [
  {
    id: "deployment-pipeline",
    tag: "CI/CD AUTOMATION · NOVA CASE",
    title: "Shrinking deploy cycles from 3 days to 12 minutes",
    synopsis: "We redesigned a slow Jenkins pipeline into a parallelized GitHub Actions workflow with preview environments, automated test gates, and one-click rollbacks — taking deploy time from 3 days to 12 minutes.",
    stat: "3 days → 12 min deploys · 0 deployment incidents",
    image: "/images/cards/software.jpg",
  },
  {
    id: "infrastructure-iac",
    tag: "INFRASTRUCTURE AUTOMATION · NOVA CASE",
    title: "Provisioning a full production environment in under 15 minutes",
    synopsis: "A Terraform + ArgoCD GitOps pipeline that provisions a full multi-region VPC, EKS cluster, RDS fleet, Vault, and observability stack from a single git push in under 15 minutes.",
    stat: "Full IaC · 15-min provisioning · 100% drift-free",
    image: "/images/cards/build.jpg",
  },
  {
    id: "workflow-rpa",
    tag: "WORKFLOW AUTOMATION · NOVA CASE",
    title: "Automating 40,000 manual data entries per month",
    synopsis: "An n8n + Python RPA system that monitors an email inbox, extracts structured data via LLM parsing, validates against business rules, and syncs directly to Salesforce — eliminating 40,000 manual entries per month.",
    stat: "40K/month automated · 3 FTE reclaimed",
    image: "/images/cards/grow.jpg",
  },
];

const PROJECTS = [
  {
    id: "zero-touch-deploy",
    tag: "NOVA SOLUTION ARCHITECTURE · 01",
    title: "A zero-touch multi-environment release system for 50+ microservices",
    synopsis: "GitOps pipeline using ArgoCD image updaters that automatically promotes container images from dev → staging → production with automated smoke tests and Slack approval gates between each environment.",
    architecture: "ArgoCD · GitHub Actions · Helm · Slack API · Prometheus",
    image: "/images/cards/software.jpg",
  },
  {
    id: "compliance-automation",
    tag: "NOVA SOLUTION ARCHITECTURE · 02",
    title: "Automated SOC2 evidence collection cutting audit prep from 3 weeks to 2 days",
    synopsis: "A GitHub Actions + OPA pipeline that continuously validates infrastructure compliance, collects evidence artifacts, and generates audit-ready reports — reducing annual SOC2 prep from 3 weeks to 2 days.",
    architecture: "OPA · GitHub Actions · AWS Config · Audit Reports",
    image: "/images/cards/learn.jpg",
  },
  {
    id: "ai-triage",
    tag: "NOVA SOLUTION ARCHITECTURE · 03",
    title: "An AI-powered incident triage system resolving 70% of alerts autonomously",
    synopsis: "Automated incident responder combining Prometheus alerting, LangGraph agent reasoning, and runbook execution that resolves 70% of production alerts without human intervention — at 3am.",
    architecture: "LangGraph · Prometheus · PagerDuty · Slack · Kubernetes",
    image: "/images/cards/gen_ai_research.jpg",
  },
];

const STACK_LAYERS = [
  { layer: "SOURCE", detail: "Git workflows, branch policies, PR automation, semantic versioning" },
  { layer: "BUILD", detail: "GitHub Actions, parallelized test runners, Docker image baking" },
  { layer: "VALIDATE", detail: "SAST, DAST, unit/E2E/contract tests, Lighthouse, accessibility" },
  { layer: "DEPLOY", detail: "ArgoCD GitOps, Helm releases, canary/blue-green strategies" },
  { layer: "OPERATE", detail: "SLO monitoring, auto-remediation runbooks, chaos engineering" },
];

const TECHS = [
  { name: "GitHub Actions", category: "CI/CD" },
  { name: "ArgoCD", category: "GitOps Delivery" },
  { name: "Terraform", category: "Infrastructure as Code" },
  { name: "Ansible", category: "Configuration Mgmt" },
  { name: "Playwright", category: "E2E Testing" },
  { name: "Prometheus", category: "Metrics" },
  { name: "n8n", category: "Workflow Automation" },
  { name: "OPA / Rego", category: "Policy as Code" },
  { name: "Helm", category: "Kubernetes Packaging" },
  { name: "PagerDuty", category: "Incident Management" },
];

const RELATED = [
  { number: "02", title: "Cloud & Infrastructure", description: "The foundation on which automation runs.", href: "/what-we-do/cloud" },
  { number: "01", title: "AI & Data", description: "Intelligent automation that reasons and self-heals.", href: "/what-we-do/ai-intelligence" },
  { number: "03", title: "Software & Technology", description: "The systems that automation accelerates.", href: "/what-we-do/software-technology" },
  { number: "07", title: "Talent Solutions", description: "Platform engineers and DevOps specialists on-demand.", href: "/what-we-do/talent-solutions" },
];

export default function AutomationPage() {
  const capability = CAPABILITIES.find((c) => c.slug === "automation");
  if (!capability) notFound();

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-amber-500 selection:text-white">
      <SiteHeader transparent />
      <ChapterProgress />
      <main className="flex flex-col">
        <CapabilityHero capability={capability} />
        <SharedSignalsSection id="auto-signals" chapter="02 / MARKET SIGNALS" heading="Automation now" subtext="Engineering teams that automate everything else are the ones shipping everything first." signals={SIGNALS} accent="amber" />
        <SharedOfferingsSection id="auto-offerings" chapter="03 / CAPABILITY CATALOGUE" subtext="From zero-touch CI/CD pipelines to intelligent workflow automation — eliminate every preventable bottleneck." offerings={OFFERINGS} accent="amber" />
        <SharedInActionSection id="auto-action" chapter="04 / AUTOMATION IN ACTION" heading="What happens when you remove the bottlenecks" subtext="Real systems where NOVA automation directly improved engineering velocity and operational reliability." stories={STORIES} accent="amber" />
        <SharedRealWorldSection id="auto-real-world" chapter="05 / REAL-WORLD PROOF" heading="Automation in the real world" subtext="Selected automation engineering and DevOps solutions built by NOVA." projects={PROJECTS} accent="amber" />
        <SharedTechSection id="auto-tech" chapter="06 / TECHNOLOGY ECOSYSTEM" heading="Our automation stack" subtext="Battle-tested tooling for every layer of the software delivery lifecycle." stackLabel="Delivery Pipeline Architecture" stackLayers={STACK_LAYERS} techsLabel="Production Technologies" techs={TECHS} accent="amber" />
        <SharedRelatedSection id="auto-related" chapter="07 / DIRECTORY" heading="Explore more of NOVA" subtext="Automation connects directly to every capability NOVA delivers." related={RELATED} accent="amber" />
        <CapabilityCta />
      </main>
      <SiteFooter />
    </div>
  );
}
