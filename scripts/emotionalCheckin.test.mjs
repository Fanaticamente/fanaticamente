import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";

const source = readFileSync(new URL("../src/components/home/MinimalHome.tsx", import.meta.url), "utf8");
const moods = source.match(/const GOOD_MOODS = (\[[^;]+\]);/);
const groups = source.match(/const getReasonGroups = \(moodId: string \| null\) => \{([\s\S]*?)\n\};/);
if (!moods || !groups) throw new Error("Check-in rules were not found");
const getReasonGroups = runInNewContext(
  `const GOOD_MOODS = ${moods[1]}; const REASON_GROUPS_BASE = []; (moodId) => {${groups[1]}}`,
);

test("Bem offers exactly the same positive club reasons as Muito bem", () => {
  const positive = ["Vitória", "Goleada aplicada", "Vitória no clássico", "Classificação", "Título", "Derrota do rival"];
  assert.deepEqual(Array.from(getReasonGroups("muito_bem")[0].items), positive);
  assert.deepEqual(Array.from(getReasonGroups("mais_ou_menos")[0].items), positive);
});