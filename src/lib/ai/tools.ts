// Controlled tool abstraction (Phase 8D, extended Phase 8E). The model never
// decides whether it has permission to use a tool — this module does,
// entirely server-side, before any tool runs. Every tool declares the single
// capability it requires; authorizeToolUse() is the one gate every tool call
// must pass through, checking (in order) that the task's assigned agent
// actually has that capability, and — critically — whether the capability
// requires human approval. If it does, the tool is NOT executed on this
// call: either an already-granted, not-yet-used approval is consumed
// (exactly once, never replayed), or the task moves to
// 'waiting_for_approval' via request_ai_task_approval() and the caller gets
// back `authorized: false`. Nothing here ever trusts a cached "this was
// approved before" belief without checking the database fresh.

import type { SupabaseClient } from "@supabase/supabase-js";

// Tool registry: tool slug -> the one capability required to use it.
export const TOOL_CAPABILITY: Record<string, string> = {
  web_search: "read_public_web",
  generate_website: "generate_code",
  run_website_checks: "run_tests",
  deploy_website: "deploy",
  generate_content: "write_draft",
  publish_content_externally: "publish_content",
};

export interface ToolAuthorizationResult {
  authorized: boolean;
  waitingForApproval: boolean;
  approvalId?: string;
  reason?: string;
}

export async function authorizeToolUse(
  supabase: SupabaseClient,
  params: { taskId: string; toolSlug: string; reason: string }
): Promise<ToolAuthorizationResult> {
  const capabilitySlug = TOOL_CAPABILITY[params.toolSlug];
  if (!capabilitySlug) {
    return { authorized: false, waitingForApproval: false, reason: `Unknown tool: ${params.toolSlug}` };
  }

  const { data: task, error: taskError } = await supabase
    .from("ai_tasks")
    .select("id, agent_definition_id")
    .eq("id", params.taskId)
    .maybeSingle();
  if (taskError || !task) {
    return { authorized: false, waitingForApproval: false, reason: "Task not found." };
  }
  if (!task.agent_definition_id) {
    return { authorized: false, waitingForApproval: false, reason: "Task has no assigned agent." };
  }

  const { data: capability, error: capabilityError } = await supabase
    .from("ai_capabilities")
    .select("id, requires_approval")
    .eq("slug", capabilitySlug)
    .maybeSingle();
  if (capabilityError || !capability) {
    return { authorized: false, waitingForApproval: false, reason: "Unknown capability." };
  }

  // Re-verify the agent actually has this capability — never assumed from
  // the tool registry alone.
  const { data: grant } = await supabase
    .from("agent_definition_capabilities")
    .select("agent_definition_id")
    .eq("agent_definition_id", task.agent_definition_id)
    .eq("capability_id", capability.id)
    .maybeSingle();
  if (!grant) {
    return { authorized: false, waitingForApproval: false, reason: "Agent does not have the required capability." };
  }

  if (capability.requires_approval) {
    // Look for an existing, granted, NOT YET USED approval for this exact
    // task+capability. This is the only path that lets an approval-required
    // tool ever actually execute — request_ai_task_approval() itself always
    // creates a fresh pending request every time it's called (proven by the
    // Phase 8D "never trusts cached approval state" test); consuming an
    // approval and requesting one are deliberately two different RPCs.
    const { data: existingApproval } = await supabase
      .from("ai_approvals")
      .select("id")
      .eq("ai_task_id", params.taskId)
      .eq("capability_id", capability.id)
      .eq("status", "approved")
      .is("consumed_at", null)
      .order("decided_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingApproval) {
      const { error: consumeError } = await supabase.rpc("consume_ai_approval", { approval_id: existingApproval.id });
      if (consumeError) {
        return { authorized: false, waitingForApproval: false, reason: consumeError.message };
      }
      return { authorized: true, waitingForApproval: false, approvalId: existingApproval.id as string };
    }

    const { data: approvalId, error: approvalError } = await supabase.rpc("request_ai_task_approval", {
      task_id: params.taskId,
      capability_id: capability.id,
      reason: params.reason,
      resource_description: `Tool: ${params.toolSlug}`,
    });
    if (approvalError) {
      return { authorized: false, waitingForApproval: false, reason: approvalError.message };
    }
    return { authorized: false, waitingForApproval: true, approvalId: approvalId as string };
  }

  return { authorized: true, waitingForApproval: false };
}

export interface WebSearchResult {
  query: string;
  results: string[];
  provider: string;
  resultCount: number;
}

const MAX_WEB_SEARCH_RESULTS = 5;
const WEB_SEARCH_TIMEOUT_MS = 5000;

// Real, keyless, server-side web research. DuckDuckGo's Instant Answer API
// requires no API key/credential at all — nothing to invent, nothing to
// expose to the browser (this module has no "use client" directive and is
// only ever called from Server Actions / other server-only lib code). Off
// by default: ENABLE_REAL_WEB_SEARCH must be explicitly set, so unit and
// integration tests stay hermetic and don't depend on outbound network
// access. A timeout and a hard cap on returned results keep this within
// "reasonable request limits"; a network failure degrades to an explicit
// empty result rather than failing the whole task.
async function realWebSearch(query: string): Promise<WebSearchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEB_SEARCH_TIMEOUT_MS);
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Search request failed with status ${response.status}`);
    }
    const data = (await response.json()) as { AbstractText?: string; RelatedTopics?: { Text?: string }[] };
    const results = [data.AbstractText, ...(data.RelatedTopics ?? []).map((topic) => topic.Text)]
      .filter((text): text is string => Boolean(text && text.trim().length > 0))
      .slice(0, MAX_WEB_SEARCH_RESULTS);
    return { query, results, provider: "duckduckgo", resultCount: results.length };
  } finally {
    clearTimeout(timeout);
  }
}

export async function webSearch(query: string): Promise<WebSearchResult> {
  if (process.env.ENABLE_REAL_WEB_SEARCH !== "true") {
    return {
      query,
      results: [`No live web access is connected yet — this is a placeholder result for: ${query}`],
      provider: "mock",
      resultCount: 1,
    };
  }
  try {
    return await realWebSearch(query);
  } catch {
    // Never let a flaky external dependency fail the whole task — degrade
    // to an explicit empty result the Research Agent can still work from.
    return { query, results: [], provider: "duckduckgo", resultCount: 0 };
  }
}
