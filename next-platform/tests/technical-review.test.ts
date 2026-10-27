import { describe, it, expect } from "vitest";
import { inspectJavaScript } from "../src/modules/code-policy";
import { inspectAccessibility } from "../src/modules/accessibility";
import { validateAssessment } from "../src/modules/assessment";
import {
  TECHNICAL_RULES_VERSION,
  type TechnicalReport,
} from "../src/modules/review-types";
const inspect = (s: string) => inspectJavaScript(s, "game.js", () => {});
describe("static technical review", () => {
  it("distinguishes browser APIs from locally declared functions and object methods", () => {
    expect(
      inspect(
        "open(); function open(){}; const game={open(){}}; game.open(); function x(fetch){fetch('dynamic')} ",
      ),
    ).toEqual([]);
    expect(inspect("window.open('elsewhere');")[0].rule).toBe(
      "code.unsupported-api",
    );
    expect(
      inspect("function x(){let open=()=>{};open()} open('elsewhere');"),
    ).toHaveLength(1);
  });
  it.each([
    "eval('1')",
    "new Function('return 1')",
    "setTimeout('alert(1)',100)",
    "navigator.serviceWorker.register('./sw.js')",
    "location.href='other.html'",
    "window['eval']('1')",
  ])("blocks direct unsupported operation %s", (code) => {
    expect(inspect(code).some((f) => f.severity === "blocker")).toBe(true);
  });
  it("allows local imports, fetch and normal function timers", () => {
    const refs: string[] = [];
    expect(
      inspectJavaScript(
        "import './local.js'; fetch('./questions.json'); setTimeout(()=>{},100)",
        "game.js",
        (r) => refs.push(r),
      ),
    ).toEqual([]);
    expect(refs).toEqual(["./local.js", "./questions.json"]);
    expect(inspect("fetch(path)")[0].rule).toBe("code.dynamic-fetch");
  });
  it("reports source evidence and distinguishes decorative images and labelled controls", () => {
    const findings = inspectAccessibility(
      '<html lang="tr"><head><title>Oyun</title></head><body><img alt="" src="a.png"><label for="a">Yanıt</label><input id="a"><button aria-labelledby="missing"></button><canvas></canvas></body></html>',
      "index.html",
    );
    expect(findings.map((f) => f.rule)).toEqual([
      "a11y.label-reference",
      "a11y.control-label",
      "a11y.canvas",
    ]);
    expect(
      findings.every(
        (f) =>
          f.file === "index.html" &&
          f.location.startsWith("1:") &&
          f.evidence.length > 0,
      ),
    ).toBe(true);
  });
});
const report: TechnicalReport = {
  id: "test",
  versionId: "v",
  sha256: "s",
  entrypoint: "index.html",
  rulesVersion: TECHNICAL_RULES_VERSION,
  status: "complete",
  at: "now",
  filesChecked: [],
  completedChecks: [],
  findings: inspectAccessibility("<canvas></canvas>", "index.html"),
  accessibility: "complete",
  limitations: [],
};
const assessment = () => ({
  science: { status: "suitable", note: "" },
  age: { status: "suitable", note: "" },
  education: { status: "suitable", note: "" },
  accessibility: { status: "suitable", note: "Klavye ve odak elle incelendi." },
  cover: { status: "suitable", note: "" },
  warnings: [...new Set(report.findings.map((f) => f.rule))].map((rule) => ({
    rule,
    disposition: "accepted_limitation",
    note: "Sınıf etkinliği için sınırlılık kaydedildi.",
  })),
  outcomes: [],
});
it("requires a disposition for every warning and prohibits unresolved educational approval", () => {
  expect(() =>
    validateAssessment(assessment(), report, [], true, []),
  ).not.toThrow();
  expect(() =>
    validateAssessment({ ...assessment(), warnings: [] }, report, [], true, []),
  ).toThrow(/uyarı/);
  expect(() =>
    validateAssessment(
      {
        ...assessment(),
        age: { status: "unassessed", note: "Yaş uygunluğu incelenemedi." },
      },
      report,
      [],
      true,
      [],
    ),
  ).toThrow(/Çözülmemiş/);
  expect(() =>
    validateAssessment(
      {
        ...assessment(),
        age: { status: "not_applicable", note: "Uygulanamaz" },
      },
      report,
      [],
      true,
      [],
    ),
  ).toThrow(/yalnızca/);
});
it("requires a separate outcome decision matching source references and exclusions", () => {
  const refs = [{ catalogId: "c", outcomeId: "o" }];
  expect(() =>
    validateAssessment(assessment(), report, refs, true, []),
  ).toThrow(/Her kazanım/);
  const value = {
    ...assessment(),
    outcomes: [
      {
        ...refs[0],
        status: "exclude",
        note: "Oyun bu kazanımı desteklemiyor.",
      },
    ],
  };
  expect(() => validateAssessment(value, report, refs, true, [])).toThrow(
    /tutarlı/,
  );
  expect(() =>
    validateAssessment(value, report, refs, true, ["o"]),
  ).not.toThrow();
});
