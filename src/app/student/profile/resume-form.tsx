"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { replaceResumeAction } from "../actions";
import { initialProfileActionState } from "../action-state";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ResumeForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(replaceResumeAction, initialProfileActionState);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resume">Replace resume (PDF, up to 5MB)</Label>
        <input
          id="resume"
          name="resume"
          type="file"
          accept="application/pdf"
          required
          className="text-small text-text file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-small file:font-medium file:text-text file:transition-colors hover:file:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="text-small text-success">
          {state.message}
        </p>
      )}

      <Button type="submit" variant="outline" loading={pending} className="self-start">
        Upload new resume
      </Button>
    </form>
  );
}
