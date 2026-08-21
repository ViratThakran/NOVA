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
          className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 hover:bg-slate-900 hover:border-indigo-500/50 cursor-pointer transition-all text-center"
        >
          <UploadCloud className="h-6 w-6 text-indigo-400 mb-1.5" />
          <span className="text-xs font-mono font-bold text-slate-200">
            {selectedFileName ? selectedFileName : "Choose PDF Resume File"}
          </span>
          <span className="text-[10px] font-mono text-slate-500 mt-0.5">
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
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-xs font-mono text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}
      {state.status === "success" && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs font-mono text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="outline"
        loading={pending}
        disabled={!selectedFileName || pending}
        className="w-full bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 font-mono text-xs uppercase font-bold tracking-wider py-2"
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading PDF...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            Upload Selected Resume
          </span>
        )}
      </Button>
    </form>
  );
}
