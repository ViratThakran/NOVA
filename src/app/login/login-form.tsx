"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/auth/actions";
import { initialAuthActionState } from "@/app/auth/action-state";
import { PageHeader } from "@/components/app/page-header";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface LoginFormProps {
  next?: string;
  resetSuccess?: boolean;
  callbackError?: boolean;
}

export function LoginForm({ next, resetSuccess, callbackError }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialAuthActionState);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Log in" description="Welcome back to NOVA." />

      {resetSuccess && (
        <p className="text-small text-success">Your password has been updated. Log in with your new password.</p>
      )}
      {callbackError && (
        <p role="alert" className="text-small text-error">
          That link didn&apos;t work. Please try again.
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {next && <input type="hidden" name="next" value={next} />}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/auth/forgot-password" className="text-caption font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>

        {state.status === "error" && (
          <p role="alert" className="text-small text-error">
            {state.message}
          </p>
        )}

        <Button type="submit" loading={pending} className="mt-2">
          Log in
        </Button>
      </form>

      <p className="text-small text-text-muted">
        New to NOVA?{" "}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
