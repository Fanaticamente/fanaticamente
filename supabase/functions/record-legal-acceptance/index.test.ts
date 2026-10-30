import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const BASE = `${Deno.env.get("VITE_SUPABASE_URL")!}/functions/v1/record-legal-acceptance`;

Deno.test("aceite sem autenticação é recusado (401)", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slugs: ["terms-of-use"], source: "reaccept_prompt" }),
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("aceite com token inválido é recusado (401)", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer token-forjado" },
    body: JSON.stringify({ slugs: ["terms-of-use"], source: "reaccept_prompt" }),
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("método GET não é aceito (405)", async () => {
  const res = await fetch(BASE, { method: "GET" });
  await res.text();
  assertEquals(res.status, 405);
});

Deno.test("origem forjada pelo navegador não passa da autenticação", async () => {
  // A origem "signup" só pode ser gravada pelo banco a partir de uma intenção
  // criada no servidor; qualquer outra origem enviada pelo cliente é recusada.
  // Sem sessão válida, a requisição já falha na autenticação (401) — o que
  // também impede o envio de versão, data ou origem falsificados.
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer qualquer" },
    body: JSON.stringify({
      slugs: ["terms-of-use"],
      source: "signup",
      version: 99,
      accepted_at: "2020-01-01T00:00:00Z",
      content_sha256: "00",
    }),
  });
  await res.text();
  assertEquals(res.status, 401);
});
