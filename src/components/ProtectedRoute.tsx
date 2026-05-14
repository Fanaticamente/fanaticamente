import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { useAppPages } from "@/hooks/useAppPages";

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
  "/terapeuta", "/cursos", "/curso",
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

  // Hard guard: profissional não pode acessar rotas do ambiente torcedor.
  if (hasRole("professional") && isFanOnlyRoute(location.pathname)) {
    return <Navigate to="/profissional" replace />;
  }

  // Hard guard: torcedor (sem role professional) não pode acessar rotas exclusivas profissionais.
  if (isProfessionalRoute(location.pathname) && !hasRole("professional") && !hasRole("admin") && !hasRole("developer")) {
    return <Navigate to="/" replace />;
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

  // GUARD GLOBAL: profissional logado nunca permanece em rota do ambiente torcedor,
  // independente de a página ser pública ou privada.
  if (user && hasRole("professional") && isFanOnlyRoute(location.pathname)) {
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

  // If page not found in DB or is_public is true, render without protection
  if (!page || page.is_public !== false) {
    return <>{children}</>;
  }

  // Page is private - require login
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export default ProtectedRoute;
