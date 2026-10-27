import { describe, expect, it } from "vitest";
import {
  getPublicationProgress,
  isLiveVersion,
} from "../src/lib/publication-progress";
const version = (state: string, revokedAt: string | null = null) => ({
  id: "draft",
  state,
  revokedAt,
});
describe("publication progress", () => {
  it.each([
    ["queued", 1],
    ["scanning", 1],
    ["scan_error", 1],
    ["rejected", 1],
    ["needs_entry", 2],
    ["extracting", 2],
    ["needs_metadata", 2],
    ["review", 3],
    ["revision_requested", 3],
    ["publishing", 4],
    ["publish_error", 4],
  ])("maps %s to stage %i", (state, index) => {
    const progress = getPublicationProgress({
      version: version(String(state)),
    });
    expect(progress.steps.map((s) => s.label)).toEqual([
      "Dosya",
      "Güvenlik",
      "Bilgiler",
      "İnceleme",
      "Yayın",
    ]);
    expect(progress.steps.findIndex((s) => s.current)).toBe(index);
    expect(progress.live).toBe(false);
    expect(
      progress.steps
        .slice(0, Number(index))
        .every((s) => s.status === "complete"),
    ).toBe(true);
    expect(
      progress.steps
        .slice(Number(index) + 1)
        .every((s) => s.status === "waiting"),
    ).toBe(true);
  });
  it.each(["scan_error", "rejected", "publish_error"])(
    "marks %s as an error",
    (state) => {
      expect(
        getPublicationProgress({ version: version(state) }).steps.find(
          (s) => s.current,
        )?.status,
      ).toBe("error");
    },
  );
  it("only a matching, nonrevoked published version is live", () => {
    const v = version("published");
    expect(isLiveVersion(v, "draft")).toBe(true);
    expect(isLiveVersion(v, null)).toBe(false);
    expect(isLiveVersion(v, "other")).toBe(false);
    expect(isLiveVersion({ ...v, revokedAt: new Date() }, "draft")).toBe(false);
    expect(isLiveVersion(version("publishing"), "draft")).toBe(false);
    const p = getPublicationProgress({
      version: v,
      publishedVersionId: "draft",
    });
    expect(p.steps.every((s) => s.status === "complete")).toBe(true);
    expect(p.steps[4].current).toBe(true);
  });
  it.each(["superseded", "unknown", "toString", "published"])(
    "does not invent activity or success for %s",
    (state) => {
      const p = getPublicationProgress({ version: version(state) });
      expect(p.live).toBe(false);
      expect(p.steps.every((s) => !s.current && s.status === "inactive")).toBe(
        true,
      );
    },
  );
  it("revocation overrides a stale publication pointer", () => {
    const p = getPublicationProgress({
      version: version("published", "2026-10-27"),
      publishedVersionId: "draft",
    });
    expect(p.live).toBe(false);
    expect(p.title).toContain("iptal");
    expect(p.steps.every((s) => !s.current)).toBe(true);
  });
  it("distinguishes a new draft from a verified older publication", () => {
    const p = getPublicationProgress({
      version: version("needs_metadata"),
      publishedVersionId: "live",
      publishedVersion: { id: "live", state: "published" },
    });
    expect(p.live).toBe(false);
    expect(p.previousPublicationLive).toBe(true);
    expect(p.steps[2].current).toBe(true);
    expect(
      getPublicationProgress({
        version: version("needs_metadata"),
        publishedVersionId: "live",
      }).previousPublicationLive,
    ).toBe(false);
    expect(
      getPublicationProgress({
        version: version("needs_metadata"),
        publishedVersionId: "live",
        publishedVersion: {
          id: "live",
          state: "published",
          revokedAt: new Date(),
        },
      }).previousPublicationLive,
    ).toBe(false);
  });
  it.each([
    "empty",
    "ready",
    "preparing",
    "uploading",
    "saving",
    "cover",
  ] as const)("keeps %s at file stage", (uploadPhase) => {
    const p = getPublicationProgress({ uploadPhase });
    expect(p.steps[0].current).toBe(true);
    expect(p.steps.slice(1).every((s) => s.status === "waiting")).toBe(true);
  });
});
