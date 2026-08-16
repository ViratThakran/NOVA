"use client";

import { useActionState } from "react";
import { updateProgramAction } from "../../actions";
import { initialAdminActionState } from "../../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PROGRAM_CATEGORIES, DIFFICULTY_LEVELS } from "@/lib/catalog-options";

interface EditProgramFormProps {
  program: {
    id: string;
    slug: string;
    name: string;
    short_description: string;
    long_description: string;
    overview: string | null;
    prerequisites: string | null;
    category: string;
    difficulty: string;
    duration_weeks: number;
    career_outcomes: string[];
    display_order: number;
  };
}

export function EditProgramForm({ program }: EditProgramFormProps) {
  const [state, formAction, pending] = useActionState(updateProgramAction, initialAdminActionState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="program_id" value={program.id} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required maxLength={200} defaultValue={program.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" required maxLength={100} defaultValue={program.slug} />
        <p className="text-caption text-text-muted">Lowercase letters, numbers, and hyphens only.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="short_description">Short description</Label>
        <Textarea id="short_description" name="short_description" required rows={2} maxLength={300} defaultValue={program.short_description} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="long_description">Long description</Label>
        <Textarea id="long_description" name="long_description" required rows={4} defaultValue={program.long_description} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="overview">Overview</Label>
        <Textarea id="overview" name="overview" rows={3} defaultValue={program.overview ?? ""} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="prerequisites">Prerequisites</Label>
        <Textarea id="prerequisites" name="prerequisites" rows={2} defaultValue={program.prerequisites ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" required defaultValue={program.category}>
            {PROGRAM_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select id="difficulty" name="difficulty" required defaultValue={program.difficulty}>
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
        <Input id="duration_weeks" name="duration_weeks" type="number" min={1} required defaultValue={program.duration_weeks} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="career_outcomes">Career outcomes</Label>
        <Textarea id="career_outcomes" name="career_outcomes" rows={3} defaultValue={program.career_outcomes.join("\n")} />
        <p className="text-caption text-text-muted">One per line, e.g. &quot;Data Analyst&quot;.</p>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="display_order">Display order</Label>
        <Input id="display_order" name="display_order" type="number" min={0} defaultValue={program.display_order} />
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
