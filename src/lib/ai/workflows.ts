// Typed workflow definitions (Phase 8E). A workflow is a fixed, reviewed
// task graph for a specific service — not a database-driven engine. Adding
// a new workflow means adding one entry to WORKFLOW_DEFINITIONS below, never
// a new branch of "if service === x" logic in project-manager.ts or
// workflow-engine.ts; both of those only ever call findWorkflowForService()/
// findWorkflowBySlug() and iterate the returned definition's tasks.
//
// Only one workflow is defined this phase (Website Creation) — proving one
// complete, safe, auto-advancing workflow end-to-end, per the Phase 8E
// scope instruction, rather than covering every service in the catalog.

export interface WorkflowTaskTemplate {
  // Stable key used to wire dependencies within THIS workflow and to look
  // up the right runner in workflow-engine.ts. Never exposed to the model.
  key: string;
  title: string;
  agentSlug: string;
  capabilitySlugs: string[];
  dependsOnKey: string | null;
  // If this task completes with a structured output whose `status` field is
  // "failed" (QA-style outcome, not an RPC-level task failure), the engine
  // retries the referenced task instead of advancing forward. Declarative
  // failure routing, not special-cased QA logic in the engine itself.
  onFailureReturnToKey?: string | null;
}

export interface WorkflowDefinition {
  slug: string;
  serviceSlugs: string[];
  tasks: WorkflowTaskTemplate[];
}

export const WEBSITE_CREATION_WORKFLOW: WorkflowDefinition = {
  slug: "website-creation",
  serviceSlugs: ["ai-website-creation"],
  tasks: [
    {
      key: "research",
      title: "Research the business, audience, and market context",
      agentSlug: "research-agent",
      capabilitySlugs: ["research", "read_public_web"],
      dependsOnKey: null,
    },
    {
      key: "development",
      title: "Build the website",
      agentSlug: "developer-agent",
      capabilitySlugs: ["generate_code", "create_artifact"],
      dependsOnKey: "research",
    },
    {
      key: "qa",
      title: "Test and validate the generated website",
      agentSlug: "qa-agent",
      capabilitySlugs: ["run_tests", "create_artifact"],
      dependsOnKey: "development",
      onFailureReturnToKey: "development",
    },
    {
      key: "deployment",
      title: "Deploy the website to production",
      agentSlug: "developer-agent",
      capabilitySlugs: ["deploy", "create_artifact"],
      dependsOnKey: "qa",
    },
  ],
};

const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [WEBSITE_CREATION_WORKFLOW];

export function findWorkflowForService(serviceSlug: string): WorkflowDefinition | null {
  return WORKFLOW_DEFINITIONS.find((workflow) => workflow.serviceSlugs.includes(serviceSlug)) ?? null;
}

export function findWorkflowBySlug(workflowSlug: string): WorkflowDefinition | null {
  return WORKFLOW_DEFINITIONS.find((workflow) => workflow.slug === workflowSlug) ?? null;
}
