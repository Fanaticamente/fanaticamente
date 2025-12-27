import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { Briefcase, User } from "lucide-react";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres");

type AuthMode = "user" | "professional";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "professional" ? "professional" : "user";
  
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  const { signIn, signUp, user, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Redirect based on role
      if (hasRole("admin")) {
        navigate("/admin");
      } else if (hasRole("developer")) {
        navigate("/desenvolvedor");
      } else if (hasRole("professional")) {
        navigate("/profissional");
      } else {
        navigate("/");
      }
    }
  }, [user, hasRole, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (!isLogin && !fullName.trim()) {
      newErrors.fullName = "Nome completo é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Login realizado com sucesso!");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este email já está cadastrado");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Conta criada com sucesso!");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-primary mb-2">
            fanática<span className="text-secondary">MENTE</span>
          </h1>
          <p className="text-muted-foreground">
            {authMode === "professional" 
              ? "Área do Profissional Parceiro" 
              : isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setAuthMode("user")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              authMode === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:border-primary"
            }`}
          >
            <User className="w-5 h-5" />
            Torcedor
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("professional")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              authMode === "professional"
                ? "bg-therapy text-therapy-foreground"
                : "bg-card border border-border text-muted-foreground hover:border-therapy"
            }`}
          >
            <Briefcase className="w-5 h-5" />
            Profissional
          </button>
        </div>

        <div className={`bg-card border rounded-2xl p-6 transition-colors ${
          authMode === "professional" ? "border-therapy" : "border-border"
        }`}>
          {authMode === "professional" && (
            <div className="mb-6 p-4 bg-therapy/10 border border-therapy/30 rounded-xl">
              <p className="text-therapy text-sm font-medium">
                🩺 Área exclusiva para profissionais de saúde mental parceiros.
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Acesse seu painel para gerenciar consultas e disponibilidade.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-card-foreground text-sm mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-primary focus:outline-none transition-colors"
                  placeholder="Seu nome"
                />
                {errors.fullName && (
                  <p className="text-destructive text-sm mt-1">{errors.fullName}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-card-foreground text-sm mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-primary focus:outline-none transition-colors"
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-card-foreground text-sm mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-primary focus:outline-none transition-colors"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed ${
                authMode === "professional"
                  ? "bg-therapy text-therapy-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isLoading
                ? "Carregando..."
                : isLogin
                ? "Entrar"
                : "Criar conta"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className={`hover:underline ${
                authMode === "professional" ? "text-therapy" : "text-primary"
              }`}
            >
              {isLogin
                ? "Não tem conta? Cadastre-se"
                : "Já tem conta? Entre"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
