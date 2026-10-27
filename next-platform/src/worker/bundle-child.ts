import { validateSources, BundleError } from "../modules/bundle";
process.once(
  "message",
  async (
    input: Parameters<typeof validateSources> extends [
      infer R,
      infer M,
      ...unknown[],
    ]
      ? { root: R; manifest: M; selected?: string }
      : never,
  ) => {
    try {
      const result = await validateSources(
        input.root,
        input.manifest,
        input.selected,
      );
      process.send?.({ result });
    } catch (e) {
      process.send?.({
        error: e instanceof Error ? e.message : "Paket analizi başarısız.",
        rejected: e instanceof BundleError,
        finding: e instanceof BundleError ? e.finding : undefined,
      });
    } finally {
      process.disconnect?.();
    }
  },
);
