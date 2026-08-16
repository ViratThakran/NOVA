"use client";

import { useActionState } from "react";
import { updateProgramSkillsAction } from "../../actions";
import { initialAdminActionState } from "../../action-state";
import { Button } from "@/components/ui/button";

interface Skill {
  id: string;
  name: string;
  category: string;
}

export function SkillsManager({
  programId,
  allSkills,
  selectedSkillIds,
}: {
  programId: string;
  allSkills: Skill[];
  selectedSkillIds: string[];
}) {
  const [state, formAction, pending] = useActionState(updateProgramSkillsAction, initialAdminActionState);

  const byCategory = new Map<string, Skill[]>();
  for (const skill of allSkills) {
    const list = byCategory.get(skill.category) ?? [];
    list.push(skill);
    byCategory.set(skill.category, list);
  }
  const selected = new Set(selectedSkillIds);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="program_id" value={programId} />

      <div className="flex max-h-80 flex-col gap-4 overflow-y-auto rounded-md border border-border p-3">
        {[...byCategory.entries()].map(([category, skills]) => (
          <div key={category} className="flex flex-col gap-1.5">
            <h4 className="text-caption font-semibold uppercase text-text-muted">{category.replace(/_/g, " ")}</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {skills.map((skill) => (
                <label key={skill.id} className="flex items-center gap-1.5 text-small text-text">
                  <input type="checkbox" name="skill_ids" value={skill.id} defaultChecked={selected.has(skill.id)} className="h-4 w-4 rounded border-border" />
                  {skill.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}

      <Button type="submit" variant="outline" size="sm" loading={pending} className="self-start">
        Save skills
      </Button>
    </form>
  );
}
