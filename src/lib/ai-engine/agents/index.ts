// Agent registry — the single dispatch table for NOVA's AI workforce.

import type { SupabaseClient } from "@supabase/supabase-js";
import { planServiceRequest } from "./project-manager";
import { runResearchTask } from "./research-agent";
import { runDevelopmentTask, runDeploymentTask } from "./developer-agent";
import { runQaTask } from "./qa-agent";
import { runContentTask } from "./content-marketing-agent";
import { bootstrapInternshipJourney, reviewInternshipSubmission } from "./internship-mentor-agent";

export { planServiceRequest } from "./project-manager";
export { runResearchTask } from "./research-agent";
export { runDevelopmentTask, runDeploymentTask } from "./developer-agent";
export { runQaTask } from "./qa-agent";
export { runContentTask } from "./content-marketing-agent";
export { bootstrapInternshipJourney, reviewInternshipSubmission } from "./internship-mentor-agent";

export interface AgentRunResult {
  status: "success" | "waiting_for_approval" | "error";
  message?: string;
  output?: unknown;
  approvalId?: string;
}

export type AgentRunner = (supabase: SupabaseClient, taskId: string) => Promise<AgentRunResult>;

export const WORKFLOW_TASK_RUNNERS: Record<string, AgentRunner> = {
  research: runResearchTask,
  development: runDevelopmentTask,
  qa: runQaTask,
  deployment: runDeploymentTask,
};

export const GENERIC_AGENT_RUNNERS: Record<string, AgentRunner> = {
  "research-agent": runResearchTask,
  "content-marketing-agent": runContentTask,
};
