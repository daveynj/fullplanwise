import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // tsconfig sets jsx:preserve (for the app's Vite build); tests need JSX
  // actually compiled. Vitest v4 bundles rolldown-vite (oxc transformer),
  // which ignores esbuild options, so override via `oxc` (vitest-only config).
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "jsdom",
    include: ["client/src/**/*.test.{ts,tsx}", "server/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
});
