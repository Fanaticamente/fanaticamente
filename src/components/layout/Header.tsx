import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Home, Users, BookOpen, Radio, Newspaper, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAppLogo, useAppLogoSmall } from "@/hooks/useAppLogo";

const menuItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Users, label: "Terapeutas", path: "/terapeutas" },
  { icon: BookOpen, label: "FanatiClass", path: "/cursos" },
  { icon: Radio, label: "Alambrado FM", path: "/radio" },
  { icon: Newspaper, label: "Notícias", path: "/futebol" },
  { icon: User, label: "Perfil", path: "/perfil" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: logo } = useAppLogo();
  const { data: logoSmall } = useAppLogoSmall();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-dark">
      <div className="flex items-center justify-between px-4 py-3">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Menu className="w-6 h-6 text-primary" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-background border-border p-0">
            <div className="p-6 border-b border-border">
              {logo ? (
                <img src={logo} alt="Logo" className="h-10 w-auto" />
              ) : (
                <h2 className="font-display text-3xl text-primary">
                  fanatica<span className="text-secondary">mente</span>
                </h2>
              )}
              <p className="text-muted-foreground text-sm mt-1">
                Saúde mental para torcedores
              </p>
            </div>

            <nav className="p-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors group"
                >
                  <item.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-card-foreground font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center">
          {logoSmall ? (
            <img src={logoSmall} alt="Logo" className="h-8 w-auto" />
          ) : (
            <span className="font-display text-2xl">
              <span className="text-primary">fanatica</span>
              <span className="text-secondary">mente</span>
            </span>
          )}
        </Link>

        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <Search className="w-6 h-6 text-primary" />
        </button>
      </div>
    </header>
  );
};

export default Header;
