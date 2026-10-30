export const PENDING_LEGAL_KEY = "pendingLegalAcceptance";

export const LEGAL_PATHS: Record<string, string> = {
  "terms-of-use": "/termos-de-uso",
  "privacy-policy": "/politica-privacidade",
  "terms-of-use-professional": "/termos-de-uso-profissional",
  "privacy-policy-professional": "/politica-privacidade-profissional",
};

export const signupSlugs = (accountType: "fan" | "pro") =>
  accountType === "pro"
    ? ["terms-of-use-professional", "privacy-policy-professional"]
    : ["terms-of-use", "privacy-policy"];

/** Signup requires every document checkbox to be ticked explicitly. */
export const canCompleteSignup = (checks: { terms: boolean; privacy: boolean }) =>
  checks.terms === true && checks.privacy === true;

/** Signup-time intent only counts if it covers every currently required document. */
export const pendingCoversRequired = (stored: unknown, required: string[]) =>
  Array.isArray(stored) && required.length > 0 && required.every((s) => stored.includes(s));

const EXEMPT = [
  "/auth", "/profissional/auth", "/admin-access",
  ...Object.values(LEGAL_PATHS),
  "/privacy-policy", "/privacy-policy-professional", "/terms-of-use", "/terms-of-use-professional",
];

export const isLegalGateExemptPath = (pathname: string) =>
  EXEMPT.some((p) => pathname === p || pathname.endsWith(p));
