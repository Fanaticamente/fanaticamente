import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useManagerTheme } from "@/hooks/useManagerTheme";
import ActivitiesManager from "@/components/developer/ActivitiesManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2, Loader2 } from "lucide-react";

const ActivitiesManagerPage = () => {
  useManagerTheme();
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="min-h-14 bg-card border-b border-border flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 flex-shrink-0 sticky top-0 z-10">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/developer")}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="w-px h-8 bg-border" />
        <div className="w-10 h-10 rounded-xl bg-primary/10 hidden sm:flex items-center justify-center">
          <Gamepad2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-base sm:text-lg text-card-foreground">Gerenciador de Atividades</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Menus, tópicos e quizzes da Resenha Fanática</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <ActivitiesManager />
      </main>
    </div>
  );
};

export default ActivitiesManagerPage;