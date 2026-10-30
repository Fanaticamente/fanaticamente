// Trusted client-IP extraction for Lovable Cloud edge functions.
//
// Infrastructure (verified empirically): browser -> Cloudflare (supabase.co worker)
// -> platform API gateway -> Deno edge runtime.
// The platform gateway SETS `sb-forwarded-for` to the connecting client IP and
// overwrites any value sent by the browser (a forged `sb-forwarded-for: 6.6.6.6`
// arrives replaced by the real address). `cf-connecting-ip` is also set by
// Cloudflare, and Cloudflare rejects requests that try to forge it (error 1000).
// `x-forwarded-for`, `x-real-ip`, `true-client-ip` are NOT used: they may carry
// client-controlled values or intermediate hops.
//
// Rule: use `sb-forwarded-for` only if it is a single syntactically valid IP.
// If it is missing/invalid, record NULL with source "unavailable" — never invent.

export type TrustedIp = { ip: string | null; source: "sb-forwarded-for" | "unavailable" };

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6 = /^[0-9a-f:]{2,39}$/i;

export const isValidIp = (v: string) => IPV4.test(v) || (v.includes(":") && IPV6.test(v));

export function trustedClientIp(headers: Headers): TrustedIp {
  const raw = (headers.get("sb-forwarded-for") ?? "").trim();
  if (raw && !raw.includes(",") && isValidIp(raw)) return { ip: raw, source: "sb-forwarded-for" };
  return { ip: null, source: "unavailable" };
}
