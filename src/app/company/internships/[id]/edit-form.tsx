"use client";

import { useActionState } from "react";
import { updateCompanyInternshipAction } from "../../actions";
import { initialCompanyActionState } from "../../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface InternshipContent {
  id: string;
  title: string;
  description: string;
  requirements: string;
  eligibility: string;
}

export function EditCompanyInternshipForm({ internship }: { internship: InternshipContent }) {
  const [state, formAction, pending] = useActionState(updateCompanyInternshipAction, initialCompanyActionState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="internship_id" value={internship.id} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={200} defaultValue={internship.title} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required rows={5} defaultValue={internship.description} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="requirements">Requirements</Label>
        <Textarea id="requirements" name="requirements" required rows={4} defaultValue={internship.requirements} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="eligibility">Eligibility</Label>
        <Textarea id="eligibility" name="eligibility" required rows={3} defaultValue={internship.eligibility} />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}

      <Button type="submit" loading={pending} className="self-start">
        Save changes
      </Button>
    </form>
  );
}
