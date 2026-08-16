"use client";

import { useActionState } from "react";
import { createCourseAction } from "../../actions";
import { initialAdminActionState } from "../../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_LEVELS } from "@/lib/catalog-options";

interface CreateCourseFormProps {
  programs: { id: string; name: string }[];
  defaultProgramId?: string;
}

export function CreateCourseForm({ programs, defaultProgramId }: CreateCourseFormProps) {
  const [state, formAction, pending] = useActionState(createCourseAction, initialAdminActionState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="program_id">Program</Label>
        <Select id="program_id" name="program_id" required defaultValue={defaultProgramId ?? ""}>
          <option value="" disabled>
            Select a program
          </option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={200} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" required maxLength={100} />
        <p className="text-caption text-text-muted">Lowercase letters, numbers, and hyphens only. Must be unique within the program.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required rows={2} maxLength={2000} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="overview">Overview (optional)</Label>
        <Textarea id="overview" name="overview" rows={3} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="prerequisites">Prerequisites (optional)</Label>
        <Textarea id="prerequisites" name="prerequisites" rows={2} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="learning_outcomes">Learning outcomes</Label>
        <Textarea id="learning_outcomes" name="learning_outcomes" rows={3} placeholder="One outcome per line" />
        <p className="text-caption text-text-muted">One per line.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="level">Level</Label>
          <Select id="level" name="level" required defaultValue="">
            <option value="" disabled>
              Select a level
            </option>
            {DIFFICULTY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="duration_hours">Duration (hours)</Label>
          <Input id="duration_hours" name="duration_hours" type="number" min={1} required />
        </div>
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
        Create course
      </Button>
    </form>
  );
}
