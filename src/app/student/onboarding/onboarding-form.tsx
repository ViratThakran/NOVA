"use client";

import { useActionState } from "react";
import { completeOnboardingAction } from "../actions";
import { initialOnboardingActionState } from "../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CURRENT_YEAR = new Date().getFullYear();

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialOnboardingActionState);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="school">School</Label>
          <Input id="school" name="school" autoComplete="organization" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="degree">Degree</Label>
          <Input id="degree" name="degree" required />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="grad_year">Graduation year</Label>
        <Input id="grad_year" name="grad_year" type="number" min={2000} max={2100} defaultValue={CURRENT_YEAR} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="skills">Skills</Label>
        <Input id="skills" name="skills" placeholder="TypeScript, SQL, Figma" required />
        <p className="text-caption text-text-muted">Separate skills with commas.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resume">Resume (PDF, up to 5MB)</Label>
        <input
          id="resume"
          name="resume"
          type="file"
          accept="application/pdf"
          required
          className="text-small text-text file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-small file:font-medium file:text-text file:transition-colors hover:file:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}

      <Button type="submit" loading={pending} className="self-start">
        Complete onboarding
      </Button>
    </form>
  );
}
