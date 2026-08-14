"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  companyProfileSchema,
  addCompanyMemberSchema,
  updateCompanyMemberRoleSchema,
  removeCompanyMemberSchema,
  internshipSchema,
  editInternshipSchema,
  internshipStatusSchema,
  reviewSchema,
  markUnderReviewSchema,
} from "@/lib/validation";
import type { CompanyActionState } from "./action-state";

const uuidSchema = z.string().uuid();

// Shared with admin/actions.ts's own mapping — both review_application() and
// mark_application_under_review() raise the same message vocabulary
// regardless of whether the caller was a platform admin or a company
// reviewer, so one mapping covers both call sites.
function friendlyRpcError(error: { message?: string } | null): string {
  const message = error?.message ?? "";

  if (message.includes("Unauthorized")) {
    return "You don't have permission to review this application.";
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

export async function updateCompanyProfileAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase } = auth;

  const parsed = companyProfileSchema.safeParse({
    company_id: formData.get("company_id"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  const { company_id, ...fields } = parsed.data;

  // Reuses the exact predicate RLS itself enforces (is_company_admin), so
  // this check can never drift out of sync with the real security boundary.
  const { data: isAdmin } = await supabase.rpc("is_company_admin", { target_company_id: company_id });
  if (!isAdmin) return { status: "error", message: "You don't have permission to update this company." };

  const { error } = await supabase.from("companies").update(fields).eq("id", company_id);
  if (error) {
    console.error("updateCompanyProfileAction:", error);
    return { status: "error", message: "We couldn't save these changes. Please try again." };
  }

  revalidatePath("/company/profile");
  return { status: "success", message: "Company updated." };
}

export async function addCompanyMemberAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase } = auth;

  const parsed = addCompanyMemberSchema.safeParse({
    company_id: formData.get("company_id"),
    email: formData.get("email"),
    company_role: formData.get("company_role"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  const { data: isAdmin } = await supabase.rpc("is_company_admin", { target_company_id: parsed.data.company_id });
  if (!isAdmin) return { status: "error", message: "You don't have permission to manage members for this company." };

  // Resolves the email to a user id via the narrowly-scoped
  // find_user_for_company_membership() RPC — profiles itself has no RLS
  // path that would let this query the table directly.
  const { data: matches, error: lookupError } = await supabase.rpc("find_user_for_company_membership", {
    lookup_email: parsed.data.email,
  });
  if (lookupError) {
    console.error("addCompanyMemberAction (lookup):", lookupError);
    return { status: "error", message: "We couldn't add this member. Please try again." };
  }
  const match = matches?.[0];
  if (!match) return { status: "error", message: "No user was found with that email address." };

  const { error } = await supabase.from("company_members").insert({
    company_id: parsed.data.company_id,
    user_id: match.user_id,
    company_role: parsed.data.company_role,
  });
  if (error) {
    console.error("addCompanyMemberAction:", error);
    if (error.code === "23505") return { status: "error", message: "This user is already a member." };
    return { status: "error", message: "We couldn't add this member. Please try again." };
  }

  revalidatePath("/company/members");
  return { status: "success", message: "Member added." };
}

export async function updateCompanyMemberRoleAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase } = auth;

  const parsed = updateCompanyMemberRoleSchema.safeParse({
    company_id: formData.get("company_id"),
    member_user_id: formData.get("member_user_id"),
    company_role: formData.get("company_role"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  const { data: isAdmin } = await supabase.rpc("is_company_admin", { target_company_id: parsed.data.company_id });
  if (!isAdmin) return { status: "error", message: "You don't have permission to manage members for this company." };

  // Owner rows are unconditionally protected by RLS regardless of this
  // check — this UPDATE simply affects zero rows if the target is 'owner'.
  const { error } = await supabase
    .from("company_members")
    .update({ company_role: parsed.data.company_role })
    .eq("company_id", parsed.data.company_id)
    .eq("user_id", parsed.data.member_user_id);
  if (error) {
    console.error("updateCompanyMemberRoleAction:", error);
    return { status: "error", message: "We couldn't update this member. Please try again." };
  }

  revalidatePath("/company/members");
  return { status: "success", message: "Member role updated." };
}

export async function removeCompanyMemberAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase } = auth;

  const parsed = removeCompanyMemberSchema.safeParse({
    company_id: formData.get("company_id"),
    member_user_id: formData.get("member_user_id"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  const { data: isAdmin } = await supabase.rpc("is_company_admin", { target_company_id: parsed.data.company_id });
  if (!isAdmin) return { status: "error", message: "You don't have permission to manage members for this company." };

  const { error } = await supabase
    .from("company_members")
    .delete()
    .eq("company_id", parsed.data.company_id)
    .eq("user_id", parsed.data.member_user_id);
  if (error) {
    console.error("removeCompanyMemberAction:", error);
    return { status: "error", message: "We couldn't remove this member. Please try again." };
  }

  revalidatePath("/company/members");
  return { status: "success", message: "Member removed." };
}

export async function createCompanyInternshipAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase } = auth;

  const companyIdParsed = uuidSchema.safeParse(formData.get("company_id"));
  if (!companyIdParsed.success) return { status: "error", message: "Invalid company." };
  const companyId = companyIdParsed.data;

  // Never trust the browser's company_id for what it implies (permission) —
  // it is only trusted as "which company", re-verified here independently.
  const { data: isAdmin } = await supabase.rpc("is_company_admin", { target_company_id: companyId });
  if (!isAdmin) return { status: "error", message: "You don't have permission to create internships for this company." };

  const parsed = internshipSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
    eligibility: formData.get("eligibility"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  const { data, error } = await supabase
    .from("internships")
    .insert({ ...parsed.data, company_id: companyId })
    .select("id")
    .single();
  if (error) {
    console.error("createCompanyInternshipAction:", error);
    return { status: "error", message: "We couldn't create this internship. Please try again." };
  }

  redirect(`/company/internships/${data.id}`);
}

export async function updateCompanyInternshipAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase } = auth;

  const parsed = editInternshipSchema.safeParse({
    internship_id: formData.get("internship_id"),
    title: formData.get("title"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
    eligibility: formData.get("eligibility"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  const { internship_id, ...fields } = parsed.data;

  // company_id is derived from the resource itself, never from a client
  // field — an internship's owning company is a fact about the row, not
  // something the editor should even be asked to supply.
  const { data: internship } = await supabase.from("internships").select("company_id").eq("id", internship_id).maybeSingle();
  if (!internship?.company_id) return { status: "error", message: "This internship could not be found." };

  const { data: isAdmin } = await supabase.rpc("is_company_admin", { target_company_id: internship.company_id });
  if (!isAdmin) return { status: "error", message: "You don't have permission to edit this internship." };

  const { error } = await supabase.from("internships").update(fields).eq("id", internship_id);
  if (error) {
    console.error("updateCompanyInternshipAction:", error);
    return { status: "error", message: "We couldn't save these changes. Please try again." };
  }

  redirect(`/company/internships/${internship_id}`);
}

export async function updateCompanyInternshipStatusAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase } = auth;

  const parsed = internshipStatusSchema.safeParse({
    internship_id: formData.get("internship_id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  const { data: internship } = await supabase
    .from("internships")
    .select("company_id")
    .eq("id", parsed.data.internship_id)
    .maybeSingle();
  if (!internship?.company_id) return { status: "error", message: "This internship could not be found." };

  const { data: isAdmin } = await supabase.rpc("is_company_admin", { target_company_id: internship.company_id });
  if (!isAdmin) return { status: "error", message: "You don't have permission to change this internship's status." };

  const { error } = await supabase
    .from("internships")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.internship_id);
  if (error) {
    console.error("updateCompanyInternshipStatusAction:", error);
    return { status: "error", message: "We couldn't update the status. Please try again." };
  }

  revalidatePath(`/company/internships/${parsed.data.internship_id}`);
  revalidatePath("/company/internships");
  return { status: "success", message: "Status updated." };
}

// Wraps the existing review_application()/mark_application_under_review()
// RPCs exactly like admin/actions.ts does — the RPCs themselves (Phase 5B-3)
// now accept a company owner/admin whose company owns the application's
// internship, via can_review_company_application(). No state-machine,
// locking, enrollment, notification, or audit-log logic is duplicated here;
// a company member (read-only) still gets rejected by the RPC itself even
// if this action were somehow called directly.
export async function markCompanyUnderReviewAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase } = auth;

  const parsed = markUnderReviewSchema.safeParse({
    application_id: formData.get("application_id"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  const { error } = await supabase.rpc("mark_application_under_review", {
    app_uuid: parsed.data.application_id,
  });
  if (error) {
    console.error("markCompanyUnderReviewAction:", error);
    return { status: "error", message: friendlyRpcError(error) };
  }

  return { status: "success", message: "Application marked as under review." };
}

export async function reviewCompanyApplicationAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Your session has expired. Please log in again." };
  const { supabase } = auth;

  const parsed = reviewSchema.safeParse({
    application_id: formData.get("application_id"),
    status: formData.get("status"),
    feedback: formData.get("feedback") || undefined,
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };

  const { error } = await supabase.rpc("review_application", {
    app_uuid: parsed.data.application_id,
    review_status: parsed.data.status,
    feedback: parsed.data.feedback ?? null,
  });
  if (error) {
    console.error("reviewCompanyApplicationAction:", error);
    return { status: "error", message: friendlyRpcError(error) };
  }

  return {
    status: "success",
    message: parsed.data.status === "accepted" ? "Application accepted." : "Application rejected.",
  };
}
