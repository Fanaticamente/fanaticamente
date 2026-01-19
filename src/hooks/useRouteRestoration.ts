import { useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTE_STORAGE_KEY = "fanatica_last_route";
const ROUTE_TIMESTAMP_KEY = "fanatica_last_route_ts";
const FOCUSED_FIELD_KEY = "fanatica_focused_field";

// Tempo máximo de inatividade (em ms) antes de resetar para a home
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

// Evita disparar restauração múltiplas vezes na mesma execução do app.
// Importante: isso precisa ser em memória (não sessionStorage), porque em iOS/PWA
// o processo pode ser morto e o app recarregar mantendo sessionStorage; ainda assim
// queremos restaurar a rota novamente após um reload real.
let restoredThisRuntime = false;

// Rotas públicas que não devem participar da restauração
const PUBLIC_ROUTES = ["/auth", "/admin-access", "/setup-test"];

const isPublicRoute = (path: string) =>
  PUBLIC_ROUTES.some((route) => path.startsWith(route));

// Salva o campo focado no localStorage
const saveFocusedField = () => {
  try {
    const activeElement = document.activeElement as HTMLElement | null;
    if (
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.isContentEditable)
    ) {
      const fieldId =
        activeElement.id ||
        activeElement.getAttribute("name") ||
        activeElement.getAttribute("data-field-id");

      if (fieldId) {
        localStorage.setItem(FOCUSED_FIELD_KEY, fieldId);
        // Salva também a posição do cursor/seleção
        if ("selectionStart" in activeElement) {
          const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
          localStorage.setItem(
            `${FOCUSED_FIELD_KEY}_selection`,
            JSON.stringify({
              start: input.selectionStart,
              end: input.selectionEnd,
            })
          );
        }
      }
    }
  } catch {
    // ignore
  }
};

// Restaura o foco no campo salvo
const restoreFocusedField = () => {
  try {
    const fieldId = localStorage.getItem(FOCUSED_FIELD_KEY);
    if (!fieldId) return;

    // Aguarda o DOM estar pronto
    const attemptFocus = (retries = 0) => {
      const element =
        document.getElementById(fieldId) ||
        document.querySelector(`[name="${fieldId}"]`) ||
        document.querySelector(`[data-field-id="${fieldId}"]`);

      if (element) {
        (element as HTMLElement).focus();

        // Restaura posição do cursor
        const selectionData = localStorage.getItem(`${FOCUSED_FIELD_KEY}_selection`);
        if (selectionData && "setSelectionRange" in element) {
          const { start, end } = JSON.parse(selectionData);
          const input = element as HTMLInputElement | HTMLTextAreaElement;
          // Timeout pequeno para garantir que o valor foi preenchido
          setTimeout(() => {
            try {
              input.setSelectionRange(start, end);
            } catch {
              // ignore - alguns tipos de input não suportam
            }
          }, 50);
        }

        // Limpa após restaurar
        localStorage.removeItem(FOCUSED_FIELD_KEY);
        localStorage.removeItem(`${FOCUSED_FIELD_KEY}_selection`);
      } else if (retries < 10) {
        // Tenta novamente após um curto delay (componentes podem não estar montados ainda)
        setTimeout(() => attemptFocus(retries + 1), 100);
      }
    };

    // Aguarda um pouco para que a página seja renderizada
    setTimeout(attemptFocus, 200);
  } catch {
    // ignore
  }
};

export const useRouteRestoration = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Monitora quando o usuário sai do app (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Salva o campo focado quando o app perde visibilidade
        saveFocusedField();
        // Atualiza o timestamp
        try {
          const now = Date.now().toString();
          localStorage.setItem(ROUTE_TIMESTAMP_KEY, now);
          sessionStorage.setItem(ROUTE_TIMESTAMP_KEY, now);
        } catch {
          // ignore
        }
      } else if (document.visibilityState === "visible" && restoredThisRuntime) {
        // Quando o app volta a ficar visível (e já restaurou rota), restaura o foco
        restoreFocusedField();
      }
    };

    // Também monitora beforeunload para casos onde o app é fechado
    const handleBeforeUnload = () => {
      saveFocusedField();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  }, []);

  // 1) Persistir a rota atual.
  //    Usamos localStorage (sobrevive a fechar o app/OS matar o processo)
  //    e sessionStorage (rápido e isolado por aba).
  //
  // IMPORTANTE: em alguns cenários de PWA/iOS, o app pode "renascer" na rota "/".
  // Se persistirmos "/" imediatamente, apagamos a última rota útil salva e a
  // restauração não acontece. Por isso, quando estivermos em "/" e ainda não
  // tivermos feito a restauração nesta execução, evitamos gravar "/" se existir
  // uma rota salva diferente de "/".
  useEffect(() => {
    const currentPath = location.pathname + location.search;

    if (isPublicRoute(location.pathname)) return;

    // Evita sobrescrever a última rota com "/" antes de restaurar.
    if (location.pathname === "/" && !restoredThisRuntime) {
      try {
        const savedRoute =
          sessionStorage.getItem(ROUTE_STORAGE_KEY) ||
          localStorage.getItem(ROUTE_STORAGE_KEY);

        if (savedRoute && savedRoute !== "/") return;
      } catch {
        // ignore
      }
    }

    try {
      localStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
      sessionStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
      // Atualiza o timestamp a cada mudança de rota
      const now = Date.now().toString();
      localStorage.setItem(ROUTE_TIMESTAMP_KEY, now);
      sessionStorage.setItem(ROUTE_TIMESTAMP_KEY, now);
    } catch {
      // Se storage estiver indisponível (modo privado, etc.), apenas ignora.
    }
  }, [location.pathname, location.search]);

  // 2) Ao montar o app, voltar para a última rota salva.
  //    Para evitar "piscadas/recarregamentos" ao alternar de app/aba,
  //    fazemos a restauração no máximo 1x por sessão.
  useEffect(() => {
    const currentPath = location.pathname;
    if (isPublicRoute(currentPath)) return;

    if (restoredThisRuntime) return;
    restoredThisRuntime = true;

    const savedRoute =
      sessionStorage.getItem(ROUTE_STORAGE_KEY) ||
      localStorage.getItem(ROUTE_STORAGE_KEY);

    const savedTimestamp =
      sessionStorage.getItem(ROUTE_TIMESTAMP_KEY) ||
      localStorage.getItem(ROUTE_TIMESTAMP_KEY);

    if (!savedRoute) return;
    if (isPublicRoute(savedRoute)) return;

    // Verifica se passou mais de 10 minutos desde a última atividade
    if (savedTimestamp) {
      const lastActivity = parseInt(savedTimestamp, 10);
      const now = Date.now();
      const elapsed = now - lastActivity;

      if (elapsed > INACTIVITY_TIMEOUT_MS) {
        // Limpa a rota salva e não restaura (fica na home)
        try {
          localStorage.removeItem(ROUTE_STORAGE_KEY);
          sessionStorage.removeItem(ROUTE_STORAGE_KEY);
          localStorage.removeItem(ROUTE_TIMESTAMP_KEY);
          sessionStorage.removeItem(ROUTE_TIMESTAMP_KEY);
          localStorage.removeItem(FOCUSED_FIELD_KEY);
          localStorage.removeItem(`${FOCUSED_FIELD_KEY}_selection`);
        } catch {
          // ignore
        }
        return;
      }
    }

    // Só restaura quando o app nasce na raiz (comportamento padrão do PWA/browser)
    if (currentPath === "/" && savedRoute !== "/") {
      const timer = window.setTimeout(() => {
        navigate(savedRoute, { replace: true });
        // Restaura o foco após a navegação
        setTimeout(restoreFocusedField, 300);
      }, 0);

      return () => window.clearTimeout(timer);
    } else if (currentPath === savedRoute) {
      // Se já está na rota correta, apenas restaura o foco
      setTimeout(restoreFocusedField, 300);
    }
  }, []); // executar apenas uma vez ao montar
};
