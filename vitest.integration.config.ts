import { defineConfig, loadEnv } from "vite";
import path from "path";

// Integration test config: requires local Supabase running
// Run with: npm run test:integration
export default defineConfig(({ mode }) => ({
  test: {
    environment: "node",
    globals: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30000,
    // Load NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY etc.
    // from .env.local (and other Vite-convention env files) into process.env
    // for the test run, without hard-coding or committing any values.
    env: loadEnv(mode, process.cwd(), ""),
  },
}));
