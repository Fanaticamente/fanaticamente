import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTE_STORAGE_KEY = "fanatica_last_route";

export const useRouteRestoration = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Salvar rota atual quando o usuário sai do app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Salvar a rota atual quando o app fica em segundo plano
        const currentPath = location.pathname + location.search;
        sessionStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
      }
    };

    // Também salvar a cada mudança de rota
    const currentPath = location.pathname + location.search;
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
    
    // Só restaurar se estiver na raiz e houver uma rota salva diferente
    if (savedRoute && currentPath === "/" && savedRoute !== "/") {
      // Pequeno delay para garantir que o app está pronto
      const timer = setTimeout(() => {
        navigate(savedRoute, { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []); // Executar apenas uma vez ao montar
};
