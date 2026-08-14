"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  reviewSchema,
  markUnderReviewSchema,
  internshipSchema,
  editInternshipSchema,
  internshipStatusSchema,
  serviceSchema,
  editServiceSchema,
  serviceStatusSchema,
  reviewServiceRequestSchema,
  advanceServiceRequestSchema,
  planServiceRequestSchema,
  runAiTaskSchema,
  decideAiApprovalSchema,
} from "@/lib/validation";
import { planServiceRequest } from "@/lib/ai/project-manager";
import { runResearchTask } from "@/lib/ai/research-agent";
import { runDevelopmentTask, runDeploymentTask } from "@/lib/ai/developer-agent";
import { runQaTask } from "@/lib/ai/qa-agent";
import { runContentTask } from "@/lib/ai/content-marketing-agent";
import { advanceWorkflow } from "@/lib/ai/workflow-engine";
import type { AdminActionState } from "./action-state";

type AdminActionSupabase = Parameters<typeof planServiceRequest>[0];

// Workflow-driven tasks carry input.workflow_key (Phase 8E) and dispatch
// here; a task with no workflow_key falls back to the Phase 8D generic-path
// behavior (agent slug -> runner) below. One dispatch table, not a growing
// if/else chain — adding a new workflow step means adding one entry.
const WORKFLOW_TASK_RUNNERS: Record<string, (supabase: AdminActionSupabase, taskId: string) => Promise<{ status: string; message?: string }>> = {
  research: runResearchTask,
  development: runDevelopmentTask,
  qa: runQaTask,
  deployment: runDeploymentTask,
};

const ADMIN_ROLES = ["admin", "super_admin"];

// Maps the RAISE EXCEPTION messages thrown by review_application() and
// mark_application_under_review() to user-facing copy. Both RPCs share the
// same message vocabulary on purpose (see the migration), so one mapping
// covers both. Raw Postgres/RPC errors are never shown to the user, only
// logged server-side.
function friendlyRpcError(error: { message?: string } | null): string {
  const message = error?.message ?? "";

  if (message.includes("Unauthorized")) {
    return "You don't have permission to review applications.";
  }
  if (message.includes("Application not found")) {
    return "This application could not be found.";
  }
  if (message.includes("Invalid State")) {
    return "This application is no longer in a state that allows that action.";
  }
  if (message.includes("Invalid Status")) {
    return "Invalid review decision.";
  }
  return "Something went wrong. Please try again.";
}

export async function reviewApplicationAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to review applications." };
  }

  const parsed = reviewSchema.safeParse({
    application_id: formData.get("application_id"),
    status: formData.get("status"),
    feedback: formData.get("feedback") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // Wraps the existing review_application() RPC rather than duplicating its
  // state-machine/enrollment/notification/audit-log logic here.
  const { error } = await supabase.rpc("review_application", {
    app_uuid: parsed.data.application_id,
    review_status: parsed.data.status,
    feedback: parsed.data.feedback ?? null,
  });

  if (error) {
    console.error("reviewApplicationAction:", error);
    return { status: "error", message: friendlyRpcError(error) };
  }

  return {
    status: "success",
    message: parsed.data.status === "accepted" ? "Application accepted." : "Application rejected.",
  };
}

export async function markUnderReviewAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to review applications." };
  }

  const parsed = markUnderReviewSchema.safeParse({
    application_id: formData.get("application_id"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { error } = await supabase.rpc("mark_application_under_review", {
    app_uuid: parsed.data.application_id,
  });

  if (error) {
    console.error("markUnderReviewAction:", error);
    return { status: "error", message: friendlyRpcError(error) };
  }

  return { status: "success", message: "Application marked as under review." };
}

export async function createInternshipAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to create internships." };
  }

  const parsed = internshipSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
    eligibility: formData.get("eligibility"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // status is never set here — it defaults to 'draft' via the column's own
  // DEFAULT, matching the internships RLS/GRANT model exactly (admins insert
  // via the same policy that already only allows is_current_user_admin()).
  const { data, error } = await supabase.from("internships").insert(parsed.data).select("id").single();

  if (error) {
    console.error("createInternshipAction:", error);
    return { status: "error", message: "We couldn't create this internship. Please try again." };
  }

  redirect(`/admin/internships/${data.id}`);
}

export async function updateInternshipAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to edit internships." };
  }

  const parsed = editInternshipSchema.safeParse({
    internship_id: formData.get("internship_id"),
    title: formData.get("title"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
    eligibility: formData.get("eligibility"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { internship_id, ...fields } = parsed.data;

  // Only ever writes the four content columns — status changes go through
  // updateInternshipStatusAction below, kept separate the same way
  // markUnderReviewAction stays separate from reviewApplicationAction.
  const { error } = await supabase.from("internships").update(fields).eq("id", internship_id);

  if (error) {
    console.error("updateInternshipAction:", error);
    return { status: "error", message: "We couldn't save these changes. Please try again." };
  }

  redirect(`/admin/internships/${internship_id}`);
}

export async function updateInternshipStatusAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to change internship status." };
  }

  const parsed = internshipStatusSchema.safeParse({
    internship_id: formData.get("internship_id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // internships has no state-machine RPC (unlike applications) — the admin
  // UPDATE RLS policy already permits any status to any other status by
  // design, so this only validates the value against the real CHECK
  // constraint's enum and confirms the actor is an admin; it does not
  // invent a new transition restriction the schema doesn't have.
  const { error } = await supabase
    .from("internships")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.internship_id);

  if (error) {
    console.error("updateInternshipStatusAction:", error);
    return { status: "error", message: "We couldn't update the status. Please try again." };
  }

  revalidatePath(`/admin/internships/${parsed.data.internship_id}`);
  revalidatePath("/admin/internships");

  return { status: "success", message: "Status updated." };
}

export async function createServiceAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to create services." };
  }

  const parsed = serviceSchema.safeParse({
    category_id: formData.get("category_id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    short_description: formData.get("short_description"),
    description: formData.get("description"),
    automation_level: formData.get("automation_level"),
    display_order: formData.get("display_order"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // published is never set here — it defaults to false via the column's
  // own DEFAULT, the same "create as unpublished, publish explicitly"
  // pattern createInternshipAction uses for status above.
  const { data, error } = await supabase.from("services").insert(parsed.data).select("id").single();

  if (error) {
    console.error("createServiceAction:", error);
    if (error.code === "23505") return { status: "error", message: "A service with this slug already exists." };
    return { status: "error", message: "We couldn't create this service. Please try again." };
  }

  redirect(`/admin/services/${data.id}`);
}

export async function updateServiceAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to edit services." };
  }

  const parsed = editServiceSchema.safeParse({
    service_id: formData.get("service_id"),
    category_id: formData.get("category_id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    short_description: formData.get("short_description"),
    description: formData.get("description"),
    automation_level: formData.get("automation_level"),
    display_order: formData.get("display_order"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { service_id, ...fields } = parsed.data;

  // Only ever writes content fields — publish state goes through
  // updateServiceStatusAction below, kept separate the same way
  // updateInternshipStatusAction stays separate from updateInternshipAction.
  const { error } = await supabase.from("services").update(fields).eq("id", service_id);

  if (error) {
    console.error("updateServiceAction:", error);
    if (error.code === "23505") return { status: "error", message: "A service with this slug already exists." };
    return { status: "error", message: "We couldn't save these changes. Please try again." };
  }

  redirect(`/admin/services/${service_id}`);
}

export async function updateServiceStatusAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to change service status." };
  }

  const parsed = serviceStatusSchema.safeParse({
    service_id: formData.get("service_id"),
    published: formData.get("published") === "true",
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { error } = await supabase
    .from("services")
    .update({ published: parsed.data.published })
    .eq("id", parsed.data.service_id);

  if (error) {
    console.error("updateServiceStatusAction:", error);
    return { status: "error", message: "We couldn't update the status. Please try again." };
  }

  revalidatePath(`/admin/services/${parsed.data.service_id}`);
  revalidatePath("/admin/services");

  return { status: "success", message: parsed.data.published ? "Service published." : "Service unpublished." };
}

export async function deleteServiceAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to delete services." };
  }

  const serviceIdParsed = z.string().uuid().safeParse(formData.get("service_id"));
  if (!serviceIdParsed.success) {
    return { status: "error", message: "Invalid service." };
  }

  const { error } = await supabase.from("services").delete().eq("id", serviceIdParsed.data);

  if (error) {
    console.error("deleteServiceAction:", error);
    return { status: "error", message: "We couldn't delete this service. Please try again." };
  }

  revalidatePath("/admin/services");
  redirect("/admin/services");
}

// Maps the RAISE EXCEPTION messages thrown by review_service_request() and
// advance_service_request() to user-facing copy — same vocabulary/pattern
// as friendlyRpcError() in company/actions.ts, kept local since this file
// has no shared error-mapping helper of its own yet.
function friendlyServiceRequestError(error: { message?: string } | null): string {
  const message = error?.message ?? "";

  if (message.includes("Unauthorized")) {
    return "You don't have permission to manage this request.";
  }
  if (message.includes("Request not found")) {
    return "This request could not be found.";
  }
  if (message.includes("Invalid State")) {
    return "This request is no longer in a state that allows that action.";
  }
  if (message.includes("Invalid Input")) {
    return "Delivery notes are required to mark a request delivered.";
  }
  if (message.includes("Invalid Status")) {
    return "Invalid decision.";
  }
  return "Something went wrong. Please try again.";
}

export async function reviewServiceRequestAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to review service requests." };
  }

  const parsed = reviewServiceRequestSchema.safeParse({
    request_id: formData.get("request_id"),
    decision: formData.get("decision"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { error } = await supabase.rpc("review_service_request", {
    request_id: parsed.data.request_id,
    decision: parsed.data.decision,
  });

  if (error) {
    console.error("reviewServiceRequestAction:", error);
    return { status: "error", message: friendlyServiceRequestError(error) };
  }

  revalidatePath(`/admin/services/requests/${parsed.data.request_id}`);
  revalidatePath("/admin/services/requests");

  return {
    status: "success",
    message: parsed.data.decision === "accepted" ? "Request accepted." : "Request rejected.",
  };
}

export async function advanceServiceRequestAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to update this request." };
  }

  const parsed = advanceServiceRequestSchema.safeParse({
    request_id: formData.get("request_id"),
    new_status: formData.get("new_status"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { error } = await supabase.rpc("advance_service_request", {
    request_id: parsed.data.request_id,
    new_status: parsed.data.new_status,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    console.error("advanceServiceRequestAction:", error);
    return { status: "error", message: friendlyServiceRequestError(error) };
  }

  revalidatePath(`/admin/services/requests/${parsed.data.request_id}`);
  revalidatePath("/admin/services/requests");

  return { status: "success", message: "Request updated." };
}

export async function planServiceRequestAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to plan service requests." };
  }

  const parsed = planServiceRequestSchema.safeParse({ request_id: formData.get("request_id") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // planServiceRequest() itself calls the assign_ai_task/start_agent_run/
  // complete_agent_run RPCs — this action supplies the caller's own
  // RLS-scoped Supabase client, the same "authorization from the session,
  // never from a request parameter" pattern every other action already
  // follows. No service-role key is used anywhere in this path.
  const result = await planServiceRequest(supabase, parsed.data.request_id);

  if (result.status === "error") {
    console.error("planServiceRequestAction:", result.message);
    return { status: "error", message: result.message ?? "We couldn't plan this request. Please try again." };
  }

  revalidatePath(`/admin/services/requests/${parsed.data.request_id}`);

  return { status: "success", message: `Plan created with ${result.childTaskIds?.length ?? 0} task(s).` };
}

export async function runAiTaskAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to run AI tasks." };
  }

  const parsed = runAiTaskSchema.safeParse({ task_id: formData.get("task_id") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { data: task, error: taskError } = await supabase
    .from("ai_tasks")
    .select("id, input, service_request_id, agent_definitions(slug)")
    .eq("id", parsed.data.task_id)
    .maybeSingle();
  if (taskError || !task) {
    return { status: "error", message: "This task could not be found." };
  }

  const input = (task.input ?? {}) as Record<string, unknown>;
  const workflowKey = typeof input.workflow_key === "string" ? input.workflow_key : null;
  const agentDefinition = Array.isArray(task.agent_definitions) ? task.agent_definitions[0] : task.agent_definitions;
  const agentSlug = agentDefinition?.slug as string | undefined;

  let runner = workflowKey ? WORKFLOW_TASK_RUNNERS[workflowKey] : undefined;
  if (!runner && agentSlug === "research-agent") runner = runResearchTask;
  if (!runner && agentSlug === "content-marketing-agent") runner = runContentTask;
  if (!runner) {
    return { status: "error", message: "This task cannot be run from here yet." };
  }

  const result = await runner(supabase, parsed.data.task_id);

  if (result.status === "error") {
    console.error("runAiTaskAction:", result.message);
    return { status: "error", message: result.message ?? "We couldn't run this task. Please try again." };
  }

  if (result.status === "success" && workflowKey) {
    // Continue the chain if this run unblocked a subsequent workflow step —
    // relevant when this call is a manual resume (e.g. re-running the
    // deployment task after an approval decision), not just the initial
    // auto-advance from planServiceRequest.
    await advanceWorkflow(supabase, task.service_request_id);
  }

  revalidatePath(`/admin/services/requests`);

  if (result.status === "waiting_for_approval") {
    return { status: "success", message: "This task requires approval before it can continue." };
  }
  return { status: "success", message: "Task completed." };
}

export async function retryAiTaskAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to retry AI tasks." };
  }

  const parsed = runAiTaskSchema.safeParse({ task_id: formData.get("task_id") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { error } = await supabase.rpc("retry_ai_task", { task_id: parsed.data.task_id });
  if (error) {
    console.error("retryAiTaskAction:", error);
    if (error.message.includes("retry limit")) {
      return { status: "error", message: "This task has reached its retry limit and cannot be retried again." };
    }
    if (error.message.includes("Invalid State")) {
      return { status: "error", message: "Only a failed task can be retried." };
    }
    return { status: "error", message: "We couldn't retry this task. Please try again." };
  }

  revalidatePath(`/admin/services/requests`);

  return { status: "success", message: "Task requeued for retry." };
}

export async function decideAiApprovalAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    return { status: "error", message: "Your session has expired. Please log in again." };
  }

  const { supabase, roles } = auth;

  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    return { status: "error", message: "You don't have permission to decide AI approvals." };
  }

  const parsed = decideAiApprovalSchema.safeParse({
    approval_id: formData.get("approval_id"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const { error } = await supabase.rpc("decide_ai_approval", { approval_id: parsed.data.approval_id, decision: parsed.data.decision });
  if (error) {
    console.error("decideAiApprovalAction:", error);
    return { status: "error", message: error.message };
  }

  revalidatePath("/admin/services/requests");

  return { status: "success", message: parsed.data.decision === "approved" ? "Approved." : "Rejected." };
}
