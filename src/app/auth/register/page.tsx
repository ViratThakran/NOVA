"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "../actions";
import { initialAuthActionState } from "../action-state";
import { PageHeader } from "@/components/app/page-header";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialAuthActionState);

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
      <PageHeader title="Create your account" description="Join NOVA as a student." />

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" name="first_name" autoComplete="given-name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" name="last_name" autoComplete="family-name" required />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          <p className="text-caption text-text-muted">At least 8 characters, with a letter and a number.</p>
        </div>

        {state.status === "error" && (
          <p role="alert" className="text-small text-error">
            {state.message}
          </p>
        )}

        <Button type="submit" loading={pending} className="mt-2">
          Create account
        </Button>
      </form>

      <p className="text-small text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
