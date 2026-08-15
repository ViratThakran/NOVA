// Approvals boundary. Every path that creates, decides, or consumes an
// AI approval goes through the three functions below — never a raw
// `supabase.rpc(...)` call scattered elsewhere in the engine or the
// application. This does not duplicate the approval RPCs themselves
// (request_ai_task_approval / decide_ai_approval / consume_ai_approval
// remain the actual SECURITY DEFINER authority in Postgres); it's the one
// place their TypeScript call sites live, so tools/index.ts and engine.ts
// never each grow their own copy.
//
// NOVA's database is still the source of truth: these functions only ever
// ask the database to make a decision, never make one themselves.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface RequestApprovalParams {
  taskId: string;
  capabilityId: string;
  reason: string;
  resourceDescription?: string;
}

export async function requestApproval(supabase: SupabaseClient, params: RequestApprovalParams) {
  return supabase.rpc("request_ai_task_approval", {
    task_id: params.taskId,
    capability_id: params.capabilityId,
    reason: params.reason,
    resource_description: params.resourceDescription ?? null,
  });
}

export type ApprovalDecision = "approved" | "rejected";

export async function decideApproval(supabase: SupabaseClient, approvalId: string, decision: ApprovalDecision) {
  return supabase.rpc("decide_ai_approval", { approval_id: approvalId, decision });
}

// Marks a granted approval as used — exactly once, ever. This is the ONLY
// path that lets an approval-required tool actually execute (see
// tools/index.ts's authorizeToolUse); replay is blocked at the database
// level (consume_ai_approval's own consumed_at IS NULL check), not merely
// by convention here.
export async function consumeApproval(supabase: SupabaseClient, approvalId: string) {
  return supabase.rpc("consume_ai_approval", { approval_id: approvalId });
}
