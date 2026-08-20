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
  title: "Data & Analytics | NOVA Capabilities",
  description:
    "Transforming fragmented telemetry into unified, real-time data warehouses, low-latency event streaming pipelines, and actionable executive decision canvases.",
};

const SIGNALS = [
  { metric: "328×", label: "Data Growth Rate", description: "Enterprise data volume is growing at 328× the rate of data analyst hiring — creating a structural gap that can only be closed through engineering and automation, not headcount." },
  { metric: "63%", label: "Siloed & Unusable", description: "Of enterprise data is locked in silos, inconsistently formatted, or missing lineage documentation — making it effectively inaccessible to analysts and AI systems alike." },
  { metric: "11min", label: "Decision Delay Cost", description: "Research shows that every 11 minutes of delay in surfacing a critical business signal during a real-time event window costs enterprises an average of $1.3M in potential revenue." },
  { metric: "4×", label: "Analytics ROI", description: "Organizations with mature analytics platforms report 4× higher ROI on marketing and product investment through better attribution, forecasting, and allocation models." },
];

const OFFERINGS = [
  {
    id: "data-engineering",
    title: "Data Engineering",
    image: "/images/cards/gen_ai_research.jpg",
    items: [
      { num: "01", label: "Data Warehouse Architecture (Snowflake, BigQuery)" },
      { num: "02", label: "ETL / ELT Pipeline Engineering" },
      { num: "03", label: "Data Lakehouse Design" },
      { num: "04", label: "Schema Design & Data Modelling" },
      { num: "05", label: "Data Quality & Validation Frameworks" },
      { num: "06", label: "Data Catalogue & Lineage Tracking" },
    ],
  },
  {
    id: "realtime-streaming",
    title: "Real-Time Streaming",
    image: "/images/cards/software.jpg",
    items: [
      { num: "01", label: "Apache Kafka Event Streaming Pipelines" },
      { num: "02", label: "Flink / Spark Streaming Processing" },
      { num: "03", label: "Change Data Capture (CDC) Systems" },
      { num: "04", label: "Sub-second Dashboard Refresh Pipelines" },
      { num: "05", label: "IoT & Sensor Data Ingestion" },
      { num: "06", label: "Event Sourcing & Audit Streams" },
    ],
  },
  {
    id: "bi-visualization",
    title: "BI & Visualization",
    image: "/images/cards/learn.jpg",
    items: [
      { num: "01", label: "Executive Dashboard Architecture" },
      { num: "02", label: "Self-Service Analytics Platforms" },
      { num: "03", label: "Custom React / D3.js Data Visualization" },
      { num: "04", label: "Tableau & Power BI Engineering" },
      { num: "05", label: "Embedded Analytics SDK Integration" },
      { num: "06", label: "Report Automation & Distribution" },
    ],
  },
  {
    id: "data-governance",
    title: "Data Governance",
    image: "/images/cards/grow.jpg",
    items: [
      { num: "01", label: "Data Access Control & RBAC Policies" },
      { num: "02", label: "PII Detection & Masking Automation" },
      { num: "03", label: "GDPR / CCPA Compliance Engineering" },
      { num: "04", label: "Data Retention & Purge Automation" },
      { num: "05", label: "Audit Logging & Data Lineage" },
      { num: "06", label: "Data Contract Definition & Enforcement" },
    ],
  },
  {
    id: "predictive-analytics",
    title: "Predictive Analytics",
    image: "/images/cards/ai.jpg",
    items: [
      { num: "01", label: "Demand Forecasting Models" },
      { num: "02", label: "Customer Churn Prediction" },
      { num: "03", label: "Anomaly Detection Systems" },
      { num: "04", label: "Attribution & Incrementality Modelling" },
      { num: "05", label: "Cohort & Retention Analysis" },
      { num: "06", label: "Experimentation & A/B Test Infrastructure" },
    ],
  },
  {
    id: "data-products",
    title: "Data Products",
    image: "/images/cards/build.jpg",
    items: [
      { num: "01", label: "Internal Data Platform Engineering" },
      { num: "02", label: "Data Mesh & Domain Ownership" },
      { num: "03", label: "Metric Store & Semantic Layer" },
      { num: "04", label: "Data Marketplace & Monetization" },
      { num: "05", label: "Reverse ETL & Data Activation" },
      { num: "06", label: "Customer-Facing Data APIs" },
    ],
  },
];

const STORIES = [
  {
    id: "unified-warehouse",
    tag: "DATA ENGINEERING · NOVA CASE",
    title: "Unifying 14 data sources into a single Snowflake warehouse",
    synopsis: "We consolidated 14 disconnected data systems — CRM, ERP, analytics, marketing, and support — into a unified Snowflake data warehouse with dbt transformations and a semantic layer, reducing data query latency from 8 hours to 90 seconds.",
    stat: "14 sources unified · 8h → 90s query time",
    image: "/images/cards/gen_ai_research.jpg",
  },
  {
    id: "realtime-dashboard",
    tag: "REAL-TIME STREAMING · NOVA CASE",
    title: "A real-time operations dashboard processing 50M events per hour",
    synopsis: "Kafka → Flink → ClickHouse streaming pipeline feeding a React executive dashboard with sub-2-second data freshness, custom alerting, and drill-through from KPI to individual event level.",
    stat: "50M events/hr · <2s data freshness",
    image: "/images/cards/software.jpg",
  },
  {
    id: "predictive-churn",
    tag: "PREDICTIVE ANALYTICS · NOVA CASE",
    title: "A churn prediction model that identified 83% of at-risk accounts 30 days early",
    synopsis: "An XGBoost ensemble model trained on 3 years of behavioral telemetry that surfaces churn probability scores directly in the CRM, enabling proactive success team outreach that reduced annual churn by 22%.",
    stat: "83% precision · 22% churn reduction",
    image: "/images/cards/learn.jpg",
  },
];

const PROJECTS = [
  {
    id: "data-platform",
    tag: "NOVA SOLUTION ARCHITECTURE · 01",
    title: "An internal data platform serving 200 analysts across 8 business units",
    synopsis: "A self-service data platform built on dbt + Snowflake + Monte Carlo with a Streamlit-powered analyst workspace, automated data quality checks, and a Slack bot for natural-language metric queries.",
    architecture: "Snowflake · dbt · Monte Carlo · Airflow · Streamlit",
    image: "/images/cards/gen_ai_research.jpg",
  },
  {
    id: "semantic-layer",
    tag: "NOVA SOLUTION ARCHITECTURE · 02",
    title: "A semantic metric layer used across Tableau, Power BI, and a custom dashboard",
    synopsis: "A dbt Semantic Layer implementation defining 120+ business metrics with consistent logic across 3 BI tools — eliminating metric discrepancies between sales, finance, and product teams.",
    architecture: "dbt Semantic Layer · Tableau · Power BI · React",
    image: "/images/cards/learn.jpg",
  },
  {
    id: "streaming-pipeline",
    tag: "NOVA SOLUTION ARCHITECTURE · 03",
    title: "A zero-copy streaming pipeline from 40 IoT sensors to live dashboards",
    synopsis: "An end-to-end IoT telemetry pipeline using MQTT → Kafka → ksqlDB → ClickHouse with real-time anomaly detection, automated alerting, and a Grafana operations dashboard updating every 500ms.",
    architecture: "MQTT · Kafka · ksqlDB · ClickHouse · Grafana",
    image: "/images/cards/software.jpg",
  },
];

const STACK_LAYERS = [
  { layer: "INGEST", detail: "Kafka, Fivetran, Airbyte, custom CDC connectors, webhooks" },
  { layer: "STORE", detail: "Snowflake, BigQuery, ClickHouse, Delta Lake, S3 data lake" },
  { layer: "TRANSFORM", detail: "dbt (SQL transforms), Spark, Flink, Apache Beam pipelines" },
  { layer: "SERVE", detail: "Semantic layer, REST API, GraphQL, Reverse ETL, embedded analytics" },
  { layer: "OBSERVE", detail: "Data quality monitoring, lineage tracking, anomaly detection" },
];

const TECHS = [
  { name: "Snowflake", category: "Data Warehouse" },
  { name: "BigQuery", category: "Analytical DB" },
  { name: "Apache Kafka", category: "Event Streaming" },
  { name: "dbt", category: "SQL Transforms" },
  { name: "Apache Airflow", category: "Orchestration" },
  { name: "ClickHouse", category: "Real-Time OLAP" },
  { name: "Apache Spark", category: "Batch Processing" },
  { name: "Tableau", category: "BI Visualization" },
  { name: "Fivetran", category: "Data Ingestion" },
  { name: "Monte Carlo", category: "Data Observability" },
];

const RELATED = [
  { number: "01", title: "AI & Data", description: "Turning structured data into intelligent systems.", href: "/what-we-do/ai-intelligence" },
  { number: "02", title: "Cloud & Infrastructure", description: "The infrastructure backbone for every data pipeline.", href: "/what-we-do/cloud" },
  { number: "06", title: "Automation", description: "Automated data pipelines and quality enforcement.", href: "/what-we-do/automation" },
  { number: "03", title: "Software & Technology", description: "Engineering the systems that generate the data.", href: "/what-we-do/software-technology" },
];

export default function DataAnalyticsPage() {
  const capability = CAPABILITIES.find((c) => c.slug === "data-analytics");
  if (!capability) notFound();

  return (
    <div className="min-h-screen bg-white text-neutral-950 selection:bg-teal-500 selection:text-white">
      <SiteHeader transparent />
      <ChapterProgress />
      <main className="flex flex-col">
        <CapabilityHero capability={capability} />
        <SharedSignalsSection id="da-signals" chapter="02 / MARKET SIGNALS" heading="Data & analytics now" subtext="The organizations winning the next decade are not the ones with more data — they are the ones who can use it in real time." signals={SIGNALS} accent="teal" />
        <SharedOfferingsSection id="da-offerings" chapter="03 / CAPABILITY CATALOGUE" subtext="From raw event ingestion to real-time streaming and predictive analytics — making every data point work harder." offerings={OFFERINGS} accent="teal" />
        <SharedInActionSection id="da-action" chapter="04 / DATA IN ACTION" heading="When data actually works" subtext="Real data engineering outcomes that moved real metrics." stories={STORIES} accent="teal" />
        <SharedRealWorldSection id="da-real-world" chapter="05 / REAL-WORLD PROOF" heading="Data & analytics in the real world" subtext="Selected data engineering and analytics architectures built by NOVA." projects={PROJECTS} accent="teal" />
        <SharedTechSection id="da-tech" chapter="06 / TECHNOLOGY ECOSYSTEM" heading="Our data engineering stack" subtext="Best-in-class tooling for every stage of the modern data lifecycle." stackLabel="Data Architecture Flow" stackLayers={STACK_LAYERS} techsLabel="Production Technologies" techs={TECHS} accent="teal" />
        <SharedRelatedSection id="da-related" chapter="07 / DIRECTORY" heading="Explore more of NOVA" subtext="Data flows through every capability NOVA delivers." related={RELATED} accent="teal" />
        <CapabilityCta />
      </main>
      <SiteFooter />
    </div>
  );
}
