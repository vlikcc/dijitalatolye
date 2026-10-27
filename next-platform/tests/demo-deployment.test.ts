import { afterEach, expect, it, vi } from "vitest";
import { settings } from "../src/server/env";
import { requireUploads } from "../src/server/demo-deployment";
import { authorizeAsset, gameUrl } from "../src/modules/game-access";

afterEach(() => vi.unstubAllEnvs());
function production() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("DEPLOYMENT_ENV", "");
  vi.stubEnv("APP_URL", "https://doa.example.com");
  vi.stubEnv("GAME_BASE_DOMAIN", "games.example.com");
  for (const key of ["BETTER_AUTH_SECRET", "PREVIEW_SECRET", "INTERNAL_SECRET"])
    vi.stubEnv(key, "test-only-secret-with-at-least-32-characters");
}
it("single-domain demo keeps HTTPS and disables uploaded game delivery", async () => {
  production();
  vi.stubEnv("BUNDLED_DEMO_ONLY", "true");
  expect(settings().production).toBe(true);
  expect(() => requireUploads()).toThrow();
  expect(() => gameUrl("id", "index.html")).toThrow();
  expect(
    await authorizeAsset("v-id.games.example.com", "/play/index.html"),
  ).toBeNull();
  vi.stubEnv("APP_URL", "http://doa.example.com");
  expect(() => settings()).toThrow();
});
it("ordinary production still requires separate registered domains", () => {
  production();
  vi.stubEnv("BUNDLED_DEMO_ONLY", "false");
  expect(() => settings()).toThrow();
  vi.stubEnv("GAME_BASE_DOMAIN", "example.net");
  expect(settings().production).toBe(true);
  expect(() => requireUploads()).not.toThrow();
});
