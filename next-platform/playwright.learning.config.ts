import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: "learning.spec.ts",
  outputDir: ".data/learning-playwright",
  reporter: [["list"], ["html", { outputFolder: ".data/learning-playwright-report", open: "never" }]],
});
