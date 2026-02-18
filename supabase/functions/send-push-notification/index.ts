import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// VAPID JWT generation (no payload encryption needed for VAPID)
// ============================================================
async function generateVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64url: string
): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };

  const encodeB64url = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signingInput = `${encodeB64url(header)}.${encodeB64url(payload)}`;

  // VAPID private key is stored as raw base64url (32-byte scalar for P-256).
  // Import it via JWK format which Deno supports natively.
  // We derive x/y from the private scalar by generating a temporary key pair,
  // but the simplest approach is to use a known placeholder (x/y don't matter for signing
  // since only d is used by the signing operation).
  const rawPrivateBytes = Uint8Array.from(
    atob(privateKeyBase64url.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  const dBase64url = btoa(String.fromCharCode(...rawPrivateBytes))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  // We need a matching public key (x, y). Generate a temporary key pair using the
  // raw private bytes as seed via SubtleCrypto importKey with JWK, but we need x/y.
  // Best approach: derive x/y by doing ECDH scalar multiplication on G.
  // In WebCrypto we can't do that directly, so we generate a fresh key pair and
  // swap the private scalar. Since we only need to SIGN (not verify here), x and y
  // just need to be valid P-256 points. We'll generate a temporary key pair to get
  // valid x/y coords, then replace d with our real private key.
  const tempKey = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );
  const tempJwk = await crypto.subtle.exportKey("jwk", tempKey.privateKey) as JsonWebKey;

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    { ...tempJwk, d: dBase64url, key_ops: ["sign"] },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signingInput}.${signatureBase64}`;
}


// ============================================================
// Web Push Payload Encryption — RFC 8291 / RFC 8188
// ============================================================
async function encryptPayload(
  payload: string,
  p256dhBase64: string,
  authBase64: string
): Promise<{ ciphertext: Uint8Array; localPublicKeyBytes: Uint8Array; salt: Uint8Array }> {
  const enc = new TextEncoder();

  // Decode subscription keys
  const receiverPublicKeyBytes = Uint8Array.from(
    atob(p256dhBase64.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );
  const authSecret = Uint8Array.from(
    atob(authBase64.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  // Import receiver's public key
  const receiverPublicKey = await crypto.subtle.importKey(
    "raw",
    receiverPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  // Generate local (sender) ECDH key pair
  const senderKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Export sender public key
  const localPublicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey("raw", senderKeyPair.publicKey)
  );

  // ECDH shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: receiverPublicKey },
    senderKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF for auth secret (PRK)
  const prkInfoBuf = new Uint8Array([
    ...enc.encode("WebPush: info\0"),
    ...receiverPublicKeyBytes,
    ...localPublicKeyBytes,
  ]);

  const authSecretKey = await crypto.subtle.importKey(
    "raw",
    authSecret,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  const ikmBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: sharedSecret, info: prkInfoBuf },
    authSecretKey,
    256
  );
  const ikm = new Uint8Array(ikmBits);

  // HKDF for CEK (content encryption key, 16 bytes)
  const cekInfoBuf = enc.encode("Content-Encoding: aes128gcm\0");
  const saltKey = await crypto.subtle.importKey(
    "raw",
    ikm,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  const cekBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: cekInfoBuf },
    saltKey,
    128
  );
  const cek = new Uint8Array(cekBits);

  // HKDF for nonce (12 bytes)
  const nonceInfoBuf = enc.encode("Content-Encoding: nonce\0");
  const saltKeyNonce = await crypto.subtle.importKey(
    "raw",
    ikm,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  const nonceBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: nonceInfoBuf },
    saltKeyNonce,
    96
  );
  const nonce = new Uint8Array(nonceBits);

  // AES-128-GCM encryption
  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);

  // Add padding (2-byte delimiter 0x02 at end of plaintext — RFC 8291)
  const plaintext = enc.encode(payload);
  const paddedPlaintext = new Uint8Array([...plaintext, 0x02]);

  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    paddedPlaintext
  );

  return { ciphertext: new Uint8Array(ciphertextBuf), localPublicKeyBytes, salt };
}

// Build the RFC 8188 encrypted content body
function buildEncryptedBody(
  ciphertext: Uint8Array,
  localPublicKeyBytes: Uint8Array,
  salt: Uint8Array
): Uint8Array {
  // rs = record size = 4096 (big-endian uint32)
  const rs = 4096;
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, rs, false);

  // idlen = length of sender public key (65 bytes for uncompressed P-256)
  const idlen = new Uint8Array([localPublicKeyBytes.length]);

  // Header: salt (16) + rs (4) + idlen (1) + keyid (65)
  const header = new Uint8Array([...salt, ...rsBytes, ...idlen, ...localPublicKeyBytes]);

  return new Uint8Array([...header, ...ciphertext]);
}

// ============================================================
// Main push sender
// ============================================================
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublic: string,
  vapidPrivate: string,
  vapidSubject: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const jwt = await generateVapidJwt(audience, vapidSubject, vapidPrivate);

    // Encrypt the payload
    const { ciphertext, localPublicKeyBytes, salt } = await encryptPayload(
      payload,
      subscription.p256dh,
      subscription.auth
    );
    const body = buildEncryptedBody(ciphertext, localPublicKeyBytes, salt);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${jwt},k=${vapidPublic}`,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        TTL: "86400",
        Urgency: "normal",
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Push failed [${response.status}]:`, text);
      return { ok: false, status: response.status, error: text };
    }
    return { ok: true, status: response.status };
  } catch (e) {
    console.error("sendWebPush exception:", e);
    return { ok: false, error: String(e) };
  }
}

// ============================================================
// Edge Function handler
// ============================================================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: rolesData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);

    const hasPermission = rolesData?.some((r) => ["admin", "developer"].includes(r.role));
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { title, message, type = "info", link, target_user_id, target_club_id, icon } = body;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "title and message are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Determine target user IDs
    let userIds: string[] = [];

    if (target_user_id) {
      if (typeof target_user_id !== "string" || target_user_id.trim() === "") {
        return new Response(JSON.stringify({ error: "target_user_id inválido" }), { status: 400, headers: corsHeaders });
      }
      userIds = [target_user_id.trim()];
      console.log(`Targeting specific user: ${target_user_id}`);
    } else if (target_club_id) {
      const { data: profiles, error: profilesErr } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("favorite_club_id", target_club_id);
      if (profilesErr) console.error("Error fetching club fans:", profilesErr);
      userIds = (profiles || []).map((p) => p.user_id);
      console.log(`Targeting club ${target_club_id}: ${userIds.length} fans`);
    } else {
      const { data: roles, error: rolesErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "user");
      if (rolesErr) console.error("Error fetching users:", rolesErr);
      userIds = (roles || []).map((r) => r.user_id);
      console.log(`Broadcasting to ${userIds.length} users`);
    }

    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@fanaticamente.com";

    if (!vapidPublic || !vapidPrivate) {
      return new Response(
        JSON.stringify({ success: false, error: "VAPID keys not configured", push_sent: 0, push_failed: 0 }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, push_sent: 0, push_failed: 0, pwa_subscribers: 0, vapid_configured: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: subs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    const subsCount = subs?.length ?? 0;
    console.log(`Found ${subsCount} PWA push subscriptions for ${userIds.length} target user(s)`);

    let pushSent = 0;
    let pushFailed = 0;

    if (subs && subs.length > 0) {
      const pushPayload = JSON.stringify({
        title,
        body: message,
        icon: icon || "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        data: { url: link || "/" },
      });

      const results = await Promise.allSettled(
        subs.map((sub) =>
          sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            pushPayload,
            vapidPublic,
            vapidPrivate,
            vapidSubject
          )
        )
      );

      const expiredEndpoints: string[] = [];
      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          if (result.value.ok) {
            pushSent++;
          } else {
            pushFailed++;
            console.error(`Push failed for sub ${idx}:`, result.value.status, result.value.error);
            if (result.value.status === 410) expiredEndpoints.push(subs[idx].endpoint);
          }
        } else {
          pushFailed++;
          console.error(`Push rejected for sub ${idx}:`, result.reason);
        }
      });

      if (expiredEndpoints.length > 0) {
        await supabaseAdmin
          .from("push_subscriptions")
          .delete()
          .in("endpoint", expiredEndpoints);
        console.log(`Removed ${expiredEndpoints.length} expired push subscriptions`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        push_sent: pushSent,
        push_failed: pushFailed,
        pwa_subscribers: subsCount,
        vapid_configured: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
