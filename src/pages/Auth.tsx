import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { Briefcase, ChevronDown, Brain, ArrowLeft, Calendar as CalendarIcon, Eye, EyeOff } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { allBrazilianClubs } from "@/data/allBrazilianClubs";
import { brazilianStates, getCitiesByState } from "@/data/brazilianStates";
import { supabase } from "@/integrations/supabase/client";
import { encodeAuthEmail, isProfessionalApp } from "@/lib/appMode";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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

// Reusable password input with eye toggle
const PasswordInput = ({
  value,
  onChange,
  placeholder,
  className,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className: string;
  id?: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} pr-12`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
};

interface SignUpData {
  fullName: string;
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

const PROFESSIONAL_APP_PATHS = [
  "/profissional",
  "/fanatica-lab",
  "/psi-house",
  "/conecta",
];

const getSafeFanReturnTarget = (state: unknown): { path: string; state?: unknown } | null => {
  const from = (state as { from?: { pathname?: string; search?: string; state?: unknown } } | null)?.from;
  if (!from?.pathname) return null;
  const path = `${from.pathname}${from.search ?? ""}`;
  if (from.pathname.startsWith("/auth") || from.pathname.startsWith("/profissional/auth")) return null;
  if (PROFESSIONAL_APP_PATHS.some((route) => from.pathname === route || from.pathname.startsWith(`${route}/`))) return null;
  return { path, state: from.state };
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isProfessionalRoute = location.pathname.startsWith("/profissional/auth");
  const initialMode: AuthMode = isProfessionalRoute ? "professional" : "user";
  const initialSignup = searchParams.get("signup") === "true";
  
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isLogin, setIsLogin] = useState(!initialSignup);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpData, setSignUpData] = useState<SignUpData>({
    fullName: "",
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
  const [customClubName, setCustomClubName] = useState("");

  // --- Recuperação de senha ---
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [sendingReset, setSendingReset] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const { signIn, signUp, user, hasRole, loading } = useAuth();
  const navigate = useNavigate();

  // Detecta o retorno do link de redefinição de senha (hash/param `type=recovery`)
  useEffect(() => {
    const hash = window.location.hash || "";
    const isRecoveryLink =
      hash.includes("type=recovery") || searchParams.get("type") === "recovery";

    if (isRecoveryLink) setRecoveryMode(true);

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (recoveryMode) return;
    if (user && roleValidated && !loading) {
      const safeFanReturn = getSafeFanReturnTarget(location.state);
      const navigateAfterAuth = (path: string, state?: unknown) => {
        navigate(path, { replace: true, state });
      };

      if (hasRole("admin")) {
        navigateAfterAuth("/admin");
      } else if (hasRole("developer")) {
        navigateAfterAuth("/desenvolvedor");
      } else if (hasRole("professional")) {
        // Profissionais também podem usar o app torcedor como pacientes.
        // Se o login foi exigido por uma rota torcedor (ex.: /agendar/:id),
        // volta para ela em vez de jogar ao painel profissional e criar ping-pong.
        if (safeFanReturn) {
          navigateAfterAuth(safeFanReturn.path, safeFanReturn.state);
        } else {
          navigateAfterAuth(authMode === "professional" ? "/profissional" : "/");
        }
      } else {
        // Fresh professional signup: role is being assigned async by edge function.
        // Route to professional dashboard so the onboarding wizard kicks in.
        let pendingIsProfessional = false;
        try {
          const raw = sessionStorage.getItem("pendingProfileUpdate") || localStorage.getItem("pendingProfileUpdate");
          if (raw) pendingIsProfessional = !!JSON.parse(raw)?.is_professional;
        } catch {
          pendingIsProfessional = false;
        }
        if (authMode === "professional" || pendingIsProfessional) {
          navigateAfterAuth("/profissional");
        } else {
          navigateAfterAuth(safeFanReturn?.path ?? "/", safeFanReturn?.state);
        }
      }
    }
  }, [user, hasRole, navigate, roleValidated, loading, authMode, location.state]);

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
        // Skip enforcement if a fresh professional signup is in progress
        // (the professional role is assigned asynchronously after signup)
        if (sessionStorage.getItem("pendingProfileUpdate")) return;
        // Definitive check: maybe the role wasn't fetched correctly. Verify
        // against the professionals table before signing the user out.
        const { data: profRow } = await supabase
          .from("professionals")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profRow) {
          // Auto-recover the missing role and proceed.
          await supabase
            .from("user_roles")
            .upsert({ user_id: user.id, role: "professional" }, { onConflict: "user_id,role" });
          setRoleValidated(true);
          return;
        }
        // Sessão torcedor ativa no formulário profissional: desloga em silêncio
        // e mantém o usuário no fluxo profissional para poder se cadastrar.
        await supabase.auth.signOut();
        setRoleValidated(false);
        setEmail("");
        setPassword("");
        toast.info(
          "Você estava conectado como Torcedor. Faça login ou cadastre-se como Profissional abaixo."
        );
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
          // Skip if a fresh professional signup is in progress
          if (sessionStorage.getItem("pendingProfileUpdate")) {
            setRoleValidated(true);
            return;
          }
          // Definitive check via professionals table before logging out.
          const { data: profRow } = await supabase
            .from("professionals")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (profRow) {
            await supabase
              .from("user_roles")
              .upsert({ user_id: user.id, role: "professional" }, { onConflict: "user_id,role" });
            setRoleValidated(true);
            return;
          }
          // Torcedor logado abrindo o cadastro/login profissional:
          // NÃO redireciona para o modo torcedor. Apenas desloga em silêncio e
          // mantém o formulário profissional visível, para que ele possa se
          // cadastrar como profissional (mesmo usando o mesmo e-mail).
          await supabase.auth.signOut();
          setRoleValidated(false);
          setEmail("");
          setPassword("");
          toast.info(
            "Você estava conectado como Torcedor. Faça login ou cadastre-se como Profissional abaixo."
          );
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

    if (authMode === "professional") {
      // Validate document type and number for professionals
      if (!signUpData.documentType) {
        newErrors.documentType = "Selecione CPF ou CNPJ";
      }
      if (!signUpData.documentNumber.trim()) {
        newErrors.documentNumber = "Número do documento é obrigatório";
      } else {
        const cleanDoc = signUpData.documentNumber.replace(/\D/g, '');
        if (signUpData.documentType === 'cpf' && cleanDoc.length !== 11) {
          newErrors.documentNumber = "CPF deve ter 11 dígitos";
        } else if (signUpData.documentType === 'cnpj' && cleanDoc.length !== 14) {
          newErrors.documentNumber = "CNPJ deve ter 14 dígitos";
        }
      }
    }

    // Telefone — obrigatório
    if (!signUpData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    } else {
      const cleanPhone = signUpData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        newErrors.phone = "Telefone inválido (DDD + número)";
      }
    }

    // Data de nascimento — obrigatória
    if (!signUpData.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    } else {
      const birthDate = new Date(signUpData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      const minAge = 18;
      if (age < minAge) {
        newErrors.birthDate = `Você deve ter pelo menos ${minAge} anos`;
      }
    }

    if (!signUpData.favoriteClub) {
      newErrors.favoriteClub = "Selecione seu time do coração";
    } else if (signUpData.favoriteClub === "__custom__" && !customClubName.trim()) {
      newErrors.favoriteClub = "Digite o nome do seu time";
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

    if (signUpData.password !== signUpConfirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
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
        const { error } = await signIn(
          email,
          password,
          authMode === "professional" ? "pro" : "fan"
        );
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setFailedAttempts((n) => n + 1);
            toast.error("Conta inválida ou não cadastrada. Revise os dados ou cadastre-se.");
          } else {
            setFailedAttempts((n) => n + 1);
            toast.error(error.message);
          }
        } else {
          // Let the global auth state + roles loader decide the redirect.
          // This avoids race conditions where roles are not ready right after login.
          // Don't show success toast here - wait for full validation in dashboard
          setFailedAttempts(0);
          setRoleValidated(true);
        }
      } else {
        // Sign up with additional user data
        // Bloqueia cadastro duplicado (mesmo e-mail OU telefone) DENTRO do mesmo
        // sistema. O mesmo e-mail/telefone continua permitido se um cadastro for
        // torcedor e o outro profissional.
        const accountType = authMode === "professional" ? "pro" : "fan";
        try {
          const { data: dup } = await supabase.functions.invoke("check-signup-duplicate", {
            body: {
              email: signUpData.email,
              phone: signUpData.phone,
              account_type: accountType,
            },
          });
          const nextErrors: Record<string, string> = {};
          if (dup?.email_taken) {
            nextErrors.email =
              accountType === "pro"
                ? "Este e-mail já possui cadastro Profissional. Faça login."
                : "Este e-mail já possui cadastro Torcedor. Faça login.";
          }
          if (dup?.phone_taken) {
            nextErrors.phone =
              accountType === "pro"
                ? "Este telefone já está em uso em outro cadastro Profissional."
                : "Este telefone já está em uso em outro cadastro Torcedor.";
          }
          if (Object.keys(nextErrors).length > 0) {
            setErrors((prev) => ({ ...prev, ...nextErrors }));
            toast.error(nextErrors.email || nextErrors.phone);
            setIsLoading(false);
            return;
          }
        } catch (dupError) {
          console.warn("[Auth] duplicate check failed:", dupError);
        }

        // IMPORTANT: store signup data BEFORE calling signUp to avoid race conditions
        const profileData: any = {
          birth_date: signUpData.birthDate,
          favorite_club_id:
            signUpData.favoriteClub === "__custom__"
              ? `custom:${customClubName.trim()}`
              : signUpData.favoriteClub,
          city: signUpData.city,
          state: signUpData.state,
          phone: signUpData.phone,
        };

        if (authMode === "professional") {
          profileData.is_professional = true;
          profileData.document_type = signUpData.documentType;
          profileData.document_number = signUpData.documentNumber.replace(/\D/g, '');
        }

        // Use sessionStorage instead of localStorage for sensitive data (shorter exposure window)
        sessionStorage.setItem("pendingProfileUpdate", JSON.stringify(profileData));

        // ISOLAMENTO: garantir que não haja sessão de OUTRO tipo de conta ativa
        // antes de cadastrar. Ex.: torcedor já logado tentando se cadastrar
        // como profissional com o mesmo e-mail — sem isso, o signUp acontece
        // sob a sessão errada e o app trata como se fosse a conta antiga.
        try {
          await supabase.auth.signOut();
        } catch {}

        const { error } = await signUp(
          signUpData.email,
          signUpData.password,
          signUpData.fullName,
          authMode === "professional" ? "pro" : "fan"
        );

        if (error) {
          // Clean up sensitive data on error
          sessionStorage.removeItem("pendingProfileUpdate");
          if (error.message.includes("already registered")) {
            toast.error(
              authMode === "professional"
                ? "Este e-mail já tem uma conta Profissional cadastrada. Faça login."
                : "Este e-mail já tem uma conta Torcedor cadastrada. Faça login."
            );
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
      if (field === 'state') {
        newData.city = '';
      }
      return newData;
    });
  };

  // Envia o e-mail de redefinição de senha para a conta correta (torcedor x profissional)
  const handleForgotPassword = async () => {
    const target = email.trim();
    setResetFeedback(null);
    try {
      emailSchema.parse(target);
    } catch {
      setResetFeedback({ type: "err", text: "Informe um e-mail válido para receber o link de redefinição." });
      return;
    }

    setSendingReset(true);
    try {
      const accountType = authMode === "professional" ? "pro" : "fan";
      const redirectPath = authMode === "professional" ? "/profissional/auth" : "/auth";
      const { error } = await supabase.auth.resetPasswordForEmail(
        encodeAuthEmail(target, accountType),
        { redirectTo: `${window.location.origin}${redirectPath}?type=recovery` }
      );
      if (error) {
        const seconds = error.message.match(/after (\d+) seconds/i)?.[1];
        setResetFeedback({
          type: "err",
          text: seconds
            ? `Aguarde ${seconds} segundos para solicitar novamente.`
            : error.message,
        });
      } else {
        setResetFeedback({ type: "ok", text: "Enviamos um link de redefinição para o seu e-mail." });
      }
    } finally {
      setSendingReset(false);
    }
  };

  // Define a nova senha após o usuário voltar pelo link do e-mail
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError("");

    try {
      passwordSchema.parse(newPassword);
    } catch (err: any) {
      setRecoveryError(err?.errors?.[0]?.message || "Senha inválida");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setRecoveryError("As senhas não coincidem");
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setRecoveryError(
          error.message.includes("Auth session missing")
            ? "O link expirou. Solicite uma nova redefinição."
            : error.message
        );
        return;
      }
      await supabase.auth.signOut();
      setNewPassword("");
      setConfirmNewPassword("");
      setFailedAttempts(0);
      setPasswordUpdated(true);
      window.history.replaceState({}, "", authMode === "professional" ? "/profissional/auth" : "/auth");
    } finally {
      setSavingPassword(false);
    }
  };

  const inputClassName = "w-full h-12 px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:ring-2 focus:ring-therapy focus:outline-none transition-colors";
  const selectClassName = "w-full h-12 px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:ring-2 focus:ring-therapy focus:outline-none transition-colors appearance-none cursor-pointer";
  const dateInputClassName = "w-full h-12 px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:ring-2 focus:ring-therapy focus:outline-none transition-colors appearance-none text-base leading-none";

  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile || !isLogin) return;

    const { body, documentElement } = document;
    const previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      inset: body.style.inset,
      width: body.style.width,
      height: body.style.height,
      overscrollBehavior: body.style.overscrollBehavior,
    };
    const previousHtmlStyles = {
      overflow: documentElement.style.overflow,
      height: documentElement.style.height,
      overscrollBehavior: documentElement.style.overscrollBehavior,
    };

    window.scrollTo(0, 0);
    documentElement.style.overflow = "hidden";
    documentElement.style.height = "100%";
    documentElement.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.inset = "0";
    body.style.width = "100%";
    body.style.height = "100%";
    body.style.overscrollBehavior = "none";

    const preventTouchMove = (event: TouchEvent) => event.preventDefault();
    document.addEventListener("touchmove", preventTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventTouchMove);
      documentElement.style.overflow = previousHtmlStyles.overflow;
      documentElement.style.height = previousHtmlStyles.height;
      documentElement.style.overscrollBehavior = previousHtmlStyles.overscrollBehavior;
      body.style.overflow = previousBodyStyles.overflow;
      body.style.position = previousBodyStyles.position;
      body.style.inset = previousBodyStyles.inset;
      body.style.width = previousBodyStyles.width;
      body.style.height = previousBodyStyles.height;
      body.style.overscrollBehavior = previousBodyStyles.overscrollBehavior;
      window.scrollTo(0, 0);
    };
  }, [isMobile, isLogin]);

  // Garante que nenhum toast fique preso na tela ao sair da autenticação
  useEffect(() => {
    return () => {
      toast.dismiss();
    };
  }, []);

  // Confirmação após salvar a nova senha
  if (passwordUpdated) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6 text-center">
        <img src={logoAuth} alt="Logo" className="h-32 w-auto mb-4" />
        <h1 className="text-xl font-semibold text-card-foreground mb-2">
          Senha alterada com sucesso
        </h1>
        <p className="text-muted-foreground max-w-sm">
          Senha alterada com sucesso, retorne ao aplicativo para acessar sua conta!
        </p>
        <button
          type="button"
          onClick={() => {
            setPasswordUpdated(false);
            setRecoveryMode(false);
            setIsLogin(true);
          }}
          className={`mt-8 w-full max-w-xs h-12 rounded-xl font-medium ${
            authMode === "professional" ? "bg-therapy text-white" : "bg-white text-background"
          }`}
        >
          Entrar agora
        </button>
      </div>
    );
  }

  // Tela de redefinição de senha (retorno do link enviado por e-mail)
  if (recoveryMode) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <img src={logoAuth} alt="Logo" className="h-36 w-auto mx-auto mb-1" />
            <p className="text-muted-foreground">Criar nova senha</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-card-foreground text-sm mb-2">Nova senha</label>
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                className={inputClassName}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-card-foreground text-sm mb-2">Confirmar nova senha</label>
              <PasswordInput
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
                className={inputClassName}
                placeholder="••••••••"
              />
            </div>

            {recoveryError && (
              <p className="text-destructive text-sm">{recoveryError}</p>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className={`w-full h-12 rounded-xl font-medium transition-opacity disabled:opacity-60 ${
                authMode === "professional"
                  ? "bg-therapy text-white"
                  : "bg-white text-background"
              }`}
            >
              {savingPassword ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                setRecoveryMode(false);
                setIsLogin(true);
              }}
              className={`hover:underline ${
                authMode === "professional" ? "text-therapy" : "text-white"
              }`}
            >
              Voltar para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {/* Acesso profissional vive exclusivamente em /profissional/auth */}

            <div className={`bg-card border rounded-2xl p-6 transition-colors ${
              authMode === "professional" ? "border-therapy" : "border-border"
            }`}>
              {authMode === "professional" && (
                <div className="mb-6 p-4 bg-therapy/10 border border-therapy/30 rounded-xl">
                  <p className="text-therapy text-sm font-medium flex items-center justify-center gap-2 text-center">
                    <Brain className="w-5 h-5 text-therapy" />
                    Aplicativo exclusivo para psicólogos(as)
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
                      <PasswordInput
                        value={password}
                        onChange={setPassword}
                        className={inputClassName}
                        placeholder="••••••••"
                      />
                      {errors.password && (
                        <p className="text-destructive text-sm mt-1">{errors.password}</p>
                      )}
                    </div>

                    {failedAttempts >= 2 && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={sendingReset}
                        className={`text-sm hover:underline disabled:opacity-60 ${
                          authMode === "professional" ? "text-therapy" : "text-[#237B0E]"
                        }`}
                      >
                        {sendingReset ? "Enviando..." : "Esqueceu sua senha?"}
                      </button>
                    )}
                    {resetFeedback && (
                      <p className={`text-sm ${resetFeedback.type === "ok" ? "text-[#237B0E]" : "text-destructive"}`}>
                        {resetFeedback.text}
                      </p>
                    )}
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
                          Nascimento *
                        </label>
                        <input
                          type="date"
                          value={signUpData.birthDate}
                          onChange={(e) => handleSignUpDataChange('birthDate', e.target.value)}
                          min="1900-01-01"
                          max={format(
                            new Date(
                            new Date().getFullYear() - 18,
                              new Date().getMonth(),
                              new Date().getDate()
                            ),
                            "yyyy-MM-dd"
                          )}
                          className={dateInputClassName}
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
                          <option value="__custom__">Outro (digitar meu time)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                      </div>
                      {signUpData.favoriteClub === "__custom__" && (
                        <input
                          type="text"
                          value={customClubName}
                          onChange={(e) => setCustomClubName(e.target.value)}
                          placeholder="Digite o nome do seu time"
                          className={selectClassName + " mt-2"}
                          maxLength={60}
                        />
                      )}
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
                      <PasswordInput
                        value={signUpData.password}
                        onChange={(v) => handleSignUpDataChange('password', v)}
                        className={inputClassName}
                        placeholder="Mínimo 6 caracteres"
                      />
                      {errors.password && (
                        <p className="text-destructive text-sm mt-1">{errors.password}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-card-foreground text-sm mb-2">
                        Confirmar Senha *
                      </label>
                      <PasswordInput
                        value={signUpConfirmPassword}
                        onChange={setSignUpConfirmPassword}
                        className={inputClassName}
                        placeholder="Repita a senha"
                      />
                      {errors.confirmPassword && (
                        <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>
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
                            to={authMode === "professional" ? "/politica-privacidade-profissional" : "/politica-privacidade"}
                            target="_blank"
                            className="underline font-medium text-therapy"
                          >
                            Política de Privacidade
                          </Link>
                          {" "}e os{" "}
                          <Link
                            to={authMode === "professional" ? "/termos-de-uso-profissional" : "/termos-de-uso"}
                            target="_blank"
                            className="underline font-medium text-therapy"
                          >
                            Termos de Uso
                          </Link>
                          {" "}da plataforma.
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
                      : "bg-[#237B0E] text-white"
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
                    authMode === "professional" ? "text-therapy" : "text-[#237B0E]"
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
      </div>
    );
  }

  // Mobile Layout (existing)
  return (
    <div className={`relative isolate bg-background flex flex-col items-center px-4 ${isLogin ? 'fixed top-0 left-0 right-0 h-[100svh] max-h-[100svh] overflow-hidden overscroll-none touch-none justify-start pt-[10svh] pb-6' : 'min-h-[100dvh] justify-start py-6'}`}>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-background" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <img src={logoAuth} alt="Logo" className="h-40 w-auto mx-auto mb-1" />
          <p className={`text-muted-foreground ${authMode === "professional" ? "text-lg font-medium" : ""}`}>
            {authMode === "professional" 
              ? "Área do Profissional" 
              : isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        {/* Mode Selector */}
        {/* Acesso profissional vive exclusivamente em /profissional/auth */}

        <div className="bg-transparent border-0 rounded-none p-0 transition-colors">
          {authMode === "professional" && (
            <div className="mb-6 p-4 bg-therapy/10 border border-therapy/30 rounded-xl">
              <p className="text-therapy text-sm font-medium flex items-center justify-center gap-2 text-center">
                <Brain className="w-5 h-5 text-therapy" />
                Aplicativo exclusivo para psicólogos(as)
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
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    className={inputClassName}
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="text-destructive text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {failedAttempts >= 2 && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={sendingReset}
                    className={`text-sm hover:underline disabled:opacity-60 ${
                      authMode === "professional" ? "text-therapy" : "text-white"
                    }`}
                  >
                    {sendingReset ? "Enviando..." : "Esqueceu sua senha?"}
                  </button>
                )}
                {resetFeedback && (
                  <p className={`text-sm ${resetFeedback.type === "ok" ? "text-white" : "text-destructive"}`}>
                    {resetFeedback.text}
                  </p>
                )}
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
                      Nascimento *
                    </label>
                    <input
                      type="date"
                      value={signUpData.birthDate}
                      onChange={(e) => handleSignUpDataChange('birthDate', e.target.value)}
                      min="1900-01-01"
                      max={format(
                        new Date(
                          new Date().getFullYear() - 18,
                          new Date().getMonth(),
                          new Date().getDate()
                        ),
                        "yyyy-MM-dd"
                      )}
                      className={dateInputClassName}
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
                      <option value="__custom__">Outro (digitar meu time)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                  {signUpData.favoriteClub === "__custom__" && (
                    <input
                      type="text"
                      value={customClubName}
                      onChange={(e) => setCustomClubName(e.target.value)}
                      placeholder="Digite o nome do seu time"
                      className={selectClassName + " mt-2"}
                      maxLength={60}
                    />
                  )}
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
                  <PasswordInput
                    value={signUpData.password}
                    onChange={(v) => handleSignUpDataChange('password', v)}
                    className={inputClassName}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.password && (
                    <p className="text-destructive text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-card-foreground text-sm mb-2">
                    Confirmar Senha *
                  </label>
                  <PasswordInput
                    value={signUpConfirmPassword}
                    onChange={setSignUpConfirmPassword}
                    className={inputClassName}
                    placeholder="Repita a senha"
                  />
                  {errors.confirmPassword && (
                    <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                 {/* Terms Acceptance */}
                 <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                   <div className="flex items-start gap-3">
                     <Checkbox
                       id="accept-terms"
                       checked={acceptedTerms}
                       onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                       className={`mt-0.5 ${authMode === "professional" ? "border-therapy data-[state=checked]:bg-therapy data-[state=checked]:text-therapy-foreground data-[state=checked]:border-therapy focus-visible:ring-therapy" : "border-white data-[state=checked]:bg-white data-[state=checked]:text-background data-[state=checked]:border-white focus-visible:ring-white"}`}
                     />
                     <label htmlFor="accept-terms" className={`text-sm cursor-pointer leading-relaxed ${authMode === "professional" ? "text-therapy" : "text-white"}`}>
                       Li e aceito a{" "}
                       <Link
                         to={authMode === "professional" ? "/politica-privacidade-profissional" : "/politica-privacidade"}
                         target="_blank"
                         className={`underline font-medium ${authMode === "professional" ? "text-therapy" : "text-white"}`}
                       >
                         Política de Privacidade
                       </Link>
                       {" "}e os{" "}
                       <Link
                         to={authMode === "professional" ? "/termos-de-uso-profissional" : "/termos-de-uso"}
                         target="_blank"
                         className={`underline font-medium ${authMode === "professional" ? "text-therapy" : "text-white"}`}
                       >
                         Termos de Uso
                       </Link>
                       {" "}da plataforma.
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
                  : "bg-white text-background"
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
                authMode === "professional" ? "text-therapy" : "text-white"
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
