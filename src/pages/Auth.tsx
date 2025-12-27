import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { Briefcase, User, ChevronDown } from "lucide-react";
import { allBrazilianClubs, getLeagueLabel } from "@/data/allBrazilianClubs";
import { brazilianStates, getCitiesByState } from "@/data/brazilianStates";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres");

type AuthMode = "user" | "professional";

interface SignUpData {
  fullName: string;
  birthDate: string;
  favoriteClub: string;
  state: string;
  city: string;
  email: string;
  password: string;
}

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "professional" ? "professional" : "user";
  
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signUpData, setSignUpData] = useState<SignUpData>({
    fullName: "",
    birthDate: "",
    favoriteClub: "",
    state: "",
    city: "",
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user, hasRole } = useAuth();
  const navigate = useNavigate();

  // Get cities based on selected state
  const availableCities = signUpData.state ? getCitiesByState(signUpData.state) : [];

  // Group clubs by league
  const clubsByLeague = allBrazilianClubs.reduce((acc, club) => {
    if (!acc[club.league]) {
      acc[club.league] = [];
    }
    acc[club.league].push(club);
    return acc;
  }, {} as Record<string, typeof allBrazilianClubs>);

  useEffect(() => {
    if (user) {
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

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUpForm = () => {
    const newErrors: Record<string, string> = {};

    if (!signUpData.fullName.trim()) {
      newErrors.fullName = "Nome completo é obrigatório";
    }

    if (!signUpData.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    } else {
      const birthDate = new Date(signUpData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        newErrors.birthDate = "Você deve ter pelo menos 13 anos";
      }
    }

    if (!signUpData.favoriteClub) {
      newErrors.favoriteClub = "Selecione seu time do coração";
    }

    if (!signUpData.state) {
      newErrors.state = "Selecione seu estado";
    }

    if (!signUpData.city) {
      newErrors.city = "Selecione sua cidade";
    }

    try {
      emailSchema.parse(signUpData.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(signUpData.password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      if (!validateLoginForm()) return;
    } else {
      if (!validateSignUpForm()) return;
    }

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
        // Sign up with additional user data
        const { error } = await signUp(signUpData.email, signUpData.password, signUpData.fullName);
        
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este email já está cadastrado");
          } else {
            toast.error(error.message);
          }
        } else {
          // Profile will be updated via the auth state change handler
          // Store signup data in localStorage temporarily
          localStorage.setItem('pendingProfileUpdate', JSON.stringify({
            birth_date: signUpData.birthDate,
            favorite_club_id: signUpData.favoriteClub,
            city: signUpData.city,
            state: signUpData.state
          }));
          toast.success("Conta criada com sucesso!");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpDataChange = (field: keyof SignUpData, value: string) => {
    setSignUpData(prev => {
      const newData = { ...prev, [field]: value };
      // Reset city when state changes
      if (field === 'state') {
        newData.city = '';
      }
      return newData;
    });
  };

  const inputClassName = "w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-primary focus:outline-none transition-colors";
  const selectClassName = "w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
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
            {isLogin ? (
              // Login Form
              <>
                <div>
                  <label className="block text-card-foreground text-sm mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClassName}
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
                    className={inputClassName}
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="text-destructive text-sm mt-1">{errors.password}</p>
                  )}
                </div>
              </>
            ) : (
              // Sign Up Form
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-card-foreground text-sm mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={signUpData.fullName}
                    onChange={(e) => handleSignUpDataChange('fullName', e.target.value)}
                    className={inputClassName}
                    placeholder="Seu nome completo"
                  />
                  {errors.fullName && (
                    <p className="text-destructive text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-card-foreground text-sm mb-2">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    value={signUpData.birthDate}
                    onChange={(e) => handleSignUpDataChange('birthDate', e.target.value)}
                    className={inputClassName}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.birthDate && (
                    <p className="text-destructive text-sm mt-1">{errors.birthDate}</p>
                  )}
                </div>

                {/* Favorite Club */}
                <div>
                  <label className="block text-card-foreground text-sm mb-2">
                    Time do Coração *
                  </label>
                  <div className="relative">
                    <select
                      value={signUpData.favoriteClub}
                      onChange={(e) => handleSignUpDataChange('favoriteClub', e.target.value)}
                      className={selectClassName}
                    >
                      <option value="">Selecione seu time</option>
                      {(['serie_a', 'serie_b', 'serie_c', 'serie_d'] as const).map(league => (
                        <optgroup key={league} label={getLeagueLabel(league)}>
                          {clubsByLeague[league]?.map(club => (
                            <option key={club.id} value={club.id}>
                              {club.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.favoriteClub && (
                    <p className="text-destructive text-sm mt-1">{errors.favoriteClub}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-card-foreground text-sm mb-2">
                    Estado *
                  </label>
                  <div className="relative">
                    <select
                      value={signUpData.state}
                      onChange={(e) => handleSignUpDataChange('state', e.target.value)}
                      className={selectClassName}
                    >
                      <option value="">Selecione seu estado</option>
                      {brazilianStates.map(state => (
                        <option key={state.sigla} value={state.sigla}>
                          {state.nome} ({state.sigla})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.state && (
                    <p className="text-destructive text-sm mt-1">{errors.state}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-card-foreground text-sm mb-2">
                    Cidade *
                  </label>
                  <div className="relative">
                    <select
                      value={signUpData.city}
                      onChange={(e) => handleSignUpDataChange('city', e.target.value)}
                      className={selectClassName}
                      disabled={!signUpData.state}
                    >
                      <option value="">
                        {signUpData.state ? "Selecione sua cidade" : "Selecione o estado primeiro"}
                      </option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.city && (
                    <p className="text-destructive text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-card-foreground text-sm mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => handleSignUpDataChange('email', e.target.value)}
                    className={inputClassName}
                    placeholder="seu@email.com"
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-card-foreground text-sm mb-2">
                    Senha *
                  </label>
                  <input
                    type="password"
                    value={signUpData.password}
                    onChange={(e) => handleSignUpDataChange('password', e.target.value)}
                    className={inputClassName}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.password && (
                    <p className="text-destructive text-sm mt-1">{errors.password}</p>
                  )}
                </div>
              </>
            )}

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
