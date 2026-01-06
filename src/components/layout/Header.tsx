import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, Home, Users, BookOpen, Radio, Newspaper, User, Settings, ShoppingBag, Thermometer, Shirt } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAppMenu } from "@/hooks/useAppContent";
import logoHeader from "@/assets/logo-header.png";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Users,
  BookOpen,
  Radio,
  Newspaper,
  User,
  Settings,
  ShoppingBag,
  Thermometer,
  Shirt,
};

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: menuData } = useAppMenu('header_menu');

  const menuItems = menuData?.items || [
    { icon: "Home", label: "Início", path: "/" },
    { icon: "Users", label: "Terapeutas", path: "/terapeutas" },
    { icon: "BookOpen", label: "FanatiClass", path: "/cursos" },
    { icon: "Radio", label: "Alambrado FM", path: "/radio" },
    { icon: "Newspaper", label: "Notícias", path: "/futebol" },
    { icon: "User", label: "Perfil", path: "/perfil" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-dark pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-4 py-3">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Menu className="w-6 h-6 text-white" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-background border-border p-0">
            <div className="p-6 border-b border-border flex flex-col items-center">
              <img src={logoHeader} alt="Logo" className="h-12 w-auto" />
              <p className="text-muted-foreground text-sm mt-2">
                Saúde mental para torcedores
              </p>
            </div>

            <nav className="p-4">
              {menuItems.map((item) => {
                const IconComponent = iconMap[item.icon] || Home;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors group"
                  >
                    <IconComponent className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    <span className="text-card-foreground font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center">
          <img src={logoHeader} alt="Logo" className="h-8 w-auto" />
        </Link>

        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <Search className="w-6 h-6 text-white" />
        </button>
      </div>
    </header>
  );
};

export default Header;