import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Smartphone, Monitor, ArrowRight, Loader2, Settings, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const ContentManagers = () => {
  const { user, hasRole, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };
  
  // Desktop-only check: viewport >= 1024px
  const [isDesktop, setIsDesktop] = useState(() => 
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Block mobile/tablet access - desktop only
  if (!isDesktop) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-6">
            <Monitor className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="font-display text-2xl text-card-foreground mb-3">
            Acesso apenas pelo Desktop
          </h1>
          <p className="text-muted-foreground mb-6">
            O Gerenciador de Conteúdo está disponível apenas em computadores. 
            Por favor, acesse pelo navegador do seu computador.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center">
            <Settings className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h1 className="font-display text-lg text-card-foreground">
              Gerenciadores de Conteúdo
            </h1>
            <p className="text-xs text-muted-foreground">
              Escolha qual plataforma deseja editar
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Visualizar o site
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          {/* Mobile Manager Card */}
          <div 
            onClick={() => navigate("/developer/mobile")}
            className="group cursor-pointer bg-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="font-display text-2xl text-card-foreground mb-3">
              App Mobile
            </h2>
            <p className="text-muted-foreground mb-6">
              Edite o conteúdo do aplicativo mobile: home, carrossel, cards, navegação e páginas internas do app.
            </p>
            
            <div className="flex items-center gap-2 text-primary group-hover:gap-4 transition-all">
              <span className="font-medium">Acessar gerenciador</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Desktop Manager Card */}
          <div 
            onClick={() => navigate("/developer/desktop")}
            className="group cursor-pointer bg-card border border-border rounded-2xl p-8 hover:border-secondary/50 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Monitor className="w-10 h-10 text-secondary" />
            </div>
            
            <h2 className="font-display text-2xl text-card-foreground mb-3">
              Site Desktop/Web
            </h2>
            <p className="text-muted-foreground mb-6">
              Edite o conteúdo do site institucional: hero, seções, depoimentos, formulários e páginas web.
            </p>
            
            <div className="flex items-center gap-2 text-secondary group-hover:gap-4 transition-all">
              <span className="font-medium">Acessar gerenciador</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
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
