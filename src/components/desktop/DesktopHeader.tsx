import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoHeader from "@/assets/logo-header.png";

const navLinks = [
  { label: "Início", path: "/", isRoute: true },
  { label: "Especialistas", path: "/terapeutas", isRoute: true },
  { label: "Zona Mista", path: "/zona-mista", isRoute: true },
  { label: "OSMF", path: "/osmf", isRoute: true },
  { label: "Junte-se a nós", path: "#profissionais", isRoute: false },
];

const DesktopHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNavClick(link)}
              className="text-gray-400 hover:text-white font-medium transition-colors px-2"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
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
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;
