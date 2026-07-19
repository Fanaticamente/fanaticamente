import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, Home, Users, BookOpen, Radio, Newspaper, User, Shirt, LogOut, Tv, Heart } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import logoHeader from "@/assets/logo-header-v4.png.asset.json";


// Minimal floating icons for the home page (menu + search) — replaces the full Header bar.
const HomeFloatingActions = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const items = [
    { icon: Home, label: "Início", path: "/" },
    { icon: Heart, label: "Bem-estar", path: "/bem-estar" },
    { icon: Users, label: "Terapeutas", path: "/terapeutas" },
    { icon: BookOpen, label: "FanatiClass", path: "/cursos" },
    { icon: Radio, label: "Alambrado FM", path: "/radio" },
    { icon: Newspaper, label: "Futebol", path: "/futebol" },
    { icon: Shirt, label: "FanaticaShop", path: "/loja" },
    { icon: Tv, label: "FanatiCazé TV", path: "/fanaticaze-tv" },
  ];

  const handleLogout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 bg-white flex items-center justify-between px-3 py-2 pt-[calc(env(safe-area-inset-top)+8px)]"
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Abrir menu"
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 bg-white p-0 flex flex-col">
          <div className="p-6 border-b border-slate-200 flex flex-col items-center">
            <img src={logoHeader.url} alt="Fanaticamente" className="h-12 w-auto" />
            <p className="text-slate-500 text-sm mt-2">Saúde mental para torcedores</p>
          </div>
          <nav className="p-3 flex-1 overflow-y-auto">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <Link
                  key={it.path}
                  to={it.path}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700"
                >
                  <Icon className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium">{it.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-200 p-3 space-y-1">
            <Link
              to="/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700"
            >
              <User className="w-5 h-5 text-emerald-600" />
              <span className="font-medium">Você</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 w-full text-left text-rose-600"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Link to="/" aria-label="Fanaticamente" className="flex items-center">
        <img src={logoHeader.url} alt="Fanaticamente" className="h-9 w-auto" />
      </Link>

      <button
        aria-label="Buscar"
        className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-700"
      >
        <Search className="w-5 h-5" />
      </button>
    </div>
  );
};

export default HomeFloatingActions;