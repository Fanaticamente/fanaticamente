import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Monitor, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationManager from "@/components/developer/NotificationManager";

const NotificationManagerPage = () => {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!loading && (!user || (!hasRole("developer") && !hasRole("admin")))) {
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

  if (!isDesktop) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-6">
            <Monitor className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="font-display text-2xl text-card-foreground mb-3">Acesso apenas pelo Desktop</h1>
          <p className="text-muted-foreground mb-6">
            O Gerenciador de Notificações está disponível apenas em computadores.
          </p>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/developer")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary font-medium">Sistema ativo</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Central de Notificações</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <NotificationManager />
      </div>
    </div>
  );
};

export default NotificationManagerPage;
