"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { addCompanyMemberAction, updateCompanyMemberRoleAction, removeCompanyMemberAction } from "../actions";
import { initialCompanyActionState } from "../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function AddMemberForm({ companyId }: { companyId: string }) {
  const [state, formAction, pending] = useActionState(addCompanyMemberAction, initialCompanyActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="company_id" value={companyId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="person@example.com" />
        <p className="text-caption text-text-muted">
          The person must already have a NOVA account under this exact email address.
        </p>
      </div>
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="company_role">Role</Label>
        <Select id="company_role" name="company_role" defaultValue="member">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </Select>
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}
      <Button type="submit" loading={pending} className="self-start">
        Add member
      </Button>
    </form>
  );
}

export function MemberRoleControl({ companyId, memberUserId, currentRole }: { companyId: string; memberUserId: string; currentRole: "admin" | "member" }) {
  const [state, formAction, pending] = useActionState(updateCompanyMemberRoleAction, initialCompanyActionState);
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "member">(currentRole);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="member_user_id" value={memberUserId} />
      <input type="hidden" name="company_role" value={role} />
      <Select
        aria-label="Member role"
        value={role}
        onChange={(event) => setRole(event.target.value as "admin" | "member")}
        className="h-9 w-32"
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </Select>
      <Button type="submit" variant="outline" size="sm" loading={pending} disabled={role === currentRole}>
        Update
      </Button>
      {state.status === "error" && <p role="alert" className="text-caption text-error">{state.message}</p>}
    </form>
  );
}

export function RemoveMemberButton({ companyId, memberUserId }: { companyId: string; memberUserId: string }) {
  const [state, formAction, pending] = useActionState(removeCompanyMemberAction, initialCompanyActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="member_user_id" value={memberUserId} />
      <Button type="submit" variant="destructive" size="sm" loading={pending}>
        Remove
      </Button>
      {state.status === "error" && <p role="alert" className="text-caption text-error">{state.message}</p>}
    </form>
  );
}
