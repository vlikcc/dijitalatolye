import path from "node:path";
import { getDomain } from "tldts";
import { bundledDemoOnly } from "./demo-deployment";
export function settings() {
  const production = process.env.NODE_ENV === "production";
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const gameDomain = process.env.GAME_BASE_DOMAIN || "games.localhost";
  const secret = process.env.BETTER_AUTH_SECRET;
  const previewSecret = process.env.PREVIEW_SECRET;
  const internalSecret = process.env.INTERNAL_SECRET;
  if (
    !secret ||
    secret.length < 32 ||
    !previewSecret ||
    previewSecret.length < 32 ||
    !internalSecret ||
    internalSecret.length < 32
  )
    throw new Error(
      "BETTER_AUTH_SECRET, PREVIEW_SECRET ve INTERNAL_SECRET en az 32 karakter olmalı.",
    );
  if (production && process.env.DEPLOYMENT_ENV !== "local-test") {
    if (
      new URL(appUrl).protocol !== "https:" ||
      (!bundledDemoOnly() &&
        (!getDomain(gameDomain) ||
          getDomain(new URL(appUrl).hostname) === getDomain(gameDomain)))
    )
      throw new Error(
        "Üretimde HTTPS ve oyunlar için ayrı kayıtlı kök alan adı gerekir.",
      );
  }
  return {
    production,
    appUrl,
    gameDomain,
    gameProtocol: process.env.GAME_PROTOCOL || (production ? "https" : "http"),
    gamePort: process.env.GAME_PORT || "",
    secret,
    previewSecret,
    internalSecret,
    dataDir: path.resolve(process.env.DATA_DIR || ".data"),
    databaseUrl:
      process.env.DATABASE_URL ||
      "postgresql://app:local-only@127.0.0.1:55432/dijital",
  };
}
