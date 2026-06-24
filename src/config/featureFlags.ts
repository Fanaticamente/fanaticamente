/**
 * Feature flags para ocultar/exibir funcionalidades temporariamente.
 *
 * --------------------------------------------------------------------------
 * COMO REATIVAR OS CARDS DE MÉTODOS DE RECEBIMENTO (PIX + Cartão/Stripe):
 *   Altere SHOW_PAYMENT_METHOD_CARDS para `true`.
 *   Isso reativa em:
 *     • Cadastro novo (wizard de onboarding — passo "Recebimento")
 *     • Painel de profissionais já cadastrados (bloco "Métodos de Recebimento"
 *       em src/pages/ProfessionalDashboard.tsx)
 *
 * COMO LIBERAR GOOGLE CALENDAR PARA MAIS PROFISSIONAIS:
 *   Adicione o e-mail (em minúsculas) ao array GOOGLE_CALENDAR_ALLOWLIST,
 *   ou esvazie o array E altere GOOGLE_CALENDAR_RESTRICTED para `false`
 *   para liberar a todos novamente.
 * --------------------------------------------------------------------------
 */

export const SHOW_PAYMENT_METHOD_CARDS = false;

export const GOOGLE_CALENDAR_RESTRICTED = true;
export const GOOGLE_CALENDAR_ALLOWLIST = ["universal@teste.com"];

export const isGoogleCalendarAllowed = (email?: string | null): boolean => {
  if (!GOOGLE_CALENDAR_RESTRICTED) return true;
  if (!email) return false;
  return GOOGLE_CALENDAR_ALLOWLIST.includes(email.trim().toLowerCase());
};