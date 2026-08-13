import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Unit tests only — integration tests require a running Supabase instance
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["tests/integration/**"],
  },
});
