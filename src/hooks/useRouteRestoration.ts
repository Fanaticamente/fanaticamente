import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTE_STORAGE_KEY = "fanatica_last_route";
const ROUTE_RESTORED_KEY = "fanatica_route_restored_v1";

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
  useEffect(() => {
    const currentPath = location.pathname + location.search;

    if (isPublicRoute(location.pathname)) return;

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

    try {
      // Se já restauramos nesta sessão, não redireciona novamente.
      if (sessionStorage.getItem(ROUTE_RESTORED_KEY) === "1") return;
      sessionStorage.setItem(ROUTE_RESTORED_KEY, "1");
    } catch {
      // Sem sessionStorage disponível: seguimos sem o “restore once”.
    }

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
