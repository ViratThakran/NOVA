import { internshipDefinitionSchema, type InternshipDefinition } from "../schemas";

export const AI_ML_INTERNSHIP_DEFINITION: InternshipDefinition = {
  title: "AI/ML Engineering Intern",
  duration_weeks: 8,
  difficulty: "beginner_to_intermediate",
  domain: "Education Technology & Machine Learning",
  required_skills: [
    "Python",
    "Machine Learning",
    "Data Analysis",
    "Pandas",
    "Scikit-learn",
    "REST APIs",
    "FastAPI",
    "Pytest",
    "Docker",
    "Git",
  ],
  tools: ["Python", "Pandas", "Scikit-learn", "FastAPI", "Pytest", "Docker", "Git"],
  learning_objectives: [
    "Process, clean, and engineer features from complex real-world datasets using Pandas and NumPy.",
    "Train, tune, and evaluate machine learning models using cross-validation and standard metrics.",
    "Expose ML models as low-latency, validated REST APIs using FastAPI and Pydantic.",
    "Implement comprehensive automated unit and integration tests using Pytest.",
    "Containerize and package the prediction service using Docker for cloud deployment.",
  ],
  final_project: {
    title: "Deploy an ML Prediction Microservice with Automated Pipeline and API",
    description:
      "End-to-end machine learning system that ingests raw telemetry data, transforms features, predicts student risk outcomes via a trained Scikit-learn model, and exposes validated REST endpoints packaged in Docker.",
    expected_outcome:
      "A production-ready GitHub repository with passing automated test suite, Docker container, and OpenAPI interactive documentation.",
    key_deliverables: [
      "Modular data preprocessing and feature transformation pipeline",
      "Model training, cross-validation, and serialized joblib artifact",
      "FastAPI web service with /predict and /health endpoints",
      "Pytest test suite achieving >= 80% coverage",
      "Optimized multi-stage Dockerfile and deployment documentation",
    ],
  },
  prerequisites: ["Basic Python syntax", "Fundamental linear algebra & statistics", "Basic Git workflow"],
};

export const FULLSTACK_INTERNSHIP_DEFINITION: InternshipDefinition = {
  title: "Full-Stack Web Development Intern",
  duration_weeks: 8,
  difficulty: "beginner_to_intermediate",
  domain: "SaaS & Web Applications",
  required_skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Tailwind CSS",
    "Node.js",
    "PostgreSQL",
    "REST APIs",
    "Authentication",
    "Playwright",
    "Git",
  ],
  tools: ["TypeScript", "React", "Next.js", "Tailwind CSS", "PostgreSQL", "Supabase", "Git"],
  learning_objectives: [
    "Build modular, responsive, accessible UI component libraries with TypeScript and Tailwind CSS.",
    "Design relational database schemas and implement secure backend API routes.",
    "Implement session-based/JWT authentication and role-based access control.",
    "Write comprehensive unit and end-to-end test suites.",
    "Deploy full-stack web applications with continuous integration.",
  ],
  final_project: {
    title: "Production Full-Stack SaaS Portal with Auth, Database & Analytics",
    description:
      "A complete web application featuring secure user onboarding, role-gated dashboards, relational database storage, and responsive UI components.",
    expected_outcome:
      "A deployed web application with secure authentication, PostgreSQL database, responsive dashboard, and automated tests.",
    key_deliverables: [
      "Type-safe UI component library with responsive design",
      "Secure backend REST/Server Action endpoints with Zod validation",
      "PostgreSQL schema migrations and seed scripts",
      "End-to-end automated test suite",
      "Production deployment documentation",
    ],
  },
  prerequisites: ["HTML/CSS fundamentals", "Basic JavaScript/TypeScript", "Basic Git"],
};

export const CLOUD_DEVOPS_INTERNSHIP_DEFINITION: InternshipDefinition = {
  title: "Cloud & DevOps Engineering Intern",
  duration_weeks: 8,
  difficulty: "intermediate",
  domain: "Cloud Infrastructure & Platform Engineering",
  required_skills: [
    "Linux",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "GitHub Actions",
    "Terraform",
    "Prometheus",
    "Shell Scripting",
    "Git",
  ],
  tools: ["Docker", "Kubernetes", "GitHub Actions", "Terraform", "Linux", "Prometheus", "Git"],
  learning_objectives: [
    "Package microservices into secure, multi-stage Docker containers.",
    "Build automated CI/CD pipelines with linting, testing, and container scanning.",
    "Write declarative Kubernetes manifests for deployments, services, and ingress.",
    "Configure infrastructure observability and health monitoring with Prometheus.",
  ],
  final_project: {
    title: "Resilient Containerized Infrastructure Deployment with Automated CI/CD",
    description:
      "Automated infrastructure stack running microservices on Kubernetes with GitHub Actions CI/CD pipelines, container security scanning, and observability dashboards.",
    expected_outcome:
      "A fully automated GitHub repository with CI/CD workflows, declarative Kubernetes manifests, and monitoring playbooks.",
    key_deliverables: [
      "Multi-stage Dockerfiles with non-root security",
      "GitHub Actions CI/CD pipeline",
      "Kubernetes deployment and service manifests",
      "Prometheus monitoring configuration",
      "Disaster recovery and rollback runbook",
    ],
  },
  prerequisites: ["Basic Linux command line", "Basic networking (TCP/IP, HTTP)", "Basic Git"],
};

export const DATA_ENGINEERING_INTERNSHIP_DEFINITION: InternshipDefinition = {
  title: "Data Engineering Intern",
  duration_weeks: 8,
  difficulty: "beginner_to_intermediate",
  domain: "Data Platform & ETL",
  required_skills: [
    "Python",
    "SQL",
    "PostgreSQL",
    "Pandas",
    "PySpark",
    "Airflow",
    "Data Modeling",
    "Git",
  ],
  tools: ["Python", "SQL", "PostgreSQL", "Pandas", "PySpark", "Git"],
  learning_objectives: [
    "Design normalized relational and dimensional schemas (Star/Snowflake).",
    "Develop robust batch ETL pipelines with Python and SQL.",
    "Implement automated data validation and quality checks.",
    "Orchestrate recurring pipeline workflows and handle failure alerts.",
  ],
  final_project: {
    title: "Automated Data Ingestion & Analytics Warehouse Pipeline",
    description:
      "Scalable ETL pipeline that extracts raw data from multiple sources, validates schema consistency, transforms records, and populates an analytical data warehouse.",
    expected_outcome:
      "An automated data pipeline with database schemas, ETL transformations, and data quality test reports.",
    key_deliverables: [
      "Dimensional data warehouse schema design",
      "Modular Python/SQL ETL pipeline scripts",
      "Data quality validation test suite",
      "Pipeline orchestration configuration",
    ],
  },
  prerequisites: ["SQL querying fundamentals", "Basic Python scripting", "Basic Git"],
};

export const CYBERSECURITY_INTERNSHIP_DEFINITION: InternshipDefinition = {
  title: "Cybersecurity Intern",
  duration_weeks: 8,
  difficulty: "beginner_to_intermediate",
  domain: "Application Security, Threat Modeling & DevSecOps",
  required_skills: [
    "Python",
    "Security Testing",
    "Threat Modeling",
    "OWASP Top 10",
    "Linux",
    "Vulnerability Scanning",
    "Cryptography",
    "Git",
  ],
  tools: ["Python", "OWASP ZAP", "Trivy", "Semgrep", "Linux", "Burp Suite", "Git"],
  learning_objectives: [
    "Perform threat modeling on web application architectures using the STRIDE framework.",
    "Identify, exploit in sandbox, and remediate OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF, IDOR).",
    "Implement secure cryptographic authentication, password hashing, and token storage.",
    "Automate static and dynamic security analysis (SAST/DAST) in continuous integration pipelines.",
    "Conduct security audits, author vulnerability reports, and implement defensive countermeasures.",
  ],
  final_project: {
    title: "Automated Security Auditing & Vulnerability Remediation Suite",
    description:
      "Comprehensive application security assessment featuring threat modeling, automated SAST/DAST scanning pipeline, patched application vulnerabilities with security tests, and executive audit documentation.",
    expected_outcome:
      "A secured code repository with automated CI security scanning, regression security test suite, and published threat model audit report.",
    key_deliverables: [
      "STRIDE threat modeling architecture document",
      "Automated Semgrep and OWASP ZAP security scan workflows",
      "Remediated codebase with passing security unit tests",
      "Executive vulnerability remediation and risk mitigation report",
    ],
  },
  prerequisites: ["Basic Python or JavaScript", "Fundamental networking (HTTP/HTTPS, TCP/IP)", "Basic Linux commands"],
};

export const UIUX_DESIGN_INTERNSHIP_DEFINITION: InternshipDefinition = {
  title: "UI/UX Design Intern",
  duration_weeks: 8,
  difficulty: "beginner_to_intermediate",
  domain: "Product Design, User Research & Design Systems",
  required_skills: [
    "Figma",
    "User Research",
    "Wireframing",
    "Prototyping",
    "Design Systems",
    "Usability Testing",
    "Accessibility (WCAG)",
    "Information Architecture",
  ],
  tools: ["Figma", "FigJam", "Storybook", "Miro", "Loom"],
  learning_objectives: [
    "Conduct qualitative user interviews, synthesize findings into personas, and map user journeys.",
    "Create responsive low-fidelity wireframes and optimize information architecture.",
    "Build a production-grade atomic design system in Figma with typography, color, and spacing tokens.",
    "Develop interactive high-fidelity clickable prototypes with realistic micro-interactions and transitions.",
    "Execute usability testing sessions, calculate SUS scores, and verify WCAG 2.1 AA accessibility compliance.",
  ],
  final_project: {
    title: "Complete Product Design System and High-Fidelity Interactive Prototype",
    description:
      "End-to-end product design for the NOVA student residency portal, spanning foundational user research synthesis, design system library, accessible responsive components, and validated clickable prototypes.",
    expected_outcome:
      "A complete Figma file with design system components, high-fidelity clickable prototype, user research documentation, and WCAG accessibility audit.",
    key_deliverables: [
      "User research synthesis report with personas and user journey maps",
      "Atomic design system library with responsive component variants",
      "Interactive high-fidelity clickable prototype covering mobile and desktop flows",
      "Usability testing report with WCAG 2.1 AA accessibility audit results",
    ],
  },
  prerequisites: ["Basic visual design principles", "Figma interface fundamentals", "Basic empathy for user experience"],
};

const STANDARD_DEFINITIONS: Record<string, InternshipDefinition> = {
  "ai-ml": AI_ML_INTERNSHIP_DEFINITION,
  "ai/ml": AI_ML_INTERNSHIP_DEFINITION,
  "machine-learning": AI_ML_INTERNSHIP_DEFINITION,
  "fullstack": FULLSTACK_INTERNSHIP_DEFINITION,
  "full-stack": FULLSTACK_INTERNSHIP_DEFINITION,
  "web": FULLSTACK_INTERNSHIP_DEFINITION,
  "cloud": CLOUD_DEVOPS_INTERNSHIP_DEFINITION,
  "devops": CLOUD_DEVOPS_INTERNSHIP_DEFINITION,
  "cloud-devops": CLOUD_DEVOPS_INTERNSHIP_DEFINITION,
  "data": DATA_ENGINEERING_INTERNSHIP_DEFINITION,
  "data-engineering": DATA_ENGINEERING_INTERNSHIP_DEFINITION,
  "security": CYBERSECURITY_INTERNSHIP_DEFINITION,
  "cybersecurity": CYBERSECURITY_INTERNSHIP_DEFINITION,
  "cyber-security": CYBERSECURITY_INTERNSHIP_DEFINITION,
  "ui-ux": UIUX_DESIGN_INTERNSHIP_DEFINITION,
  "ui/ux": UIUX_DESIGN_INTERNSHIP_DEFINITION,
  "design": UIUX_DESIGN_INTERNSHIP_DEFINITION,
};

export function getStandardInternshipDefinition(slugOrDomain: string): InternshipDefinition {
  const normalized = slugOrDomain.toLowerCase().replace(/[^a-z0-9/-]/g, "");
  for (const [key, def] of Object.entries(STANDARD_DEFINITIONS)) {
    if (normalized.includes(key) || def.title.toLowerCase().includes(normalized)) {
      return def;
    }
  }
  return AI_ML_INTERNSHIP_DEFINITION;
}

export const AIML_INTERNSHIP_DEFINITION = AI_ML_INTERNSHIP_DEFINITION;

export function createInternshipDefinition(raw: unknown): InternshipDefinition {
  return internshipDefinitionSchema.parse(raw);
}
