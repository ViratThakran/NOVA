import {
  curriculumPlanSchema,
  type CurriculumPlan,
  type CurriculumMilestone,
  type InternshipDefinition,
} from "../schemas";

export const AI_ML_CURRICULUM_PLAN: CurriculumPlan = {
  internship_title: "AI/ML Engineering Intern",
  total_duration_weeks: 8,
  milestones: [
    {
      milestone_index: 0,
      title: "Data Ingestion & Preprocessing Pipeline",
      description: "Process real-world datasets, handle anomalies, engineer features, and build clean pipelines.",
      learning_objectives: [
        "Load and clean noisy datasets with Pandas and NumPy.",
        "Implement robust feature transformers and missing value imputers.",
        "Write automated unit tests verifying dataset consistency.",
      ],
      skills_focused: ["Python", "Pandas", "Data Cleaning", "Pytest"],
      target_difficulty: "beginner",
      estimated_duration_weeks: 2,
      prerequisites: [],
      expected_outcomes: [
        "Clean, reproducible data ingestion scripts",
        "Documented data dictionary and feature transformations",
      ],
      final_project_contribution: "Forms the foundational data pipeline feeding model training.",
    },
    {
      milestone_index: 1,
      title: "Model Development & Rigorous Evaluation",
      description: "Train classification and regression models, evaluate with standard metrics, and tune hyperparameters.",
      learning_objectives: [
        "Train baseline and ensemble models with Scikit-learn.",
        "Execute 5-fold cross-validation and hyperparameter tuning.",
        "Compute cross-validated ROC-AUC, precision, recall, and confusion matrix.",
      ],
      skills_focused: ["Python", "Scikit-learn", "Machine Learning", "Model Evaluation"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: 2,
      prerequisites: ["Data Ingestion & Preprocessing Pipeline"],
      expected_outcomes: [
        "Serialized model artifact (.joblib)",
        "Comprehensive model evaluation report with metrics",
      ],
      final_project_contribution: "Provides the core predictive model artifact for the prediction service.",
    },
    {
      milestone_index: 2,
      title: "REST API Inference Service",
      description: "Expose trained model predictions through high-performance FastAPI endpoints with input validation.",
      learning_objectives: [
        "Build FastAPI endpoints for real-time and batch model inference.",
        "Implement strict Pydantic payload validation and error schemas.",
        "Write asynchronous integration test suites with Pytest and HTTPX.",
      ],
      skills_focused: ["FastAPI", "Pydantic", "REST APIs", "Pytest"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: 2,
      prerequisites: ["Model Development & Rigorous Evaluation"],
      expected_outcomes: [
        "Tested FastAPI inference server",
        "Interactive Swagger/OpenAPI documentation",
      ],
      final_project_contribution: "Serves model predictions to external client applications via HTTP.",
    },
    {
      milestone_index: 3,
      title: "Containerization, Automated Testing & Deployment",
      description: "Containerize the inference service with Docker, implement test suites, and deploy.",
      learning_objectives: [
        "Package Python microservice with optimized multi-stage Dockerfile.",
        "Configure non-root security and container healthchecks.",
        "Write end-to-end integration tests and deployment runbooks.",
      ],
      skills_focused: ["Docker", "Python", "Deployment", "Git"],
      target_difficulty: "advanced",
      estimated_duration_weeks: 2,
      prerequisites: ["REST API Inference Service"],
      expected_outcomes: [
        "Production-ready Docker image configuration",
        "Complete capstone deployment and documentation",
      ],
      final_project_contribution: "Delivers the complete production-ready ML prediction service capstone.",
    },
  ],
  final_outcome:
    "Deploy a production-ready ML prediction service with automated preprocessing, validated API, and test suite.",
};

export const FULLSTACK_CURRICULUM_PLAN: CurriculumPlan = {
  internship_title: "Full-Stack Web Development Intern",
  total_duration_weeks: 8,
  milestones: [
    {
      milestone_index: 0,
      title: "Frontend Components & State Management",
      description: "Build accessible, responsive UI component libraries with TypeScript and state management.",
      learning_objectives: [
        "Develop reusable, accessible UI components with React and TypeScript.",
        "Manage application state with predictable unidirectional flow.",
      ],
      skills_focused: ["React", "TypeScript", "Tailwind CSS"],
      target_difficulty: "beginner",
      estimated_duration_weeks: 2,
      prerequisites: [],
      expected_outcomes: ["Type-safe component library", "Accessible, responsive interactive layouts"],
      final_project_contribution: "Builds the user interface layer of the full-stack portal.",
    },
    {
      milestone_index: 1,
      title: "Backend API Engineering & Data Modeling",
      description: "Architect secure REST APIs with PostgreSQL schema migrations and validation.",
      learning_objectives: [
        "Design normalized relational database schemas with migrations.",
        "Create validated REST endpoints with Zod.",
      ],
      skills_focused: ["Node.js", "PostgreSQL", "REST APIs", "Zod"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: 2,
      prerequisites: ["Frontend Components & State Management"],
      expected_outcomes: ["Validated backend route handlers", "Database migration scripts"],
      final_project_contribution: "Builds the data and API backend for the application.",
    },
    {
      milestone_index: 2,
      title: "Authentication, Authorization & Integration",
      description: "Implement JWT/session auth, RBAC permissions, and end-to-end frontend-backend integration.",
      learning_objectives: [
        "Implement secure session authentication flows.",
        "Enforce role-based access control policies.",
      ],
      skills_focused: ["Authentication", "Security", "Integration"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: 2,
      prerequisites: ["Backend API Engineering & Data Modeling"],
      expected_outcomes: ["Secure user authentication flow", "Role-gated dashboards"],
      final_project_contribution: "Secures user access across the full-stack platform.",
    },
    {
      milestone_index: 3,
      title: "Full-Stack Application Deployment & Testing",
      description: "Deliver the completed SaaS application with comprehensive E2E tests and production deployment.",
      learning_objectives: [
        "Write end-to-end integration tests using Playwright.",
        "Deploy full-stack web application with continuous delivery.",
      ],
      skills_focused: ["Playwright", "Docker", "Full-Stack Architecture"],
      target_difficulty: "advanced",
      estimated_duration_weeks: 2,
      prerequisites: ["Authentication, Authorization & Integration"],
      expected_outcomes: ["Passing E2E test suite", "Live production web application"],
      final_project_contribution: "Delivers the complete SaaS portal capstone project.",
    },
  ],
  final_outcome:
    "Deploy a full-stack SaaS platform with authentication, PostgreSQL database, responsive UI, and automated tests.",
};

export const CLOUD_DEVOPS_CURRICULUM_PLAN: CurriculumPlan = {
  internship_title: "Cloud & DevOps Engineering Intern",
  total_duration_weeks: 8,
  milestones: [
    {
      milestone_index: 0,
      title: "Infrastructure Fundamentals & Containerization",
      description: "Master container packaging and Dockerfile optimization for production microservices.",
      learning_objectives: [
        "Containerize services with multi-stage Dockerfiles and unprivileged non-root users.",
        "Configure local service orchestration with Docker Compose, volume mounts, and network bridges.",
      ],
      skills_focused: ["Docker", "Linux", "Container Security"],
      target_difficulty: "beginner",
      estimated_duration_weeks: 2,
      prerequisites: [],
      expected_outcomes: ["Optimized Docker images (<150MB)", "Working local docker-compose environment"],
      final_project_contribution: "Provides container packaging base for the final production cluster.",
    },
    {
      milestone_index: 1,
      title: "CI/CD Pipeline Automation & Quality Gates",
      description: "Build robust automated GitHub Actions workflows with linting, testing, and security scanning.",
      learning_objectives: [
        "Implement automated pull request validation and build workflows with GitHub Actions.",
        "Integrate static linting, unit test matrices, and container vulnerability scanning.",
      ],
      skills_focused: ["CI/CD", "GitHub Actions", "Security Scanning"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: 2,
      prerequisites: ["Infrastructure Fundamentals & Containerization"],
      expected_outcomes: ["Automated GitHub Actions CI/CD workflows", "Passing security and vulnerability scans"],
      final_project_contribution: "Automates continuous testing and delivery for the capstone service.",
    },
    {
      milestone_index: 2,
      title: "Kubernetes Orchestration & Observability",
      description: "Deploy scalable deployments, services, ingress, and Prometheus metrics monitoring.",
      learning_objectives: [
        "Write declarative Kubernetes manifests for deployments, configmaps, secrets, and ingress.",
        "Configure Prometheus metrics scraping and service health probes.",
      ],
      skills_focused: ["Kubernetes", "Prometheus", "Terraform"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: 2,
      prerequisites: ["CI/CD Pipeline Automation & Quality Gates"],
      expected_outcomes: ["Declarative Kubernetes deployment configs", "Prometheus metrics observability"],
      final_project_contribution: "Deploys the production infrastructure for the final project.",
    },
    {
      milestone_index: 3,
      title: "Production Release & Disaster Recovery",
      description: "Deploy the final resilient, auto-scaling infrastructure with disaster recovery playbooks.",
      learning_objectives: [
        "Implement rolling updates and automated rollback triggers on failure.",
        "Document disaster recovery playbooks and operational runbooks.",
      ],
      skills_focused: ["Kubernetes", "Cloud Architecture", "Reliability"],
      target_difficulty: "advanced",
      estimated_duration_weeks: 2,
      prerequisites: ["Kubernetes Orchestration & Observability"],
      expected_outcomes: ["Production deployment with 99.9% uptime validation", "Full DR runbook"],
      final_project_contribution: "Delivers the complete production-grade cloud deployment capstone.",
    },
  ],
  final_outcome:
    "Deploy a production-grade containerized microservice on Kubernetes with automated CI/CD and observability.",
};

export const DATA_ENGINEERING_CURRICULUM_PLAN: CurriculumPlan = {
  internship_title: "Data Engineering Intern",
  total_duration_weeks: 8,
  milestones: [
    {
      milestone_index: 0,
      title: "Data Ingestion & Multi-Source Extraction",
      description: "Extract, parse, and validate high-volume batch data from heterogeneous sources (CSV, JSON, REST APIs).",
      learning_objectives: [
        "Develop modular Python ingestion scripts with robust error handling.",
        "Implement schema validation and data integrity checks on raw payloads.",
      ],
      skills_focused: ["Python", "Pandas", "Data Cleaning"],
      target_difficulty: "beginner",
      estimated_duration_weeks: 2,
      prerequisites: [],
      expected_outcomes: ["Modular extraction scripts", "Validated raw data lake directory"],
      final_project_contribution: "Establishes reliable data extraction for downstream analytical tables.",
    },
    {
      milestone_index: 1,
      title: "Relational Modeling & Star Schema Data Warehousing",
      description: "Design normalized staging schemas and dimensional models (Fact and Dimension tables) in PostgreSQL.",
      learning_objectives: [
        "Design 3NF staging tables and dimensional star schemas.",
        "Implement DDL migrations, foreign key constraints, and indexing strategies.",
      ],
      skills_focused: ["SQL", "PostgreSQL", "Data Modeling"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: 2,
      prerequisites: ["Data Ingestion & Multi-Source Extraction"],
      expected_outcomes: ["PostgreSQL DDL schema migrations", "Dimensional model entity-relationship diagram"],
      final_project_contribution: "Provides the analytical database warehouse for reporting.",
    },
    {
      milestone_index: 2,
      title: "Batch Transformation & Quality Testing Pipeline",
      description: "Build robust SQL and Python transformation pipelines with automated data quality assertions.",
      learning_objectives: [
        "Write idempotent SQL transformations for fact and dimension population.",
        "Implement automated data quality testing with Great Expectations or Pytest.",
      ],
      skills_focused: ["SQL", "Python", "Data Quality"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: 2,
      prerequisites: ["Relational Modeling & Star Schema Data Warehousing"],
      expected_outcomes: ["Tested batch transformation pipeline", "Data quality test suite report"],
      final_project_contribution: "Transforms raw data into clean, queryable analytical tables.",
    },
    {
      milestone_index: 3,
      title: "Pipeline Orchestration & Automated Alerting",
      description: "Orchestrate recurring batch DAGs in Apache Airflow with automated failure retries and alerting.",
      learning_objectives: [
        "Author declarative Airflow DAGs with dependency task graphs.",
        "Configure automated retry policies, SLA monitoring, and failure alerts.",
      ],
      skills_focused: ["Airflow", "Python", "Orchestration"],
      target_difficulty: "advanced",
      estimated_duration_weeks: 2,
      prerequisites: ["Batch Transformation & Quality Testing Pipeline"],
      expected_outcomes: ["Production Airflow DAG definitions", "Automated monitoring and SLA alerts"],
      final_project_contribution: "Delivers the complete automated data platform pipeline capstone.",
    },
  ],
  final_outcome:
    "Automated data pipeline with database schemas, ETL transformations, and data quality test reports.",
};

export const CYBERSECURITY_CURRICULUM_PLAN: CurriculumPlan = {
  internship_title: "Cybersecurity Intern",
  total_duration_weeks: 8,
  milestones: [
    {
      milestone_index: 0,
      title: "Threat Modeling & Application Architecture Assessment",
      description: "Conduct comprehensive threat modeling on web architectures using the STRIDE methodology.",
      learning_objectives: [
        "Map system data flow diagrams and trust boundaries.",
        "Identify threat vectors across Spoofing, Tampering, Repudiation, Info Disclosure, DoS, and Elevation of Privilege.",
      ],
      skills_focused: ["Threat Modeling", "Security Architecture", "Linux"],
      target_difficulty: "beginner",
      estimated_duration_weeks: 2,
      prerequisites: [],
      expected_outcomes: ["STRIDE threat model documentation", "Data flow diagram with trust boundaries"],
      final_project_contribution: "Establishes the threat assessment baseline for all security countermeasures.",
    },
    {
      milestone_index: 1,
      title: "OWASP Top 10 Vulnerability Remediation",
      description: "Identify, exploit in sandbox, and patch critical OWASP vulnerabilities (SQLi, XSS, CSRF, IDOR).",
      learning_objectives: [
        "Detect and exploit SQL injection and cross-site scripting vulnerabilities.",
        "Implement parameterized queries, output sanitization, and CSRF token protections.",
      ],
      skills_focused: ["OWASP Top 10", "Python", "Security Testing"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: 2,
      prerequisites: ["Threat Modeling & Application Architecture Assessment"],
      expected_outcomes: ["Patched codebase eliminating OWASP vulnerabilities", "Regression security test suite"],
      final_project_contribution: "Hardens the application codebase against common attack vectors.",
    },
    {
      milestone_index: 2,
      title: "Automated SAST/DAST Security Scanning in CI/CD",
      description: "Integrate automated static and dynamic security scanning tools (Semgrep, OWASP ZAP, Trivy) into CI.",
      learning_objectives: [
        "Configure automated Semgrep rules for static vulnerability detection.",
        "Automate OWASP ZAP baseline DAST scans against staging APIs.",
      ],
      skills_focused: ["Vulnerability Scanning", "CI/CD", "Security Testing"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: 2,
      prerequisites: ["OWASP Top 10 Vulnerability Remediation"],
      expected_outcomes: ["Automated CI security scanning pipeline", "Vulnerability scan artifact reports"],
      final_project_contribution: "Enables continuous security compliance on every code change.",
    },
    {
      milestone_index: 3,
      title: "Penetration Testing, Cryptography & Audit Reporting",
      description: "Perform comprehensive security audit, enforce strong cryptography (bcrypt/argon2, TLS), and author executive reports.",
      learning_objectives: [
        "Implement secure cryptographic hashing and token signing.",
        "Conduct penetration testing and write executive risk mitigation audit reports.",
      ],
      skills_focused: ["Cryptography", "Security Auditing", "Incident Response"],
      target_difficulty: "advanced",
      estimated_duration_weeks: 2,
      prerequisites: ["Automated SAST/DAST Security Scanning in CI/CD"],
      expected_outcomes: ["Executive security audit report", "Cryptographically hardened authentication service"],
      final_project_contribution: "Delivers the complete verified security audit and remediation capstone.",
    },
  ],
  final_outcome:
    "A secured code repository with automated CI security scanning, regression security test suite, and published threat model audit report.",
};

export const UIUX_DESIGN_CURRICULUM_PLAN: CurriculumPlan = {
  internship_title: "UI/UX Design Intern",
  total_duration_weeks: 8,
  milestones: [
    {
      milestone_index: 0,
      title: "User Research Synthesis & Journey Mapping",
      description: "Conduct user interviews, synthesize qualitative data into personas, and map empathetic user journeys.",
      learning_objectives: [
        "Synthesize user interview transcripts into affinity maps and problem statements.",
        "Create primary and secondary user personas with concrete user journey maps.",
      ],
      skills_focused: ["User Research", "Information Architecture", "Empathy"],
      target_difficulty: "beginner",
      estimated_duration_weeks: 2,
      prerequisites: [],
      expected_outcomes: ["User research synthesis document", "User personas and journey maps"],
      final_project_contribution: "Grounds all subsequent UI design decisions in validated user needs.",
    },
    {
      milestone_index: 1,
      title: "Low-Fidelity Wireframing & Information Architecture",
      description: "Design responsive low-fidelity wireframe flows and define intuitive information architecture.",
      learning_objectives: [
        "Structure navigation hierarchies and page layouts with responsive breakpoints.",
        "Create clickable low-fidelity wireframes in Figma validating key task flows.",
      ],
      skills_focused: ["Wireframing", "Information Architecture", "Figma"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: 2,
      prerequisites: ["User Research Synthesis & Journey Mapping"],
      expected_outcomes: ["Responsive low-fidelity wireframes", "Information architecture site map"],
      final_project_contribution: "Provides structural blueprint for the high-fidelity design system.",
    },
    {
      milestone_index: 2,
      title: "Atomic Design System & Component Library",
      description: "Build an accessible, scalable design system in Figma with design tokens, auto-layout, and variants.",
      learning_objectives: [
        "Define typography scales, color palettes, and spacing tokens in Figma variables.",
        "Build reusable component variants (buttons, inputs, cards, dialogs) with Auto Layout.",
      ],
      skills_focused: ["Design Systems", "Figma", "Accessibility (WCAG)"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: 2,
      prerequisites: ["Low-Fidelity Wireframing & Information Architecture"],
      expected_outcomes: ["Figma design system library with tokens", "Documented component usage guidelines"],
      final_project_contribution: "Supplies the standardized UI library for the final interactive prototype.",
    },
    {
      milestone_index: 3,
      title: "High-Fidelity Interactive Prototyping & Usability Testing",
      description: "Develop interactive clickable prototypes with micro-interactions and conduct usability audits.",
      learning_objectives: [
        "Build realistic interactive prototypes with smart animations in Figma.",
        "Conduct usability testing sessions and evaluate WCAG 2.1 AA accessibility compliance.",
      ],
      skills_focused: ["Prototyping", "Usability Testing", "Accessibility (WCAG)"],
      target_difficulty: "advanced",
      estimated_duration_weeks: 2,
      prerequisites: ["Atomic Design System & Component Library"],
      expected_outcomes: ["Interactive clickable Figma prototype", "Usability testing and WCAG audit report"],
      final_project_contribution: "Delivers the complete product design and tested prototype capstone.",
    },
  ],
  final_outcome:
    "A complete Figma file with design system components, high-fidelity clickable prototype, user research documentation, and WCAG accessibility audit.",
};

export function generateCurriculumPlan(definition: InternshipDefinition): CurriculumPlan {
  const titleLower = definition.title.toLowerCase();
  if (titleLower.includes("ai") || titleLower.includes("machine learning") || titleLower.includes("data science")) {
    return AI_ML_CURRICULUM_PLAN;
  }
  if (titleLower.includes("full-stack") || titleLower.includes("fullstack") || titleLower.includes("web")) {
    return FULLSTACK_CURRICULUM_PLAN;
  }
  if (titleLower.includes("cloud") || titleLower.includes("devops") || titleLower.includes("infrastructure")) {
    return CLOUD_DEVOPS_CURRICULUM_PLAN;
  }
  if (titleLower.includes("data") && !titleLower.includes("science")) {
    return DATA_ENGINEERING_CURRICULUM_PLAN;
  }
  if (titleLower.includes("security") || titleLower.includes("cyber")) {
    return CYBERSECURITY_CURRICULUM_PLAN;
  }
  if (titleLower.includes("design") || titleLower.includes("ui") || titleLower.includes("ux")) {
    return UIUX_DESIGN_CURRICULUM_PLAN;
  }

  // Deterministic dynamic curriculum builder for custom definitions
  const totalWeeks = definition.duration_weeks || 8;
  const weeksPerMilestone = Math.max(1, Math.floor(totalWeeks / 4));
  const skills = definition.required_skills;
  const chunk = (arr: string[], i: number, total: number) => {
    const size = Math.ceil(arr.length / total);
    return arr.slice(i * size, (i + 1) * size);
  };

  const milestones: CurriculumMilestone[] = [
    {
      milestone_index: 0,
      title: `Foundations & Setup: ${definition.domain}`,
      description: `Establish core development environment, data pipelines, and project foundations for ${definition.title}.`,
      learning_objectives: definition.learning_objectives.slice(0, 2),
      skills_focused: chunk(skills, 0, 4).length > 0 ? chunk(skills, 0, 4) : [skills[0] || "Foundations"],
      target_difficulty: "beginner",
      estimated_duration_weeks: weeksPerMilestone,
      prerequisites: [],
      expected_outcomes: ["Structured project repository", "Configured developer environment"],
      final_project_contribution: "Provides initial foundational codebase.",
    },
    {
      milestone_index: 1,
      title: `Core Implementation & Business Logic`,
      description: `Implement primary domain logic, models, and processing components.`,
      learning_objectives: definition.learning_objectives.slice(1, 3),
      skills_focused: chunk(skills, 1, 4).length > 0 ? chunk(skills, 1, 4) : [skills[1] || skills[0] || "Core"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: weeksPerMilestone,
      prerequisites: [`Foundations & Setup: ${definition.domain}`],
      expected_outcomes: ["Working core domain modules", "Unit test suite"],
      final_project_contribution: "Builds the functional engine for the final project.",
    },
    {
      milestone_index: 2,
      title: `Integration & Service Interface`,
      description: `Connect modular components into a cohesive interface with rigorous validation.`,
      learning_objectives: definition.learning_objectives.slice(2, 4),
      skills_focused: chunk(skills, 2, 4).length > 0 ? chunk(skills, 2, 4) : [skills[2] || skills[0] || "Integration"],
      target_difficulty: "intermediate",
      estimated_duration_weeks: weeksPerMilestone,
      prerequisites: [`Core Implementation & Business Logic`],
      expected_outcomes: ["Validated service interfaces", "Integration test results"],
      final_project_contribution: "Enables service communication and data exchange.",
    },
    {
      milestone_index: 3,
      title: `Production Deployment & Capstone Delivery`,
      description: `Finalize the ${definition.final_project.title} with automated verification and deployment.`,
      learning_objectives: definition.learning_objectives.slice(3, 5),
      skills_focused: chunk(skills, 3, 4).length > 0 ? chunk(skills, 3, 4) : [skills[skills.length - 1] || "Deployment"],
      target_difficulty: "advanced",
      estimated_duration_weeks: weeksPerMilestone,
      prerequisites: [`Integration & Service Interface`],
      expected_outcomes: definition.final_project.key_deliverables,
      final_project_contribution: "Delivers the completed final project capstone.",
    },
  ];

  return curriculumPlanSchema.parse({
    internship_title: definition.title,
    total_duration_weeks: totalWeeks,
    milestones,
    final_outcome: definition.final_project.expected_outcome,
  });
}

export function getMilestoneByIndex(plan: CurriculumPlan, index: number): CurriculumMilestone | null {
  return plan.milestones.find((m) => m.milestone_index === index) ?? null;
}

export function getPrerequisiteMilestones(plan: CurriculumPlan, milestoneIndex: number): CurriculumMilestone[] {
  return plan.milestones.filter((m) => m.milestone_index < milestoneIndex);
}

export function calculateCurriculumProgress(
  plan: CurriculumPlan,
  currentMilestoneIndex: number,
  completedTasksCount: number,
  tasksPerMilestone = 2
): number {
  if (plan.milestones.length === 0) return 0;
  const totalEstimatedTasks = plan.milestones.length * tasksPerMilestone;
  const clampedCompleted = Math.min(completedTasksCount, totalEstimatedTasks);
  const percentage = Math.round((clampedCompleted / totalEstimatedTasks) * 100);
  return Math.min(100, Math.max(0, percentage));
}
