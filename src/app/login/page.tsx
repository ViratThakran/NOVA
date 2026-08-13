import type { Metadata } from "next";
import AuthLayout from "@/app/auth/layout";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login — NOVA",
  description: "Log in to your NOVA account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthLayout>
      <LoginForm
        next={params.next}
        resetSuccess={params.reset === "success"}
        callbackError={params.error === "auth_callback_failed"}
      />
    </AuthLayout>
  );
}
