// The workflow registry — the one lookup table mapping a service to its
// typed workflow definition (if any). Adding a new workflow is: write its
// WorkflowDefinition (see website.ts), import it, and add it to
// WORKFLOW_DEFINITIONS below. Nothing else in the engine branches on
// individual service slugs.

import type { WorkflowDefinition } from "./types";
import { WEBSITE_CREATION_WORKFLOW } from "./website";

const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [WEBSITE_CREATION_WORKFLOW];

export function findWorkflowForService(serviceSlug: string): WorkflowDefinition | null {
  return WORKFLOW_DEFINITIONS.find((workflow) => workflow.serviceSlugs.includes(serviceSlug)) ?? null;
}

export function findWorkflowBySlug(workflowSlug: string): WorkflowDefinition | null {
  return WORKFLOW_DEFINITIONS.find((workflow) => workflow.slug === workflowSlug) ?? null;
}
