"use client";

import { useActionState } from "react";
import { createCompanyAction } from "../actions";
import { initialCompanyActionState } from "../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function CreateCompanyForm() {
  const [state, formAction, pending] = useActionState(createCompanyAction, initialCompanyActionState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Company name</Label>
        <Input id="name" name="name" required maxLength={200} autoComplete="organization" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" rows={4} maxLength={2000} placeholder="What does your company do?" />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}

      <Button type="submit" loading={pending} className="self-start">
        Create company
      </Button>
    </form>
  );
}
