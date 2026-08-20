export interface CapabilityService {
  number: string;
  title: string;
  shortExplanation: string;
  keyTechnologies: string[];
  typicalOutcomes: string;
}

export interface CapabilityActionItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  layout: "featured" | "horizontal" | "split" | "compact";
  tag: string;
}

export interface CapabilityProcessStep {
  number: string;
  title: string;
  tagline: string;
  description: string;
}

export interface TechCategory {
  id: string;
  category: string;
  items: string[];
  relationships: string[];
}

export interface RelatedInsight {
  number: string;
  title: string;
  readTime: string;
  category: string;
  href: string;
}

export interface CapabilityData {
  slug: string;
  number: string;
  title: string;
  tagline: string;
  heroHeadline: string;
  heroDescription: string;
  shortDescription: string;
  stackSteps: {
    layer: string;
    description: string;
    detail: string;
  }[];
  services: CapabilityService[];
  actionItems: CapabilityActionItem[];
  outcomes: {
    headline: string;
    description: string;
  }[];
  process: CapabilityProcessStep[];
  techCategories: TechCategory[];
  insights: RelatedInsight[];
}

export const CAPABILITIES: CapabilityData[] = [
  {
    slug: "ai-intelligence",
    number: "01",
    title: "AI & DATA",
    tagline: "Intelligence and data, working together.",
    heroHeadline: "AI and data",
    heroDescription:
      "Intelligence starts with the right data. NOVA combines AI, advanced analytics, and intelligent systems to help organizations turn information into decisions, automate complexity, and build what comes next.",
    shortDescription:
      "Move beyond static software with autonomous workflows, custom fine-tuned models, and self-verifying agent loops engineered for reliability and scale.",
    stackSteps: [
      {
        layer: "DATA",
        description: "Vector stores, distributed telemetry & feature stores",
        detail: "Curating high-signal context, embeddings, and streaming ingestion for model grounding.",
      },
      {
        layer: "MODELS",
        description: "Foundational LLMs, small language models & custom fine-tunes",
        detail: "Selecting and adapting domain-specific architectures with low-latency inference.",
      },
      {
        layer: "INTELLIGENCE",
        description: "Reasoning chains, retrieval augmentation & guardrails",
        detail: "Structured prompt workflows, memory graphs, and deterministic validation layers.",
      },
      {
        layer: "AGENTS",
        description: "Autonomous planning, tool calling & multi-agent coordination",
        detail: "Self-correcting agent swarms executing multi-step operations with human-in-the-loop oversight.",
      },
      {
        layer: "APPLICATIONS",
        description: "Edge interfaces, real-time APIs & ambient digital products",
        detail: "Low-latency user experiences that integrate intelligent decisioning directly into daily workflows.",
      },
      {
        layer: "OUTCOMES",
        description: "Operational velocity, automated accuracy & adaptive capability",
        detail: "Measurable efficiency improvements and continuous organizational intelligence evolution.",
      },
    ],
    services: [
      {
        number: "01",
        title: "AI ENGINEERING",
        shortExplanation:
          "Architecting end-to-end production AI infrastructure, high-throughput model serving pipelines, and continuous evaluation harnesses.",
        keyTechnologies: ["PyTorch", "vLLM", "Triton", "Ray Distributed", "LangSmith"],
        typicalOutcomes: "Sub-100ms inference latency, zero-downtime model deployments, and deterministic unit-testing for non-deterministic model outputs.",
      },
      {
        number: "02",
        title: "GENERATIVE AI",
        shortExplanation:
          "Developing enterprise Retrieval-Augmented Generation (RAG) systems, contextual copilot interfaces, and domain-grounded synthesis engines.",
        keyTechnologies: ["Claude 3.5", "GPT-4o", "Llama 3", "Qdrant", "ChromaDB"],
        typicalOutcomes: "Factually grounded document intelligence, eliminated hallucination risks, and high-adoption contextual assistants.",
      },
      {
        number: "03",
        title: "AI AGENTS",
        shortExplanation:
          "Autonomous agent frameworks capable of multi-step task decomposition, external tool invocation, and iterative error correction.",
        keyTechnologies: ["LangGraph", "AutoGen", "CrewAI", "Function Calling", "Semantic Kernel"],
        typicalOutcomes: "Automated triage loops, multi-agent code analysis, and autonomous operational execution without manual intervention.",
      },
      {
        number: "04",
        title: "MACHINE LEARNING",
        shortExplanation:
          "Designing statistical predictive models, anomaly detection systems, and high-dimensional classification pipelines for enterprise data.",
        keyTechnologies: ["Scikit-Learn", "XGBoost", "LightGBM", "TensorFlow", "MLflow"],
        typicalOutcomes: "Early defect detection, real-time risk scoring, and precise operational forecasting.",
      },
      {
        number: "05",
        title: "COMPUTER VISION",
        shortExplanation:
          "Visual inspection models, real-time object tracking, spatial comprehension, and document OCR systems running at the edge.",
        keyTechnologies: ["YOLOv10", "OpenCV", "SAM 2", "TensorRT", "Edge TPU"],
        typicalOutcomes: "Automated quality inspection, zero-latency visual validation, and high-accuracy document digitisation.",
      },
      {
        number: "06",
        title: "NLP & LANGUAGE SYSTEMS",
        shortExplanation:
          "High-throughput text classification, entity extraction, semantic search, and multilingual translation infrastructure.",
        keyTechnologies: ["Hugging Face", "spaCy", "BGE Embeddings", "FastText", "Sentence-Transformers"],
        typicalOutcomes: "Unified cross-lingual search, automated categorization of unstructured support queues, and semantic clustering.",
      },
    ],
    actionItems: [
      {
        id: "autonomous-ops",
        tag: "AUTONOMOUS OPERATIONS",
        title: "Systems that monitor, reason, and autonomously remediate.",
        subtitle: "Zero-touch operational loops engineered for 24/7 cloud stability.",
        description:
          "Deploying self-healing observability agents that detect latency spikes, isolate root-cause commits, and safely execute rollout rollbacks before customer impact occurs.",
        layout: "featured",
      },
      {
        id: "intelligent-products",
        tag: "INTELLIGENT PRODUCTS",
        title: "Software that adapts to user intent in real time.",
        subtitle: "Contextual software interfaces that anticipate needs.",
        description:
          "Embedding lightweight reasoning models directly on the client edge to personalize navigation paths, synthesize complex summaries, and predict workflow actions.",
        layout: "horizontal",
      },
      {
        id: "decision-systems",
        tag: "DECISION SYSTEMS",
        title: "Data + AI infrastructure for high-conviction leadership.",
        subtitle: "Multi-modal intelligence unifying fragmented telemetry.",
        description:
          "Unifying cross-functional enterprise metrics into an interactive semantic querying canvas that surfaces key drivers and scenario forecasts.",
        layout: "split",
      },
      {
        id: "adaptive-agents",
        tag: "AI AGENT SWARMS",
        title: "Coordinated agent swarms executing multi-system engineering.",
        subtitle: "Task decomposition across autonomous specialized roles.",
        description:
          "Specialized agent networks that collaborate across code analysis, security auditing, documentation synthesis, and deployment verification.",
        layout: "compact",
      },
    ],
    outcomes: [
      {
        headline: "FASTER DECISIONS",
        description: "Transform raw distributed data streams into actionable intelligence in seconds rather than days.",
      },
      {
        headline: "LOWER MANUAL WORK",
        description: "Automate repetitive triage, data verification, and operational routing with deterministic reliability.",
      },
      {
        headline: "BETTER EXPERIENCES",
        description: "Provide users with ambient, context-aware digital products that adapt fluidly to their immediate needs.",
      },
      {
        headline: "MORE ADAPTIVE SYSTEMS",
        description: "Build software architecture that continuously learns from production feedback and evolves gracefully.",
      },
    ],
    process: [
      {
        number: "01",
        title: "DISCOVER",
        tagline: "Problem formulation & data readiness auditing",
        description:
          "We analyze your operational bottlenecks, assess proprietary dataset signal-to-noise ratios, and establish precise feasibility benchmarks.",
      },
      {
        number: "02",
        title: "DESIGN",
        tagline: "System architecture & model selection",
        description:
          "We design the optimal combination of foundation models, RAG vector pipelines, agent protocols, and deterministic validation guardrails.",
      },
      {
        number: "03",
        title: "BUILD",
        tagline: "Iterative engineering & evaluation harnesses",
        description:
          "We construct the complete solution alongside comprehensive evaluation suites to benchmark accuracy, latency, and cost per inference.",
      },
      {
        number: "04",
        title: "DEPLOY",
        tagline: "Edge and cloud orchestration with zero downtime",
        description:
          "We integrate the intelligent models into production microservices, CI/CD pipelines, and monitoring dashboards with strict observability.",
      },
      {
        number: "05",
        title: "EVOLVE",
        tagline: "Continuous learning & operational optimization",
        description:
          "We implement active-learning loops and telemetry feedback systems to continuously refine model performance as real-world demands grow.",
      },
    ],
    techCategories: [
      {
        id: "foundation-models",
        category: "FOUNDATION MODELS",
        items: ["Anthropic Claude 3.5", "OpenAI GPT-4o", "Meta Llama 3.1", "Mistral Large", "DeepSeek V3"],
        relationships: ["vector-systems", "agent-frameworks"],
      },
      {
        id: "cloud-infra",
        category: "CLOUD & ACCELERATION",
        items: ["AWS Bedrock", "Google Vertex AI", "Azure AI Foundry", "NVIDIA TensorRT-LLM", "Modal Labs"],
        relationships: ["mlops", "applications"],
      },
      {
        id: "data-telemetry",
        category: "DATA & STORAGE",
        items: ["Apache Kafka", "ClickHouse", "PostgreSQL pgvector", "Snowflake", "BigQuery"],
        relationships: ["vector-systems", "mlops"],
      },
      {
        id: "mlops-eval",
        category: "MLOPS & EVALUATION",
        items: ["LangSmith", "Weights & Biases", "Arize Phoenix", "MLflow", "Ragas"],
        relationships: ["foundation-models", "agent-frameworks"],
      },
      {
        id: "vector-systems",
        category: "VECTOR SYSTEMS",
        items: ["Qdrant", "Pinecone", "Milvus", "ChromaDB", "Weaviate"],
        relationships: ["data-telemetry", "foundation-models"],
      },
      {
        id: "agent-frameworks",
        category: "AGENT FRAMEWORKS",
        items: ["LangGraph", "CrewAI", "AutoGen", "Semantic Kernel", "LlamaIndex Workflows"],
        relationships: ["applications", "foundation-models"],
      },
      {
        id: "applications",
        category: "APPLICATIONS & UI",
        items: ["Next.js App Router", "Tailwind CSS", "React 19", "Framer Motion", "WebSocket Streaming"],
        relationships: ["agent-frameworks", "cloud-infra"],
      },
    ],
    insights: [
      {
        number: "01",
        title: "How AI is changing the way we architect distributed production systems.",
        readTime: "5 min read",
        category: "SYSTEMS ARCHITECTURE",
        href: "/what-we-think",
      },
      {
        number: "02",
        title: "The rise of autonomous agent swarms in enterprise DevOps pipelines.",
        readTime: "7 min read",
        category: "AGENTIC WORKFLOWS",
        href: "/what-we-think",
      },
      {
        number: "03",
        title: "Building production-ready Generative AI: Avoiding the prototype trap.",
        readTime: "6 min read",
        category: "PRODUCTION AI",
        href: "/what-we-think",
      },
    ],
  },
  {
    slug: "cloud",
    number: "02",
    title: "CLOUD & INFRASTRUCTURE",
    tagline: "The foundation for scalable digital systems.",
    heroHeadline: "SCALE SYSTEMS\nWITH RESILIENT\nCLOUD NODES.",
    heroDescription:
      "Modern cloud architecture, serverless microservices, and distributed Kubernetes deployments built for high-throughput concurrency and zero-downtime reliability.",
    shortDescription:
      "High-performance cloud engineering, edge networks, and distributed infrastructure designed to support enterprise-grade software products at scale.",
    stackSteps: [],
    services: [],
    actionItems: [],
    outcomes: [],
    process: [],
    techCategories: [],
    insights: [],
  },
  {
    slug: "software-technology",
    number: "03",
    title: "SOFTWARE & TECHNOLOGY",
    tagline: "Engineering reliable systems from architecture to deployment.",
    heroHeadline: "ENGINEERED FOR\nPERFORMANCE,\nSCALE & SPEED.",
    heroDescription:
      "Full-lifecycle software engineering, distributed backend systems, low-latency microservices, and modern API architectures tailored for mission-critical operations.",
    shortDescription:
      "Robust software engineering covering backend microservices, resilient API gateways, and distributed cloud computing designed for enterprise velocity.",
    stackSteps: [],
    services: [],
    actionItems: [],
    outcomes: [],
    process: [],
    techCategories: [],
    insights: [],
  },
  {
    slug: "digital-products",
    number: "04",
    title: "DIGITAL PRODUCTS",
    tagline: "Products designed around real people and real outcomes.",
    heroHeadline: "DESIGNED FOR UTILITY.\nENGINEERED FOR\nRETENTION.",
    heroDescription:
      "User-centric product design, high-fidelity interfaces, design systems, and edge-native responsive web applications built to transform visitors into engaged power users.",
    shortDescription:
      "End-to-end digital product design and frontend engineering engineered around intuitive interactions, fluid micro-animations, and measurable conversion.",
    stackSteps: [],
    services: [],
    actionItems: [],
    outcomes: [],
    process: [],
    techCategories: [],
    insights: [],
  },
  {
    slug: "data-analytics",
    number: "05",
    title: "DATA & ANALYTICS",
    tagline: "Turning complex data into useful decisions.",
    heroHeadline: "HIGH-THROUGHPUT\nSTREAMING &\nDECISION DATA.",
    heroDescription:
      "Transforming fragmented telemetry into unified, real-time data warehouses, low-latency event streaming pipelines, and actionable executive decision canvases.",
    shortDescription:
      "Real-time data telemetry, streaming infrastructure, automated ETL pipelines, and high-performance analytical modeling for high-conviction decision making.",
    stackSteps: [],
    services: [],
    actionItems: [],
    outcomes: [],
    process: [],
    techCategories: [],
    insights: [],
  },
  {
    slug: "automation",
    number: "06",
    title: "AUTOMATION",
    tagline: "Removing repetitive work and accelerating operations.",
    heroHeadline: "ZERO-TOUCH\nOPERATIONS &\nCONTINUOUS CI/CD.",
    heroDescription:
      "Eliminating manual bottlenecks through self-verifying automation loops, infrastructure-as-code, and continuous release orchestration across enterprise stacks.",
    shortDescription:
      "Automated verification pipelines, self-healing deployment engines, and continuous integration protocols that eliminate operational friction.",
    stackSteps: [],
    services: [],
    actionItems: [],
    outcomes: [],
    process: [],
    techCategories: [],
    insights: [],
  },
  {
    slug: "talent-solutions",
    number: "07",
    title: "TALENT SOLUTIONS",
    tagline: "Connecting organizations with capable builders.",
    heroHeadline: "EMBEDDED BUILDERS.\nPROVEN COMMITS.\nFAST-TRACK HIRING.",
    heroDescription:
      "Connecting technology teams directly with proven engineers, agile squads, and resident builders with verified repository commits and live shipping capability.",
    shortDescription:
      "Direct integration of high-performing builder squads and mentored engineering talent directly into your production codebases to accelerate execution.",
    stackSteps: [],
    services: [],
    actionItems: [],
    outcomes: [],
    process: [],
    techCategories: [],
    insights: [],
  },
];
