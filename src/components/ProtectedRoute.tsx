import { useRef } from "react";
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

// Rotas torcedor. No app profissional, elas devem voltar ao painel profissional.
// No app torcedor/web, profissionais também podem navegar aqui como torcedores.
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

// ---------------------------------------------------------------------------
// Loop breaker
//
// Contas legadas que possuem role "professional" E navegam no ambiente torcedor
// entravam em ping-pong entre rotas (/terapeutas ↔ /terapeuta/:id ↔ /profissional):
// o guard redirecionava, o destino devolvia o usuário, e o ciclo se repetia
// indefinidamente. Aqui limitamos a quantidade de redirecionamentos automáticos
// numa janela curta de tempo; ao estourar o limite, deixamos a tela renderizar
// em vez de continuar redirecionando.
// ---------------------------------------------------------------------------
const BOUNCE_WINDOW_MS = 5000;
const MAX_BOUNCES = 4;
let bounceTimestamps: number[] = [];

const canBounce = (): boolean => {
  const now = Date.now();
  bounceTimestamps = bounceTimestamps.filter((t) => now - t < BOUNCE_WINDOW_MS);
  if (bounceTimestamps.length >= MAX_BOUNCES) return false;
  bounceTimestamps.push(now);
  return true;
};

// Evita o caso trivial de redirecionar para a própria rota atual.
const redirectTo = (target: string, current: string): boolean =>
  target !== current && canBounce();

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  // Uma vez que o conteúdo já foi renderizado, um novo ciclo de "loading"
  // (refresh de token, evento de outra aba/iframe) não deve desmontar a tela:
  // isso apaga o conteúdo e recarrega iframes filhos em loop.
  const hasRenderedRef = useRef(false);

  if (loading && !hasRenderedRef.current) {
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

    // App torcedor: sem tela de carregamento — o splash inicial já cobre o boot.
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Hard guards isolando os ambientes — comportamento varia por build:
  //
  // 1) APP DOS PROFISSIONAIS (VITE_APP_MODE=professional): qualquer rota torcedor
  //    redireciona para /profissional. E sem role professional → bloqueia totalmente.
  // 2) APP DOS TORCEDORES (VITE_APP_MODE=fan): profissionais também podem usar
  //    o app como torcedores/pacientes. Só bloqueia rotas do painel profissional.
  // 3) WEB UNIFICADO (default): profissionais também podem navegar no ambiente
  //    torcedor; apenas usuários sem papel profissional não acessam rotas pro.
  if (isProfessionalApp) {
    if (!hasRole("professional") && !hasRole("admin") && !hasRole("developer")) {
      return <Navigate to="/auth" replace />;
    }
    if (isFanOnlyRoute(location.pathname) && redirectTo("/profissional", location.pathname)) {
      return <Navigate to="/profissional" replace />;
    }
  } else if (isFanApp) {
    if (isProfessionalRoute(location.pathname) && redirectTo("/", location.pathname)) {
      return <Navigate to="/" replace />;
    }
  } else {
    // Web unificado
    if (
      isProfessionalRoute(location.pathname) &&
      !hasRole("professional") &&
      !hasRole("admin") &&
      !hasRole("developer") &&
      redirectTo("/", location.pathname)
    ) {
      return <Navigate to="/" replace />;
    }
  }

  hasRenderedRef.current = true;
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
  useAuth();

  // Profissionais também podem usar as rotas torcedor como pacientes; não
  // redirecionamos automaticamente para /profissional para evitar loops.
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
