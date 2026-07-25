import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { useAppPages } from "@/hooks/useAppPages";
import { isFanApp, isProfessionalApp } from "@/lib/appMode";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Rotas exclusivas do ambiente profissional
const PROFESSIONAL_ROUTES = [
  "/profissional",
  "/psi-house",
  "/fanatica-lab",
  "/fanatica-lab/",
  "/conecta",
];

const isProfessionalRoute = (pathname: string): boolean => {
  return PROFESSIONAL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );
};

// Rotas onde profissional logado NÃO deve permanecer (são exclusivas do ambiente torcedor).
// Rotas administrativas/de suporte ficam fora dessa lista.
const FAN_ONLY_ROUTES = [
  "/", "/futebol", "/quiz", "/radio", "/ranking", "/loja", "/zona-mista",
  "/setor-saude", "/diario", "/fanaticaze-tv", "/osmf", "/terapeutas",
  "/terapeuta", "/cursos", "/curso", "/perfil", "/meus-agendamentos",
  "/pagamentos", "/configuracoes", "/notificacoes", "/pagamento",
];

const isFanOnlyRoute = (pathname: string): boolean => {
  if (pathname === "/") return true;
  return FAN_ONLY_ROUTES.some(
    (route) => route !== "/" && (pathname === route || pathname.startsWith(route + "/"))
  );
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    const isProfessional = isProfessionalRoute(location.pathname);

    if (isProfessional) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[hsl(145,63%,42%)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Carregando...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[hsl(0,0%,8%)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[hsl(45,100%,51%)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Hard guards isolando os ambientes — comportamento varia por build:
  //
  // 1) APP DOS PROFISSIONAIS (VITE_APP_MODE=professional): qualquer rota torcedor
  //    redireciona para /profissional. E sem role professional → bloqueia totalmente.
  // 2) APP DOS TORCEDORES (VITE_APP_MODE=fan): sessão profissional é incompatível
  //    com este app e não deve renderizar ambiente torcedor.
  // 3) WEB UNIFICADO (default): mantém o isolamento estrito por role —
  //    profissional sempre é jogado para /profissional, torcedor não acessa
  //    rotas profissionais.
  if (isProfessionalApp) {
    if (!hasRole("professional") && !hasRole("admin") && !hasRole("developer")) {
      return <Navigate to="/auth" replace />;
    }
    if (isFanOnlyRoute(location.pathname)) {
      return <Navigate to="/profissional" replace />;
    }
  } else if (isFanApp) {
    if (hasRole("professional") && !hasRole("admin") && !hasRole("developer")) {
      return <Navigate to="/auth" replace />;
    }
    if (isProfessionalRoute(location.pathname)) {
      return <Navigate to="/" replace />;
    }
  } else {
    // Web unificado
    if (hasRole("professional") && isFanOnlyRoute(location.pathname)) {
      return <Navigate to="/profissional" replace />;
    }
    if (isProfessionalRoute(location.pathname) && !hasRole("professional") && !hasRole("admin") && !hasRole("developer")) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Dynamic route protection based on app_pages.is_public flag.
 * If the page is marked as public, renders children directly.
 * If private (is_public=false), wraps in ProtectedRoute requiring login.
 * Falls back to public if page config not found or still loading.
 */
export const DynamicProtectedRoute = ({ children, pageId }: ProtectedRouteProps & { pageId?: string }) => {
  const { data: pages, isLoading: pagesLoading } = useAppPages("all");
  const { user, hasRole } = useAuth();
  const location = useLocation();

  // GUARD GLOBAL: profissionais não podem permanecer em rota torcedor no web unificado
  // nem no app torcedor; no app profissional, rotas torcedor não existem.
  if (isFanApp && user && hasRole("professional") && !hasRole("admin") && !hasRole("developer")) {
    return <Navigate to="/auth" replace />;
  }
  if (!isFanApp && !isProfessionalApp && user && hasRole("professional") && isFanOnlyRoute(location.pathname)) {
    return <Navigate to="/profissional" replace />;
  }
  if (isProfessionalApp) {
    // Rotas torcedor não devem renderizar no app profissional.
    return <Navigate to="/profissional" replace />;
  }

  // If no pageId provided or pages still loading, render children directly (public)
  if (!pageId || pagesLoading) {
    return <>{children}</>;
  }

  const page = pages?.find((p) => p.page_id === pageId);

  // If page is explicitly hidden, do not allow direct access
  if (page?.is_visible === false) {
    return <Navigate to="/" replace />;
  }

  // Fan/mobile experience: login is mandatory. The desktop marketing site
  // (fanaticamente.com em telas >=1024px) mantém as páginas públicas conforme
  // a flag is_public do CMS.
  const isMobileViewport =
    typeof window !== "undefined" && window.innerWidth < 1024;
  const requireLoginAlways = isFanApp || isMobileViewport;

  if (requireLoginAlways) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
  }

  // Desktop web: if page not found in DB or is_public is true, render without protection
  if (!page || page.is_public !== false) {
    return <>{children}</>;
  }

  // Page is private - require login
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export default ProtectedRoute;
