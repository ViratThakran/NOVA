// Artifacts boundary. One insert helper used by every agent that produces
// a deliverable, instead of each agent module hand-rolling its own
// `supabase.from("ai_artifacts").insert(...)` call. ai_artifacts remains
// the single addressable, typed, service-request-scoped record of what an
// agent produced (see the migration's own reasoning for why
// ai_tasks.output alone wasn't sufficient once a workflow has multiple
// tasks producing deliverables other tasks and the service request as a
// whole need to reference).
//
// This module does not add authorization logic of its own — RLS and the
// table's grants (admin-only INSERT, no UPDATE/DELETE) remain the real
// boundary, exactly as before.

import type { SupabaseClient } from "@supabase/supabase-js";

// Mirrors the ai_artifacts.type CHECK constraint exactly.
export type ArtifactType = "research_report" | "website_source" | "qa_report" | "content_draft" | "deployment_record";

export interface RecordArtifactParams {
  serviceRequestId: string;
  taskId: string;
  agentId: string;
  type: ArtifactType;
  title: string;
  content: unknown;
}

export async function recordArtifact(supabase: SupabaseClient, params: RecordArtifactParams) {
  return supabase.from("ai_artifacts").insert({
    service_request_id: params.serviceRequestId,
    ai_task_id: params.taskId,
    created_by_agent_id: params.agentId,
    type: params.type,
    title: params.title,
    content: params.content,
  });
}
