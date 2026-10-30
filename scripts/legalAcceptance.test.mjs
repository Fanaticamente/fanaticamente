import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Load the TS helper as plain JS (it has only type-free exports).
const src = readFileSync(new URL("../src/lib/legalAcceptance.ts", import.meta.url), "utf8");
const mod = await import("data:text/javascript," + encodeURIComponent(src.replace(/: \{[^}]*\}/g, "").replace(/: (unknown|string\[\]|string|Record<string, string>|"fan" \| "pro")/g, "")));

test("signup is blocked unless both documents are checked", () => {
  assert.equal(mod.canCompleteSignup({ terms: false, privacy: false }), false);
  assert.equal(mod.canCompleteSignup({ terms: true, privacy: false }), false);
  assert.equal(mod.canCompleteSignup({ terms: false, privacy: true }), false);
  assert.equal(mod.canCompleteSignup({ terms: true, privacy: true }), true);
});

test("signup intent must cover every currently required document", () => {
  assert.equal(mod.pendingCoversRequired(["terms-of-use"], ["terms-of-use", "privacy-policy"]), false);
  assert.equal(mod.pendingCoversRequired(null, ["terms-of-use"]), false);
  assert.equal(mod.pendingCoversRequired(["terms-of-use", "privacy-policy"], ["terms-of-use", "privacy-policy"]), true);
});

test("professional signup uses professional documents", () => {
  assert.deepEqual(mod.signupSlugs("pro"), ["terms-of-use-professional", "privacy-policy-professional"]);
  assert.deepEqual(mod.signupSlugs("fan"), ["terms-of-use", "privacy-policy"]);
});
