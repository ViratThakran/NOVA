"use client";

import { useActionState } from "react";
import { updateStudentProfileAction } from "../actions";
import { initialProfileActionState } from "../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StudentProfileFormProps {
  firstName: string;
  lastName: string;
  school: string;
  degree: string;
  gradYear: number;
  skills: string[];
}

export function StudentProfileForm({ firstName, lastName, school, degree, gradYear, skills }: StudentProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateStudentProfileAction, initialProfileActionState);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" name="first_name" required maxLength={100} defaultValue={firstName} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" name="last_name" required maxLength={100} defaultValue={lastName} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="school">School</Label>
          <Input id="school" name="school" autoComplete="organization" required defaultValue={school} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="degree">Degree</Label>
          <Input id="degree" name="degree" required defaultValue={degree} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="grad_year">Graduation year</Label>
        <Input id="grad_year" name="grad_year" type="number" min={2000} max={2100} required defaultValue={gradYear} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="skills">Skills</Label>
        <Input id="skills" name="skills" placeholder="TypeScript, SQL, Figma" required defaultValue={skills.join(", ")} />
        <p className="text-caption text-text-muted">Separate skills with commas.</p>
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
