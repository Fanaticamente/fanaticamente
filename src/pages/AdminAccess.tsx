import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Shield, Code, Lock, ArrowLeft } from "lucide-react";

const AdminAccess = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signOut, user, hasRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;

    if (hasRole("admin")) {
      navigate("/admin");
      return;
    }

    if (hasRole("developer")) {
      navigate("/desenvolvedor");
      return;
    }

    // Se o usuário estiver logado como torcedor/profissional, mantemos esta tela
    // independente: deslogamos e deixamos o formulário disponível.
    toast.error("Você não tem permissão nesta conta. Entre com uma conta Admin/Dev.");
    signOut();
  }, [user, hasRole, loading, navigate, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error("Credenciais inválidas");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-destructive/20 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-3xl text-card-foreground mb-2">
            Acesso Restrito
          </h1>
          <p className="text-muted-foreground text-sm">
            Área exclusiva para administradores e desenvolvedores
          </p>
        </div>

        <div className="bg-card border border-destructive/30 rounded-2xl p-6">
          <div className="flex justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-lg">
              <Shield className="w-4 h-4 text-destructive" />
              <span className="text-destructive text-sm font-medium">Admin</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary/10 rounded-lg">
              <Code className="w-4 h-4 text-secondary" />
              <span className="text-secondary text-sm font-medium">Dev</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-card-foreground text-sm mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-destructive focus:outline-none transition-colors"
                placeholder="admin@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-card-foreground text-sm mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-destructive focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-destructive text-destructive-foreground rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verificando..." : "Acessar"}
            </button>
          </form>

          <p className="text-muted-foreground text-xs text-center mt-6">
            Tentativas de acesso não autorizado serão registradas.
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar ao site</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAccess;
