"use client";

import { useActionState } from "react";
import { createProgramAction } from "../../actions";
import { initialAdminActionState } from "../../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PROGRAM_CATEGORIES, DIFFICULTY_LEVELS } from "@/lib/catalog-options";

export function CreateProgramForm() {
  const [state, formAction, pending] = useActionState(createProgramAction, initialAdminActionState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required maxLength={200} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" required maxLength={100} />
        <p className="text-caption text-text-muted">Lowercase letters, numbers, and hyphens only.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="short_description">Short description</Label>
        <Textarea id="short_description" name="short_description" required rows={2} maxLength={300} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="long_description">Long description</Label>
        <Textarea id="long_description" name="long_description" required rows={4} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="overview">Overview (optional)</Label>
        <Textarea id="overview" name="overview" rows={3} placeholder="How the program is structured." />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="prerequisites">Prerequisites (optional)</Label>
        <Textarea id="prerequisites" name="prerequisites" rows={2} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" required defaultValue="">
            <option value="" disabled>
              Select a category
            </option>
            {PROGRAM_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select id="difficulty" name="difficulty" required defaultValue="">
            <option value="" disabled>
              Select a difficulty
            </option>
            {DIFFICULTY_LEVELS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="duration_weeks">Duration (weeks)</Label>
        <Input id="duration_weeks" name="duration_weeks" type="number" min={1} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="career_outcomes">Career outcomes</Label>
        <Textarea id="career_outcomes" name="career_outcomes" rows={3} placeholder="One role title per line" />
        <p className="text-caption text-text-muted">One per line, e.g. &quot;Data Analyst&quot;.</p>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="display_order">Display order</Label>
        <Input id="display_order" name="display_order" type="number" min={0} defaultValue={0} />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}

      <Button type="submit" loading={pending} className="self-start">
        Create program
      </Button>
    </form>
  );
}
