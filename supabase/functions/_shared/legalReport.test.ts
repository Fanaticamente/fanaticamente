import { assert, assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildCsv,
  buildManifest,
  canonicalize,
  generateVerificationCode,
  sha256Hex,
} from "./legalReport.ts";

Deno.test("canonicalize é determinístico independente da ordem das chaves", async () => {
  const a = canonicalize({ b: 1, a: { d: [2, 1], c: "x" } });
  const b = canonicalize({ a: { c: "x", d: [2, 1] }, b: 1 });
  assertEquals(a, b);
  assertEquals(a, '{"a":{"c":"x","d":[2,1]},"b":1}');
});

Deno.test("sha256Hex confere com vetor conhecido", async () => {
  // sha256("abc") — vetor público do NIST
  assertEquals(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

Deno.test("manifesto inclui sha256 de cada arquivo em ordem de nome", async () => {
  const files = [
    { name: "b.txt", mime: "text/plain", bytes: new TextEncoder().encode("B") },
    { name: "a.txt", mime: "text/plain", bytes: new TextEncoder().encode("A") },
  ];
  const m = await buildManifest({
    reportId: "r1",
    reportType: "general",
    filters: { scope: "all" },
    recordCount: 2,
    files,
  });
  const names = (m.files as { name: string }[]).map((f) => f.name);
  assertEquals(names, ["a.txt", "b.txt"]);
  const hashes = (m.files as { sha256: string }[]).map((f) => f.sha256);
  assertEquals(hashes[0], await sha256Hex("A"));
  assertEquals(hashes[1], await sha256Hex("B"));
});

Deno.test("código de verificação tem 26 caracteres do alfabeto Crockford", () => {
  const code = generateVerificationCode();
  assertEquals(code.length, 26);
  assert(/^[0-9A-HJKMNP-TV-Z]+$/.test(code));
  assertNotEquals(generateVerificationCode(), generateVerificationCode());
});

Deno.test("CSV escapa aspas e inclui cabeçalho de evidências", () => {
  const csv = new TextDecoder().decode(buildCsv([{
    id: "1", user_id: "u", full_name: 'Nome "com" aspas', email: "e@x.com",
    slug: "terms-of-use", version: 1, content_sha256: "ab", action: "accept",
    source: "signup", ip_address: null, user_agent: null,
    accepted_at: "2026-10-01T00:00:00Z", document_version_id: "v",
  }]));
  assert(csv.includes('"Nome ""com"" aspas"'));
  assert(csv.includes("sha256_documento"));
  assert(csv.includes("data_hora_servidor_utc"));
});
