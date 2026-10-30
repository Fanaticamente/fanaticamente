/**
 * Minimal RFC 3161 trusted-timestamp client (no external deps).
 *
 * Builds a TimeStampReq for a SHA-256 digest, POSTs it to a Timestamp
 * Authority (TSA), and parses the TimeStampResp to extract the TSTInfo
 * fields needed for validation: status, genTime, messageImprint, serial.
 *
 * The raw token bytes are returned untouched so they can be stored and
 * re-verified later (including a full CMS signature check with openssl
 * offline: `openssl ts -verify -digest <hex> -in token.der -CAfile ...`).
 */

import { base64ToBytes, bytesToBase64 } from "./legalReport.ts";

export const TSA_PROVIDERS = [
  { name: "FreeTSA", url: "https://freetsa.org/tsr" },
  { name: "DigiCert", url: "http://timestamp.digicert.com" },
] as const;

const SHA256_OID = [0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01];

function derLen(n: number): number[] {
  if (n < 128) return [n];
  const bytes: number[] = [];
  let v = n;
  while (v > 0) {
    bytes.unshift(v & 0xff);
    v >>= 8;
  }
  return [0x80 | bytes.length, ...bytes];
}

function tlv(tag: number, content: number[] | Uint8Array): Uint8Array {
  const c = content instanceof Uint8Array ? [...content] : content;
  return new Uint8Array([tag, ...derLen(c.length), ...c]);
}

export function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** TimeStampReq ::= SEQUENCE { version, messageImprint, nonce, certReq TRUE } */
export function buildTimestampRequest(hashHex: string, nonce?: Uint8Array): Uint8Array {
  const digest = hexToBytes(hashHex);
  if (digest.length !== 32) throw new Error("expected a SHA-256 digest (32 bytes)");
  const n = nonce ?? crypto.getRandomValues(new Uint8Array(8));
  const alg = tlv(0x30, SHA256_OID); // AlgorithmIdentifier, parameters omitted per RFC 3161
  const imprint = tlv(0x30, [...alg, ...tlv(0x04, digest)]);
  const body = [
    ...tlv(0x02, [0x01]), // version 1
    ...imprint,
    ...tlv(0x02, n),
    ...tlv(0x01, [0xff]), // certReq = TRUE
  ];
  return tlv(0x30, body);
}

interface Tlv {
  tag: number;
  start: number; // content start
  end: number; // content end
}

function readTlv(data: Uint8Array, off: number): Tlv {
  const tag = data[off];
  let lb = data[off + 1];
  let pos = off + 2;
  let length: number;
  if (lb & 0x80) {
    const n = lb & 0x7f;
    length = 0;
    for (let i = 0; i < n; i++) length = length * 256 + data[pos + i];
    pos += n;
  } else {
    length = lb;
  }
  return { tag, start: pos, end: pos + length };
}

export interface ParsedTimestamp {
  /** PKIStatus: 0 = granted, 1 = grantedWithMods, 2..5 = rejection/failure */
  status: number;
  statusText: string;
  genTime: string; // e.g. 20261030211015Z
  genTimeIso: string;
  messageImprint: string; // hex
  serial: string; // hex
}

/** Parse TimeStampResp -> TSTInfo (status, genTime, messageImprint, serial). */
export function parseTimestampResponse(data: Uint8Array): ParsedTimestamp {
  const resp = readTlv(data, 0); // TimeStampResp SEQUENCE
  if (resp.tag !== 0x30) throw new Error("not a TimeStampResp");
  const statusInfo = readTlv(data, resp.start); // PKIStatusInfo
  const statusInt = readTlv(data, statusInfo.start);
  const status = data[statusInt.start];

  // failInfo / statusString are optional context inside PKIStatusInfo; extract text if present
  let statusText = "";
  let cursor = statusInt.end;
  while (cursor < statusInfo.end) {
    const t = readTlv(data, cursor);
    if (t.tag === 0x30) {
      // PKIFreeText: sequence of UTF8String
      let c2 = t.start;
      while (c2 < t.end) {
        const s = readTlv(data, c2);
        if (s.tag === 0x0c) statusText += new TextDecoder().decode(data.slice(s.start, s.end)) + " ";
        c2 = s.end;
      }
    }
    cursor = t.end;
  }
  if (status > 1) throw new Error(`TSA refused the request (status ${status}) ${statusText}`.trim());
  if (statusInfo.end >= resp.end) throw new Error("response carries no timestamp token");

  const contentInfo = readTlv(data, statusInfo.end); // ContentInfo SEQUENCE
  const oid = readTlv(data, contentInfo.start); // contentType OID (id-signedData)
  const explicit = readTlv(data, oid.end); // [0] EXPLICIT SignedData
  const signedData = readTlv(data, explicit.start); // SignedData SEQUENCE
  const version = readTlv(data, signedData.start);
  const digestAlgs = readTlv(data, version.end);
  const encap = readTlv(data, digestAlgs.end); // EncapsulatedContentInfo
  const eContentType = readTlv(data, encap.start);
  const eContentExplicit = readTlv(data, eContentType.end); // [0] EXPLICIT OCTET STRING
  const eContentOctets = readTlv(data, eContentExplicit.start);
  const tst = data.slice(eContentOctets.start, eContentOctets.end);

  // TSTInfo ::= SEQUENCE { version, policy, messageImprint, serialNumber, genTime, ... }
  const tstInfo = readTlv(tst, 0);
  const v = readTlv(tst, tstInfo.start);
  const policy = readTlv(tst, v.end);
  const imprintSeq = readTlv(tst, policy.end);
  const imprintAlg = readTlv(tst, imprintSeq.start);
  const imprintHash = readTlv(tst, imprintAlg.end);
  const serial = readTlv(tst, imprintSeq.end);
  const genTime = readTlv(tst, serial.end);

  const genTimeStr = new TextDecoder().decode(tst.slice(genTime.start, genTime.end));
  return {
    status,
    statusText: statusText.trim(),
    genTime: genTimeStr,
    genTimeIso: rfc3161TimeToIso(genTimeStr),
    messageImprint: bytesToHex(tst.slice(imprintHash.start, imprintHash.end)),
    serial: bytesToHex(tst.slice(serial.start, serial.end)),
  };
}

/** "20261030211015Z" (GeneralizedTime) or "261030211015Z" (UTCTime) -> ISO string */
export function rfc3161TimeToIso(t: string): string {
  const clean = t.replace(/\.\d+/, "").replace(/Z$/, "");
  if (clean.length === 12) {
    // UTCTime: YYMMDDHHMMSS — RFC 5280: YY < 50 => 20YY
    const yy = parseInt(clean.slice(0, 2), 10);
    const year = yy < 50 ? 2000 + yy : 1900 + yy;
    return `${year}-${clean.slice(2, 4)}-${clean.slice(4, 6)}T${clean.slice(6, 8)}:${clean.slice(8, 10)}:${clean.slice(10, 12)}Z`;
  }
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T${clean.slice(8, 10)}:${clean.slice(10, 12)}:${clean.slice(12, 14)}Z`;
}

export interface TimestampResult {
  ok: boolean;
  tsaUrl?: string;
  tsaName?: string;
  tokenBase64?: string;
  genTimeIso?: string;
  serial?: string;
  error?: string;
}

/**
 * Request a trusted timestamp for a SHA-256 hex digest. Tries each provider
 * in order with a hard timeout. Only returns ok=true when the TSA granted
 * the request AND the returned messageImprint matches the digest we sent.
 */
export async function requestTrustedTimestamp(hashHex: string, timeoutMs = 15000): Promise<TimestampResult> {
  const errors: string[] = [];
  for (const provider of TSA_PROVIDERS) {
    try {
      const reqBytes = buildTimestampRequest(hashHex);
      const resp = await fetch(provider.url, {
        method: "POST",
        headers: { "Content-Type": "application/timestamp-query" },
        body: reqBytes,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resp.ok) {
        errors.push(`${provider.name}: HTTP ${resp.status}`);
        continue;
      }
      const token = new Uint8Array(await resp.arrayBuffer());
      const parsed = parseTimestampResponse(token);
      if (parsed.messageImprint !== hashHex.toLowerCase()) {
        errors.push(`${provider.name}: messageImprint mismatch`);
        continue;
      }
      return {
        ok: true,
        tsaUrl: provider.url,
        tsaName: provider.name,
        tokenBase64: bytesToBase64(token),
        genTimeIso: parsed.genTimeIso,
        serial: parsed.serial,
      };
    } catch (e) {
      errors.push(`${provider.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { ok: false, error: errors.join(" | ") || "no TSA provider available" };
}

/** Re-validate a stored token against the hash it claims to timestamp. */
export function verifyStoredToken(tokenBase64: string, expectedHashHex: string): {
  valid: boolean;
  genTimeIso?: string;
  serial?: string;
  error?: string;
} {
  try {
    const parsed = parseTimestampResponse(base64ToBytes(tokenBase64));
    if (parsed.messageImprint !== expectedHashHex.toLowerCase()) {
      return { valid: false, error: "messageImprint does not match the anchored hash" };
    }
    return { valid: true, genTimeIso: parsed.genTimeIso, serial: parsed.serial };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : String(e) };
  }
}
