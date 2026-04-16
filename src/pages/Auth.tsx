import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { Briefcase, User, ChevronDown, Brain, ArrowLeft } from "lucide-react";
import { allBrazilianClubs } from "@/data/allBrazilianClubs";
import { brazilianStates, getCitiesByState } from "@/data/brazilianStates";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import logoAuth from "@/assets/logo-auth.png";
import { useIsMobile } from "@/hooks/use-mobile";
import heroCover from "@/assets/desktop/hero-cover.png";
import authBgGramado from "@/assets/auth-bg-gramado.jpg";


// Mask functions
const formatCRP = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 7)}`;
};

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};
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
  const initialSignup = searchParams.get("signup") === "true";
  
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isLogin, setIsLogin] = useState(!initialSignup);
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { signIn, signUp, user, hasRole, loading } = useAuth();
  const navigate = useNavigate();

  // Get cities based on selected state
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (!signUpData.state) {
      setAvailableCities([]);
      return;
    }
    setLoadingCities(true);
    getCitiesByState(signUpData.state).then(cities => {
      setAvailableCities(cities);
      setLoadingCities(false);
    });
  }, [signUpData.state]);

  useEffect(() => {
    // Only redirect if role has been validated AND roles are loaded
    if (user && roleValidated && !loading) {
      if (hasRole("admin")) {
        navigate("/admin");
      } else if (hasRole("developer")) {
        navigate("/desenvolvedor");
      } else if (hasRole("professional")) {
        // Profissionais logando no modo profissional vão para o painel
        // Profissionais logando no modo torcedor vão para a home
        navigate(authMode === "professional" ? "/profissional" : "/");
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

      // Profissionais podem acessar o modo torcedor normalmente
      if (authMode === "user" && isProfessional) {
        setRoleValidated(true);
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

        // Profissionais podem acessar o modo torcedor normalmente
        if (authMode === "user" && isProfessional) {
          setRoleValidated(true);
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

    // CRP is collected later in the onboarding wizard (step 3 — Documentos)
    if (authMode === "professional") {
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

    // Validate phone (optional)
    if (signUpData.phone.trim()) {
      const cleanPhone = signUpData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        newErrors.phone = "Telefone inválido (DDD + número)";
      }
    }

    // Validate birth date (optional)
    if (signUpData.birthDate) {
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

    // Validate terms acceptance
    if (!acceptedTerms) {
      newErrors.terms = "Você deve aceitar os termos e política de privacidade";
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
            toast.error("Conta inválida ou não cadastrada. Revise os dados ou cadastre-se.");
          } else {
            toast.error(error.message);
          }
        } else {
          // Let the global auth state + roles loader decide the redirect.
          // This avoids race conditions where roles are not ready right after login.
          // Don't show success toast here - wait for full validation in dashboard
          setRoleValidated(true);
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
          // CRP is collected later in the onboarding wizard
          profileData.document_type = signUpData.documentType;
          profileData.document_number = signUpData.documentNumber.replace(/\D/g, '');
        }

        // Use sessionStorage instead of localStorage for sensitive data (shorter exposure window)
        sessionStorage.setItem("pendingProfileUpdate", JSON.stringify(profileData));

        const { error } = await signUp(
          signUpData.email,
          signUpData.password,
          signUpData.fullName
        );

        if (error) {
          // Clean up sensitive data on error
          sessionStorage.removeItem("pendingProfileUpdate");
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

  const inputClassName = "w-full h-12 px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:ring-2 focus:ring-therapy focus:outline-none transition-colors";
  const selectClassName = "w-full h-12 px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:ring-2 focus:ring-therapy focus:outline-none transition-colors appearance-none cursor-pointer";
  const dateInputClassName = "w-full h-12 px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:ring-2 focus:ring-therapy focus:outline-none transition-colors appearance-none text-base leading-none";

  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile || typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const previousStyles = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      bodyOverscroll: body.style.overscrollBehavior,
    };

    const resetWindowScroll = () => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    };

    html.style.overflow = "hidden";
    html.style.height = "var(--app-height, 100dvh)";
    html.style.overscrollBehavior = "none";

    body.style.overflow = "hidden";
    body.style.height = "var(--app-height, 100dvh)";
    body.style.overscrollBehavior = "none";

    const viewport = window.visualViewport;

    resetWindowScroll();
    document.addEventListener("focusout", resetWindowScroll);
    viewport?.addEventListener("resize", resetWindowScroll);
    viewport?.addEventListener("scroll", resetWindowScroll);

    return () => {
      document.removeEventListener("focusout", resetWindowScroll);
      viewport?.removeEventListener("resize", resetWindowScroll);
      viewport?.removeEventListener("scroll", resetWindowScroll);

      html.style.overflow = previousStyles.htmlOverflow;
      html.style.height = previousStyles.htmlHeight;
      html.style.overscrollBehavior = previousStyles.htmlOverscroll;

      body.style.overflow = previousStyles.bodyOverflow;
      body.style.height = previousStyles.bodyHeight;
      body.style.overscrollBehavior = previousStyles.bodyOverscroll;
    };
  }, [isMobile]);

  // Desktop Layout
  if (!isMobile) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Visual/Image */}
        <div 
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
          style={{
            backgroundImage: `url(${authBgGramado})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 p-12 text-center">
            <img 
              src={heroCover} 
              alt="Torcedor" 
              className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl"
            />
            <div className="mt-8 space-y-4">
              <h2 className="text-3xl font-bold text-white">
                Cuide da sua saúde mental
              </h2>
              <p className="text-white/80 text-lg max-w-md mx-auto">
                Conecte-se com profissionais especializados que entendem a paixão pelo futebol.
              </p>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-6 bg-background overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="text-center mb-2">
              <img src={logoAuth} alt="Logo" className="h-44 w-auto mx-auto mb-2" />
              <p className={`text-muted-foreground ${authMode === "professional" ? "text-lg font-medium" : ""}`}>
                {authMode === "professional" 
                  ? "Área do Profissional" 
                  : isLogin ? "Entre em campo" : "Crie sua conta"}
              </p>
            </div>

            {/* Mode Selector */}
            {authMode === "user" && (
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setAuthMode("user")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all bg-primary text-primary-foreground"
                >
                  <User className="w-5 h-5" />
                  Torcedor
                </button>
              </div>
            )}
            {authMode === "professional" && (
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all bg-therapy text-therapy-foreground"
                >
                  <Brain className="w-5 h-5" />
                  Psicólogo(a)
                </button>
              </div>
            )}

            <div className={`bg-card border rounded-2xl p-6 transition-colors ${
              authMode === "professional" ? "border-therapy" : "border-border"
            }`}>
              {authMode === "professional" && (
                <div className="mb-6 p-4 bg-therapy/10 border border-therapy/30 rounded-xl">
                  <p className="text-therapy text-sm font-medium flex items-center gap-2">
                    <Brain className="w-5 h-5 text-therapy" />
                    Área exclusiva para profissionais de saúde mental parceiros.
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {isLogin 
                      ? "Acesse seu painel para gerenciar consultas e disponibilidade."
                      : "Cadastre-se para integrar o time de profissionais parceiros do Fanticamente."}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isLogin ? (
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

                    {/* Birth Date and Phone - Side by Side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-card-foreground text-sm mb-2">
                          Nascimento
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
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={signUpData.phone}
                          onChange={(e) => handleSignUpDataChange('phone', formatPhone(e.target.value))}
                          className={inputClassName}
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                        />
                        {errors.phone && (
                          <p className="text-destructive text-xs mt-1">{errors.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Document Type Selection for Professionals */}
                    {authMode === "professional" && (
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
                            onChange={(e) => {
                              const formatted = signUpData.documentType === 'cnpj' 
                                ? formatCNPJ(e.target.value) 
                                : formatCPF(e.target.value);
                              handleSignUpDataChange('documentNumber', formatted);
                            }}
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

                    {/* State and City */}
                    <div className="grid grid-cols-2 gap-3">
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

                    {/* Terms Acceptance */}
                    <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="accept-terms-desktop"
                          checked={acceptedTerms}
                          onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                          className="mt-0.5 border-therapy data-[state=checked]:bg-therapy data-[state=checked]:text-therapy-foreground data-[state=checked]:border-therapy focus-visible:ring-therapy"
                        />
                        <label htmlFor="accept-terms-desktop" className="text-sm text-therapy cursor-pointer leading-relaxed">
                          Li e aceito a{" "}
                          <Link
                            to="/politica-privacidade"
                            target="_blank"
                            className="underline font-medium text-therapy"
                          >
                            Política de Privacidade
                          </Link>
                          {" "}e os{" "}
                          <Link
                            to="/politica-privacidade"
                            target="_blank"
                            className="underline font-medium text-therapy"
                          >
                            Termos de Uso
                          </Link>
                          {" "}da plataforma Fanaticamente.
                        </label>
                      </div>
                      {errors.terms && (
                        <p className="text-destructive text-sm mt-2 ml-7">{errors.terms}</p>
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

          <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Voltar</span>
              </button>
            </div>

            {authMode === "user" && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("professional");
                    setIsLogin(true);
                    setErrors({});
                  }}
                  className="text-sm text-primary underline hover:text-primary/80 transition-colors"
                >
                  Área do(a) profissional parceiro(a)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile Layout (existing)
  return (
    <div
      className="bg-background flex h-[var(--app-height,100dvh)] items-start justify-center overflow-y-auto overscroll-contain px-4 py-8"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="w-full max-w-md pb-8">
        <div className="text-center mb-8">
          <img src={logoAuth} alt="Logo" className="h-44 w-auto mx-auto mb-6" />
          <p className={`text-muted-foreground ${authMode === "professional" ? "text-lg font-medium" : ""}`}>
            {authMode === "professional" 
              ? "Área do Profissional" 
              : isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        {/* Mode Selector */}
        {authMode === "user" && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setAuthMode("user")}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all bg-primary text-primary-foreground"
            >
              <User className="w-5 h-5" />
              Torcedor
            </button>
          </div>
        )}
        {authMode === "professional" && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all bg-therapy text-therapy-foreground"
            >
              <Brain className="w-5 h-5" />
              Psicólogo(a)
            </button>
          </div>
        )}

        <div className={`bg-card border rounded-2xl p-6 transition-colors ${
          authMode === "professional" ? "border-therapy" : "border-border"
        }`}>
          {authMode === "professional" && (
            <div className="mb-6 p-4 bg-therapy/10 border border-therapy/30 rounded-xl">
              <p className="text-therapy text-sm font-medium flex items-center gap-2">
                <Brain className="w-5 h-5 text-therapy" />
                Área exclusiva para profissionais de saúde mental parceiros.
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {isLogin 
                  ? "Acesse seu painel para gerenciar consultas e disponibilidade."
                  : "Cadastre-se para integrar o time de profissionais parceiros do Fanticamente."}
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

                {/* Birth Date and Phone - Side by Side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-card-foreground text-sm mb-2">
                      Nascimento
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
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={signUpData.phone}
                      onChange={(e) => handleSignUpDataChange('phone', formatPhone(e.target.value))}
                      className={inputClassName}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                    {errors.phone && (
                      <p className="text-destructive text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

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
                          onChange={(e) => {
                            const formatted = signUpData.documentType === 'cnpj' 
                              ? formatCNPJ(e.target.value) 
                              : formatCPF(e.target.value);
                            handleSignUpDataChange('documentNumber', formatted);
                          }}
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

                {/* Terms Acceptance */}
                <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="accept-terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                      className="mt-0.5 border-therapy data-[state=checked]:bg-therapy data-[state=checked]:text-therapy-foreground data-[state=checked]:border-therapy focus-visible:ring-therapy"
                    />
                    <label htmlFor="accept-terms" className="text-sm text-therapy cursor-pointer leading-relaxed">
                      Li e aceito a{" "}
                      <Link
                        to="/politica-privacidade"
                        target="_blank"
                        className="underline font-medium text-therapy"
                      >
                        Política de Privacidade
                      </Link>
                      {" "}e os{" "}
                      <Link
                        to="/politica-privacidade"
                        target="_blank"
                        className="underline font-medium text-therapy"
                      >
                        Termos de Uso
                      </Link>
                      {" "}da plataforma Fanaticamente.
                    </label>
                  </div>
                  {errors.terms && (
                    <p className="text-destructive text-sm mt-2 ml-7">{errors.terms}</p>
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

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </button>
        </div>

        {authMode === "user" && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setAuthMode("professional");
                setIsLogin(true);
                setErrors({});
              }}
              className="text-sm text-primary underline hover:text-primary/80 transition-colors"
            >
              Área do(a) profissional parceiro(a)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
