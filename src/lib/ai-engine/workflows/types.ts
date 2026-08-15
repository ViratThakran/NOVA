// Typed workflow definition shapes. A workflow is a fixed, reviewed task
// graph for a specific service — not a database-driven engine. Adding a
// new workflow means adding one entry to registry.ts's
// WORKFLOW_DEFINITIONS, never a new branch of "if service === x" logic
// in agents/project-manager.ts or workflows/orchestrator.ts; both of
// those only ever call findWorkflowForService()/findWorkflowBySlug() and
// iterate the returned definition's tasks.

export interface WorkflowTaskTemplate {
  // Stable key used to wire dependencies within THIS workflow and to look
  // up the right runner in agents/index.ts. Never exposed to the model.
  key: string;
  title: string;
  agentSlug: string;
  capabilitySlugs: string[];
  dependsOnKey: string | null;
  // If this task completes with a structured output whose `status` field is
  // "failed" (QA-style outcome, not an RPC-level task failure), the
  // orchestrator retries the referenced task instead of advancing forward.
  // Declarative failure routing, not special-cased QA logic in the engine.
  onFailureReturnToKey?: string | null;
}

export interface WorkflowDefinition {
  slug: string;
  serviceSlugs: string[];
  tasks: WorkflowTaskTemplate[];
}
