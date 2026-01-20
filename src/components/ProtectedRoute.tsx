import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

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
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    const isProfessional = isProfessionalRoute(location.pathname);

    if (isProfessional) {
      // Loading claro para profissionais (verde)
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[hsl(145,63%,42%)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Carregando...</p>
          </div>
        </div>
      );
    }

    // Loading escuro para torcedores (amarelo)
    return (
      <div className="min-h-screen bg-[hsl(0,0%,8%)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[hsl(45,100%,51%)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page, preserving the intended destination
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
