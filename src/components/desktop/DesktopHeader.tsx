import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoHeader from "@/assets/logo-header.png";

const navLinks = [
  { label: "Funcionalidades", path: "#funcionalidades" },
  { label: "Curiosidades", path: "#curiosidades" },
  { label: "Sobre nós", path: "#sobre" },
  { label: "Profissionais", path: "#profissionais" },
];

const DesktopHeader = () => {
  const scrollToSection = (id: string) => {
    if (id.startsWith('#')) {
      const element = document.getElementById(id.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src={logoHeader} alt="Logo" className="h-10 w-auto" />
          <span className="font-display text-2xl text-white tracking-wide">
            Fanaticamente
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => scrollToSection(link.path)}
              className="text-gray-400 hover:text-white font-medium transition-colors"
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
