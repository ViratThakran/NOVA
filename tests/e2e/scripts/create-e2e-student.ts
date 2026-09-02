/**
 * E2E Environment Setup Script
 *
 * Run this ONCE to create the dedicated E2E student account in Supabase.
 * Credentials are stored in .env.local (gitignored).
 *
 * Usage:
 *   npx tsx tests/e2e/scripts/create-e2e-student.ts
 *
 * After running, add to .env.local:
 *   E2E_STUDENT_EMAIL=nova.e2e.test+student@gmail.com
 *   E2E_STUDENT_PASSWORD=<generated_password>
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const E2E_EMAIL = process.env.E2E_STUDENT_EMAIL || "nova.e2e.test+student@gmail.com";
const E2E_PASSWORD = process.env.E2E_STUDENT_PASSWORD || "E2E_Nova_Test_2026!";

async function createE2EStudent() {
  console.log("\n========================================");
  console.log("  NOVA E2E Student Account Setup");
  console.log("========================================\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Try to sign up
  console.log(`[1/4] Creating auth user: ${E2E_EMAIL}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
    options: {
      data: {
        first_name: "E2E",
        last_name: "TestStudent",
      },
    },
  });

  if (signUpError) {
    if (signUpError.message.includes("already registered") || signUpError.message.includes("already exists")) {
      console.log("   ✓ User already exists — will use existing account.");
    } else {
      console.error("   ✗ Signup failed:", signUpError.message);
      process.exit(1);
    }
  } else {
    console.log("   ✓ Auth user created:", signUpData.user?.id);
  }

  // Sign in to get session
  console.log("[2/4] Signing in as E2E student...");
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
  });

  if (signInError || !session.user) {
    console.error("   ✗ Sign-in failed:", signInError?.message);
    console.log("\n   If the account exists but credentials fail, check E2E_STUDENT_PASSWORD in .env.local");
    process.exit(1);
  }

  const userId = session.user.id;
  console.log("   ✓ Signed in as:", userId);

  // Check if profile exists
  console.log("[3/4] Ensuring student profile exists...");
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, onboarded")
    .eq("id", userId)
    .maybeSingle();

  if (!existingProfile) {
    console.log("   Profile not found — must be created by Supabase trigger. Wait and re-run.");
  } else {
    console.log("   ✓ Profile exists. Onboarded:", existingProfile.onboarded);
  }

  // Check role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const hasStudentRole = roles?.some((r) => r.role === "student");
  console.log("   Roles:", roles?.map((r) => r.role).join(", ") || "(none)");

  if (!hasStudentRole) {
    console.log("\n⚠ WARNING: E2E student does not have 'student' role.");
    console.log("  A NOVA admin must grant this role via the admin panel before E2E tests can run.");
  }

  console.log("\n[4/4] .env.local entries needed:");
  console.log("─".repeat(40));
  console.log(`E2E_STUDENT_EMAIL=${E2E_EMAIL}`);
  console.log(`E2E_STUDENT_PASSWORD=${E2E_PASSWORD}`);
  console.log("─".repeat(40));

  console.log("\n✅ E2E student account setup complete.");
  console.log("   Add the above lines to your .env.local and run: npm run test:e2e\n");
}

createE2EStudent().catch(console.error);
