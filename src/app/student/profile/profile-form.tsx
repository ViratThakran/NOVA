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
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Personal Identity
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="first_name" className="text-xs font-medium text-slate-700">
              First Name
            </Label>
            <Input
              id="first_name"
              name="first_name"
              required
              maxLength={100}
              defaultValue={firstName}
              className="bg-[#F8FAFC] border-slate-200 text-slate-900 text-xs focus:border-sky-400 focus:bg-white rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="last_name" className="text-xs font-medium text-slate-700">
              Last Name
            </Label>
            <Input
              id="last_name"
              name="last_name"
              required
              maxLength={100}
              defaultValue={lastName}
              className="bg-[#F8FAFC] border-slate-200 text-slate-900 text-xs focus:border-sky-400 focus:bg-white rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Academic Background */}
      <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Academic Background
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="school" className="text-xs font-medium text-slate-700">
              Institution / School
            </Label>
            <Input
              id="school"
              name="school"
              autoComplete="organization"
              required
              defaultValue={school}
              className="bg-[#F8FAFC] border-slate-200 text-slate-900 text-xs focus:border-sky-400 focus:bg-white rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="degree" className="text-xs font-medium text-slate-700">
              Degree &amp; Major
            </Label>
            <Input
              id="degree"
              name="degree"
              required
              defaultValue={degree}
              className="bg-[#F8FAFC] border-slate-200 text-slate-900 text-xs focus:border-sky-400 focus:bg-white rounded-xl"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:max-w-xs">
          <Label htmlFor="grad_year" className="text-xs font-medium text-slate-700">
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
            className="bg-[#F8FAFC] border-slate-200 text-slate-900 text-xs focus:border-sky-400 focus:bg-white rounded-xl"
          />
        </div>
      </div>

      {/* Technical Skills Studio */}
      <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Technical Skills ({skillList.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Press Enter or click + to add skill
          </span>
        </div>

        {/* Existing skill chips */}
        {skillList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skillList.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-medium text-sky-800"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="p-0.5 rounded-full hover:bg-sky-200/60 text-sky-600 hover:text-red-600 transition-colors"
                  title={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No skills listed yet.</p>
        )}

        {/* Add Skill Control */}
        <div className="flex items-center gap-2 max-w-sm">
          <Input
            type="text"
            placeholder="e.g. TypeScript, PyTorch, SQL..."
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-[#F8FAFC] border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:border-sky-400 focus:bg-white rounded-xl"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Action status & submit */}
      {state.status === "error" && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{state.message}</span>
        </div>
      )}
      {state.status === "success" && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{state.message}</span>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <Button
          type="submit"
          loading={pending}
          className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors"
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
