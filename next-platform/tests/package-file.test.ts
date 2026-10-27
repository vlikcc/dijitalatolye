import { describe, it, expect } from "vitest";
import {
  validatePackageFiles,
  MAX_PACKAGE_BYTES,
  packageFileKind,
} from "../src/lib/package-file";
import { readUploadResponse } from "../src/lib/package-upload";
describe("package selection", () => {
  it.each([
    "game.html",
    "game.htm",
    "game.zip",
    "OYUN.HTML",
    "OYUN.HTM",
    "OYUN.ZIP",
  ])("accepts %s", (name) =>
    expect(validatePackageFiles([{ name, size: 1 }])).toBeNull(),
  );
  it("allows the stated size boundary and rejects overflow", () => {
    expect(
      validatePackageFiles([{ name: "game.zip", size: MAX_PACKAGE_BYTES }]),
    ).toBeNull();
    expect(
      validatePackageFiles([{ name: "game.zip", size: MAX_PACKAGE_BYTES + 1 }]),
    ).toContain("50 MB");
  });
  it("rejects zero, multiple and unsupported files", () => {
    expect(validatePackageFiles([{ name: "game.html", size: 0 }])).toContain(
      "boş",
    );
    expect(validatePackageFiles([])).toContain("bir oyun");
    expect(
      validatePackageFiles([
        { name: "a.html", size: 1 },
        { name: "b.html", size: 1 },
      ]),
    ).toContain("bir oyun");
    expect(
      validatePackageFiles([{ name: "game.html.exe", size: 1 }]),
    ).toContain("HTML");
    expect(packageFileKind("GAME.ZIP")).toBe("ZIP paketi");
  });
});
describe("upload acknowledgement", () => {
  it("requires a successful response with an actual version id", () => {
    expect(readUploadResponse(202, '{"versionId":"version"}')).toEqual({
      versionId: "version",
    });
    for (const response of [
      "{}",
      "null",
      "[]",
      '{"versionId":123}',
      '{"versionId":""}',
    ])
      expect(() => readUploadResponse(202, response)).toThrow(
        "sürüm kimliğini",
      );
  });
  it("separates bad acknowledgements, server errors and safe trace IDs", () => {
    expect(() => readUploadResponse(202, "<html>")).toThrow(
      "yükleme sonucu doğrulanamadı",
    );
    expect(() => readUploadResponse(500, "<html>")).toThrow("HTTP 500");
    expect(() =>
      readUploadResponse(422, '{"error":"Paket hatası","traceId":"trace"}'),
    ).toThrow("Paket hatası (İzleme: trace)");
    expect(() => readUploadResponse(500, "null")).toThrow("HTTP 500");
  });
});
