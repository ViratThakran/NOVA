import { IndustryAccent } from "@/components/marketing/industries/industry-theme";
import { IndustrySignal } from "@/components/marketing/industries/industry-signals-section";
import { IndustrySolutionData } from "@/components/marketing/industries/industry-solutions-section";
import { IndustryActionCase } from "@/components/marketing/industries/industry-in-action-section";
import { AssurancePillar } from "@/components/marketing/industries/industry-assurance-section";
import { IndustryStackLayer, IndustryTechItem } from "@/components/marketing/industries/industry-tech-section";

export interface IndustryData {
  slug: string;
  number: string;
  name: string;
  title: string;
  tagline: string;
  heroHeadline: string;
  heroDescription: string;
  illustrationSrc: string;
  accent: IndustryAccent;
  relevantCapabilities?: string[];
  metrics: { label: string; value: string }[];
  signals: {
    heading: string;
    subtext: string;
    items: IndustrySignal[];
  };
  solutions: {
    heading: string;
    subtext: string;
    industryCategory: string;
    items: IndustrySolutionData[];
  };
  action: {
    heading: string;
    subtext: string;
    cases: IndustryActionCase[];
  };
  assurance: {
    heading: string;
    subtext: string;
    pillars: AssurancePillar[];
  };
  ecosystem: {
    heading: string;
    subtext: string;
    pipelineLabel: string;
    stackLayers: IndustryStackLayer[];
    techsLabel: string;
    techs: IndustryTechItem[];
  };
  ctaSubtext: string;
}

export const INDUSTRIES: IndustryData[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 01. FINANCIAL SERVICES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    slug: "financial-services",
    number: "01 / FINANCIAL SERVICES",
    name: "FINANCIAL SERVICES",
    title: "Financial services",
    tagline: "CAPITAL MARKETS · BANKING · FINTECH",
    heroHeadline: "Financial services",
    heroDescription:
      "Engineering high-throughput transaction systems, real-time risk intelligence, and cloud-native ledger infrastructure built for zero-downtime capital operations.",
    illustrationSrc: "/images/cards/grow.jpg",
    accent: "emerald",
    relevantCapabilities: ["AI & Intelligence", "Software & Technology", "Data & Analytics", "Automation"],
    metrics: [
      { label: "Execution Latency", value: "< 4.2ms P99" },
      { label: "System Availability", value: "99.999% SLA" },
      { label: "Transaction Scale", value: "250K+ ops/sec" },
      { label: "Compliance Benchmark", value: "SOC2 & ISO 27001" },
    ],
    signals: {
      heading: "Financial infrastructure now",
      subtext:
        "The convergence of real-time market data, algorithmic intelligence, and regulatory scrutiny requires engineering precision at every layer.",
      items: [
        {
          metric: "< 5ms",
          label: "Execution Latency SLA",
          description:
            "Market makers and institutional liquidity providers now require sub-5ms P99 execution latencies to avoid adverse price slippage in volatile order books.",
        },
        {
          metric: "$48B",
          label: "Fraud Exposure Mitigated",
          description:
            "Real-time graph analysis and behavioral machine learning reduce synthetic identity fraud and unauthorized account takeover losses across global payment corridors.",
        },
        {
          metric: "78%",
          label: "Core Ledger Modernization",
          description:
            "Of tier-1 banks are actively replacing 30-year-old COBOL and mainframe batch ledgers with event-driven, cloud-native double-entry micro-ledgers.",
        },
        {
          metric: "T+0",
          label: "Atomic Settlement Standard",
          description:
            "Securities clearance is transitioning from T+2 / T+1 to atomic real-time settlement, eliminating counterparty capital lockup and credit risk.",
        },
      ],
    },
    solutions: {
      heading: "Financial Capabilities Matrix",
      subtext:
        "Purpose-built architectures for institutional capital markets, banking infrastructure, and fintech leaders.",
      industryCategory: "Financial Systems",
      items: [
        {
          id: "capital-markets",
          title: "Capital Markets & Trading",
          image: "/images/cards/software.jpg",
          tagline: "Low-latency order matching, FIX gateways, and algorithmic execution engines",
          items: [
            { num: "01", label: "Sub-Millisecond Order Matching Engines" },
            { num: "02", label: "FIX Protocol / FAST Gateways & Normalization" },
            { num: "03", label: "Smart Order Routing (SOR) & Dark Pool Liquidity" },
            { num: "04", label: "Real-Time Level-2/3 Market Data Feeds" },
            { num: "05", label: "Pre-Trade Risk Controls & Credit Checks" },
            { num: "06", label: "Direct Market Access (DMA) Infrastructure" },
          ],
        },
        {
          id: "core-banking",
          title: "Core Banking & Modern Ledgers",
          image: "/images/cards/build.jpg",
          tagline: "Event-sourced, immutable ledgers and modern real-time account systems",
          items: [
            { num: "01", label: "Event-Sourced Double-Entry Ledger Architecture" },
            { num: "02", label: "Real-Time Balance Calculation & Shadow Ledgers" },
            { num: "03", label: "ISO 20022 Financial Messaging Transformation" },
            { num: "04", label: "Multi-Currency Deposit & Lending Engines" },
            { num: "05", label: "Open Banking APIs & PSD2/PSD3 Compliance" },
            { num: "06", label: "Mainframe Core Migration & Strangler-Fig Patterns" },
          ],
        },
        {
          id: "risk-fraud",
          title: "Risk Intelligence & Anti-Fraud",
          image: "/images/cards/gen_ai_research.jpg",
          tagline: "Real-time graph reasoning, anomaly scoring, and automated AML pipelines",
          items: [
            { num: "01", label: "Graph-Based Money Laundering (AML) Detection" },
            { num: "02", label: "Real-Time Transaction Fraud Scoring (<15ms)" },
            { num: "03", label: "Synthetic Identity & Account Takeover Defense" },
            { num: "04", label: "Monte Carlo Value-at-Risk (VaR) Simulators" },
            { num: "05", label: "Credit Risk Scoring & Alternative Data Models" },
            { num: "06", label: "Automated Suspicious Activity Report (SAR) Filing" },
          ],
        },
        {
          id: "wealth-quant",
          title: "Wealth Tech & Quantitative Analytics",
          image: "/images/cards/grow.jpg",
          tagline: "Portfolio rebalancing algorithms, factor modeling, and robotic advisory systems",
          items: [
            { num: "01", label: "Automated Tax-Loss Harvesting & Rebalancing" },
            { num: "02", label: "Multi-Asset Factor Risk & Attribution Engines" },
            { num: "03", label: "Quantitative Backtesting & Strategy Execution" },
            { num: "04", label: "High-Net-Worth Client Portal & Reporting" },
            { num: "05", label: "Robo-Advisory Decision Loops & Risk Profiling" },
            { num: "06", label: "ESG Screening & Regulatory Sustainability Feeds" },
          ],
        },
        {
          id: "payments-clearing",
          title: "Payments & Global Clearing",
          image: "/images/cards/experience.jpg",
          tagline: "High-throughput tokenized payment rails and cross-border settlement",
          items: [
            { num: "01", label: "High-Throughput Card Authorization Switches" },
            { num: "02", label: "FedNow / SEPA Instant Payment Rail Integration" },
            { num: "03", label: "PCI-DSS Level 1 Tokenization & Vaulting" },
            { num: "04", label: "Cross-Border Foreign Exchange (FX) Routing" },
            { num: "05", label: "Dispute & Chargeback Automation Workflows" },
            { num: "06", label: "Stablecoin & Digital Asset Settlement Gateways" },
          ],
        },
        {
          id: "regtech-audit",
          title: "RegTech & Deterministic Audit",
          image: "/images/cards/learn.jpg",
          tagline: "Continuous compliance verification, immutable logging, and supervisory analytics",
          items: [
            { num: "01", label: "Automated Basel III/IV & Dodd-Frank Reporting" },
            { num: "02", label: "Zero-Knowledge Cryptographic Audit Proofs" },
            { num: "03", label: "Real-Time Communications & Trade Surveillance" },
            { num: "04", label: "Automated Know-Your-Customer (KYC) Verification" },
            { num: "05", label: "Immutable Append-Only Audit Trail Architecture" },
            { num: "06", label: "Policy-as-Code for Capital Allocation Rules" },
          ],
        },
      ],
    },
    action: {
      heading: "High-assurance engineering under extreme volume",
      subtext: "Real institutional deployments where latency, accuracy, and fault tolerance are non-negotiable.",
      cases: [
        {
          id: "clearing-engine",
          tag: "CAPITAL MARKETS · NOVA CASE",
          title: "Scaling a multi-asset matching engine to 250,000 orders/sec",
          synopsis:
            "We engineered a distributed C++ & Rust order matching engine with DPDK kernel bypass and zero-copy ring buffers. The system processes over 250K orders/sec with deterministic P99 latency under 3.8ms during peak market volatility.",
          stat: "250K ops/sec · 3.8ms P99 · 0 dropped frames",
          image: "/images/cards/software.jpg",
        },
        {
          id: "aml-graph",
          tag: "RISK & COMPLIANCE · NOVA CASE",
          title: "Cutting false-positive AML alerts by 74% using real-time graph AI",
          synopsis:
            "Replaced static rule-based transaction monitoring with a TigerGraph + PyTorch GNN intelligence pipeline. Correlating entity networks across 45M historical transactions dropped false-positive investigation overhead by 74% while uncovering complex multi-hop layering rings.",
          stat: "-74% false positives · 45M transactions analyzed",
          image: "/images/cards/gen_ai_research.jpg",
        },
        {
          id: "ledger-migration",
          tag: "CORE BANKING · NOVA CASE",
          title: "Zero-downtime ledger migration across $12B in active deposits",
          synopsis:
            "Executed a shadow-ledger dual-write migration strategy converting legacy batch-updated banking ledgers to an immutable event-sourced PostgreSQL + Kafka ledger. Completed cutover across 1.8M retail accounts without a single second of deposit service disruption.",
          stat: "$12B deposits · 1.8M accounts · 0s downtime",
          image: "/images/cards/build.jpg",
        },
      ],
    },
    assurance: {
      heading: "Bank-grade security & regulatory governance",
      subtext: "Engineered from the ground up for strict global regulatory compliance, deterministic uptime, and zero-compromise security.",
      pillars: [
        {
          iconName: "ShieldCheck",
          title: "SOC 2 Type II & ISO 27001",
          badge: "COMPLIANCE CERTIFIED",
          description: "Continuous control validation and automated compliance telemetry ensuring audited bank-grade data security across compute and storage.",
        },
        {
          iconName: "Lock",
          title: "PCI-DSS Level 1 & Tokenization",
          badge: "PAYMENT SECURITY",
          description: "Zero-exposure cardholder data environments with hardware-backed encryption keys, tokenization vaults, and automated rotation.",
        },
        {
          iconName: "KeyRound",
          title: "Multi-Party Computation & HSM",
          badge: "CRYPTOGRAPHIC VAULTING",
          description: "Threshold signature schemes and Dedicated Cloud HSM key management that eliminate single points of compromise for digital assets and transaction signing.",
        },
        {
          iconName: "RefreshCw",
          title: "RPO = 0 & RTO < 60s Disaster Recovery",
          badge: "RESILIENCE SLA",
          description: "Synchronous cross-region database replication and automated circuit-breaking DNS failover guaranteeing zero data loss during cloud infrastructure outages.",
        },
        {
          iconName: "FileCheck2",
          title: "Immutable Append-Only Audit",
          badge: "REGULATORY PROVENANCE",
          description: "Cryptographically verified transaction logs and tamper-evident event streaming ensuring full auditability for SEC, FINRA, and FCA regulatory reporting.",
        },
        {
          iconName: "Cpu",
          title: "Deterministic Engine Validation",
          badge: "ALGORITHMIC ASSURANCE",
          description: "High-throughput fuzz testing, formal verification harnesses, and historical market re-simulation testing preventing order mismatch anomalies.",
        },
      ],
    },
    ecosystem: {
      heading: "Built for low-latency & deterministic scale",
      subtext: "Every layer of the financial engineering stack — from direct market data feeds to immutable ledgers and cryptographic key management.",
      pipelineLabel: "Financial Transaction Architecture Flow",
      stackLayers: [
        { layer: "MARKET DATA", detail: "FIX 4.4/5.0, FAST, ITCH/OUCH, Market Ticks, WebSockets" },
        { layer: "LOW-LATENCY RUNTIMES", detail: "Rust, C++20, Go, DPDK Kernel Bypass, Ring Buffers" },
        { layer: "IMMUTABLE LEDGERS", detail: "PostgreSQL, TigerGraph, ClickHouse, Apache Iceberg" },
        { layer: "RISK & AI MODELS", detail: "PyTorch GNNs, ONNX Runtime, Ray Distributed, Feature Stores" },
        { layer: "SECURITY & VAULTS", detail: "Cloud HSM, HashiCorp Vault, MPC Signing, OPA Policy" },
      ],
      techsLabel: "Production Financial Technologies",
      techs: [
        { name: "FIX Protocol & FAST", category: "Market Data" },
        { name: "Rust & C++20", category: "Low-Latency Compute" },
        { name: "Apache Kafka", category: "Event Streaming" },
        { name: "PostgreSQL (Event-Sourced)", category: "Immutable Ledgers" },
        { name: "TigerGraph", category: "Graph AML & Fraud" },
        { name: "ClickHouse", category: "Real-Time Tick Analytics" },
        { name: "PyTorch & ONNX", category: "Real-Time ML Scoring" },
        { name: "HashiCorp Vault & HSM", category: "Cryptographic Keys" },
        { name: "ISO 20022", category: "Financial Messaging" },
        { name: "AWS / GCP Financial Zones", category: "Multi-Region Cloud" },
      ],
    },
    ctaSubtext: "Let's discuss your transaction volume, risk architecture, or core banking modernization.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 02. HEALTHCARE & LIFE SCIENCES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    slug: "healthcare",
    number: "02 / HEALTHCARE",
    name: "HEALTHCARE",
    title: "Healthcare & life sciences",
    tagline: "HEALTH DATA · CLINICAL AI · INTEROPERABILITY",
    heroHeadline: "Healthcare & life sciences",
    heroDescription:
      "Architecting HIPAA/GDPR-compliant clinical data fabrics, multimodal diagnostic AI pipelines, and FHIR interoperability engines that accelerate patient outcomes.",
    illustrationSrc: "/images/cards/ai.jpg",
    accent: "cyan",
    relevantCapabilities: ["AI & Intelligence", "Data & Analytics", "Digital Products", "Automation"],
    metrics: [
      { label: "Data Interoperability", value: "HL7 & FHIR R4" },
      { label: "Regulatory Standard", value: "HIPAA & FDA SAMD" },
      { label: "Model Sensitivity", value: "99.4% ROC-AUC" },
      { label: "Privacy Preservation", value: "Zero-Trust De-ID" },
    ],
    signals: {
      heading: "Healthcare technology now",
      subtext:
        "From fragmented EHR silos to unified clinical intelligence — the future of care delivery is real-time, interoperable, and privacy-preserving.",
      items: [
        {
          metric: "91%",
          label: "EHR Interoperability Bottleneck",
          description:
            "Of healthcare health systems cite legacy EHR integration and incompatible data schemas as the single biggest impediment to clinical workflow innovation.",
        },
        {
          metric: "4.2×",
          label: "Diagnostic AI Acceleration",
          description:
            "Hospitals utilizing edge-accelerated computer vision triage emergency radiology scans 4.2× faster, directly reducing critical care response times.",
        },
        {
          metric: "80%",
          label: "Unstructured Medical Data",
          description:
            "Of patient health information exists in unstructured clinical notes, pathology PDFs, and DICOM imaging requiring specialized NLP and vision pipelines.",
        },
        {
          metric: "< 0.01%",
          label: "Zero-Knowledge Re-ID Risk",
          description:
            "Automated de-identification pipelines ensure research data sharing adheres to Safe Harbor and Expert Determination privacy thresholds.",
        },
      ],
    },
    solutions: {
      heading: "Clinical & Life Science Capabilities",
      subtext:
        "High-assurance healthcare engineering for health systems, medical device manufacturers, and biopharma research leaders.",
      industryCategory: "Healthcare Systems",
      items: [
        {
          id: "interoperability",
          title: "FHIR & Clinical Data Pipelines",
          image: "/images/cards/software.jpg",
          tagline: "HL7 FHIR R4 API gateways, SMART-on-FHIR apps, and EHR bidirectional integration",
          items: [
            { num: "01", label: "SMART-on-FHIR App Architecture" },
            { num: "02", label: "HL7 v2 to FHIR R4 Real-Time Transcoding" },
            { num: "03", label: "Epic / Cerner EHR Bidirectional Adapters" },
            { num: "04", label: "DICOM & Medical Imaging Ingestion" },
            { num: "05", label: "Clinical Data Warehouse & OHDSI OMOP" },
            { num: "06", label: "Patient Identity Matching & Master Patient Index" },
          ],
        },
        {
          id: "clinical-ai",
          title: "Diagnostic & Clinical Decision AI",
          image: "/images/cards/gen_ai_research.jpg",
          tagline: "Medical imaging models, clinical NLP, and ambient physician scribe copilot engines",
          items: [
            { num: "01", label: "Radiology DICOM Computer Vision Triage" },
            { num: "02", label: "Ambient Clinical Scribe & Note Synthesis" },
            { num: "03", label: "ICD-10 / SNOMED CT Automated Coding" },
            { num: "04", label: "Sepsis & Early Deterioration Prediction" },
            { num: "05", label: "Clinical Trial Eligibility Matching" },
            { num: "06", label: "FDA Software as a Medical Device (SaMD) Validation" },
          ],
        },
        {
          id: "telehealth-iot",
          title: "Remote Patient Monitoring & IoT",
          image: "/images/cards/experience.jpg",
          tagline: "Continuous biometric streaming, medical IoT device gateways, and virtual care platforms",
          items: [
            { num: "01", label: "Wearable & Medical Device Ingestion Gateways" },
            { num: "02", label: "Real-Time ECG / Vital Telemetry Streaming" },
            { num: "03", label: "WebRTC Low-Latency Video Consultation Rails" },
            { num: "04", label: "Automated Clinical Alert Routing & Escalation" },
            { num: "05", label: "Edge Gateway Firmware & BLE Data Sync" },
            { num: "06", label: "Chronic Care Patient Portal & Mobile Apps" },
          ],
        },
        {
          id: "pharma-genomics",
          title: "Genomics & Bio-Informatics",
          image: "/images/cards/build.jpg",
          tagline: "High-performance sequence alignment, variant calling, and molecular docking clusters",
          items: [
            { num: "01", label: "Next-Gen Sequencing (NGS) Pipeline Automation" },
            { num: "02", label: "Variant Calling & Annotation Workflows (GATK)" },
            { num: "03", label: "Distributed GPU Accelerated Molecular Docking" },
            { num: "04", label: "Multi-Omics Data Lakehouse Architecture" },
            { num: "05", label: "Bio-Repository Metadata Cataloging" },
            { num: "06", label: "FAIR-Compliant Scientific Data Platforms" },
          ],
        },
        {
          id: "privacy-governance",
          title: "HIPAA Cloud & Safe Harbor Privacy",
          image: "/images/cards/learn.jpg",
          tagline: "Automated PHI redaction, zero-trust access control, and confidential computing",
          items: [
            { num: "01", label: "Automated PHI De-Identification in Real Time" },
            { num: "02", label: "Confidential Computing & Enclave AI Training" },
            { num: "03", label: "HIPAA & HITECH Cloud Infrastructure Hardening" },
            { num: "04", label: "Granular Role & Consent-Based Access Control" },
            { num: "05", label: "Tamper-Evident Medical Audit Trails" },
            { num: "06", label: "BAA Governance & Vendor Security Scans" },
          ],
        },
      ],
    },
    action: {
      heading: "Clinical outcomes delivered in production",
      subtext: "Validated engineering for health systems, biopharma research, and digital health pioneers.",
      cases: [
        {
          id: "ehr-unification",
          tag: "INTEROPERABILITY · NOVA CASE",
          title: "Unifying 12 hospital EHR systems into a single real-time FHIR fabric",
          synopsis:
            "Constructed a cloud-native FHIR R4 data fabric federating Epic, Cerner, and legacy HL7 feeds across 12 hospitals. Clinicians now access a consolidated longitudinal patient chart updating in sub-500ms.",
          stat: "12 hospital networks · 3.4M patient records · <500ms sync",
          image: "/images/cards/software.jpg",
        },
        {
          id: "radiology-triage",
          tag: "CLINICAL AI · NOVA CASE",
          title: "Sub-minute emergency stroke triage using edge computer vision",
          synopsis:
            "Deployed an FDA-aligned 3D CNN inference model on edge hospital servers. Automated detection of acute intracranial hemorrhage on non-contrast CT scans alerted neurotrauma teams within 48 seconds of scan completion.",
          stat: "48s alert latency · 99.1% sensitivity · 15K patients",
          image: "/images/cards/gen_ai_research.jpg",
        },
        {
          id: "genomic-pipeline",
          tag: "BIO-INFORMATICS · NOVA CASE",
          title: "Shrinking whole-genome variant analysis from 28 hours to 42 minutes",
          synopsis:
            "Re-architected a precision oncology sequencing pipeline using Nextflow, AWS Batch, and GPU-accelerated Cromwell runners, slashing whole-genome variant identification turnaround to 42 minutes.",
          stat: "28h → 42min processing · 65% compute cost reduction",
          image: "/images/cards/build.jpg",
        },
      ],
    },
    assurance: {
      heading: "Healthcare compliance & patient privacy guarantees",
      subtext: "Architected to meet stringent global health data protection mandates.",
      pillars: [
        {
          iconName: "ShieldCheck",
          title: "HIPAA & HITECH Compliant",
          badge: "HEALTH DATA GOVERNANCE",
          description: "End-to-end encryption for ePHI at rest and in transit with comprehensive Business Associate Agreement (BAA) alignment.",
        },
        {
          iconName: "HeartPulse",
          title: "FDA SaMD & GxP Validation",
          badge: "CLINICAL REGULATORY",
          description: "Software as a Medical Device verification protocols, 21 CFR Part 11 compliant audit trails, and design history files.",
        },
        {
          iconName: "Lock",
          title: "Automated PHI De-Identification",
          badge: "PRIVACY PRESERVATION",
          description: "Transformer-based redaction of 18 HIPAA Safe Harbor identifiers across medical text, PDFs, and DICOM metadata.",
        },
        {
          iconName: "KeyRound",
          title: "Confidential Enclave Compute",
          badge: "HARDWARE PRIVACY",
          description: "AWS Nitro Enclaves and GCP Confidential VMs enabling multi-institutional federated AI training without raw data sharing.",
        },
        {
          iconName: "FileCheck2",
          title: "FHIR R4 & HL7 Certification",
          badge: "OPEN INTEROPERABILITY",
          description: "Certified conformance with ONC 21st Century Cures Act interoperability and information-blocking mandates.",
        },
        {
          iconName: "Activity",
          title: "99.99% Clinical System SLA",
          badge: "CRITICAL AVAILABILITY",
          description: "Multi-region redundant hospital interfaces with zero single points of failure for life-critical telemetry streams.",
        },
      ],
    },
    ecosystem: {
      heading: "Engineered for clinical depth & throughput",
      subtext: "From medical sensor streams and DICOM imaging to FHIR microservices and privacy-preserving enclaves.",
      pipelineLabel: "Clinical Data & AI Pipeline Flow",
      stackLayers: [
        { layer: "CLINICAL INGESTION", detail: "HL7 v2, FHIR R4, DICOM, MLLP, SMART-on-FHIR, IoT" },
        { layer: "NORMALIZATION", detail: "HAPI FHIR, OHDSI OMOP, SNOMED CT, LOINC, RxNorm" },
        { layer: "SECURE STORAGE", detail: "Cloud Healthcare API, PostgreSQL, DICOM PACS, S3" },
        { layer: "AI & REASONING", detail: "MONAI, PyTorch, BioBERT, Ray Distributed, ONNX" },
        { layer: "CLINICAL INTERFACES", detail: "EHR Embedded Apps, Next.js Portals, WebRTC Telehealth" },
      ],
      techsLabel: "Healthcare & Life Science Technologies",
      techs: [
        { name: "HL7 FHIR R4", category: "Interoperability" },
        { name: "MONAI Framework", category: "Medical Vision" },
        { name: "HAPI FHIR Engine", category: "Clinical Server" },
        { name: "OHDSI OMOP CDM", category: "Research Data" },
        { name: "BioBERT & Med-PaLM", category: "Clinical NLP" },
        { name: "Nextflow & Cromwell", category: "Genomic Pipelines" },
        { name: "Orthanc PACS", category: "DICOM Routing" },
        { name: "AWS HealthLake", category: "Cloud Healthcare" },
        { name: "Google Cloud Healthcare", category: "FHIR Data Store" },
        { name: "Apache Spark on Kubernetes", category: "Data Processing" },
      ],
    },
    ctaSubtext: "Let's discuss your clinical data architecture, FHIR interoperability, or medical AI initiatives.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 03. AUTOMOTIVE & CONNECTED MOBILITY
  // ─────────────────────────────────────────────────────────────────────────────
  {
    slug: "automotive",
    number: "03 / AUTOMOTIVE",
    name: "AUTOMOTIVE",
    title: "Automotive & mobility",
    tagline: "CONNECTED VEHICLES · SDV · TELEMETRY · AUTONOMY",
    heroHeadline: "Automotive & mobility",
    heroDescription:
      "Building software-defined vehicle (SDV) architectures, real-time fleet telemetry platforms, and high-concurrency over-the-air (OTA) update infrastructure.",
    illustrationSrc: "/images/cards/experience.jpg",
    accent: "blue",
    relevantCapabilities: ["Software & Technology", "Cloud & Infrastructure", "Automation", "AI & Intelligence"],
    metrics: [
      { label: "Fleet Telemetry Ingest", value: "10M+ msg/sec" },
      { label: "OTA Update Success", value: "99.98% Rate" },
      { label: "Edge Inference Latency", value: "< 12ms Edge" },
      { label: "Safety Standard", value: "ISO 26262 ASIL" },
    ],
    signals: {
      heading: "Automotive software revolution",
      subtext:
        "The shift from hardware-centric vehicles to software-defined mobility requires cloud-native backend scale and automotive-grade reliability.",
      items: [
        {
          metric: "95%",
          label: "Connected Fleet by 2026",
          description:
            "Of new passenger and commercial vehicles ship with integrated cellular telematics generating gigabytes of continuous telemetry daily.",
        },
        {
          metric: "100M+",
          label: "Lines of In-Vehicle Code",
          description:
            "Modern software-defined vehicles run microservices architectures across heterogeneous central compute and zonal ECUs.",
        },
        {
          metric: "80%",
          label: "Warranty Claims Prevented",
          description:
            "Automotive OEMs deploying predictive battery and drivetrain telemetry identify mechanical anomalies weeks before breakdown.",
        },
        {
          metric: "< 15s",
          label: "Emergency E-Call Response",
          description:
            "Low-latency cloud ingestion pipelines route critical crash telemetry directly to first responders with vehicle telemetry context.",
        },
      ],
    },
    solutions: {
      heading: "Automotive & Mobility Solutions Matrix",
      subtext:
        "High-performance cloud and edge engineering for OEMs, Tier-1 suppliers, and autonomous fleet operators.",
      industryCategory: "Automotive Systems",
      items: [
        {
          id: "connected-fleet",
          title: "Connected Vehicle Platforms",
          image: "/images/cards/software.jpg",
          tagline: "MQTT/CAN-bus ingestion, digital twin state management, and real-time fleet command",
          items: [
            { num: "01", label: "MQTT / gRPC Vehicle Telematics Ingestion" },
            { num: "02", label: "Vehicle Digital Twin & Shadow State Sync" },
            { num: "03", label: "CAN-bus / SOME/IP Data Decoding Engines" },
            { num: "04", label: "Geofencing & Dynamic Route Optimization" },
            { num: "05", label: "EV Battery Health & Range Prediction Models" },
            { num: "06", label: "Fleet Analytics & Driver Behavior Scoring" },
          ],
        },
        {
          id: "sdv-ota",
          title: "Software-Defined Vehicle & OTA",
          image: "/images/cards/build.jpg",
          tagline: "Cryptographic firmware updates, differential delta packaging, and ECU rollback safety",
          items: [
            { num: "01", label: "Secure Over-the-Air (OTA) Campaign Management" },
            { num: "02", label: "Differential Binary Delta Generation" },
            { num: "03", label: "Dual-Bank ECU Firmware Rollback Safety" },
            { num: "04", label: "AUTOSAR Adaptive Cloud Connectivity" },
            { num: "05", label: "In-Vehicle App Store & Microservice Runtime" },
            { num: "06", label: "Hardware Security Module (HSM) Key Signing" },
          ],
        },
        {
          id: "autonomous-ai",
          title: "ADAS & Autonomous Driving Cloud",
          image: "/images/cards/gen_ai_research.jpg",
          tagline: "Sensor fusion ingestion, automated edge corner-case harvesting, and simulation clusters",
          items: [
            { num: "01", label: "LiDAR / Camera Raw Sensor Data Ingestion" },
            { num: "02", label: "Edge Corner-Case Trigger & Upload System" },
            { num: "03", label: "Distributed Perception Model Re-Training" },
            { num: "04", label: "High-Definition (HD) Map Vector Ingestion" },
            { num: "05", label: "Simulated Scenario Replay & Safety Verification" },
            { num: "06", label: "ISO 26262 ASIL Functional Safety Tooling" },
          ],
        },
        {
          id: "smart-charging",
          title: "EV Charging & Grid Orchestration",
          image: "/images/cards/grow.jpg",
          tagline: "OCPP 2.0.1 charge station protocols, dynamic load balancing, and smart grid optimization",
          items: [
            { num: "01", label: "OCPP 1.6 / 2.0.1 Charging Station Management" },
            { num: "02", label: "Dynamic Fleet Depot Load Balancing" },
            { num: "03", label: "Plug & Charge (ISO 15118) Public Key Infrastructure" },
            { num: "04", label: "Energy Tariff Optimization & V2G Clearing" },
            { num: "05", label: "Charger Availability & Route Integration" },
            { num: "06", label: "Battery Degradation Analytics & Telemetry" },
          ],
        },
      ],
    },
    action: {
      heading: "Mobility platforms operating at global scale",
      subtext: "Proven engineering powering connected vehicle fleets across continents.",
      cases: [
        {
          id: "fleet-telemetry",
          tag: "CONNECTED VEHICLE · NOVA CASE",
          title: "Ingesting 8M telemetry points per second across 1.2M active vehicles",
          synopsis:
            "Engineered a distributed Kafka + ClickHouse telematics pipeline with edge compression. The platform manages real-time state for 1.2M commercial trucks, reducing fleet fuel consumption by 14% via adaptive routing.",
          stat: "1.2M vehicles · 8M msg/sec · 14% fuel reduction",
          image: "/images/cards/software.jpg",
        },
        {
          id: "ota-campaign",
          tag: "SDV ENGINEERING · NOVA CASE",
          title: "Zero-fail OTA firmware rollout to 450,000 electric vehicles",
          synopsis:
            "Designed an automated staged canary OTA update orchestration engine with differential delta delivery and cryptographic ECU validation, cutting cellular data payload costs by 78%.",
          stat: "450K vehicles updated · 0 bricked ECUs · 78% bandwidth saved",
          image: "/images/cards/build.jpg",
        },
        {
          id: "ev-charging-network",
          tag: "EV MOBILITY · NOVA CASE",
          title: "Dynamic power balancing across 18,000 public EV fast-chargers",
          synopsis:
            "Implemented an OCPP 2.0.1 smart charging engine with sub-second peak load shedding algorithms, preventing local substation overloads while maximizing charging throughput during peak travel periods.",
          stat: "18K chargers · 99.98% session success · 0 grid trips",
          image: "/images/cards/grow.jpg",
        },
      ],
    },
    assurance: {
      heading: "Automotive functional safety & cyber security",
      subtext: "Engineered to UN R155 / R156 automotive cyber security and safety standards.",
      pillars: [
        {
          iconName: "ShieldCheck",
          title: "UN R155 & ISO/SAE 21434",
          badge: "VEHICLE CYBERSECURITY",
          description: "Certified Cybersecurity Management System (CSMS) architecture with automated vulnerability monitoring and threat analysis.",
        },
        {
          iconName: "Car",
          title: "ISO 26262 ASIL Compliance",
          badge: "FUNCTIONAL SAFETY",
          description: "Safety-critical software lifecycle governance, fault tree analysis, and fail-operational cloud backend architectures.",
        },
        {
          iconName: "Lock",
          title: "UN R156 Compliant OTA",
          badge: "SOFTWARE UPDATE SYSTEM",
          description: "Secure Software Update Management System (SUMS) with cryptographic provenance, rollback gates, and audit compliance.",
        },
        {
          iconName: "KeyRound",
          title: "Hardware Security Modules (HSM)",
          badge: "KEY MANAGEMENT",
          description: "Vehicle PKI certificate authority and end-to-end encrypted session keys protecting in-vehicle bus communication.",
        },
        {
          iconName: "RefreshCw",
          title: "Real-Time Fleet SRE & Failover",
          badge: "CRITICAL AVAILABILITY",
          description: "Multi-region active-active cloud clusters with automatic failover ensuring uninterrupted emergency SOS and fleet tracking.",
        },
        {
          iconName: "Cpu",
          title: "Edge Container Hardening",
          badge: "IN-VEHICLE RUNTIME",
          description: "Sandboxed, memory-safe in-vehicle container runtimes separating infotainment from mission-critical CAN bus control.",
        },
      ],
    },
    ecosystem: {
      heading: "Automotive software & telemetry stack",
      subtext: "From in-vehicle microcontrollers to global event streaming clusters and predictive fleet AI.",
      pipelineLabel: "Automotive Telematics & OTA Pipeline",
      stackLayers: [
        { layer: "VEHICLE EDGE", detail: "AUTOSAR Adaptive, CAN-bus, SOME/IP, C++ / Rust Edge Daemons" },
        { layer: "COMMUNICATION", detail: "MQTT, CoAP, Cellular 5G/4G, TLS 1.3, ISO 15118 (Plug & Charge)" },
        { layer: "STREAMING INGEST", detail: "Apache Kafka, EMQX MQTT Broker, Apache Flink, ClickHouse" },
        { layer: "DIGITAL TWIN & AI", detail: "PostgreSQL, Time-Series Stores, PyTorch Telemetry Models" },
        { layer: "OEM / FLEET PORTAL", detail: "Next.js Web Applications, GraphQL Fleet APIs, iOS/Android Apps" },
      ],
      techsLabel: "Automotive & Mobility Technologies",
      techs: [
        { name: "MQTT & EMQX", category: "Telemetry Broker" },
        { name: "Apache Kafka", category: "Event Streaming" },
        { name: "ClickHouse", category: "Time-Series DB" },
        { name: "AUTOSAR Adaptive", category: "In-Vehicle Architecture" },
        { name: "Rust & C++20", category: "Edge Vehicle Code" },
        { name: "OCPP 2.0.1", category: "EV Charging Protocol" },
        { name: "AWS IoT FleetWise", category: "Automotive Cloud" },
        { name: "HashiCorp Vault", category: "Vehicle PKI" },
        { name: "Grafana", category: "Fleet Telemetry" },
        { name: "Docker & Yocto Linux", category: "In-Vehicle OS" },
      ],
    },
    ctaSubtext: "Let's discuss your software-defined vehicle roadmap, fleet telematics scale, or OTA architecture.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 04. MANUFACTURING & ADVANCED INDUSTRIAL
  // ─────────────────────────────────────────────────────────────────────────────
  {
    slug: "manufacturing",
    number: "04 / MANUFACTURING",
    name: "MANUFACTURING",
    title: "Manufacturing & industry 4.0",
    tagline: "INDUSTRIAL IOT · COMPUTER VISION · PREDICTIVE MAINTENANCE",
    heroHeadline: "Manufacturing & industry 4.0",
    heroDescription:
      "Transforming factory floors with edge computer vision inspection, real-time SCADA/PLC telemetry ingestion, and predictive machine learning that prevents line stoppages.",
    illustrationSrc: "/images/cards/build.jpg",
    accent: "amber",
    relevantCapabilities: ["AI & Intelligence", "Automation", "Cloud & Infrastructure", "Data & Analytics"],
    metrics: [
      { label: "Defect Detection Rate", value: "99.85% Accuracy" },
      { label: "Unplanned Downtime", value: "-45% Reduction" },
      { label: "Edge Cycle Time", value: "< 25ms Vision" },
      { label: "Industrial Standard", value: "OPC UA & MQTT" },
    ],
    signals: {
      heading: "Industrial technology now",
      subtext:
        "Bridging Operational Technology (OT) and Information Technology (IT) to unlock autonomous, resilient smart manufacturing.",
      items: [
        {
          metric: "$50B",
          label: "Annual Factory Downtime Loss",
          description:
            "Unplanned machinery breakdowns cost industrial manufacturers over $50B annually in scrapped parts, lost output, and emergency repairs.",
        },
        {
          metric: "10×",
          label: "Speed Over Manual Quality QA",
          description:
            "Automated visual inspection running on edge GPUs classifies surface imperfections 10× faster than manual human spot-checking.",
        },
        {
          metric: "72%",
          label: "Factories Adopting Edge AI",
          description:
            "Industrial enterprises are processing vibration, thermal, and acoustic sensor streams locally on ruggedized factory-floor edge nodes.",
        },
        {
          metric: "99.9%",
          label: "Shop-Floor Network Reliability",
          description:
            "Modern smart manufacturing requires deterministic TSN and edge caching that continues operations even during cloud link loss.",
        },
      ],
    },
    solutions: {
      heading: "Smart Manufacturing Capabilities",
      subtext:
        "Purpose-built industrial software engineering for precision manufacturers, automotive plants, and electronics fabricators.",
      industryCategory: "Manufacturing Systems",
      items: [
        {
          id: "vision-qa",
          title: "Edge Computer Vision Inspection",
          image: "/images/cards/software.jpg",
          tagline: "Sub-25ms defect classification, dimensional measurement, and assembly verification",
          items: [
            { num: "01", label: "Real-Time Surface Defect Classification" },
            { num: "02", label: "Sub-Millimeter Optical Dimensional Gauging" },
            { num: "03", label: "Missing Component & Assembly Verification" },
            { num: "04", label: "High-Speed Line Synchronization (Trigger Sync)" },
            { num: "05", label: "Automated Rejection Actuator Integration" },
            { num: "06", label: "YOLOv10 / TensorRT Edge Pipeline Optimization" },
          ],
        },
        {
          id: "iiot-scada",
          title: "IIoT & OT/IT Convergence",
          image: "/images/cards/build.jpg",
          tagline: "OPC UA, Modbus, MQTT-SparkplugB ingestion and digital twin factory telemetry",
          items: [
            { num: "01", label: "OPC UA / Modbus / Siemens S7 Ingestion" },
            { num: "02", label: "Sparkplug B MQTT Unified Namespace (UNS)" },
            { num: "03", label: "Plant-Wide Overall Equipment Effectiveness (OEE)" },
            { num: "04", label: "Real-Time 3D Digital Factory Twin Models" },
            { num: "05", label: "Energy Consumption & Peak Load Monitoring" },
            { num: "06", label: "Edge-to-Cloud Bidirectional Control Gateways" },
          ],
        },
        {
          id: "predictive-maintenance",
          title: "Predictive Maintenance & Health",
          image: "/images/cards/gen_ai_research.jpg",
          tagline: "High-frequency vibration FFT analysis, thermal anomaly detection, and RUL estimation",
          items: [
            { num: "01", label: "High-Frequency Vibration FFT Spectral Analysis" },
            { num: "02", label: "Bearing & Drivetrain Remaining Useful Life (RUL)" },
            { num: "03", label: "Thermal Imaging Hotspot Detection" },
            { num: "04", label: "Acoustic Anomaly Detection in Rotating Gearboxes" },
            { num: "05", label: "Automated Work Order Dispatch in CMMS / SAP" },
            { num: "06", label: "Spare Part Inventory Optimization Forecasting" },
          ],
        },
        {
          id: "supply-chain",
          title: "Smart Supply Chain & Traceability",
          image: "/images/cards/grow.jpg",
          tagline: "Serialized component track-and-trace, automated AGV dispatch, and warehouse digital twins",
          items: [
            { num: "01", label: "End-to-End Serialized Component Provenance" },
            { num: "02", label: "RFID & 2D DataMatrix Tracking Stations" },
            { num: "03", label: "Automated Guided Vehicle (AGV) Fleet Routing" },
            { num: "04", label: "Supplier Material Quality Incoming Gateways" },
            { num: "05", label: "Automated Inventory Replenishment Loops" },
            { num: "06", label: "Carbon Footprint & ESG Product Passports" },
          ],
        },
      ],
    },
    action: {
      heading: "Proven impact on global factory lines",
      subtext: "Delivering zero-downtime reliability and automated quality across modern assembly plants.",
      cases: [
        {
          id: "semiconductor-vision",
          tag: "COMPUTER VISION · NOVA CASE",
          title: "Eliminating 99.4% of silicon wafer micro-defects at 200 parts/min",
          synopsis:
            "Deployed multi-camera TensorRT edge inspection nodes across 6 fabrication lines. Micro-crack detection at 200 wafers/min prevented defective chips from entering expensive packaging stages, saving $8.4M annually.",
          stat: "200 parts/min · 99.4% defect catch · $8.4M saved",
          image: "/images/cards/software.jpg",
        },
        {
          id: "stamping-pd-maint",
          tag: "IIOT & PREDICTIVE · NOVA CASE",
          title: "Predicting hydraulic stamping press failure 18 days in advance",
          synopsis:
            "Connected 40 heavy automotive metal stamping presses to high-speed vibration and hydraulic pressure telemetry with an automated anomaly detection model, completely eliminating unexpected press line stoppages.",
          stat: "18 days early warning · 0 line crashes · +24% OEE",
          image: "/images/cards/build.jpg",
        },
        {
          id: "plant-oee",
          tag: "DIGITAL FACTORY · NOVA CASE",
          title: "Unified MQTT Sparkplug namespace across 400 legacy machines",
          synopsis:
            "Implemented an edge unified namespace (UNS) converting 400 heterogeneous Siemens, Allen-Bradley, and Fanuc PLCs into standardized MQTT telemetry feeding real-time OEE dashboards across 4 global plants.",
          stat: "400 machines connected · 4 plants unified · +18% throughput",
          image: "/images/cards/grow.jpg",
        },
      ],
    },
    assurance: {
      heading: "Industrial safety & operational continuity",
      subtext: "Built to withstand harsh physical environments and air-gapped security protocols.",
      pillars: [
        {
          iconName: "Factory",
          title: "IEC 62443 Industrial Cybersecurity",
          badge: "OT/ICS SECURITY",
          description: "Zone and conduit security architectures isolating critical PLC/SCADA networks from corporate IT networks.",
        },
        {
          iconName: "ShieldCheck",
          title: "Air-Gapped & Edge Autonomous",
          badge: "LOCAL CONTINUITY",
          description: "Edge nodes execute inspection and control loops locally with zero cloud dependence during factory connectivity outages.",
        },
        {
          iconName: "RefreshCw",
          title: "Deterministic Sub-Millisecond Loops",
          badge: "HARD REAL-TIME",
          description: "Real-time Linux PREEMPT_RT and hardware industrial Ethernet (EtherCAT/Profinet) synchronization.",
        },
        {
          iconName: "Lock",
          title: "Zero-Trust Device Identity",
          badge: "DEVICE HARDENING",
          description: "TPM 2.0 cryptographic authentication ensuring rogue devices cannot inject malicious sensor packets into the factory namespace.",
        },
        {
          iconName: "FileCheck2",
          title: "ISO 9001 Quality Audit Logs",
          badge: "DIGITAL COMPLIANCE",
          description: "Automated digital batch records and immutable inspection certificates eliminating manual paper QA compliance logs.",
        },
        {
          iconName: "Cpu",
          title: "Ruggedized Hardware Compatibility",
          badge: "INDUSTRIAL HARDWARE",
          description: "Certified compatibility with NVIDIA Jetson Thor/Orin, Advantech, Siemens IPC, and Beckhoff industrial automation.",
        },
      ],
    },
    ecosystem: {
      heading: "Industry 4.0 architecture & stack",
      subtext: "From machine controllers and high-speed industrial cameras to unified namespaces and predictive ML.",
      pipelineLabel: "Industrial Telemetry & Edge Vision Flow",
      stackLayers: [
        { layer: "SHOP FLOOR OT", detail: "PLCs (Siemens, Rockwell), Sensors (4-20mA, IO-Link), Cameras (GigE Vision)" },
        { layer: "EDGE COMPUTE", detail: "NVIDIA Jetson, Industrial IPCs, TensorRT, Linux PREEMPT_RT" },
        { layer: "INDUSTRIAL BUS", detail: "OPC UA, MQTT Sparkplug B, Modbus TCP, EtherCAT, PROFINET" },
        { layer: "DATA PLATFORM", detail: "TimescaleDB, ClickHouse, Apache Kafka, Unified Namespace (UNS)" },
        { layer: "FACTORY APPS", detail: "Real-Time OEE Dashboards, CMMS Work Order Dispatch, Web SCADA" },
      ],
      techsLabel: "Smart Manufacturing Technologies",
      techs: [
        { name: "OPC UA & Sparkplug B", category: "OT Protocol" },
        { name: "NVIDIA TensorRT", category: "Edge Inference" },
        { name: "GigE Vision / GenICam", category: "Industrial Cameras" },
        { name: "EMQX Industrial MQTT", category: "Unified Namespace" },
        { name: "TimescaleDB", category: "Sensor Time-Series" },
        { name: "Node-RED on Edge", category: "Edge Logic" },
        { name: "Siemens S7 & Rockwell", category: "PLC Protocols" },
        { name: "PyTorch & OpenCV", category: "Defect AI" },
        { name: "Grafana Industrial", category: "OEE Visualizer" },
        { name: "Docker on Balena/Edge", category: "Fleet Management" },
      ],
    },
    ctaSubtext: "Let's discuss your factory visual inspection, OEE unification, or predictive maintenance initiatives.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 05. RETAIL & MODERN COMMERCE
  // ─────────────────────────────────────────────────────────────────────────────
  {
    slug: "retail-commerce",
    number: "05 / RETAIL & COMMERCE",
    name: "RETAIL & COMMERCE",
    title: "Retail & modern commerce",
    tagline: "HEADLESS COMMERCE · REAL-TIME INVENTORY · AI PERSONALIZATION",
    heroHeadline: "Retail & modern commerce",
    heroDescription:
      "Engineering sub-second headless commerce storefronts, omnichannel inventory synchronization engines, and real-time AI personalization that lifts conversion.",
    illustrationSrc: "/images/cards/products.jpg",
    accent: "rose",
    relevantCapabilities: ["Digital Products", "Data & Analytics", "AI & Intelligence", "Cloud & Infrastructure"],
    metrics: [
      { label: "Mobile Storefront Speed", value: "< 0.8s LCP" },
      { label: "Inventory Sync Accuracy", value: "99.99% Real-Time" },
      { label: "Black Friday Throughput", value: "100K+ req/sec" },
      { label: "Conversion Rate Lift", value: "+34% Average" },
    ],
    signals: {
      heading: "Commerce technology now",
      subtext:
        "The shift from monolithic e-commerce platforms to composable, edge-rendered architecture and real-time inventory intelligence.",
      items: [
        {
          metric: "+32%",
          label: "Conversion Lift from Sub-1s Speed",
          description:
            "Every 100ms decrease in page load latency directly improves e-commerce checkout completion and reduces shopping cart abandonment.",
        },
        {
          metric: "$1.8T",
          label: "Omnichannel Inventory Distortion",
          description:
            "Out-of-stock items and overstocked warehouses cost retailers over $1.8T globally due to disconnected inventory and POS systems.",
        },
        {
          metric: "4.8×",
          label: "Personalized Search ROI",
          description:
            "Retailers deploying real-time vector search and personalized re-ranking generate 4.8× higher revenue per session than static keyword search.",
        },
        {
          metric: "88%",
          label: "Traffic on Mobile Devices",
          description:
            "Modern commerce is mobile-first, requiring progressive web app architecture, one-click biometric payments, and instant optimistic updates.",
        },
      ],
    },
    solutions: {
      heading: "Modern Commerce Capabilities",
      subtext:
        "High-throughput digital engineering for global retailers, D2C brands, and multi-brand marketplace operators.",
      industryCategory: "Retail Systems",
      items: [
        {
          id: "headless-storefronts",
          title: "Headless Storefronts & Edge Commerce",
          image: "/images/cards/software.jpg",
          tagline: "Next.js App Router storefronts, edge-rendered product detail pages, and instant checkout",
          items: [
            { num: "01", label: "Composable Next.js Commerce Storefronts" },
            { num: "02", label: "Edge-Rendered Dynamic Product Catalogs" },
            { num: "03", label: "One-Click Apple Pay & Google Pay Checkout" },
            { num: "04", label: "Multi-Currency & Localized Tax Calculation" },
            { num: "05", label: "Optimistic UI Cart & Micro-Animations" },
            { num: "06", label: "Internationalization (i18n) Across 40+ Locales" },
          ],
        },
        {
          id: "inventory-omnichannel",
          title: "Real-Time Omnichannel Inventory",
          image: "/images/cards/build.jpg",
          tagline: "Unified inventory state, Ship-From-Store, and distributed warehouse order routing",
          items: [
            { num: "01", label: "Real-Time Inventory Allocation & Shadowing" },
            { num: "02", label: "BOPIS (Buy Online, Pick Up In Store) Routing" },
            { num: "03", label: "Distributed Order Management System (DOMS)" },
            { num: "04", label: "POS In-Store Real-Time Stock Synchronization" },
            { num: "05", label: "Automated Safety Stock & Out-of-Stock Prevention" },
            { num: "06", label: "ERP / WMS Real-Time Event Connectors" },
          ],
        },
        {
          id: "ai-search-personalization",
          title: "Semantic Search & AI Personalization",
          image: "/images/cards/gen_ai_research.jpg",
          tagline: "Vector product discovery, visual search, and personalized customer journey ranking",
          items: [
            { num: "01", label: "Vector Semantic Product Search (Qdrant/Pinecone)" },
            { num: "02", label: "Visual 'Shop the Look' Image Matching" },
            { num: "03", label: "Real-Time In-Session Behavioral Re-Ranking" },
            { num: "04", label: "Dynamic Bundling & Cross-Sell AI Recommendations" },
            { num: "05", label: "Natural-Language Conversational Shopping Copilots" },
            { num: "06", label: "Customer Lifetime Value (LTV) Prediction Models" },
          ],
        },
        {
          id: "loyalty-cdp",
          title: "Customer Data Platform & Loyalty",
          image: "/images/cards/grow.jpg",
          tagline: "Unified customer identity graph, automated campaign orchestration, and loyalty wallets",
          items: [
            { num: "01", label: "Real-Time Customer Identity Graph Resolution" },
            { num: "02", label: "Omnichannel Loyalty Points & Tier Engine" },
            { num: "03", label: "Automated Abandoned Cart Recovery Sequences" },
            { num: "04", label: "Personalized Dynamic Coupon & Promotion Rules" },
            { num: "05", label: "Subscription Recurring Billing & Churn Defense" },
            { num: "06", label: "GDPR / CCPA Customer Data Consent Portals" },
          ],
        },
      ],
    },
    action: {
      heading: "Peak throughput without performance degradation",
      subtext: "Delivering scale and conversion for high-volume retail and e-commerce leaders.",
      cases: [
        {
          id: "black-friday-scale",
          tag: "HEADLESS COMMERCE · NOVA CASE",
          title: "Sustaining 140,000 req/sec during Black Friday with 0 downtime",
          synopsis:
            "Architected an edge-cached Next.js + Cloudflare Workers headless storefront connected to Shopify Plus backend. During Cyber Week peak, the platform sustained 140K requests/second with 100% uptime and sub-600ms page loads.",
          stat: "140K req/sec peak · 100% uptime · $42M gross sales",
          image: "/images/cards/software.jpg",
        },
        {
          id: "omnichannel-inventory",
          tag: "INVENTORY DOMS · NOVA CASE",
          title: "Real-time inventory sync across 650 physical stores and web",
          synopsis:
            "Replaced a 4-hour batch inventory sync with an event-driven Kafka + Redis ledger connecting 650 retail store POS systems. Enabled accurate 2-hour BOPIS pickup across 180,000 SKUs.",
          stat: "650 stores synced · <2s update latency · +41% BOPIS orders",
          image: "/images/cards/build.jpg",
        },
        {
          id: "vector-search-lift",
          tag: "AI PERSONALIZATION · NOVA CASE",
          title: "Semantic search and real-time re-ranking lifting revenue by 28%",
          synopsis:
            "Implemented multimodal vector search with Qdrant and personalized intent models, replacing rigid keyword queries with conceptual discovery that cut zero-result searches by 92% and boosted basket size.",
          stat: "-92% zero-result queries · +28% revenue per search",
          image: "/images/cards/gen_ai_research.jpg",
        },
      ],
    },
    assurance: {
      heading: "Retail reliability & payment security",
      subtext: "Engineered to withstand flash-sales, DDoS attacks, and protect payment cardholder data.",
      pillars: [
        {
          iconName: "ShoppingCart",
          title: "PCI-DSS Level 1 Verified",
          badge: "PAYMENT PROTECTION",
          description: "Zero credit card data touches application servers; complete tokenized checkout with Stripe and Adyen.",
        },
        {
          iconName: "ShieldCheck",
          title: "DDoS & Bot Mitigation",
          badge: "TRAFFIC PROTECTION",
          description: "Automated Cloudflare Bot Management and CAPTCHA-less mitigation preventing scalper bot checkouts during limited drops.",
        },
        {
          iconName: "RefreshCw",
          title: "99.99% Peak Season SLA",
          badge: "AUTO-SCALING",
          description: "Elastic Kubernetes autoscaling capable of provisioning 1,000 container replicas in under 45 seconds during traffic spikes.",
        },
        {
          iconName: "Lock",
          title: "GDPR & CCPA Data Privacy",
          badge: "CONSUMER CONSENT",
          description: "Automated consumer data subject access requests (DSAR) and zero-cookie consent banners honoring global privacy laws.",
        },
        {
          iconName: "FileCheck2",
          title: "Continuous Cart Auditability",
          badge: "TRANSACTION INTEGRITY",
          description: "Deterministic order states, idempotent checkout APIs, and automated reconciliation eliminating duplicate charges.",
        },
        {
          iconName: "Cpu",
          title: "Sub-Second Global Edge CDN",
          badge: "PERFORMANCE",
          description: "Static and dynamic asset distribution across 280+ worldwide edge nodes delivering sub-800ms LCP on all continents.",
        },
      ],
    },
    ecosystem: {
      heading: "Modern commerce technology stack",
      subtext: "From edge-rendered storefronts and vector search to real-time inventory and headless checkout.",
      pipelineLabel: "Composable Commerce Architecture Flow",
      stackLayers: [
        { layer: "STOREFRONT", detail: "Next.js App Router, React 19, Tailwind CSS, Framer Motion, Edge Middleware" },
        { layer: "COMMERCE CORE", detail: "Shopify Plus, commercetools, Medusa, Stripe, Adyen, GraphQL Gateway" },
        { layer: "DISCOVERY & SEARCH", detail: "Qdrant Vector DB, Algolia, Pinecone, OpenAI Embeddings, Elasticsearch" },
        { layer: "INVENTORY & DOMS", detail: "Apache Kafka, Redis Cluster, PostgreSQL, SAP / Manhattan WMS Connectors" },
        { layer: "CDP & ENGAGEMENT", detail: "Klaviyo, PostHog, Segment, LaunchDarkly, Braze, Snowflake" },
      ],
      techsLabel: "Retail & Commerce Technologies",
      techs: [
        { name: "Next.js App Router", category: "Storefront" },
        { name: "Shopify Plus APIs", category: "Commerce Engine" },
        { name: "Stripe & Adyen", category: "Payment Rails" },
        { name: "Qdrant Vector DB", category: "Visual/Semantic Search" },
        { name: "Redis Cluster", category: "Real-Time Stock Cache" },
        { name: "Apache Kafka", category: "Order Routing" },
        { name: "Cloudflare Workers", category: "Edge Routing" },
        { name: "Sanity / Contentful", category: "Headless CMS" },
        { name: "PostHog CDP", category: "User Journey Analytics" },
        { name: "Tailwind CSS", category: "Design System" },
      ],
    },
    ctaSubtext: "Let's discuss your headless storefront re-architecture, omnichannel inventory sync, or conversion optimization.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 06. TECHNOLOGY & SOFTWARE PLATFORMS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    slug: "technology",
    number: "06 / TECHNOLOGY",
    name: "TECHNOLOGY",
    title: "Technology & software platforms",
    tagline: "DEVELOPER TOOLING · CLOUD PLATFORMS · API INFRASTRUCTURE",
    heroHeadline: "Technology & software platforms",
    heroDescription:
      "Engineering scalable multi-tenant SaaS platforms, high-throughput developer APIs, distributed microservices, and modern cloud ecosystems for high-growth tech companies.",
    illustrationSrc: "/images/cards/software.jpg",
    accent: "violet",
    relevantCapabilities: ["Software & Technology", "AI & Intelligence", "Cloud & Infrastructure", "Talent Solutions"],
    metrics: [
      { label: "API Availability", value: "99.995% SLA" },
      { label: "Multi-Tenant Isolation", value: "Row-Level & DB" },
      { label: "Deploy Velocity", value: "Continuous GitOps" },
      { label: "Developer Adoption", value: "Auto-Generated SDKs" },
    ],
    signals: {
      heading: "Platform technology now",
      subtext:
        "The shift from monolithic software to composable, API-first ecosystems with developer-first developer experiences.",
      items: [
        {
          metric: "8×",
          label: "API Platform Valuation Multiple",
          description:
            "Software companies with robust external developer ecosystems and public APIs trade at significant valuation premiums over closed systems.",
        },
        {
          metric: "40%",
          label: "Engineering Time on Tech Debt",
          description:
            "Fast-growing tech scale-ups spend 40% of sprint capacity maintaining brittle legacy systems without proper domain boundaries.",
        },
        {
          metric: "12min",
          label: "Zero-Touch Release Cadence",
          description:
            "Leading software platforms ship code to production multiple times daily via automated testing and blue-green deployments.",
        },
        {
          metric: "99.99%",
          label: "Global Multi-Tenant SLA",
          description:
            "Enterprise B2B buyers mandate strict four-nines uptime, SOC2 compliance, and dedicated data tenancy as table-stakes.",
        },
      ],
    },
    solutions: {
      heading: "Technology Platform Capabilities",
      subtext:
        "Full-lifecycle software engineering for SaaS scale-ups, cloud infrastructure providers, and enterprise tech organizations.",
      industryCategory: "Software Platforms",
      items: [
        {
          id: "saas-architecture",
          title: "Multi-Tenant SaaS Infrastructure",
          image: "/images/cards/software.jpg",
          tagline: "Tenant isolation, row-level security, metered usage billing, and enterprise SSO",
          items: [
            { num: "01", label: "Multi-Tenant Database Partitioning & RLS" },
            { num: "02", label: "SAML 2.0 / OIDC Enterprise Single Sign-On" },
            { num: "03", label: "Stripe Billing & Metered Usage Architecture" },
            { num: "04", label: "Granular Role-Based Access Control (RBAC)" },
            { num: "05", label: "Automated Tenant Provisioning & Sharding" },
            { num: "06", label: "SOC2 Audit Logging & Activity Streams" },
          ],
        },
        {
          id: "api-developer-platforms",
          title: "API Design & Developer Portals",
          image: "/images/cards/build.jpg",
          tagline: "REST/GraphQL/gRPC APIs, OpenAPI specs, auto-generated SDKs, and developer docs",
          items: [
            { num: "01", label: "High-Throughput API Gateway Architecture" },
            { num: "02", label: "OpenAPI 3.1 & Mintlify Developer Portals" },
            { num: "03", label: "Auto-Generated TypeScript / Python / Go SDKs" },
            { num: "04", label: "Webhook Delivery & Retry Queues (Svix)" },
            { num: "05", label: "Rate Limiting & Tiered API Monetization" },
            { num: "06", label: "GraphQL Schema Federation (Apollo Router)" },
          ],
        },
        {
          id: "distributed-backends",
          title: "Distributed Backend Microservices",
          image: "/images/cards/gen_ai_research.jpg",
          tagline: "Event-driven microservices, CQRS patterns, and distributed cache hierarchies",
          items: [
            { num: "01", label: "Event Sourcing & CQRS Architecture" },
            { num: "02", label: "Apache Kafka & RabbitMQ Event Brokers" },
            { num: "03", label: "Distributed Caching (Redis Cluster)" },
            { num: "04", label: "High-Performance Go & Rust Microservices" },
            { num: "05", label: "gRPC Inter-Service Communication" },
            { num: "06", label: "Database Sharding & Read Replica Topology" },
          ],
        },
        {
          id: "devops-gitops",
          title: "Cloud Native & GitOps Engineering",
          image: "/images/cards/grow.jpg",
          tagline: "Kubernetes cluster automation, Terraform IaC, and zero-downtime canary delivery",
          items: [
            { num: "01", label: "Production Kubernetes (EKS / GKE) Fleet Setup" },
            { num: "02", label: "ArgoCD & Flux GitOps Continuous Delivery" },
            { num: "03", label: "Terraform & Pulumi Infrastructure as Code" },
            { num: "04", label: "OpenTelemetry Tracing & Prometheus SRE" },
            { num: "05", label: "Canary & Blue-Green Zero-Downtime Releases" },
            { num: "06", label: "Chaos Engineering & Automated Runbooks" },
          ],
        },
      ],
    },
    action: {
      heading: "Scalable software systems operating in production",
      subtext: "Engineering high-throughput platforms that scale seamlessly with exponential user growth.",
      cases: [
        {
          id: "api-gateway-scale",
          tag: "API PLATFORM · NOVA CASE",
          title: "Building an API platform handling 850M monthly requests",
          synopsis:
            "Designed a distributed GraphQL + REST API gateway in Go with distributed Redis rate limiting and auto-generated multi-language SDKs, serving 850M monthly calls at <45ms P99 latency.",
          stat: "850M req/month · <45ms P99 · 99.995% uptime",
          image: "/images/cards/software.jpg",
        },
        {
          id: "saas-migration",
          tag: "SAAS ARCHITECTURE · NOVA CASE",
          title: "Migrating a legacy SaaS to multi-tenant isolation in 14 weeks",
          synopsis:
            "Re-architected single-tenant customer silos into a horizontally scalable multi-tenant Postgres with row-level security and automated enterprise SAML SSO, slashing monthly infrastructure costs by 52%.",
          stat: "14-week migration · 52% cost savings · 0 tenant leaks",
          image: "/images/cards/build.jpg",
        },
        {
          id: "gitops-pipeline",
          tag: "GITOPS · NOVA CASE",
          title: "Shrinking release cycles from 2 weeks to 18 deployments per day",
          synopsis:
            "Introduced an automated ArgoCD GitOps pipeline with Playwright end-to-end testing gates and ephemeral pull-request preview environments, accelerating feature release velocity by 6×.",
          stat: "18 deploys/day · 6× feature velocity · 0 rollbacks",
          image: "/images/cards/grow.jpg",
        },
      ],
    },
    assurance: {
      heading: "Enterprise trust & software security",
      subtext: "Engineered to satisfy stringent enterprise procurement and security audits.",
      pillars: [
        {
          iconName: "Server",
          title: "SOC 2 Type II Certified Stack",
          badge: "ENTERPRISE READY",
          description: "Automated evidence collection, continuous static code analysis (SAST), and secret scanning in all CI/CD pipelines.",
        },
        {
          iconName: "ShieldCheck",
          title: "Multi-Tenant Data Isolation",
          badge: "TENANT PRIVACY",
          description: "Strict database row-level security and per-tenant cryptographic keys preventing cross-tenant data bleed.",
        },
        {
          iconName: "Lock",
          title: "Enterprise SSO & SCIM 2.0",
          badge: "IDENTITY & ACCESS",
          description: "Turnkey Okta, Azure AD, and Google Workspace SAML/OIDC integration with automated user provisioning.",
        },
        {
          iconName: "RefreshCw",
          title: "99.99% Global Uptime SLA",
          badge: "RELIABILITY",
          description: "Active-active multi-region cloud deployments with automated health checks and instant DNS failover.",
        },
        {
          iconName: "FileCheck2",
          title: "Immutable Audit Trails",
          badge: "GOVERNANCE",
          description: "Granular audit logs recording every API mutation, admin action, and access request for compliance reviews.",
        },
        {
          iconName: "Cpu",
          title: "Zero-Downtime Rolling Updates",
          badge: "DEPLOYMENT SAFETY",
          description: "Automated canary deployments with automatic error-budget rollbacks ensuring zero customer-facing downtime.",
        },
      ],
    },
    ecosystem: {
      heading: "Technology platform engineering stack",
      subtext: "From TypeScript and Go microservices to Kubernetes clusters and developer portals.",
      pipelineLabel: "Platform Architecture & CI/CD Pipeline",
      stackLayers: [
        { layer: "DEVELOPER APIS", detail: "OpenAPI 3.1, GraphQL Federation, gRPC, TypeScript SDKs, Mintlify" },
        { layer: "RUNTIME ENGINES", detail: "Go, Rust, Node.js (Fastify), Python (FastAPI), Bun" },
        { layer: "DATA & STORAGE", detail: "PostgreSQL with RLS, Redis Cluster, ClickHouse, Apache Kafka" },
        { layer: "CLOUD & GITOPS", detail: "Kubernetes (EKS/GKE), Terraform, ArgoCD, Docker, Helm" },
        { layer: "OBSERVABILITY", detail: "OpenTelemetry, Grafana, Prometheus, Datadog, Sentry" },
      ],
      techsLabel: "Software & Technology Stacks",
      techs: [
        { name: "TypeScript & React 19", category: "Frontend" },
        { name: "Go & Rust", category: "High-Perf Backend" },
        { name: "PostgreSQL with RLS", category: "Multi-Tenant DB" },
        { name: "Apache Kafka", category: "Event Bus" },
        { name: "Kubernetes & EKS", category: "Container Platform" },
        { name: "ArgoCD", category: "GitOps Delivery" },
        { name: "Terraform", category: "Infrastructure as Code" },
        { name: "OpenTelemetry", category: "Distributed Tracing" },
        { name: "Stripe Billing", category: "Monetization" },
        { name: "HashiCorp Vault", category: "Secrets Engine" },
      ],
    },
    ctaSubtext: "Let's discuss your multi-tenant architecture, developer API platform, or cloud engineering roadmap.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 07. ENERGY & SMART UTILITIES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    slug: "energy",
    number: "07 / ENERGY",
    name: "ENERGY",
    title: "Energy & smart utilities",
    tagline: "SMART GRIDS · RENEWABLE TELEMETRY · ASSET OPTIMIZATION",
    heroHeadline: "Energy & smart utilities",
    heroDescription:
      "Engineering real-time grid telemetry systems, renewable generation forecasting models, and distributed energy resource management platforms (DERMS).",
    illustrationSrc: "/images/cards/gen_ai_research.jpg",
    accent: "teal",
    relevantCapabilities: ["Cloud & Infrastructure", "Data & Analytics", "Automation", "AI & Intelligence"],
    metrics: [
      { label: "Grid Telemetry Ingest", value: "2M+ samples/sec" },
      { label: "Solar/Wind Forecast", value: "96.8% Accuracy" },
      { label: "Substation Failover", value: "< 200ms Switch" },
      { label: "Regulatory Standard", value: "NERC CIP Ready" },
    ],
    signals: {
      heading: "Energy transition technology",
      subtext:
        "From centralized fossil fuel generation to distributed renewable micro-grids requiring sub-second telemetry and AI dispatch.",
      items: [
        {
          metric: "4×",
          label: "Renewable Grid Volatility",
          description:
            "Solar and wind power introduce rapid supply fluctuations that require real-time algorithmic battery storage dispatch.",
        },
        {
          metric: "$30B",
          label: "Grid Congestion Costs",
          description:
            "Transmission constraints cost utilities $30B annually in curtailed renewable energy and emergency peaker plant activations.",
        },
        {
          metric: "100K+",
          label: "Distributed Energy Assets",
          description:
            "Modern utility grids manage millions of rooftop solar inverters, EV chargers, and residential battery storage nodes.",
        },
        {
          metric: "99.999%",
          label: "Critical Infrastructure SLA",
          description:
            "Grid operations and SCADA telemetry require strict zero-downtime reliability under all weather conditions.",
        },
      ],
    },
    solutions: {
      heading: "Energy & Utilities Capabilities",
      subtext:
        "High-assurance software systems for grid operators, renewable energy producers, and smart utility providers.",
      industryCategory: "Energy Systems",
      items: [
        {
          id: "grid-telemetry",
          title: "Smart Grid & SCADA Telemetry",
          image: "/images/cards/software.jpg",
          tagline: "IEC 61850 / DNP3 ingestion, phasor measurement units (PMU), and substation telemetry",
          items: [
            { num: "01", label: "IEC 60870-5-104 / DNP3 Gateway Integration" },
            { num: "02", label: "Phasor Measurement Unit (PMU) 60Hz Telemetry" },
            { num: "03", label: "Substation State Estimation & Topology Modeling" },
            { num: "04", label: "Grid Outage Detection & Automated Fault Isolation" },
            { num: "05", label: "Advanced Metering Infrastructure (AMI) Headends" },
            { num: "06", label: "Time-Series Historical Data Lakehouse" },
          ],
        },
        {
          id: "renewable-forecasting",
          title: "Renewable Generation & Dispatch AI",
          image: "/images/cards/build.jpg",
          tagline: "Solar irradiance modeling, wind farm yield prediction, and battery energy storage dispatch",
          items: [
            { num: "01", label: "Day-Ahead & Intraday Solar Yield Forecasting" },
            { num: "02", label: "Wind Turbine Wake & Generation ML Models" },
            { num: "03", label: "Battery Energy Storage System (BESS) Arbitrage" },
            { num: "04", label: "Wholesale Electricity Market Price Prediction" },
            { num: "05", label: "Dynamic Line Rating (DLR) Sensor Integration" },
            { num: "06", label: "Carbon Accounting & Guarantees of Origin (GoO)" },
          ],
        },
        {
          id: "derms-vpp",
          title: "Virtual Power Plants & DERMS",
          image: "/images/cards/gen_ai_research.jpg",
          tagline: "Aggregating distributed solar, commercial batteries, and EV fleets into flexible grid reserves",
          items: [
            { num: "01", label: "Virtual Power Plant (VPP) Aggregation Engine" },
            { num: "02", label: "OpenADR 2.0b Demand Response Automation" },
            { num: "03", label: "IEEE 2030.5 Smart Inverter Protocol Support" },
            { num: "04", label: "Fleet EV Depot Peak Shaving Optimization" },
            { num: "05", label: "Microgrid Islanding & Black-Start Coordination" },
            { num: "06", label: "Peer-to-Peer Energy Trading Clearing" },
          ],
        },
        {
          id: "asset-health",
          title: "Industrial Utility Asset Health",
          image: "/images/cards/grow.jpg",
          tagline: "Transformer dissolved gas analysis, turbine vibration monitoring, and drone inspection AI",
          items: [
            { num: "01", label: "Transformer Dissolved Gas Analysis (DGA) ML" },
            { num: "02", label: "Wind Turbine Blade Defect Computer Vision" },
            { num: "03", label: "High-Voltage Transmission Line Thermal Scans" },
            { num: "04", label: "Substation Switchgear Predictive Maintenance" },
            { num: "05", label: "GIS Transmission Asset Spatial Mapping" },
            { num: "06", label: "Emergency Repair Crew Automated Dispatch" },
          ],
        },
      ],
    },
    action: {
      heading: "Engineering the digital energy transition",
      subtext: "Mission-critical software systems keeping power flowing reliably and efficiently.",
      cases: [
        {
          id: "vpp-dispatch",
          tag: "VIRTUAL POWER PLANT · NOVA CASE",
          title: "Orchestrating 250MW of distributed battery storage in real time",
          synopsis:
            "Engineered a real-time OpenADR VPP platform coordinating 14,000 residential batteries and 80 commercial BESS units, injecting 250MW into the grid within 4 seconds during emergency frequency events.",
          stat: "250MW flexible capacity · <4s response time · $6.2M market revenue",
          image: "/images/cards/software.jpg",
        },
        {
          id: "renewable-forecast-case",
          tag: "ENERGY AI · NOVA CASE",
          title: "Improving wind farm generation forecasting accuracy to 96.8%",
          synopsis:
            "Implemented deep learning models combining satellite weather forecasts, numerical weather predictions, and turbine anemometer telemetry across 850MW of offshore wind assets, cutting imbalance penalties by 43%.",
          stat: "850MW managed · 96.8% accuracy · -43% imbalance costs",
          image: "/images/cards/build.jpg",
        },
        {
          id: "grid-ami",
          tag: "SMART GRID · NOVA CASE",
          title: "Scalable smart meter telemetry processing for 2.8M utility customers",
          synopsis:
            "Constructed a cloud-native Kafka + ClickHouse AMI ingestion pipeline handling 15-minute interval reads for 2.8M electric and gas meters with automated theft detection and billing reconciliation.",
          stat: "2.8M smart meters · 270M daily reads · 0s pipeline lag",
          image: "/images/cards/grow.jpg",
        },
      ],
    },
    assurance: {
      heading: "Critical infrastructure security & reliability",
      subtext: "Engineered to satisfy strict NERC CIP and national grid cybersecurity mandates.",
      pillars: [
        {
          iconName: "Zap",
          title: "NERC CIP Compliance Ready",
          badge: "CRITICAL INFRASTRUCTURE",
          description: "Strict Electronic Security Perimeter (ESP) architecture and physical access audit logging.",
        },
        {
          iconName: "ShieldCheck",
          title: "Air-Gapped SCADA Isolation",
          badge: "NETWORK SEGREGATION",
          description: "Data diodes and unidirectional gateways isolating control networks from cloud analytics pipelines.",
        },
        {
          iconName: "RefreshCw",
          title: "Sub-Second Automatic Failover",
          badge: "HIGH AVAILABILITY",
          description: "Zero-data-loss active-active cloud and on-premise redundancy for real-time dispatch systems.",
        },
        {
          iconName: "Lock",
          title: "End-to-End Field Device PKI",
          badge: "DEVICE AUTHENTICATION",
          description: "Hardware cryptographic identity validation preventing rogue commands to inverters and substations.",
        },
        {
          iconName: "FileCheck2",
          title: "Tamper-Proof Energy Ledger",
          badge: "REGULATORY COMPLIANCE",
          description: "Cryptographically verified generation and consumption audit trails for renewable energy certification.",
        },
        {
          iconName: "Cpu",
          title: "Hard Real-Time Open Protocols",
          badge: "STANDARDS CONFORMANCE",
          description: "Certified conformance with IEC 61850, DNP3, OpenADR 2.0b, and IEEE 2030.5 standards.",
        },
      ],
    },
    ecosystem: {
      heading: "Energy & smart grid technology stack",
      subtext: "From field substation protocols to time-series streaming and renewable forecasting AI.",
      pipelineLabel: "Energy Grid Telemetry & Dispatch Architecture",
      stackLayers: [
        { layer: "FIELD PROTOCOLS", detail: "DNP3, IEC 60870-5-104, IEC 61850, OpenADR 2.0b, Modbus, IEEE 2030.5" },
        { layer: "STREAMING BROKER", detail: "Apache Kafka, EMQX Industrial MQTT, Apache Pulsar" },
        { layer: "TIME-SERIES STORAGE", detail: "ClickHouse, TimescaleDB, InfluxDB, Apache Iceberg Data Lake" },
        { layer: "FORECASTING & AI", detail: "PyTorch, XGBoost, Ray Distributed, Ray Serve, ONNX Runtime" },
        { layer: "DISPATCH & CONTROL", detail: "Web SCADA Dashboards, OpenADR Dispatchers, Mobile Field Apps" },
      ],
      techsLabel: "Energy & Utilities Technologies",
      techs: [
        { name: "OpenADR 2.0b", category: "Demand Response" },
        { name: "IEC 61850 / DNP3", category: "Substation Protocol" },
        { name: "ClickHouse", category: "Time-Series OLAP" },
        { name: "Apache Kafka", category: "Event Pipeline" },
        { name: "TimescaleDB", category: "Asset Database" },
        { name: "PyTorch & Ray", category: "Forecasting AI" },
        { name: "IEEE 2030.5", category: "Smart Inverters" },
        { name: "Grafana Enterprise", category: "Grid Telemetry" },
        { name: "Rust & C++", category: "Protocol Gateways" },
        { name: "AWS Energy Cloud", category: "Cloud Infrastructure" },
      ],
    },
    ctaSubtext: "Let's discuss your smart grid telemetry, virtual power plant (VPP) architecture, or renewable AI forecasting.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 08. EDUCATION & EDTECH
  // ─────────────────────────────────────────────────────────────────────────────
  {
    slug: "education",
    number: "08 / EDUCATION",
    name: "EDUCATION",
    title: "Education & adaptive learning",
    tagline: "EDTECH · ADAPTIVE LEARNING · SKILLS VERIFICATION",
    heroHeadline: "Education & adaptive learning",
    heroDescription:
      "Designing interactive challenge environments, intelligent code evaluation sandboxes, and verifiable skill credentialing platforms that bridge learning directly to industry execution.",
    illustrationSrc: "/images/cards/learn.jpg",
    accent: "purple",
    relevantCapabilities: ["Digital Products", "AI & Intelligence", "Talent Solutions", "Software & Technology"],
    metrics: [
      { label: "Interactive Code Run Rate", value: "< 250ms Sandbox" },
      { label: "Learner Retention Lift", value: "3.4× Interactive" },
      { label: "Credential Verification", value: "Cryptographic Proof" },
      { label: "Evaluation Concurrency", value: "50K+ Tests/min" },
    ],
    signals: {
      heading: "Education technology now",
      subtext:
        "The shift from passive video lectures to challenge-driven, verifiable active learning environments.",
      items: [
        {
          metric: "78%",
          label: "Video Course Drop-off",
          description:
            "Traditional MOOCs and passive video platforms experience massive abandonment compared to hands-on, terminal-integrated challenge sandboxes.",
        },
        {
          metric: "3.4×",
          label: "Speed to Job-Readiness",
          description:
            "Engineers trained on live production repositories with automated test feedback ramp to full contribution 3.4× faster than traditional bootcamps.",
        },
        {
          metric: "89%",
          label: "Skills-Based Hiring Demand",
          description:
            "Enterprise engineering leaders increasingly prioritize verified git commit track records over generic diplomas and multiple-choice certifications.",
        },
        {
          metric: "< 250ms",
          label: "Sandbox Execution Standard",
          description:
            "Learners require instantaneous browser-based compilation and unit testing feedback to maintain active cognitive flow states.",
        },
      ],
    },
    solutions: {
      heading: "Education & Learning Systems Capabilities",
      subtext:
        "High-concurrency learning architectures for universities, EdTech scale-ups, and corporate engineering academies.",
      industryCategory: "Education Systems",
      items: [
        {
          id: "interactive-sandboxes",
          title: "Browser Code Sandboxes & Labs",
          image: "/images/cards/software.jpg",
          tagline: "Ephemeral WebAssembly container sandboxes, live code execution, and automated test runners",
          items: [
            { num: "01", label: "WebAssembly / WebContainers In-Browser Linux" },
            { num: "02", label: "Ephemeral MicroVM Sandboxes (Firecracker)" },
            { num: "03", label: "Automated Unit Test Grading & Feedback Loops" },
            { num: "04", label: "Multi-Language Interactive Code Playgrounds" },
            { num: "05", label: "Real-Time Collaborative Pair Programming" },
            { num: "06", label: "Automated Plagiarism & LLM Code Attribution" },
          ],
        },
        {
          id: "adaptive-learning",
          title: "AI Tutoring & Adaptive Curriculum",
          image: "/images/cards/gen_ai_research.jpg",
          tagline: "Knowledge graph student modeling, automated hint synthesis, and spaced repetition engines",
          items: [
            { num: "01", label: "Personalized Socratic AI Coding Tutors" },
            { num: "02", label: "Knowledge Graph Concept Mastery Tracking" },
            { num: "03", label: "Dynamic Challenge Difficulty Auto-Tuning" },
            { num: "04", label: "Automated Code Review & PR Socratic Feedback" },
            { num: "05", label: "Spaced Repetition Flashcard & Quiz Loops" },
            { num: "06", label: "Diagnostic Pre-Assessment Skill Mapping" },
          ],
        },
        {
          id: "credentials-proof",
          title: "Verifiable Credentials & Portfolios",
          image: "/images/cards/build.jpg",
          tagline: "Cryptographic skill badges, GitHub commit verification, and talent discovery engines",
          items: [
            { num: "01", label: "W3C Verifiable Credentials & Open Badges 3.0" },
            { num: "02", label: "Verified Git Commit & PR Portfolio Engine" },
            { num: "03", label: "Employer Talent Search & Skill Indexing" },
            { num: "04", label: "Proctored Skill Assessment Environments" },
            { num: "05", label: "Direct Employer Hiring Matchmaking Rails" },
            { num: "06", label: "Institutional Transcript & Course Export APIs" },
          ],
        },
        {
          id: "lms-architecture",
          title: "Modern LMS & Video Streaming",
          image: "/images/cards/grow.jpg",
          tagline: "Sub-second video delivery, discussion graphs, and cohort community architecture",
          items: [
            { num: "01", label: "Adaptive HLS Video Streaming Infrastructure" },
            { num: "02", label: "Interactive Timestamped Note Taking" },
            { num: "03", label: "Real-Time Cohort Discord / Slack Bridges" },
            { num: "04", label: "Multi-Tenant University LMS Integrations (LTI 1.3)" },
            { num: "05", label: "SCORM / xAPI Telemetry Data Ingestion" },
            { num: "06", label: "Global CDN Content Edge Caching" },
          ],
        },
      ],
    },
    action: {
      heading: "Scalable learning platforms in production",
      subtext: "Empowering hundreds of thousands of active builders to master modern engineering.",
      cases: [
        {
          id: "sandbox-scale",
          tag: "INTERACTIVE SANDBOX · NOVA CASE",
          title: "Executing 1.2M browser code tests daily with sub-300ms feedback",
          synopsis:
            "Engineered an ephemeral WebAssembly + Firecracker sandbox cluster supporting 40+ programming languages. The platform executes 1.2M daily automated unit tests with sub-300ms evaluation latency.",
          stat: "1.2M daily runs · <300ms latency · 0 server escape exploits",
          image: "/images/cards/software.jpg",
        },
        {
          id: "ai-tutor",
          tag: "ADAPTIVE AI · NOVA CASE",
          title: "Socratic AI code tutor lifting challenge completion from 41% to 84%",
          synopsis:
            "Designed a custom fine-tuned LLM tutor that never gives direct solutions, but provides targeted Socratic debugging hints based on AST error node analysis, doubling student course completion rates.",
          stat: "41% → 84% completion · 4.9/5 student rating · 65K students",
          image: "/images/cards/gen_ai_research.jpg",
        },
        {
          id: "credentials-hire",
          tag: "TALENT MATCHING · NOVA CASE",
          title: "Direct talent matching placing 400+ verified engineers",
          synopsis:
            "Built a verified skills portfolio pipeline translating student GitHub PRs and code benchmark scores directly into vetted candidate profiles for partner engineering teams.",
          stat: "400+ hires · 18 days time-to-offer · 94% retention",
          image: "/images/cards/build.jpg",
        },
      ],
    },
    assurance: {
      heading: "Education data privacy & student protection",
      subtext: "Engineered to satisfy FERPA, COPPA, and global student privacy frameworks.",
      pillars: [
        {
          iconName: "ShieldCheck",
          title: "FERPA & COPPA Compliant",
          badge: "STUDENT PRIVACY",
          description: "Strict privacy safeguards ensuring student educational records and minor data remain protected and unshared.",
        },
        {
          iconName: "Lock",
          title: "Isolated Sandbox Security",
          badge: "SECURE RUNTIME",
          description: "gVisor and Firecracker microVM containment preventing arbitrary code execution exploits or network probing.",
        },
        {
          iconName: "FileCheck2",
          title: "LTI 1.3 Advantage Certified",
          badge: "INTEROPERABILITY",
          description: "Seamless single sign-on and grade passback integration with Canvas, Blackboard, and Moodle university LMS systems.",
        },
        {
          iconName: "RefreshCw",
          title: "99.95% Exam Uptime SLA",
          badge: "EXAM RELIABILITY",
          description: "High-concurrency exam proctoring clusters engineered to handle simultaneous semester finals traffic surges.",
        },
        {
          iconName: "KeyRound",
          title: "Cryptographic Credential Proofs",
          badge: "VERIFIABLE BADGES",
          description: "Ed25519 digitally signed skill certificates that employers can instantly verify without contacting issuer registrars.",
        },
        {
          iconName: "Cpu",
          title: "Accessible WCAG 2.1 AA Design",
          badge: "INCLUSIVE ACCESS",
          description: "Full keyboard navigation, screen reader compatibility, and high-contrast color palettes adhering to global accessibility.",
        },
      ],
    },
    ecosystem: {
      heading: "EdTech & learning platform technology stack",
      subtext: "From browser WebAssembly runtimes and Firecracker microVMs to LTI 1.3 and AI tutor models.",
      pipelineLabel: "Learning Execution & Evaluation Flow",
      stackLayers: [
        { layer: "LEARNER INTERFACE", detail: "Next.js App Router, Monaco Editor, Xterm.js Terminal, WebAssembly" },
        { layer: "EVALUATION ENGINE", detail: "Firecracker MicroVMs, gVisor, Docker on Kubernetes, Redis Queues" },
        { layer: "ADAPTIVE AI", detail: "OpenAI GPT-4o, Claude 3.5, LangGraph Tutors, Vector Embeddings" },
        { layer: "DATA & CREDENTIALS", detail: "PostgreSQL, W3C Verifiable Credentials, OpenBadges 3.0, Prisma" },
        { layer: "LMS & INTEGRATION", detail: "LTI 1.3 Advantage, SCORM / xAPI, Mux Video Streaming, Webhooks" },
      ],
      techsLabel: "Education & EdTech Technologies",
      techs: [
        { name: "Monaco Editor & Xterm", category: "In-Browser IDE" },
        { name: "WebAssembly (Wasm)", category: "Browser Runtime" },
        { name: "Firecracker MicroVMs", category: "Secure Sandbox" },
        { name: "LTI 1.3 Advantage", category: "University Standard" },
        { name: "Mux Video", category: "Low-Latency Stream" },
        { name: "Next.js App Router", category: "LMS Frontend" },
        { name: "PostgreSQL", category: "Progress State" },
        { name: "LangGraph", category: "AI Socratic Tutor" },
        { name: "OpenBadges 3.0", category: "Verifiable Credential" },
        { name: "Redis", category: "Job Queue" },
      ],
    },
    ctaSubtext: "Let's discuss your interactive coding sandbox, AI tutoring system, or skills verification platform.",
  },
];

export function getIndustryBySlug(slug: string): IndustryData | undefined {
  // Support aliases
  const normalized = slug === "technology-software" ? "technology" : slug === "retail-consumer" ? "retail-commerce" : slug;
  return INDUSTRIES.find((ind) => ind.slug === normalized || ind.slug === slug);
}
