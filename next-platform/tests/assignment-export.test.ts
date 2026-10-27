import { describe, expect, it } from "vitest";
import {
  assignmentCsv,
  resultCells,
  type ReportAssignment,
} from "../src/lib/assignment-export";
import { reportRows, type ReportRow } from "../src/lib/learning-workspace";
const a: ReportAssignment = {
  id: "a",
  title: "Kesirler",
  game_title: "Oyun",
  class_name: "4-A",
  tracking: true,
  closed: false,
  due_at: null,
};
const row: ReportRow = {
  id: "s",
  name: "Çağrı Işık",
  username: "cagri",
  membership: "active",
  attempts: 2,
  completed: true,
  progress: null,
  score: 0,
  best_score: 80,
  last_activity: "2026-10-27T09:00:00Z",
};
describe("assignment exports", () => {
  it("preserves Turkish, zero, null and Istanbul time with BOM and CRLF", () => {
    const csv = assignmentCsv(a, [row]);
    expect(csv.startsWith('\uFEFF"Sınıf";"Ödev";"Oyun";')).toBe(true);
    expect(csv).toContain(
      '"Çağrı Işık";"cagri";"Tamamlandı";"";"0";"80";"2";"27 Eki 2026 12:00"',
    );
    expect(csv.endsWith("\r\n")).toBe(true);
  });
  it("quotes embedded delimiters, quotes and multiline names without creating cells", () => {
    const csv = assignmentCsv({ ...a, title: 'Bir; "iki"\nüç' }, [row]);
    expect(csv).toContain('"Bir; ""iki""\nüç"');
  });
  it.each([
    "=1+2",
    "+SUM(A1)",
    "-1+2",
    "@SUM(A1)",
    "  =1",
    "\t=1",
    "\r=1",
    "\n=1",
    "\uFEFF=1",
  ])("neutralizes spreadsheet formulas: %j", (name) => {
    expect(assignmentCsv({ ...a, title: name }, [{ ...row, name }])).toContain(
      `"'${name}"`,
    );
  });
  it("does not export misleading performance values for untracked games", () => {
    expect(resultCells({ ...a, tracking: false }, row)).toEqual([
      row.name,
      row.username,
      "Açıldı · Tamamlanma ölçülemiyor",
      null,
      null,
      null,
      2,
      "27 Eki 2026 12:00",
    ]);
    expect(assignmentCsv({ ...a, tracking: false }, [row])).toContain(
      "Yalnızca açılma bilgisi",
    );
  });
  it("exports filtered/all scopes in the same current ordering, without changing source rows", () => {
    const rows = [
      row,
      {
        ...row,
        id: "b",
        name: "Ada",
        completed: false,
        last_activity: "2026-10-27T10:00:00Z",
      },
    ];
    const shown = reportRows(rows, true, "ışık", "completed", "activity");
    const all = reportRows(rows, true, "", "all", "activity");
    expect(shown.map((r) => r.id)).toEqual(["s"]);
    expect(all.map((r) => r.id)).toEqual(["b", "s"]);
    expect(assignmentCsv(a, shown).split("\r\n")).toHaveLength(3);
    expect(assignmentCsv(a, all).split("\r\n")).toHaveLength(4);
    expect(rows[0].id).toBe("s");
  });
  it("keeps closed and inactive status and never turns missing scores into zero", () => {
    expect(
      resultCells(
        { ...a, closed: true },
        { ...row, completed: false, score: null },
      )[2],
    ).toContain("Kapalı");
    expect(resultCells(a, { ...row, membership: "removed" })[2]).toContain(
      "Sınıf üyeliği etkin değil",
    );
    expect(resultCells(a, { ...row, score: null })[4]).toBeNull();
  });
});
