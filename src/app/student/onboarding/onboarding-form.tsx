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
      <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4 font-mono">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
            1
          </span>
          <GraduationCap className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Academic Background
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="school" className="text-xs text-slate-300">
              Institution / School Name
            </Label>
            <Input
              id="school"
              name="school"
              placeholder="e.g. Stanford University"
              autoComplete="organization"
              required
              className="bg-slate-900 border-slate-800 text-slate-200 text-xs focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="degree" className="text-xs text-slate-300">
              Degree &amp; Major
            </Label>
            <Input
              id="degree"
              name="degree"
              placeholder="e.g. B.S. Computer Science"
              required
              className="bg-slate-900 border-slate-800 text-slate-200 text-xs focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:max-w-xs">
          <Label htmlFor="grad_year" className="text-xs text-slate-300">
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
            className="bg-slate-900 border-slate-800 text-slate-200 text-xs focus:border-indigo-500"
          />
        </div>
      </div>

      {/* STEP 2: TECHNICAL SKILLS */}
      <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4 font-mono">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
            2
          </span>
          <Layers className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Technical Skills &amp; Stack
          </h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="skills" className="text-xs text-slate-300">
            Skills (comma-separated)
          </Label>
          <Input
            id="skills"
            name="skills"
            placeholder="TypeScript, Python, PyTorch, SQL, React"
            required
            className="bg-slate-900 border-slate-800 text-slate-200 text-xs focus:border-indigo-500"
          />
          <p className="text-[11px] text-slate-500">
            List technical languages, frameworks, or tools you work with.
          </p>
        </div>
      </div>

      {/* STEP 3: PDF RESUME UPLOAD */}
      <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4 font-mono">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
            3
          </span>
          <FileText className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            PDF Resume Upload
          </h3>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="resume"
            className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 hover:bg-slate-900 hover:border-indigo-500/50 cursor-pointer transition-all text-center"
          >
            <UploadCloud className="h-8 w-8 text-indigo-400 mb-2" />
            <span className="text-xs font-bold text-slate-200">
              {selectedFileName ? selectedFileName : "Click to select PDF resume file"}
            </span>
            <span className="text-[10px] text-slate-500 mt-1">
              File must be a single PDF up to 5MB
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

      {/* Error alert */}
      {state.status === "error" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-xs font-mono text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          loading={pending}
          disabled={pending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs uppercase font-bold tracking-wider px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting Profile...
            </span>
          ) : (
            "Complete Onboarding & Start →"
          )}
        </Button>
      </div>
    </form>
  );
}
