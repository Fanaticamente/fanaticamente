import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { allBrazilianClubs } from "@/data/allBrazilianClubs";
import { brazilianStates, getCitiesByState } from "@/data/brazilianStates";
import logoAuth from "@/assets/logo-auth.png";
import welcomeImage from "@/assets/auth-welcome-torcida.jpg";

export interface FanSignupData {
  fullName: string;
  birthDate: string;
  phone: string;
  favoriteClub: string;
  state: string;
  city: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

interface Props {
  data: FanSignupData;
  update: (patch: Partial<FanSignupData>) => void;
  isLoading: boolean;
  onSubmit: () => Promise<boolean>; // returns true if submission triggered (caller still handles redirect)
  onSwitchToLogin: () => void;
  onExit: () => void;
}

const sortedClubs = [...allBrazilianClubs].sort((a, b) =>
  a.name.localeCompare(b.name, "pt-BR")
);

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const inputCls =
  "w-full h-14 px-4 bg-background border border-border rounded-xl text-card-foreground text-lg focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition-colors";
const selectCls = inputCls + " appearance-none cursor-pointer pr-10";

const FanSignupWizard = ({ data, update, isLoading, onSubmit, onSwitchToLogin, onExit }: Props) => {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    if (!data.state) {
      setAvailableCities([]);
      return;
    }
    getCitiesByState(data.state).then(setAvailableCities);
  }, [data.state]);

  const firstName = data.fullName.trim().split(/\s+/)[0] || "";

  type Step = {
    title: string;
    subtitle?: string;
    helper?: string;
    valid: () => string | null; // returns error or null
    content: React.ReactNode;
  };

  const steps: Step[] = useMemo(() => [
    {
      title: "Qual é o seu nome?",
      subtitle: "É assim que sua torcida vai te encontrar no Fanaticamente.",
      helper: "Seu nome aparece no seu perfil público.",
      valid: () => (data.fullName.trim().length >= 3 ? null : "Informe seu nome completo"),
      content: (
        <div className="space-y-2">
          <label className="block text-card-foreground text-sm font-bold">Nome completo</label>
          <input
            type="text"
            autoFocus
            value={data.fullName}
            onChange={(e) => update({ fullName: e.target.value })}
            className={inputCls}
            placeholder="Ex.: Matheus Marques"
          />
        </div>
      ),
    },
    {
      title: firstName ? `Bem-vindo, ${firstName}! Quando é o seu aniversário?` : "Quando é o seu aniversário?",
      subtitle: "Usamos isso para classificações por idade e para manter usuários mais jovens em segurança.",
      helper: "Sua data de nascimento não aparece no seu perfil.",
      valid: () => {
        if (!data.birthDate) return "Informe sua data de nascimento";
        const d = new Date(data.birthDate);
        const today = new Date();
        let age = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
        if (age < 16) return "Você deve ter pelo menos 16 anos";
        return null;
      },
      content: (
        <div className="space-y-2">
          <label className="block text-card-foreground text-sm font-bold">Data de nascimento</label>
          <input
            type="date"
            value={data.birthDate}
            onChange={(e) => update({ birthDate: e.target.value })}
            className={inputCls}
            min="1900-01-01"
            max={new Date(new Date().getFullYear() - 16, new Date().getMonth(), new Date().getDate())
              .toISOString()
              .slice(0, 10)}
          />
        </div>
      ),
    },
    {
      title: "Qual o seu telefone?",
      subtitle: "Vamos usar para te avisar sobre sessões e novidades importantes.",
      helper: "Opcional. Você pode pular essa etapa.",
      valid: () => {
        if (!data.phone.trim()) return null;
        const clean = data.phone.replace(/\D/g, "");
        if (clean.length < 10 || clean.length > 11) return "Telefone inválido (DDD + número)";
        return null;
      },
      content: (
        <div className="space-y-2">
          <label className="block text-card-foreground text-sm font-bold">Telefone</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => update({ phone: formatPhone(e.target.value) })}
            className={inputCls}
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
        </div>
      ),
    },
    {
      title: "Qual é o seu time do coração?",
      subtitle: "Tudo no Fanaticamente fica mais legal com as cores do seu time.",
      valid: () => (data.favoriteClub ? null : "Selecione seu time"),
      content: (
        <div className="space-y-2">
          <label className="block text-card-foreground text-sm font-bold">Time</label>
          <div className="relative">
            <select
              value={data.favoriteClub}
              onChange={(e) => update({ favoriteClub: e.target.value })}
              className={selectCls}
            >
              <option value="">Selecione seu time</option>
              {sortedClubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      ),
    },
    {
      title: "De onde você torce?",
      subtitle: "Vamos mostrar conteúdo e profissionais perto de você.",
      valid: () => {
        if (!data.state) return "Selecione seu estado";
        if (!data.city) return "Selecione sua cidade";
        return null;
      },
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-card-foreground text-sm font-bold">Estado</label>
            <div className="relative">
              <select
                value={data.state}
                onChange={(e) => update({ state: e.target.value, city: "" })}
                className={selectCls}
              >
                <option value="">Selecione</option>
                {brazilianStates.map((s) => (
                  <option key={s.sigla} value={s.sigla}>
                    {s.nome} ({s.sigla})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-card-foreground text-sm font-bold">Cidade</label>
            <div className="relative">
              <select
                value={data.city}
                onChange={(e) => update({ city: e.target.value })}
                className={selectCls}
                disabled={!data.state}
              >
                <option value="">{data.state ? "Selecione" : "Escolha o estado primeiro"}</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Qual é o seu e-mail?",
      subtitle: "Usamos para você entrar na sua conta e receber comunicados.",
      valid: () => {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim());
        return ok ? null : "E-mail inválido";
      },
      content: (
        <div className="space-y-2">
          <label className="block text-card-foreground text-sm font-bold">E-mail</label>
          <input
            type="email"
            autoFocus
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
            className={inputCls}
            placeholder="seu@email.com"
          />
        </div>
      ),
    },
    {
      title: "Crie uma senha",
      subtitle: "Mínimo de 6 caracteres. Use algo que só você lembra.",
      valid: () => {
        if (data.password.length < 6) return "Senha deve ter no mínimo 6 caracteres";
        if (data.password !== data.confirmPassword) return "As senhas não coincidem";
        return null;
      },
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-card-foreground text-sm font-bold">Senha</label>
            <input
              type="password"
              value={data.password}
              onChange={(e) => update({ password: e.target.value })}
              className={inputCls}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-card-foreground text-sm font-bold">Confirmar senha</label>
            <input
              type="password"
              value={data.confirmPassword}
              onChange={(e) => update({ confirmPassword: e.target.value })}
              className={inputCls}
              placeholder="Repita a senha"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Termos e privacidade",
      subtitle: "Antes de continuar, leia e aceite nossos termos.",
      valid: () => (data.acceptedTerms ? null : "Você deve aceitar os termos"),
      content: (
        <div className="p-4 bg-muted/50 rounded-xl">
          <div className="flex items-start gap-3">
            <Checkbox
              id="wizard-terms"
              checked={data.acceptedTerms}
              onCheckedChange={(c) => update({ acceptedTerms: c === true })}
              className="mt-0.5 border-therapy data-[state=checked]:bg-therapy data-[state=checked]:text-therapy-foreground data-[state=checked]:border-therapy"
            />
            <label htmlFor="wizard-terms" className="text-sm text-therapy cursor-pointer leading-relaxed">
              Li e aceito a{" "}
              <Link to="/politica-privacidade" target="_blank" className="underline font-medium">
                Política de Privacidade
              </Link>{" "}
              e os{" "}
              <Link to="/politica-privacidade" target="_blank" className="underline font-medium">
                Termos de Uso
              </Link>{" "}
              da plataforma Fanaticamente.
            </label>
          </div>
        </div>
      ),
    },
  ], [data, availableCities, firstName, update]);

  const totalSteps = steps.length;
  const isLast = step === totalSteps - 1;
  const current = steps[step];

  const handleContinue = async () => {
    const err = current.valid();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (isLast) {
      const ok = await onSubmit();
      if (ok) setSubmitted(true);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step === 0) {
      onExit();
      return;
    }
    setStep((s) => s - 1);
  };

  // Welcome / success screen (Strava-style)
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          <img
            src={welcomeImage}
            alt="Torcida no estádio"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/85 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-6 pb-8 text-center">
            <h1 className="text-3xl font-extrabold text-foreground leading-tight">
              {firstName ? `Bem-vindo, ${firstName}!` : "Bem-vindo!"}
              <br />
              Você está em boa companhia
            </h1>
            <p className="text-muted-foreground mt-3 text-base">
              Milhares de torcedores apaixonados estão prontos para entrar em campo com você.
            </p>
          </div>
        </div>
        <div className="px-6 pb-8 pt-4 bg-background">
          <button
            onClick={onExit}
            className="w-full py-4 rounded-full font-bold uppercase tracking-wide bg-primary text-primary-foreground text-base"
          >
            Vamos lá
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <img src={logoAuth} alt="Fanaticamente" className="h-10 w-auto" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
        <h1 className="text-3xl font-extrabold text-foreground leading-tight">
          {current.title}
        </h1>
        {current.subtitle && (
          <p className="mt-3 text-muted-foreground text-base leading-relaxed">
            {current.subtitle}
          </p>
        )}
        <div className="mt-8">{current.content}</div>
        {current.helper && (
          <p className="mt-3 text-xs text-muted-foreground">{current.helper}</p>
        )}
        {error && (
          <p className="mt-3 text-sm text-destructive font-medium">{error}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-2 bg-background space-y-3">
        <button
          type="button"
          onClick={handleContinue}
          disabled={isLoading}
          className="w-full py-4 rounded-full font-bold uppercase tracking-wide bg-primary text-primary-foreground text-base disabled:opacity-50 transition-transform active:scale-[0.98]"
        >
          {isLoading ? "Carregando..." : isLast ? "Criar conta" : "Continuar"}
        </button>
        {step === 0 && (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full text-sm text-primary hover:underline"
          >
            Já tem conta? Entre
          </button>
        )}
      </div>
    </div>
  );
};

export default FanSignupWizard;