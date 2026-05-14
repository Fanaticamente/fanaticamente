/**
 * App Mode — controla qual "encapsulamento" desta base de código está rodando.
 *
 * - "professional"  → build do app dos profissionais (só rotas /profissional/*)
 * - "fan"           → build do app dos torcedores (só rotas torcedor)
 * - "web" (default) → web unificado fanaticamente.com (mantém comportamento atual)
 *
 * Configurado via variável de ambiente `VITE_APP_MODE` no momento do build.
 * Exemplos:
 *   VITE_APP_MODE=professional npm run build  → gera o APK profissional
 *   VITE_APP_MODE=fan          npm run build  → gera o APK torcedor
 *   (sem variável)                            → web unificado
 */
export type AppMode = "professional" | "fan" | "web";

const RAW = (import.meta.env.VITE_APP_MODE || "web").toString().toLowerCase();

export const APP_MODE: AppMode =
  RAW === "professional" || RAW === "fan" ? RAW : "web";

export const isProfessionalApp = APP_MODE === "professional";
export const isFanApp = APP_MODE === "fan";
export const isWebApp = APP_MODE === "web";

/**
 * Tipo de conta — discriminador interno usado para isolar contas torcedor x profissional
 * que compartilham o mesmo e-mail visível.
 */
export type AccountType = "fan" | "pro";

/**
 * Codifica o e-mail visível em um e-mail interno único por tipo de conta usando
 * sub-addressing ("+tag"). O usuário NUNCA vê esse formato; só usamos antes de
 * chamar a API de auth do Supabase.
 *
 *   joao@gmail.com  + 'fan'  →  joao+fan@gmail.com
 *   joao@gmail.com  + 'pro'  →  joao+pro@gmail.com
 *
 * Provedores principais (Gmail, Outlook, iCloud, Yahoo, ProtonMail) ignoram o
 * "+tag" no roteamento — o e-mail chega normalmente na caixa de entrada real.
 *
 * Idempotente: se o e-mail já contém a tag correta, retorna como está. Se contém
 * tag diferente, substitui.
 */
export const encodeAuthEmail = (email: string, accountType: AccountType): string => {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0) return trimmed; // inválido — deixa o validador upstream rejeitar
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  // Remove qualquer tag pré-existente (+algo) para evitar dupla codificação.
  const plus = local.indexOf("+");
  const cleanLocal = plus === -1 ? local : local.slice(0, plus);
  return `${cleanLocal}+${accountType}@${domain}`;
};

/**
 * Determina o tipo de conta para a operação de auth atual.
 *
 * - App profissional standalone → sempre 'pro'
 * - App torcedor standalone     → sempre 'fan'
 * - Web unificado               → depende da rota (/profissional/auth = pro, resto = fan)
 */
export const getAccountTypeForAuth = (pathname?: string): AccountType => {
  if (isProfessionalApp) return "pro";
  if (isFanApp) return "fan";
  const path = (pathname ?? (typeof window !== "undefined" ? window.location.pathname : "")).toLowerCase();
  return path.startsWith("/profissional") ? "pro" : "fan";
};