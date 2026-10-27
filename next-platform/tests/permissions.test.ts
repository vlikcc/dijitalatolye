import { describe, it, expect } from "vitest";
import {
  can,
  roleHome,
  roleLabel,
  safeReturn,
  workspaceLinks,
  workspaceLinkActive,
  rolesFor,
} from "../src/lib/permissions";
describe("one role policy", () => {
  it("keeps manager production and review separate from admin operations", () => {
    for (const capability of ["create", "teach", "review"] as const)
      expect(can("admin", capability)).toBe(false);
    for (const capability of [
      "create",
      "teach",
      "review",
      "recover",
      "inspect",
    ] as const)
      expect(can("editor", capability)).toBe(true);
    expect(can("editor", "administer")).toBe(false);
    expect(can("teacher", "review")).toBe(false);
    expect(can("admin", "recover")).toBe(true);
    expect(rolesFor("create")).toEqual(["teacher", "editor"]);
    expect(can("student", "inspect")).toBe(false);
    expect(can("owner", "create")).toBe(false);
    expect(roleLabel("editor")).toBe("Yönetici");
    expect(roleLabel("admin")).toBe("Admin");
  });
  it("uses permission-compatible home pages and menu destinations", () => {
    expect(
      workspaceLinkActive(
        { href: "/yonetim", label: "" },
        "/yonetim",
        "kullanicilar",
      ),
    ).toBe(true);
    expect(roleHome("editor")).toBe("/editor");
    expect(roleHome("admin")).toBe("/yonetim");
    expect(
      workspaceLinks("admin", true).some((l) => l.href.startsWith("/ogretmen")),
    ).toBe(false);
    expect(
      workspaceLinks("editor", true).some((l) => l.href === "/ogretmen/yeni"),
    ).toBe(true);
    expect(
      workspaceLinkActive(
        { href: "/yonetim", label: "" },
        "/yonetim",
        "yayinlar",
      ),
    ).toBe(false);
    expect(
      workspaceLinkActive(
        { href: "/yonetim?bolum=yayinlar", label: "" },
        "/yonetim",
        "yayinlar",
      ),
    ).toBe(true);
  });
  it("rejects external, malformed and unauthorized post-auth destinations", () => {
    for (const url of [
      "//evil.test",
      "https://evil.test",
      "/\\evil.test",
      "/%2f%2fevil.test",
      "/api/admin",
      "/giris",
      "/ogrenci/giris",
      "/kesfet\n",
    ])
      expect(safeReturn(url, "teacher")).toBe("/ogretmen");
    expect(safeReturn("/ogretmen/yeni", "admin")).toBe("/yonetim");
    expect(safeReturn("/editor", "student")).toBe("/ogrenci");
    expect(safeReturn("/ogretmen/yeni?content=test", "editor")).toBe(
      "/ogretmen/yeni?content=test",
    );
    expect(safeReturn("/kesfet?grade=4&saved=1", "student")).toBe(
      "/kesfet?grade=4&saved=1",
    );
  });
});
