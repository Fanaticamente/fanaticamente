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

  // If no pageId provided or pages still loading, render children directly (public)
  if (!pageId || pagesLoading) {
    return <>{children}</>;
  }

  const page = pages?.find((p) => p.page_id === pageId);
  
  // If page not found in DB or is_public is true, render without protection
  if (!page || page.is_public !== false) {
    return <>{children}</>;
  }

  // Page is private - require login
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export default ProtectedRoute;
