import type { Metadata } from "next";
import { createServerSideClient } from "@/lib/supabase";
import { PageHeader } from "@/components/app/page-header";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Reset password — NOVA" };

export default async function ResetPasswordPage() {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Reaching this page with an active session means /auth/callback already
  // exchanged a valid recovery link for one. No session means the link was
  // missing, already used, or expired.
  if (!user) {
    return (
      <PageHeader
        title="Reset link expired"
        description="This password reset link has expired or is invalid. Please request a new one from the forgot password page."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reset your password" description="Choose a new password for your account." />
      <ResetPasswordForm />
    </div>
  );
}
