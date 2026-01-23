import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoHeader from "@/assets/logo-header.png";

const navLinks = [
  { label: "Início", path: "/", isRoute: true },
  { label: "Especialistas", path: "/terapeutas", isRoute: true },
  { label: "OSMF", path: "/osmf", isRoute: true },
  { label: "Junte-se a nós", path: "#profissionais", isRoute: false },
];

const DesktopHeader = () => {
  const navigate = useNavigate();

  const handleNavClick = (link: typeof navLinks[0]) => {
    if (link.isRoute) {
      navigate(link.path);
    } else if (link.path.startsWith('#')) {
      const element = document.getElementById(link.path.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
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
