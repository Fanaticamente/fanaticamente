import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useManagerTheme } from "@/hooks/useManagerTheme";
import ActivitiesManager from "@/components/developer/ActivitiesManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2, Loader2, Monitor } from "lucide-react";

const ActivitiesManagerPage = () => {
  useManagerTheme();
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
    if (!loading && (!user || !(hasRole("developer") || hasRole("admin")))) {
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
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl text-card-foreground mb-3">Acesso apenas pelo Desktop</h1>
          <p className="text-muted-foreground mb-6">
            O Gerenciador de Atividades está disponível apenas em computadores.
          </p>
          <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="h-14 bg-card border-b border-border flex items-center gap-3 px-4 flex-shrink-0 sticky top-0 z-10">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/developer")}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="w-px h-8 bg-border" />
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Gamepad2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-lg text-card-foreground">Gerenciador de Atividades</h1>
          <p className="text-xs text-muted-foreground">Menus, tópicos e quizzes da Resenha Fanática</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <ActivitiesManager />
      </main>
    </div>
  );
};

export default ActivitiesManagerPage;