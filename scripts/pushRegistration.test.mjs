import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../src/lib/pushRegistration.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { isAppShellWorker, savePushSubscription } = await import("data:text/javascript," + encodeURIComponent(js));
test("messaging survives cleanup on startup and manager pages", () => {
  for (const name of ["sw-push.js", "OneSignalSDKWorker.js", "firebase-messaging-sw.js"]) {
    assert.equal(isAppShellWorker(`https://example.com/${name}?v=2`), false);
  }
  assert.equal(isAppShellWorker("https://example.com/sw.js?v=2"), true);
});
const subscription = { toJSON: () => ({ endpoint: "https://example.com/push", keys: { auth: "test", p256dh: "test" } }) };
test("browser permission cannot enable push when server persistence fails", async () => {
  await assert.rejects(savePushSubscription(subscription, async () => ({ error: "failed" })));
});
test("confirmed direct push registration works without an audience-provider ID", async () => {
  assert.equal((await savePushSubscription(subscription, async () => ({ success: true }))).success, true);
});
test("push handler displays notification without any open window", async () => {
  const listeners = {};
  const shown = [];
  let pending;
  const context = { self: { addEventListener: (event, listener) => { listeners[event] = listener; }, registration: { showNotification: async (title, options) => { shown.push({ title, options }); } } }, console: { log() {} } };
  vm.runInNewContext(readFileSync(new URL("../public/sw-push.js", import.meta.url), "utf8"), context);
  listeners.push({ data: { json: () => ({ title: "Alerta", body: "Mensagem", data: { url: "/notificacoes" } }) }, waitUntil: promise => { pending = promise; } });
  await pending;
  assert.equal(shown.length, 1);
  assert.equal(shown[0].options.body, "Mensagem");
});