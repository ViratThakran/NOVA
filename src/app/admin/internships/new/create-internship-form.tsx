"use client";

import { useActionState } from "react";
import { createInternshipAction } from "../../actions";
import { initialAdminActionState } from "../../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function CreateInternshipForm() {
  const [state, formAction, pending] = useActionState(createInternshipAction, initialAdminActionState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={200} placeholder="Software Engineering Intern" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required rows={5} placeholder="What this internship involves..." />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="requirements">Requirements</Label>
        <Textarea id="requirements" name="requirements" required rows={4} placeholder="Skills or experience needed..." />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="eligibility">Eligibility</Label>
        <Textarea id="eligibility" name="eligibility" required rows={3} placeholder="Who can apply..." />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}

      <Button type="submit" loading={pending} className="self-start">
        Create internship
      </Button>
    </form>
  );
}
