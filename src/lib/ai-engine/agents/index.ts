// Agent registry — the single dispatch table mapping a workflow task's key
// (or, for the generic non-workflow path, an agent's slug) to the function
// that actually runs it. engine.ts's execute()/resume() and
// workflows/orchestrator.ts's advanceWorkflow() both import THIS table
// rather than each maintaining their own copy.

import type { SupabaseClient } from "@supabase/supabase-js";
import { planServiceRequest } from "./project-manager";
import { runResearchTask } from "./research-agent";
import { runDevelopmentTask, runDeploymentTask } from "./developer-agent";
import { runQaTask } from "./qa-agent";
import { runContentTask } from "./content-marketing-agent";

export { planServiceRequest } from "./project-manager";
export { runResearchTask } from "./research-agent";
export { runDevelopmentTask, runDeploymentTask } from "./developer-agent";
export { runQaTask } from "./qa-agent";
export { runContentTask } from "./content-marketing-agent";

export interface AgentRunResult {
  status: "success" | "waiting_for_approval" | "error";
  message?: string;
  output?: unknown;
  approvalId?: string;
}

export type AgentRunner = (supabase: SupabaseClient, taskId: string) => Promise<AgentRunResult>;

// Keyed by WorkflowTaskTemplate.key — only tasks created from a typed
// workflow definition (workflows/registry.ts) carry a workflow_key, and
// only those auto-advance (see workflows/orchestrator.ts).
export const WORKFLOW_TASK_RUNNERS: Record<string, AgentRunner> = {
  research: runResearchTask,
  development: runDevelopmentTask,
  qa: runQaTask,
  deployment: runDeploymentTask,
};

// Keyed by agent_definitions.slug — the fallback dispatch for the generic,
// model-decomposed plan path (a task with no workflow_key). Only agents
// with a real, tested runner appear here; an agent with none simply can't
// be executed through the engine yet.
export const GENERIC_AGENT_RUNNERS: Record<string, AgentRunner> = {
  "research-agent": runResearchTask,
  "content-marketing-agent": runContentTask,
};
