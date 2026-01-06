import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTE_STORAGE_KEY = "fanatica_last_route";

// Rotas públicas que não devem participar da restauração
const PUBLIC_ROUTES = ["/auth", "/admin-access", "/setup-test"];

export const useRouteRestoration = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Salvar rota atual quando o usuário sai do app (exceto rotas públicas)
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Não salvar rotas públicas
    if (PUBLIC_ROUTES.some(route => location.pathname.startsWith(route))) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sessionStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
      }
    };

    // Também salvar a cada mudança de rota
    sessionStorage.setItem(ROUTE_STORAGE_KEY, currentPath);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [location.pathname, location.search]);

  // Restaurar rota ao montar o app
  useEffect(() => {
    const savedRoute = sessionStorage.getItem(ROUTE_STORAGE_KEY);
    const currentPath = location.pathname;
    
    // Não restaurar se estiver em uma rota pública
    if (PUBLIC_ROUTES.some(route => currentPath.startsWith(route))) {
      return;
    }
    
    // Só restaurar se estiver na raiz e houver uma rota salva diferente
    if (savedRoute && currentPath === "/" && savedRoute !== "/") {
      const timer = setTimeout(() => {
        navigate(savedRoute, { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []); // Executar apenas uma vez ao montar
};
