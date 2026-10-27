import { timingSafeEqual } from "node:crypto";
import { settings } from "@/server/env";
import { authorizeAsset } from "@/modules/game-access";
export const dynamic = "force-dynamic";
export async function GET(r: Request) {
  try {
    const supplied = Buffer.from(r.headers.get("x-internal-secret") || "");
    const secret = Buffer.from(settings().internalSecret);
    if (supplied.length !== secret.length || !timingSafeEqual(supplied, secret))
      return new Response(null, { status: 403 });
    const result = await authorizeAsset(
      r.headers.get("x-game-host") || "",
      r.headers.get("x-original-uri") || "",
    );
    return new Response(null, { status: result ? 204 : 403 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
