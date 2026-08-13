import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Passive session refresh for cookies
  const { data: { user } } = await supabase.auth.getUser();

  // Route protection UX checks only — an optimistic redirect, not the
  // security boundary. Every table's real access control is enforced by
  // RLS (see supabase/migrations) regardless of what happens here; the
  // per-role check (student vs admin) also can't happen here at all, since
  // role isn't part of the JWT — that's done server-side in the matching
  // layout via requireRole() (see src/lib/auth.ts).
  const path = request.nextUrl.pathname;
  const isProtectedArea = path.startsWith("/student") || path.startsWith("/admin");
  const isAuthEntryPoint = path === "/login" || path.startsWith("/auth/register");

  if (!user && isProtectedArea) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthEntryPoint) {
    const url = request.nextUrl.clone();
    // Role-specific placement (student vs admin) happens server-side in the
    // destination layout, which redirects again if this guess is wrong.
    url.pathname = "/student/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
