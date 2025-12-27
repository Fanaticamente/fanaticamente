import { User, Settings, LogOut, CreditCard, Calendar, BookOpen, ChevronRight, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

const menuItems = [
  {
    icon: Calendar,
    label: "Meus Agendamentos",
    description: "Ver consultas marcadas",
    path: "/perfil/agendamentos",
    badge: "2",
  },
  {
    icon: BookOpen,
    label: "Meus Cursos",
    description: "Acessar cursos comprados",
    path: "/perfil/cursos",
    badge: null,
  },
  {
    icon: CreditCard,
    label: "Pagamentos",
    description: "Histórico e métodos de pagamento",
    path: "/perfil/pagamentos",
    badge: null,
  },
  {
    icon: Bell,
    label: "Notificações",
    description: "Configurar alertas",
    path: "/perfil/notificacoes",
    badge: "5",
  },
  {
    icon: Settings,
    label: "Configurações",
    description: "Preferências da conta",
    path: "/perfil/configuracoes",
    badge: null,
  },
];

const Perfil = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-24 px-4">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl text-card-foreground">
                Torcedor Fanático
              </h1>
              <p className="text-muted-foreground text-sm">
                torcedor@email.com
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full">
                  Premium
                </span>
                <span className="text-muted-foreground text-xs">
                  Membro desde Jan 2024
                </span>
              </div>
            </div>
          </div>

          <button className="w-full py-3 border border-border rounded-xl text-card-foreground font-medium hover:border-primary transition-colors">
            Editar Perfil
          </button>
        </div>

        {/* My Team */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-display text-xl text-card-foreground mb-4">
            Meu Time do Coração
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-3xl">⚽</span>
            </div>
            <div>
              <p className="text-card-foreground font-bold text-lg">Flamengo</p>
              <p className="text-muted-foreground text-sm">Série A - Brasileiro</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="font-display text-3xl text-primary">15</p>
            <p className="text-muted-foreground text-xs">Dias no diário</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="font-display text-3xl text-secondary">3</p>
            <p className="text-muted-foreground text-xs">Cursos feitos</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="font-display text-3xl text-therapy">2</p>
            <p className="text-muted-foreground text-xs">Consultas</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2 mb-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-card-foreground font-medium">{item.label}</p>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
              {item.badge && (
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button className="w-full flex items-center justify-center gap-2 py-4 bg-destructive/10 text-destructive rounded-xl font-medium hover:bg-destructive/20 transition-colors">
          <LogOut className="w-5 h-5" />
          Sair da Conta
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

export default Perfil;
