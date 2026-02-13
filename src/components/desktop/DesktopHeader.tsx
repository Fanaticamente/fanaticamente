import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoHeader from "@/assets/logo-header.png";
import { useAuth } from "@/contexts/AuthContext";
import UserDropdownMenu from "./UserDropdownMenu";
import { useAppPages } from "@/hooks/useAppPages";

const navLinks = [
  { label: "Início", path: "/", pageId: "home", isRoute: true },
  { label: "Especialistas", path: "/terapeutas", pageId: "terapeutas", isRoute: true },
  { label: "Zona Mista", path: "/zona-mista", pageId: "zona-mista", isRoute: true },
  { label: "OSMF", path: "/osmf", pageId: "osmf", isRoute: true },
  { label: "Junte-se a nós", path: "#profissionais", pageId: null, isRoute: false },
];

const DesktopHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { data: pages } = useAppPages("desktop");

  // Filter nav links based on page visibility
  const visibleNavLinks = navLinks.filter((link) => {
    if (!link.pageId) return true; // Always show non-page links like "Junte-se a nós"
    const page = pages?.find((p) => p.page_id === link.pageId);
    return page?.is_visible !== false; // Show if page not found or is visible
  });

  const handleNavClick = (link: typeof navLinks[0]) => {
    // Limpa as rotas salvas para evitar conflito com route restoration
    try {
      sessionStorage.removeItem("fanatica_last_route");
      localStorage.removeItem("fanatica_last_route");
    } catch {
      // ignore
    }
    
    // Always navigate to route pages
    if (link.isRoute) {
      navigate(link.path);
      return;
    }

    // For anchor links (e.g., #profissionais), only scroll if we're on the home page
    if (link.path.startsWith('#')) {
      const sectionId = link.path.substring(1);

      if (location.pathname === "/") {
        // We're on the home page, scroll to section
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Navigate to home page with hash, then scroll after navigation
        navigate("/" + link.path);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={logoHeader} alt="Fanaticamente" className="h-10 w-auto" />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-12">
          {visibleNavLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNavClick(link)}
              className="text-gray-400 hover:text-white font-medium transition-colors px-2"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-9 h-9 rounded-full bg-gray-700 animate-pulse" />
          ) : user ? (
            <UserDropdownMenu />
          ) : (
            (() => {
              const authPage = pages?.find((p) => p.page_id === "auth");
              const isAuthVisible = authPage?.is_visible !== false;
              return isAuthVisible ? (
                <>
                  <Link to="/auth">
                    <Button 
                      variant="ghost" 
                      className="text-white hover:bg-white/10"
                    >
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6"
                    >
                      Baixar App
                    </Button>
                  </Link>
                </>
              ) : null;
            })()
          )}
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;
