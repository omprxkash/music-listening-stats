import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// The client lives in src/client and talks to the Express API on port 3000.
// In dev I just proxy the API calls across so everything feels like one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/auth": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
