"use client";

import { useActionState } from "react";
import { submitContactAction } from "./actions";
import { initialContactActionState } from "./action-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, initialContactActionState);

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-2 rounded-card border border-border p-6">
        <p className="text-body font-medium text-text">Message sent</p>
        <p className="text-small text-text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-small font-medium text-text">
          Name
        </label>
        <Input id="name" name="name" required maxLength={200} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-small font-medium text-text">
          Email
        </label>
        <Input id="email" name="email" type="email" required maxLength={320} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="company" className="text-small font-medium text-text">
          Company (optional)
        </label>
        <Input id="company" name="company" maxLength={200} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-small font-medium text-text">
          Message
        </label>
        <Textarea id="message" name="message" required maxLength={5000} rows={5} />
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-caption text-error">
          {state.message}
        </p>
      )}
      <Button type="submit" variant="primary" loading={pending}>
        Send message
      </Button>
    </form>
  );
}
