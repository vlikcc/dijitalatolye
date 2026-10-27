import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/server/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://app:local-only@127.0.0.1:55432/dijital",
  },
});
