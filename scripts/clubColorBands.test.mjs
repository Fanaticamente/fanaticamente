import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/data/clubColorBands.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const exports = {};
vm.runInNewContext(outputText, { exports });
const { getClubColorBands } = exports;
const clubSource = readFileSync(new URL("../src/data/brazilianClubs.ts", import.meta.url), "utf8");
const clubs = [...clubSource.matchAll(/id: "([^"]+)",[\s\S]*?primaryColor: "([^"]+)",\s*secondaryColor: "([^"]+)"/g)]
  .map(([, id, primaryColor, secondaryColor]) => ({ id, primaryColor, secondaryColor }));

test("Every registered A/B/C club has a complete circular identity palette", () => {
  assert.equal(clubs.length, 60);
  for (const club of clubs) {
    const colors = getClubColorBands(club);
    assert.ok(colors.length >= 2, club.id);
    for (const color of colors) assert.match(color, /^#[0-9A-F]{6}$/i, club.id);
  }
});

test("Grêmio includes black, white and sky blue stripes from the reference", () => {
  const club = clubs.find((item) => item.id === "gremio");
  assert.ok(club);
  assert.deepEqual(Array.from(getClubColorBands(club)), [
    "#000000", "#FFFFFF", "#40BFF0", "#FFFFFF", "#000000", "#FFFFFF", "#40BFF0", "#FFFFFF", "#000000",
  ]);
});