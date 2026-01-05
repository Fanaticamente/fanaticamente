import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { Briefcase, User, ChevronDown } from "lucide-react";
import { allBrazilianClubs } from "@/data/allBrazilianClubs";
import { brazilianStates, getCitiesByState } from "@/data/brazilianStates";
import { supabase } from "@/integrations/supabase/client";
import logoAuth from "@/assets/logo-auth.png";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres");

type AuthMode = "user" | "professional";

interface SignUpData {
  fullName: string;
  crp: string;
  birthDate: string;
  favoriteClub: string;
  state: string;
  city: string;
  phone: string;
  email: string;
  password: string;
  documentType: 'cpf' | 'cnpj' | '';
  documentNumber: string;
}

// Get all clubs sorted alphabetically (no grouping by league)
const sortedClubs = [...allBrazilianClubs].sort((a, b) => 
  a.name.localeCompare(b.name, 'pt-BR')
);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "professional" ? "professional" : "user";
  
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signUpData, setSignUpData] = useState<SignUpData>({
    fullName: "",
    crp: "",
    birthDate: "",
    favoriteClub: "",
    state: "",
    city: "",
    phone: "",
    email: "",
    password: "",
    documentType: "",
    documentNumber: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roleValidated, setRoleValidated] = useState(false);

  const { signIn, signUp, user, hasRole, loading } = useAuth();
  const navigate = useNavigate();

  // Get cities based on selected state
  const availableCities = signUpData.state ? getCitiesByState(signUpData.state) : [];

  useEffect(() => {
    // Only redirect if role has been validated AND roles are loaded
    if (user && roleValidated && !loading) {
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
  }, [user, hasRole, navigate, roleValidated, loading]);

  // Enforce correct login mode AFTER roles are loaded (prevents false logout)
  useEffect(() => {
    const enforceMode = async () => {
      if (!user || !roleValidated || loading) return;

      const isProfessional = hasRole("professional");
      const isAdmin = hasRole("admin");
      const isDeveloper = hasRole("developer");

      // Admins and developers can access from any mode
      if (isAdmin || isDeveloper) return;

      if (authMode === "professional" && !isProfessional) {
        await supabase.auth.signOut();
        setRoleValidated(false);
        setEmail("");
        setPassword("");
        setAuthMode("user");
        toast.error(
          "Esta conta não é de um profissional. Você será direcionado para o login de Torcedor."
        );
        navigate("/auth?mode=user", { replace: true });
        return;
      }

      if (authMode === "user" && isProfessional) {
        await supabase.auth.signOut();
        setRoleValidated(false);
        setEmail("");
        setPassword("");
        setAuthMode("professional");
        toast.error(
          "Esta conta é de um profissional. Você será direcionado para o login de Profissional."
        );
        navigate("/auth?mode=professional", { replace: true });
      }
    };

    enforceMode();
  }, [user, roleValidated, loading, hasRole, authMode, navigate]);

  // Handle already logged-in users visiting the auth page
  useEffect(() => {
    const checkExistingUser = async () => {
      // Wait for roles to finish loading to avoid false negatives (which caused unwanted logout)
      if (loading) return;

      if (user && !roleValidated) {
        // User was already logged in, validate their role matches the current mode
        const isProfessional = hasRole("professional");
        const isAdmin = hasRole("admin");
        const isDeveloper = hasRole("developer");

        // Admins and developers can access from any mode
        if (isAdmin || isDeveloper) {
          setRoleValidated(true);
          return;
        }

        // If on professional mode but user is not a professional
        if (authMode === "professional" && !isProfessional) {
          await supabase.auth.signOut();
          setRoleValidated(false);
          setEmail("");
          setPassword("");
          setAuthMode("user");
          toast.error(
            "Esta conta não é de um profissional. Você será direcionado para o login de Torcedor."
          );
          navigate("/auth?mode=user", { replace: true });
          return;
        }

        // If on user mode but user is a professional
        if (authMode === "user" && isProfessional) {
          await supabase.auth.signOut();
          setRoleValidated(false);
          setEmail("");
          setPassword("");
          setAuthMode("professional");
          toast.error(
            "Esta conta é de um profissional. Você será direcionado para o login de Profissional."
          );
          navigate("/auth?mode=professional", { replace: true });
          return;
        }

        // Role matches, allow redirect
        setRoleValidated(true);
      }
    };

    checkExistingUser();
  }, [user, authMode, hasRole, roleValidated, loading, navigate]);

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

    // Validate CRP only for professionals
    if (authMode === "professional") {
      if (!signUpData.crp.trim()) {
        newErrors.crp = "CRP é obrigatório";
      } else {
        // CRP format: XX/XXXXX (2 digits / 4-6 digits)
        const crpRegex = /^\d{2}\/\d{4,6}$/;
        if (!crpRegex.test(signUpData.crp)) {
          newErrors.crp = "Formato inválido. Use XX/XXXXX (ex: 06/12345)";
        }
      }

      // Validate document type and number for professionals
      if (!signUpData.documentType) {
        newErrors.documentType = "Selecione CPF ou CNPJ";
      }
      if (!signUpData.documentNumber.trim()) {
        newErrors.documentNumber = "Número do documento é obrigatório";
      } else {
        // Basic validation for CPF (11 digits) and CNPJ (14 digits)
        const cleanDoc = signUpData.documentNumber.replace(/\D/g, '');
        if (signUpData.documentType === 'cpf' && cleanDoc.length !== 11) {
          newErrors.documentNumber = "CPF deve ter 11 dígitos";
        } else if (signUpData.documentType === 'cnpj' && cleanDoc.length !== 14) {
          newErrors.documentNumber = "CNPJ deve ter 14 dígitos";
        }
      }
    }

    // Validate phone
    if (!signUpData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    } else {
      const cleanPhone = signUpData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        newErrors.phone = "Telefone inválido (DDD + número)";
      }
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
          // Let the global auth state + roles loader decide the redirect.
          // This avoids race conditions where roles are not ready right after login.
          setRoleValidated(true);
          toast.success("Login realizado com sucesso!");
        }
      } else {
        // Sign up with additional user data
        // IMPORTANT: store signup data BEFORE calling signUp to avoid race conditions
        const profileData: any = {
          birth_date: signUpData.birthDate,
          favorite_club_id: signUpData.favoriteClub,
          city: signUpData.city,
          state: signUpData.state,
          phone: signUpData.phone,
        };

        if (authMode === "professional") {
          profileData.crp = signUpData.crp;
          profileData.document_type = signUpData.documentType;
          profileData.document_number = signUpData.documentNumber.replace(/\D/g, '');
        }

        localStorage.setItem("pendingProfileUpdate", JSON.stringify(profileData));

        const { error } = await signUp(
          signUpData.email,
          signUpData.password,
          signUpData.fullName
        );

        if (error) {
          localStorage.removeItem("pendingProfileUpdate");
          if (error.message.includes("already registered")) {
            toast.error("Este email já está cadastrado");
          } else {
            toast.error(error.message);
          }
        } else {
          // Sign up successful, set role validated for new users
          setRoleValidated(true);
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

  const inputClassName = "w-full h-12 px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-primary focus:outline-none transition-colors";
  const selectClassName = "w-full h-12 px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer";
  const dateInputClassName = "w-full h-12 px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-primary focus:outline-none transition-colors appearance-none text-base leading-none";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoAuth} alt="Logo" className="h-32 w-auto mx-auto mb-6" />
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

                {/* CRP and Birth Date - Side by Side for Professionals */}
                {authMode === "professional" ? (
                  <div className="grid grid-cols-2 gap-3">
                    {/* CRP */}
                    <div>
                      <label className="block text-card-foreground text-sm mb-2">
                        CRP *
                      </label>
                      <input
                        type="text"
                        value={signUpData.crp}
                        onChange={(e) => handleSignUpDataChange('crp', e.target.value)}
                        className={inputClassName}
                        placeholder="06/12345"
                        maxLength={9}
                      />
                      {errors.crp && (
                        <p className="text-destructive text-xs mt-1">{errors.crp}</p>
                      )}
                    </div>

                    {/* Birth Date */}
                    <div>
                      <label className="block text-card-foreground text-sm mb-2">
                        Nascimento *
                      </label>
                      <input
                        type="date"
                        value={signUpData.birthDate}
                        onChange={(e) => handleSignUpDataChange('birthDate', e.target.value)}
                        className={dateInputClassName}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      {errors.birthDate && (
                        <p className="text-destructive text-xs mt-1">{errors.birthDate}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Birth Date and Phone - Side by Side for Users */
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-card-foreground text-sm mb-2">
                        Nascimento *
                      </label>
                      <input
                        type="date"
                        value={signUpData.birthDate}
                        onChange={(e) => handleSignUpDataChange('birthDate', e.target.value)}
                        className={dateInputClassName}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      {errors.birthDate && (
                        <p className="text-destructive text-xs mt-1">{errors.birthDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-card-foreground text-sm mb-2">
                        Telefone *
                      </label>
                      <input
                        type="tel"
                        value={signUpData.phone}
                        onChange={(e) => handleSignUpDataChange('phone', e.target.value)}
                        className={inputClassName}
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                      />
                      {errors.phone && (
                        <p className="text-destructive text-xs mt-1">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Phone for Professionals */}
                {authMode === "professional" && (
                  <div>
                    <label className="block text-card-foreground text-sm mb-2">
                      Telefone com DDD *
                    </label>
                    <input
                      type="tel"
                      value={signUpData.phone}
                      onChange={(e) => handleSignUpDataChange('phone', e.target.value)}
                      className={inputClassName}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                    {errors.phone && (
                      <p className="text-destructive text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>
                )}

                {/* Document Type Selection for Professionals */}
                {authMode === "professional" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-card-foreground text-sm mb-2">
                          Tipo de Documento *
                        </label>
                        <div className="relative">
                          <select
                            value={signUpData.documentType}
                            onChange={(e) => handleSignUpDataChange('documentType', e.target.value as 'cpf' | 'cnpj')}
                            className={selectClassName}
                          >
                            <option value="">Selecione</option>
                            <option value="cpf">CPF</option>
                            <option value="cnpj">CNPJ</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                        {errors.documentType && (
                          <p className="text-destructive text-xs mt-1">{errors.documentType}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-card-foreground text-sm mb-2">
                          {signUpData.documentType === 'cnpj' ? 'CNPJ *' : 'CPF *'}
                        </label>
                        <input
                          type="text"
                          value={signUpData.documentNumber}
                          onChange={(e) => handleSignUpDataChange('documentNumber', e.target.value)}
                          className={inputClassName}
                          placeholder={signUpData.documentType === 'cnpj' ? '00.000.000/0001-00' : '000.000.000-00'}
                          maxLength={signUpData.documentType === 'cnpj' ? 18 : 14}
                          disabled={!signUpData.documentType}
                        />
                        {errors.documentNumber && (
                          <p className="text-destructive text-xs mt-1">{errors.documentNumber}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

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
                      {sortedClubs.map(club => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.favoriteClub && (
                    <p className="text-destructive text-sm mt-1">{errors.favoriteClub}</p>
                  )}
                </div>

                {/* State and City - Side by Side */}
                <div className="grid grid-cols-2 gap-3">
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
                        <option value="">Estado</option>
                        {brazilianStates.map(state => (
                          <option key={state.sigla} value={state.sigla}>
                            {state.sigla}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {errors.state && (
                      <p className="text-destructive text-xs mt-1">{errors.state}</p>
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
                          {signUpData.state ? "Cidade" : "—"}
                        </option>
                        {availableCities.map(city => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {errors.city && (
                      <p className="text-destructive text-xs mt-1">{errors.city}</p>
                    )}
                  </div>
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
