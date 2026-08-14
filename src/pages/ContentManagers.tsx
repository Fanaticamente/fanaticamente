import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Smartphone, Monitor, ArrowRight, Loader2, Settings, LogOut, ExternalLink, GraduationCap, ArrowLeft, Bell, Megaphone, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourseManager from "@/components/admin/CourseManager";
import { useManagerTheme } from "@/hooks/useManagerTheme";

const ContentManagers = () => {
  const { user, hasRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"menu" | "courses">("menu");
  useManagerTheme();

  const handleLogout = async () => {
    await signOut();
    navigate("/admin-access");
  };
  
  useEffect(() => {
    if (!loading && (!user || !hasRole("developer"))) {
      navigate("/");
    }
  }, [user, hasRole, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <header className="min-h-14 bg-card border-b border-border flex items-center justify-between gap-2 px-3 sm:px-6 py-2 flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 hidden sm:flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-base sm:text-lg text-card-foreground">
              Gerenciadores de Conteúdo
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Escolha qual plataforma deseja editar
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/")}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Visualizar o site
          </Button>
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        {activeView === "courses" ? (
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <Button variant="ghost" onClick={() => setActiveView("menu")} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
            </div>
            <CourseManager />
          </div>
        ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 max-w-6xl w-full">
          {/* Mobile Manager Card */}
          <div 
            onClick={() => navigate("/developer/mobile")}
            className="group cursor-pointer bg-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl text-card-foreground mb-3">App Mobile</h2>
            <p className="text-muted-foreground mb-6">Edite o conteúdo do aplicativo mobile: home, carrossel, cards, navegação e páginas internas do app.</p>
            <div className="flex items-center gap-2 text-primary group-hover:gap-4 transition-all">
              <span className="font-medium">Acessar gerenciador</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Desktop Manager Card */}
          <div 
            onClick={() => navigate("/developer/desktop")}
            className="group cursor-pointer bg-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Monitor className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl text-card-foreground mb-3">Site Desktop/Web</h2>
            <p className="text-muted-foreground mb-6">Edite o conteúdo do site institucional: hero, seções, depoimentos, formulários e páginas web.</p>
            <div className="flex items-center gap-2 text-primary group-hover:gap-4 transition-all">
              <span className="font-medium">Acessar gerenciador</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* FanatiClass Manager Card */}
          <div 
            onClick={() => setActiveView("courses")}
            className="group cursor-pointer bg-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl text-card-foreground mb-3">FanatiClass</h2>
            <p className="text-muted-foreground mb-6">Gerencie cursos, módulos, aulas, vídeos e atividades complementares da plataforma de ensino.</p>
            <div className="flex items-center gap-2 text-primary group-hover:gap-4 transition-all">
              <span className="font-medium">Acessar gerenciador</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Notification Manager Card */}
          <div 
            onClick={() => navigate("/developer/notificacoes")}
            className="group cursor-pointer bg-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Bell className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl text-card-foreground mb-3">Notificações</h2>
            <p className="text-muted-foreground mb-6">Envie, configure templates, automatize disparos e visualize métricas completas do sistema de notificações.</p>
            <div className="flex items-center gap-2 text-primary group-hover:gap-4 transition-all">
              <span className="font-medium">Acessar gerenciador</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Marketing & Content Manager Card (monitoring access for dev/admin) */}
          <div 
            onClick={() => navigate("/developer/atividades")}
            className="group cursor-pointer bg-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl text-card-foreground mb-3">Atividades</h2>
            <p className="text-muted-foreground mb-6">Visualize todos os menus de atividades do app, crie novos menus e tópicos e edite os quizzes da Resenha Fanática (perguntas, alternativas e devolutivas).</p>
            <div className="flex items-center gap-2 text-primary group-hover:gap-4 transition-all">
              <span className="font-medium">Acessar gerenciador</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div 
            onClick={() => navigate("/marketing")}
            className="group cursor-pointer bg-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Megaphone className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl text-card-foreground mb-3">Marketing & Conteúdo</h2>
            <p className="text-muted-foreground mb-6">Acompanhe e edite as notícias do Setor Saúde publicadas pela equipe de Marketing. Acesso de monitoramento para Dev/Admin.</p>
            <div className="flex items-center gap-2 text-primary group-hover:gap-4 transition-all">
              <span className="font-medium">Abrir painel</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
        </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          As alterações são salvas automaticamente e refletidas em tempo real no preview
        </p>
      </footer>
    </div>
  );
};

export default ContentManagers;
