import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertFalse } from "https://deno.land/std@0.224.0/assert/mod.ts";

const BASE = `${Deno.env.get("VITE_SUPABASE_URL")!}/functions/v1/verify-public-report`;

// Chaves que jamais podem aparecer numa resposta pública (dados pessoais).
const FORBIDDEN_KEYS = ["email", "user_id", "ip_address", "user_agent", "full_name", "acceptance"];

function assertNoPersonalData(payload: unknown) {
  const text = JSON.stringify(payload);
  for (const key of FORBIDDEN_KEYS) {
    assertFalse(text.includes(`"${key}"`), `resposta pública vazou campo pessoal: ${key}`);
  }
}

Deno.test("código malformado retorna not_found sem vazar dados", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "abc" }),
  });
  const body = await res.json();
  assertEquals(body.status, "not_found");
  assertNoPersonalData(body);
});

Deno.test("código inexistente retorna not_found sem vazar dados", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "0".repeat(26) }),
  });
  const body = await res.json();
  assertEquals(body.status, "not_found");
  assertNoPersonalData(body);
});

Deno.test("corpo inválido não expõe erros internos", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wrong: true }),
  });
  const body = await res.json();
  assertEquals(body.status, "not_found");
  assertNoPersonalData(body);
});
