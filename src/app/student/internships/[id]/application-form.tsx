"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { submitApplicationAction } from "../../actions";
import { initialApplicationActionState } from "../../action-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ApplicationForm({ internshipId }: { internshipId: string }) {
  const [state, formAction, pending] = useActionState(submitApplicationAction, initialApplicationActionState);
  const router = useRouter();

  // On success the student now has an application against this internship —
  // refresh the server component so it re-queries and swaps this form out
  // for the application-status view, rather than duplicating that logic here.
  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="internship_id" value={internshipId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cover_letter">Cover letter</Label>
        <Textarea
          id="cover_letter"
          name="cover_letter"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder="Tell us why you're a good fit for this internship..."
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}

      {state.status === "success" ? (
        <p role="status" className="text-small text-success">
          {state.message}
        </p>
      ) : (
        <Button type="submit" loading={pending} className="self-start">
          Submit application
        </Button>
      )}
    </form>
  );
}
