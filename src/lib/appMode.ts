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