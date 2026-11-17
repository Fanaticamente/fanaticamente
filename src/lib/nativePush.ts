/**
 * Bridge between the website and the app-store shell (iOS WKWebView / Android WebView).
 *
 * Contract the native shell must implement:
 *  - Mark itself: inject `window.FanaticaNative = { platform: "ios" | "android" }` before the page loads,
 *    or add `FanaticamenteApp/ios` / `FanaticamenteApp/android` to the WebView user agent.
 *  - Receive requests from the website:
 *      iOS:     window.webkit.messageHandlers.fanaticaPush.postMessage({ action })
 *      Android: window.FanaticaAndroid.postMessage(JSON.stringify({ action }))
 *    where action is "requestPermission" (show the OS prompt, then deliver the token) or "getToken"
 *    (deliver the token only if permission is already granted, never prompt).
 *  - Deliver the Firebase Cloud Messaging token back:
 *      window.dispatchEvent(new CustomEvent("fanatica:push-token", { detail: { token, platform } }))
 *    or, on refusal/failure, detail: { error: "denied" | "unavailable" }.
 */
export type NativePlatform = "ios" | "android";
type NativeWindow = Window & {
  FanaticaNative?: { platform?: NativePlatform };
  FanaticaAndroid?: { postMessage?: (message: string) => void };
  webkit?: { messageHandlers?: { fanaticaPush?: { postMessage: (message: unknown) => void } } };
};

const TOKEN_KEY = "fanatica_native_push_token";
export const NATIVE_TOKEN_EVENT = "fanatica:push-token";

export function getNativePlatform(): NativePlatform | null {
  if (typeof window === "undefined") return null;
  const w = window as NativeWindow;
  const declared = w.FanaticaNative?.platform;
  if (declared === "ios" || declared === "android") return declared;
  const ua = navigator.userAgent;
  if (/FanaticamenteApp\/ios/i.test(ua) || w.webkit?.messageHandlers?.fanaticaPush) return "ios";
  if (/FanaticamenteApp\/android/i.test(ua) || w.FanaticaAndroid?.postMessage) return "android";
  return null;
}

export function canAskNativeShell(): boolean {
  const w = window as NativeWindow;
  return !!(w.webkit?.messageHandlers?.fanaticaPush || w.FanaticaAndroid?.postMessage);
}

function postToNative(action: "requestPermission" | "getToken"): boolean {
  const w = window as NativeWindow;
  try {
    if (w.webkit?.messageHandlers?.fanaticaPush) { w.webkit.messageHandlers.fanaticaPush.postMessage({ action }); return true; }
    if (w.FanaticaAndroid?.postMessage) { w.FanaticaAndroid.postMessage(JSON.stringify({ action })); return true; }
  } catch { /* shell without bridge */ }
  return false;
}

export type NativeTokenDetail = { token?: string; platform?: NativePlatform; error?: string };

export function rememberNativeToken(token: string) { localStorage.setItem(TOKEN_KEY, token); }
export function getRememberedNativeToken(): string | null { return localStorage.getItem(TOKEN_KEY); }

/** Asks the native shell for a token and waits for its answer. */
export function requestNativeToken(action: "requestPermission" | "getToken", timeoutMs = 20000): Promise<NativeTokenDetail> {
  return new Promise(resolve => {
    const done = (detail: NativeTokenDetail) => { clearTimeout(timer); window.removeEventListener(NATIVE_TOKEN_EVENT, onEvent); resolve(detail); };
    const onEvent = (e: Event) => done(((e as CustomEvent).detail ?? {}) as NativeTokenDetail);
    const timer = setTimeout(() => done({ error: "timeout" }), timeoutMs);
    window.addEventListener(NATIVE_TOKEN_EVENT, onEvent);
    if (!postToNative(action)) done({ error: "no-bridge" });
  });
}
