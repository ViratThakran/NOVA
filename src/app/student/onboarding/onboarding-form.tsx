"use client";

import { useActionState, useState } from "react";
import { completeOnboardingAction } from "../actions";
import { initialOnboardingActionState } from "../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GraduationCap, Layers, FileText, UploadCloud, AlertCircle, Loader2 } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialOnboardingActionState);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFileName(e.target.files[0].name);
    } else {
      setSelectedFileName(null);
    }
  };

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {/* STEP 1: ACADEMIC BACKGROUND */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold">
            1
          </span>
          <GraduationCap className="h-4 w-4 text-sky-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Academic Background
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="school" className="text-xs font-medium text-slate-700">
              Institution / School Name
            </Label>
            <Input
              id="school"
              name="school"
              placeholder="e.g. Stanford University"
              autoComplete="organization"
              required
              className="bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:border-sky-400 focus:bg-white rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="degree" className="text-xs font-medium text-slate-700">
              Degree &amp; Major
            </Label>
            <Input
              id="degree"
              name="degree"
              placeholder="e.g. B.S. Computer Science"
              required
              className="bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:border-sky-400 focus:bg-white rounded-xl"
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
            defaultValue={CURRENT_YEAR}
            required
            className="bg-slate-50/80 border-slate-200 text-slate-900 text-xs focus:border-sky-400 focus:bg-white rounded-xl"
          />
        </div>
      </div>

      {/* STEP 2: TECHNICAL SKILLS */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold">
            2
          </span>
          <Layers className="h-4 w-4 text-sky-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Technical Skills &amp; Stack
          </h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="skills" className="text-xs font-medium text-slate-700">
            Skills (comma-separated)
          </Label>
          <Input
            id="skills"
            name="skills"
            placeholder="e.g. TypeScript, React, Next.js, Python, PostgreSQL, Figma"
            required
            className="bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:border-sky-400 focus:bg-white rounded-xl"
          />
          <span className="text-[11px] text-slate-400">
            Enter technologies, frameworks, and tools you have experience with.
          </span>
        </div>
      </div>

      {/* STEP 3: RESUME UPLOAD */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold">
            3
          </span>
          <FileText className="h-4 w-4 text-sky-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Upload PDF Resume
          </h3>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="resume"
            className="flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 hover:bg-sky-50 hover:border-sky-400 cursor-pointer transition-all text-center"
          >
            <UploadCloud className="h-7 w-7 text-sky-600 mb-2" />
            <span className="text-xs font-bold text-slate-800">
              {selectedFileName ? selectedFileName : "Choose PDF Resume File"}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Single file · PDF format up to 5MB · Stored securely
            </span>
            <input
              id="resume"
              name="resume"
              type="file"
              accept="application/pdf"
              required
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* ERROR STATUS */}
      {state.status === "error" && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-red-50/90 border border-red-200 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{state.message}</span>
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <div className="flex items-center justify-end pt-2">
        <Button
          type="submit"
          loading={pending}
          disabled={pending}
          className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold px-6 py-3 rounded-xl shadow-xs transition-colors"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Completing Onboarding...
            </span>
          ) : (
            "Complete Profile & Enter Portal →"
          )}
        </Button>
      </div>
    </form>
  );
}
