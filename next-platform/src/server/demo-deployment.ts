import { fail } from "./errors";

// Single-domain previews serve only the bundled, sandboxed examples.
// Uploaded games still require the isolated production game host.
export const bundledDemoOnly = () => process.env.BUNDLED_DEMO_ONLY === "true";

export function requireUploads() {
  if (bundledDemoOnly())
    fail(
      503,
      "Bu demo kurulumunda hazır oyunları keşfedebilirsiniz. Yeni oyun yükleme henüz açık değil.",
    );
}
