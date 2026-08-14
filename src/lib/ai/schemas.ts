// Structured AI output schemas (Phase 8D). Orchestration NEVER depends on
// arbitrary model prose — every model response is parsed as JSON and
// validated against one of these schemas before anything in the response is
// acted on. A response that fails validation fails the task safely (status
// 'failed', no tasks created, no tool executed) rather than being
// interpreted loosely.

import { z } from "zod";

// The AI Project Manager's decomposition of a service request into child
// tasks. agent_slug/capability_slugs are the MODEL's claim about what it
// thinks is appropriate — planServiceRequest() in project-manager.ts
// independently re-verifies both against the real agent_definitions/
// agent_definition_capabilities tables before creating anything. A model
// claiming a capability an agent doesn't actually have is rejected, not
// trusted (see Step 4 of the Phase 8D spec: "never blindly execute
// arbitrary instructions returned by the model").
export const taskPlanSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(2000),
        agent_slug: z.string().min(1).max(100),
        capability_slugs: z.array(z.string().min(1).max(100)).max(10).default([]),
        // Index into this same tasks array that must complete first, or
        // null for "no dependency, can be planned immediately." Validated
        // structurally (must point backward, never to itself or forward)
        // in project-manager.ts, not here — Zod checks shape, not graph
        // validity.
        depends_on_index: z.number().int().nonnegative().nullable().optional(),
      })
    )
    .min(1, "A plan must contain at least one task")
    .max(10, "A plan is capped at 10 tasks to keep decomposition reviewable"),
});

export type TaskPlan = z.infer<typeof taskPlanSchema>;

// The Research Agent's structured result for a single research task.
export const researchResultSchema = z.object({
  summary: z.string().min(1).max(5000),
  findings: z.array(z.string().min(1).max(1000)).min(1).max(20),
  sources: z.array(z.string().max(500)).max(20).default([]),
});

export type ResearchResult = z.infer<typeof researchResultSchema>;

// The Developer Agent's generated deliverable (Phase 8E) — a small, capped
// set of virtual files. This is NEVER written to the real NOVA filesystem
// and NEVER executed; it is the customer's generated deliverable, stored as
// an ai_artifacts row and rendered/downloaded, not run. Capped at 8 files /
// 20,000 chars each to keep a single AI response bounded and reviewable.
export const websiteBuildSchema = z.object({
  files: z
    .array(
      z.object({
        path: z.string().min(1).max(200),
        content: z.string().min(1).max(20000),
      })
    )
    .min(1, "A website build must contain at least one file")
    .max(8, "A website build is capped at 8 files to keep output reviewable"),
});

export type WebsiteBuild = z.infer<typeof websiteBuildSchema>;

// The QA Agent's structured verdict (Phase 8E). `status` is the field
// workflow-engine.ts inspects to decide whether to advance or route the
// work back to the Developer Agent — see WorkflowTaskTemplate.onFailureReturnToKey.
export const qaResultSchema = z.object({
  status: z.enum(["passed", "failed"]),
  issues: z.array(z.string().min(1).max(500)).max(20).default([]),
  recommendations: z.array(z.string().min(1).max(500)).max(20).default([]),
  confidence: z.number().min(0).max(1),
});

export type QaResult = z.infer<typeof qaResultSchema>;

// The Content & Marketing Agent's generated draft (Phase 8E). This is
// `generate_content` (capability: write_draft, no approval) — publishing or
// sending it anywhere is a SEPARATE, approval-required capability
// (publish_content / send_email) that no code path in this phase invokes
// automatically.
export const contentDraftSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  format: z.enum(["website_copy", "seo_content", "social_post", "email_draft", "product_description", "advertisement"]),
});

export type ContentDraft = z.infer<typeof contentDraftSchema>;

// Pure, independent structural inspection of a Developer Agent's generated
// website — the QA Agent's "must not simply trust another agent's output"
// requirement satisfied concretely: this looks at the actual file content,
// not the Developer Agent's own self-reported success. Kept pure/exported
// so it's directly unit-testable without a database or an AI provider call.
export function checkWebsiteBuildStructure(build: WebsiteBuild): { issues: string[] } {
  const issues: string[] = [];
  const hasEntryPoint = build.files.some((file) => /(^|\/)index\.html$/i.test(file.path));
  if (!hasEntryPoint) {
    issues.push("No index.html entry point found among the generated files.");
  }
  for (const file of build.files) {
    if (file.content.trim().length === 0) {
      issues.push(`File '${file.path}' is empty.`);
    }
    if (/\{\{|\btodo\b/i.test(file.content)) {
      issues.push(`File '${file.path}' contains an unresolved template placeholder or TODO marker.`);
    }
  }
  const paths = build.files.map((file) => file.path.toLowerCase());
  if (new Set(paths).size !== paths.length) {
    issues.push("Duplicate file paths were generated.");
  }
  return { issues };
}

// Pure structural validation of a plan's dependency graph — every
// depends_on_index must point strictly backward (< its own index, >= 0).
// Kept out of project-manager.ts so it's directly unit-testable without a
// database, the same "pure logic extracted for testing" convention already
// used throughout this codebase (see e.g. application-view-state.ts).
export function findInvalidDependencyIndex(plan: TaskPlan): number | null {
  for (let i = 0; i < plan.tasks.length; i++) {
    const dep = plan.tasks[i].depends_on_index;
    if (dep !== null && dep !== undefined && (dep >= i || dep < 0)) {
      return i;
    }
  }
  return null;
}
