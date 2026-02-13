import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter nav links based on page visibility
  const visibleNavLinks = navLinks.filter((link) => {
    if (!link.pageId) return true;
    const page = pages?.find((p) => p.page_id === link.pageId);
    return page?.is_visible !== false;
  });

  const handleNavClick = (link: typeof navLinks[0]) => {
    setMobileMenuOpen(false);
    try {
      sessionStorage.removeItem("fanatica_last_route");
      localStorage.removeItem("fanatica_last_route");
    } catch {
      // ignore
    }
    
    if (link.isRoute) {
      navigate(link.path);
      return;
    }

    if (link.path.startsWith('#')) {
      const sectionId = link.path.substring(1);

      if (location.pathname === "/") {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate("/" + link.path);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 lg:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={logoHeader} alt="Fanaticamente" className="h-8 lg:h-10 w-auto" />
        </Link>

        {/* Desktop Navigation Links */}
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

        {/* Auth Section + Mobile Menu Button */}
        <div className="flex items-center gap-3">
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
                  <Link to="/auth" className="hidden sm:block">
                    <Button 
                      variant="ghost" 
                      className="text-white hover:bg-white/10"
                    >
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 sm:px-6 text-sm"
                    >
                      Baixar App
                    </Button>
                  </Link>
                </>
              ) : null;
            })()
          )}

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white p-1"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a0a0a]/98 backdrop-blur-sm border-t border-gray-800 px-4 py-4 space-y-1">
          {visibleNavLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNavClick(link)}
              className="block w-full text-left text-gray-300 hover:text-white font-medium py-3 px-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

export default DesktopHeader;
