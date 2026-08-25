"use client";

import { useEffect, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { replaceResumeAction } from "../actions";
import { initialProfileActionState } from "../action-state";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function ResumeForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(replaceResumeAction, initialProfileActionState);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      setSelectedFileName(null);
    }
  }, [state.status, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFileName(e.target.files[0].name);
    } else {
      setSelectedFileName(null);
    }
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="resume"
          className="flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-sky-200 bg-sky-50/40 hover:bg-sky-50 hover:border-sky-400 cursor-pointer transition-all text-center"
        >
          <UploadCloud className="h-6 w-6 text-sky-600 mb-1.5" />
          <span className="text-xs font-bold text-slate-800">
            {selectedFileName ? selectedFileName : "Choose PDF Resume File"}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            Single file · PDF format up to 5MB
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

      {state.status === "error" && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{state.message}</span>
        </div>
      )}
      {state.status === "success" && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{state.message}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="outline"
        loading={pending}
        disabled={!selectedFileName || pending}
        className="w-full bg-[#0F172A] hover:bg-slate-800 border-transparent text-white text-xs font-semibold py-2.5 rounded-xl shadow-xs transition-colors"
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading PDF...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-sky-400" />
            Upload Selected Resume
          </span>
        )}
      </Button>
    </form>
  );
}
