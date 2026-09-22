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

/**
 * AGENDAMENTOS TEMPORARIAMENTE DESATIVADOS
 *
 * Com BOOKING_ENABLED = false:
 *   • O perfil do profissional exibe apenas o botão de conversa no WhatsApp
 *     (usa o telefone cadastrado pelo profissional).
 *   • A aba "Disponibilidade" do FanaticaWork fica inacessível.
 * Para reativar tudo, basta voltar BOOKING_ENABLED para `true`.
 */
export const BOOKING_ENABLED = false;

/**
 * VALOR DAS SESSÕES TEMPORARIAMENTE OCULTO NOS PERFIS PÚBLICOS
 *
 * Com SHOW_SESSION_PRICES = false, o preço da sessão deixa de aparecer
 * nos perfis dos profissionais (card do perfil, lista de terapeutas
 * desktop e drawer de contato). Para exibir novamente, volte para `true`.
 */
export const SHOW_SESSION_PRICES = false;

/** Monta o link de conversa no WhatsApp a partir do telefone cadastrado. */
export const buildWhatsAppLink = (phone?: string | null, message?: string): string | null => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${withCountry}${text}`;
};

export const GOOGLE_CALENDAR_RESTRICTED = true;
export const GOOGLE_CALENDAR_ALLOWLIST = ["universal@teste.com"];

export const isGoogleCalendarAllowed = (email?: string | null): boolean => {
  if (!GOOGLE_CALENDAR_RESTRICTED) return true;
  if (!email) return false;
  return GOOGLE_CALENDAR_ALLOWLIST.includes(email.trim().toLowerCase());
};