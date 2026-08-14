"use client";

import { useActionState } from "react";
import { updateCompanyProfileAction } from "../actions";
import { initialCompanyActionState } from "../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function CompanyProfileForm({ companyId, name, description }: { companyId: string; name: string; description: string | null }) {
  const [state, formAction, pending] = useActionState(updateCompanyProfileAction, initialCompanyActionState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="company_id" value={companyId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Company name</Label>
        <Input id="name" name="name" required maxLength={200} defaultValue={name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={description ?? ""} />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="text-small text-success">
          {state.message}
        </p>
      )}

      <Button type="submit" loading={pending} className="self-start">
        Save changes
      </Button>
    </form>
  );
}
