import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTE_STORAGE_KEY = "fanatica_last_route";

// Evita disparar restauração múltiplas vezes na mesma execução do app.
// Importante: isso precisa ser em memória (não sessionStorage), porque em iOS/PWA
// o processo pode ser morto e o app recarregar mantendo sessionStorage; ainda assim
// queremos restaurar a rota novamente após um reload real.
let restoredThisRuntime = false;

// Rotas públicas que não devem participar da restauração
const PUBLIC_ROUTES = ["/auth", "/admin-access", "/setup-test"];

const isPublicRoute = (path: string) =>
  PUBLIC_ROUTES.some((route) => path.startsWith(route));

export const useRouteRestoration = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1) Persistir a rota atual.
  //    Usamos localStorage (sobrevive a fechar o app/OS matar o processo)
  //    e sessionStorage (rápido e isolado por aba).
  //
  // IMPORTANTE: em alguns cenários de PWA/iOS, o app pode “renascer” na rota "/".
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
    } catch {
      // Se storage estiver indisponível (modo privado, etc.), apenas ignora.
    }
  }, [location.pathname, location.search]);

  // 2) Ao montar o app, voltar para a última rota salva.
  //    Para evitar “piscadas/recarregamentos” ao alternar de app/aba,
  //    fazemos a restauração no máximo 1x por sessão.
  useEffect(() => {
    const currentPath = location.pathname;
    if (isPublicRoute(currentPath)) return;

    if (restoredThisRuntime) return;
    restoredThisRuntime = true;

    const savedRoute =
      sessionStorage.getItem(ROUTE_STORAGE_KEY) ||
      localStorage.getItem(ROUTE_STORAGE_KEY);

    if (!savedRoute) return;
    if (isPublicRoute(savedRoute)) return;

    // Só restaura quando o app nasce na raiz (comportamento padrão do PWA/browser)
    if (currentPath === "/" && savedRoute !== "/") {
      const timer = window.setTimeout(() => {
        navigate(savedRoute, { replace: true });
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, []); // executar apenas uma vez ao montar
};
