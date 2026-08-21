"use client";

import React, { useState, useActionState } from "react";
import { updateStudentProfileAction } from "../actions";
import { initialProfileActionState } from "../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface StudentProfileFormProps {
  firstName: string;
  lastName: string;
  school: string;
  degree: string;
  gradYear: number;
  skills: string[];
}

export function StudentProfileForm({
  firstName,
  lastName,
  school,
  degree,
  gradYear,
  skills: initialSkills,
}: StudentProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateStudentProfileAction, initialProfileActionState);
  const [skillList, setSkillList] = useState<string[]>(initialSkills);
  const [newSkillInput, setNewSkillInput] = useState<string>("");

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (skillList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillInput("");
      return;
    }
    setSkillList([...skillList, trimmed]);
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillList(skillList.filter((s) => s !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {/* Hidden input for comma-separated skills so updateStudentProfileAction receives expected payload */}
      <input type="hidden" name="skills" value={skillList.join(", ")} />

      {/* Personal Identity */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          Personal Identity
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 font-mono">
            <Label htmlFor="first_name" className="text-xs text-slate-300">
              First Name
            </Label>
            <Input
              id="first_name"
              name="first_name"
              required
              maxLength={100}
              defaultValue={firstName}
              className="bg-slate-900 border-slate-800 text-slate-200 text-xs focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5 font-mono">
            <Label htmlFor="last_name" className="text-xs text-slate-300">
              Last Name
            </Label>
            <Input
              id="last_name"
              name="last_name"
              required
              maxLength={100}
              defaultValue={lastName}
              className="bg-slate-900 border-slate-800 text-slate-200 text-xs focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Academic Background */}
      <div className="flex flex-col gap-4 pt-4 border-t border-slate-800/80">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          Academic Background
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 font-mono">
            <Label htmlFor="school" className="text-xs text-slate-300">
              Institution / School
            </Label>
            <Input
              id="school"
              name="school"
              autoComplete="organization"
              required
              defaultValue={school}
              className="bg-slate-900 border-slate-800 text-slate-200 text-xs focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5 font-mono">
            <Label htmlFor="degree" className="text-xs text-slate-300">
              Degree &amp; Major
            </Label>
            <Input
              id="degree"
              name="degree"
              required
              defaultValue={degree}
              className="bg-slate-900 border-slate-800 text-slate-200 text-xs focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:max-w-xs font-mono">
          <Label htmlFor="grad_year" className="text-xs text-slate-300">
            Graduation Year
          </Label>
          <Input
            id="grad_year"
            name="grad_year"
            type="number"
            min={2000}
            max={2100}
            required
            defaultValue={gradYear}
            className="bg-slate-900 border-slate-800 text-slate-200 text-xs focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Technical Skills Studio */}
      <div className="flex flex-col gap-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Technical Skills ({skillList.length})
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            Press Enter or click + to add skill
          </span>
        </div>

        {/* Existing skill chips */}
        {skillList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skillList.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 font-mono text-xs text-indigo-300"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                  title={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs font-mono text-slate-500 italic">No skills listed yet.</p>
        )}

        {/* Add Skill Control */}
        <div className="flex items-center gap-2 max-w-sm">
          <Input
            type="text"
            placeholder="e.g. TypeScript, PyTorch, SQL..."
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-slate-900 border-slate-800 text-slate-200 text-xs focus:border-indigo-500 font-mono"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold uppercase transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Action status & submit */}
      {state.status === "error" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-xs font-mono text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}
      {state.status === "success" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs font-mono text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <Button
          type="submit"
          loading={pending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs uppercase font-bold tracking-wider px-5 py-2.5 rounded-lg shadow-lg shadow-indigo-600/20"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving Changes...
            </span>
          ) : (
            "Save Profile Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
