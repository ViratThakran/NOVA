import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Client for use in client components / browser environment
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}

// Client for use in Server Components, Server Actions, and Route Handlers
export async function createServerSideClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware/proxy refreshing
          // user sessions.
        }
      },
    },
  });
}

// Server-side admin client using service-role or anon JWT for background worker / system tasks
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
  
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // If service role key is not a JWT (starts with eyJ), use the valid anon JWT
  if (!serviceKey || !serviceKey.startsWith("eyJ")) {
    serviceKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      supabaseKey;
  }

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for admin client operations");
  }
  if (!serviceKey) {
    throw new Error("Supabase key is required for admin client operations");
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}



