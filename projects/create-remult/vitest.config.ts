import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config();

export default defineConfig({
  test: {
    include: ["./src/tests/**/*.spec.ts"],
    reporters: ["default", "junit"],
    outputFile: "./test-results.xml",
    globals: false,
    testTimeout: 60000,
    coverage: {
      enabled: false,
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["projects/core/**"],
    },
  },
});
