import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/lib/legalReportSelection.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { filterLegalSystem, legalReportTargets } = await import("data:text/javascript," + encodeURIComponent(js));
const rows = [
  { id: "fan-terms", slug: "terms-of-use" }, { id: "fan-privacy", slug: "privacy-policy" },
  { id: "work-terms", slug: "terms-of-use-professional" }, { id: "work-privacy", slug: "privacy-policy-professional" },
];

test("Fanaticamente Torcedor lists only fan acceptances", () => {
  assert.deepEqual(filterLegalSystem(rows, "fan").map((r) => r.id), ["fan-terms", "fan-privacy"]);
});
test("FanaticaWork lists only professional acceptances", () => {
  assert.deepEqual(filterLegalSystem(rows, "work").map((r) => r.id), ["work-terms", "work-privacy"]);
});
test("report contains only selected acceptances from the visible system", () => {
  assert.deepEqual(legalReportTargets(filterLegalSystem(rows, "fan"), new Set(["fan-terms", "work-privacy"])).map((r) => r.id), ["fan-terms"]);
});
test("no selection generates only the currently displayed system", () => {
  assert.deepEqual(legalReportTargets(filterLegalSystem(rows, "work"), new Set()).map((r) => r.id), ["work-terms", "work-privacy"]);
});