import { defineConfig } from "vitest/config";
import path from "path";

// Integration test config: requires local Supabase running
// Run with: npm run test:integration
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30000,
  },
});
