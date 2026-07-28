/**
 * Preview frame detection.
 *
 * O Gerenciador Mobile (/developer/mobile) renderiza o app real dentro de um
 * <iframe> na MESMA origem. Isso significa que a instância do iframe compartilha
 * localStorage, tokens do Supabase, service worker e SDKs globais (OneSignal)
 * com a janela do gerenciador.
 *
 * Sem proteção, a instância do iframe pode:
 *  - limpar os tokens "sb-*" do localStorage (rotina de recuperação de sessão)
 *  - chamar supabase.auth.signOut() em guardas de ambiente
 *  - fazer login/logout no OneSignal
 *  - registrar/desregistrar service workers
 *
 * ...o que desloga e "apaga" a tela do gerenciador (bug de carregar/sumir).
 *
 * Em preview, todas essas ações destrutivas devem ser puladas.
 */
export const isPreviewFrame = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    if (window.self === window.top) return false;
    return new URLSearchParams(window.location.search).get("forceMobile") === "1";
  } catch {
    // Cross-origin access error → estamos em um iframe de outra origem
    return false;
  }
};

export const IS_PREVIEW_FRAME = isPreviewFrame();
