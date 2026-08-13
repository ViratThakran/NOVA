import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSideClient } from "@/lib/supabase";

// Exchanges the PKCE `code` Supabase's email links redirect back with for a
// real session (cookies are written by createServerSideClient() itself, via
// the same cookie-bridging used everywhere else — no second auth client).
// `next` is set by the caller (see registerAction's emailRedirectTo and
// forgotPasswordAction's redirectTo in src/app/auth/actions.ts) to control
// where this lands: /student/onboarding after a confirmed signup,
// /auth/reset-password after a password-recovery link.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/student/dashboard";

  if (code) {
    const supabase = await createServerSideClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
    console.error("auth/callback exchangeCodeForSession:", error);
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", origin));
}
