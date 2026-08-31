import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Server-only client for durable AI/background work. Never import from client components. */
export function createAiWorkerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("AI worker is not configured: SUPABASE_SECRET_KEY is missing.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
