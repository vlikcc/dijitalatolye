import {
  extractMetadata,
  type ExtractionInput,
} from "../modules/metadata-extract";
process.once("message", async (input: ExtractionInput) => {
  try {
    process.send?.({ report: await extractMetadata(input) }, () =>
      process.exit(0),
    );
  } catch (e) {
    process.send?.(
      { error: e instanceof Error ? e.message : "Bilgi çıkarımı başarısız." },
      () => process.exit(1),
    );
  }
});
