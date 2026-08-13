"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "../actions";
import { initialAuthActionState } from "../action-state";
import { PageHeader } from "@/components/app/page-header";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialAuthActionState);

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Check your email" description={state.message} />
        <Link href="/login" className="text-small font-medium text-primary hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Forgot your password?" description="We'll send you a link to reset it." />

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        {state.status === "error" && (
          <p role="alert" className="text-small text-error">
            {state.message}
          </p>
        )}

        <Button type="submit" loading={pending} className="mt-2">
          Send reset link
        </Button>
      </form>

      <Link href="/login" className="text-small font-medium text-primary hover:underline">
        Back to login
      </Link>
    </div>
  );
}
