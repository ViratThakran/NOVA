/**
 * E2E Account Confirmation Script
 *
 * Uses the Supabase admin API to confirm the E2E test student's email,
 * bypassing the email verification flow.
 *
 * This is safe for test accounts only — never use on production user accounts.
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role equivalent — in this project, SUPABASE_SERVICE_ROLE_KEY falls back to anon key
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const E2E_EMAIL = process.env.E2E_STUDENT_EMAIL || "nova.e2e.test+student@gmail.com";
const E2E_PASSWORD = process.env.E2E_STUDENT_PASSWORD || "E2E_Nova_Test_2026!";
const E2E_USER_ID = "2d7b5bd0-eb7e-4cc6-8f6d-4f5919d77f20"; // Created in previous step

async function confirmAndSetupE2EStudent() {
  console.log("\n========================================");
  console.log("  NOVA E2E Account Confirmation");
  console.log("========================================\n");

  // Try to use the admin.updateUserById to confirm email
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  console.log("[1/3] Attempting admin email confirmation for:", E2E_EMAIL);
  const { error: updateError } = await supabase.auth.admin.updateUserById(E2E_USER_ID, {
    email_confirm: true,
  });

  if (updateError) {
    console.log("   Admin API not available with anon key (expected):", updateError.message);
    console.log("\n   MANUAL STEP REQUIRED:");
    console.log("   1. Log into Supabase Dashboard: https://supabase.com/dashboard");
    console.log("   2. Go to Authentication → Users");
    console.log(`   3. Find user: ${E2E_EMAIL}`);
    console.log("   4. Click 'Send confirmation email' OR manually confirm");
    console.log("\n   Alternatively, disable email confirmation in:");
    console.log("   Supabase Dashboard → Authentication → Settings → Disable 'Confirm email'");
    console.log("\n   After confirming, re-run: npm run test:e2e:setup");
    process.exit(1);
  }

  console.log("   ✓ Email confirmed via admin API");

  // Now try signing in
  console.log("[2/3] Verifying sign-in after confirmation...");
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
  });

  if (signInError || !session.user) {
    console.error("   ✗ Sign-in still failing:", signInError?.message);
    process.exit(1);
  }

  console.log("   ✓ E2E student sign-in confirmed");
  console.log("[3/3] E2E account ready. Run: npm run test:e2e");
}

confirmAndSetupE2EStudent().catch(console.error);
