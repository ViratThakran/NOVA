import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireCompanyAccess } from "@/lib/auth";
import { AddMemberForm, MemberRoleControl, RemoveMemberButton } from "./member-actions";

export const metadata: Metadata = { title: "Members — NOVA Company" };

interface MemberRow {
  user_id: string;
  company_role: "owner" | "admin" | "member";
  created_at: string;
}

interface MemberProfile {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export default async function CompanyMembersPage() {
  const { supabase, user, companyId, companyRole } = await requireCompanyAccess();

  const [{ data: members, error }, { data: profiles }] = await Promise.all([
    supabase
      .from("company_members")
      .select("user_id, company_role, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true }),
    // Fellow members' names/emails have no RLS path through `profiles`
    // directly (see Phase 5B-2 report) — resolved instead via the
    // narrowly-scoped company_member_profiles() RPC (Phase 5B-3), which
    // re-verifies the caller's own membership in target_company_id itself.
    supabase.rpc("company_member_profiles", { target_company_id: companyId }),
  ]);

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Members" />
        <ErrorState title="Couldn't load members" description="Something went wrong. Please try again." />
      </div>
    );
  }

  const canManage = companyRole === "owner" || companyRole === "admin";
  const rows = (members ?? []) as unknown as MemberRow[];
  const profileByUserId = new Map(((profiles ?? []) as MemberProfile[]).map((p) => [p.user_id, p]));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Members" description="Manage who has access to this company." />

      {canManage && (
        <Card className="max-w-xl">
          <CardContent className="p-6">
            <AddMemberForm companyId={companyId} />
          </CardContent>
        </Card>
      )}

      {rows.length === 0 ? (
        <EmptyState title="No members found" description="Company membership will appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((member) => {
            const isSelf = member.user_id === user.id;
            const profile = profileByUserId.get(member.user_id);
            const label = profile
              ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email
              : `User ${member.user_id.slice(0, 8)}…`;
            return (
              <Card key={member.user_id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-small font-medium text-text">
                      {label} {isSelf && <span className="text-caption text-text-muted">(you)</span>}
                    </span>
                    <Badge variant={member.company_role === "owner" ? "primary" : "default"}>{member.company_role}</Badge>
                  </div>
                  {canManage && member.company_role !== "owner" && !isSelf && (
                    <div className="flex items-center gap-2">
                      <MemberRoleControl companyId={companyId} memberUserId={member.user_id} currentRole={member.company_role} />
                      <RemoveMemberButton companyId={companyId} memberUserId={member.user_id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
