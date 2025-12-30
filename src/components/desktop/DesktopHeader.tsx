import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoHeader from "@/assets/logo-header.png";

const navLinks = [
  { label: "Especialistas", path: "/terapeutas" },
  { label: "FanatiClass", path: "/cursos" },
  { label: "Comunidade", path: "/quiz" },
  { label: "Rádio", path: "/radio" },
  { label: "Loja", path: "/loja" },
];

const DesktopHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--desktop-header))] border-b border-[hsl(var(--desktop-border))] shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src={logoHeader} alt="Logo" className="h-10 w-auto" />
          <span className="font-display text-2xl text-[hsl(var(--desktop-fg))] tracking-wide">
            Fanática
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-[hsl(var(--desktop-muted-fg))] hover:text-[hsl(var(--desktop-fg))] font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button 
              variant="ghost" 
              className="text-[hsl(var(--desktop-fg))] hover:bg-[hsl(var(--desktop-muted))]"
            >
              Entrar
            </Button>
          </Link>
          <Link to="/auth">
            <Button 
              className="bg-[hsl(var(--desktop-primary))] hover:bg-[hsl(var(--desktop-primary))]/90 text-[hsl(var(--desktop-primary-foreground))] rounded-full px-6"
            >
              Cadastre-se
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;
