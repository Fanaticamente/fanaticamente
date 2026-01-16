import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_STORAGE_KEY = "fanatica_last_route";
const APP_STATE_KEY = "fanatica_app_state";

// Rotas públicas que não devem participar da restauração
const PUBLIC_ROUTES = ["/auth", "/admin-access", "/setup-test"];

export const useRouteRestoration = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  // Salvar rota atual (sem forçar recarregamentos)
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Não salvar rotas públicas
    if (PUBLIC_ROUTES.some(route => location.pathname.startsWith(route))) {
      return;
    }

    // Salvar rota no sessionStorage
    sessionStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
    
    // Marcar que o app já foi inicializado (previne reloads desnecessários)
    sessionStorage.setItem(APP_STATE_KEY, "active");
  }, [location.pathname, location.search]);

  // Prevenir comportamento padrão de reload ao retornar ao app
  useEffect(() => {
    // Handler para quando o app volta ao foco
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // App voltou ao foco - não fazer nada, manter estado atual
        // Isso previne qualquer tentativa de reload
        return;
      }
    };

    // Handler para prevenir reload no beforeunload (apenas em navegações reais)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Não interferir em navegações normais, apenas marcar estado
      sessionStorage.setItem(APP_STATE_KEY, "navigating");
    };

    // Handler para quando a página ganha foco
    const handleFocus = () => {
      // Restaurar estado ativo
      sessionStorage.setItem(APP_STATE_KEY, "active");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("focus", handleFocus);
    
    // Marcar primeira renderização como completa
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);
};
