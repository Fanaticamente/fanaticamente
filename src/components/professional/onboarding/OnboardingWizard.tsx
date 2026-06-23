import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import StepPhoto from "./StepPhoto";
import StepDegree from "./StepDegree";
import StepDocuments from "./StepDocuments";
import StepBio from "./StepBio";
import StepSpecialties from "./StepSpecialties";
import StepPricing from "./StepPricing";
import StepPaymentMethod from "./StepPaymentMethod";
import StepSubscription from "./StepSubscription";

export interface OnboardingData {
  imageUrl: string;
  degreeBase: string;
  degreeTitle: string;
  degreeDocumentFrontUrl: string;
  degreeDocumentBackUrl: string;
  crp: string;
  crpDocumentFrontUrl: string;
  crpDocumentBackUrl: string;
  bio: string;
  specialties: string[];
  sessionDuration: string;
  sessionPrice: string;
  showPrice: boolean;
  socioConsciente: boolean;
  pixKey: string;
}

interface OnboardingWizardProps {
  professionalId: string;
  existingData?: Partial<OnboardingData>;
  onComplete: () => void;
}

const STEPS = [
  { id: "photo", label: "Foto" },
  { id: "degree", label: "Formação" },
  { id: "documents", label: "Documentos" },
  { id: "bio", label: "Bio" },
  { id: "specialties", label: "Especialidades" },
  { id: "pricing", label: "Valor" },
  { id: "payment", label: "Recebimento" },
  { id: "subscription", label: "Plano" },
];

const STORAGE_KEY = "professional_onboarding_wizard";

// Keep draft for a long time so the user can always resume where they stopped.
const DRAFT_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

const loadDraft = (fallbackCrpFront: string, fallbackCrpBack: string): { step: number; data: OnboardingData } | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    const elapsed = Date.now() - (draft.savedAt ?? 0);
    if (elapsed > DRAFT_EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { step: draft.step ?? 0, data: draft.data };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const OnboardingWizard = ({ professionalId, existingData, onComplete }: OnboardingWizardProps) => {
  const { user } = useAuth();

  const [initialized] = useState(() => {
    const draft = loadDraft(existingData?.crpDocumentFrontUrl ?? "", existingData?.crpDocumentBackUrl ?? "");
    return draft;
  });

  const [currentStep, setCurrentStep] = useState(initialized?.step ?? 0);
  const [data, setData] = useState<OnboardingData>(() => {
    // Split combined degree string ("Psicólogo, Mestre em Psicologia") into base + title
    const rawDegree = (existingData as any)?.degree as string | undefined;
    const [dbBase = "", dbTitle = ""] = rawDegree ? rawDegree.split(",").map((s) => s.trim()) : [];
    const baseFromExisting: OnboardingData = {
      imageUrl: existingData?.imageUrl ?? "",
      degreeBase: (existingData as any)?.degreeBase ?? dbBase ?? "",
      degreeTitle: (existingData as any)?.degreeTitle ?? dbTitle ?? "",
      degreeDocumentFrontUrl: existingData?.degreeDocumentFrontUrl ?? "",
      degreeDocumentBackUrl: existingData?.degreeDocumentBackUrl ?? "",
      crp: (existingData as any)?.crp ?? "",
      crpDocumentFrontUrl: existingData?.crpDocumentFrontUrl ?? "",
      crpDocumentBackUrl: existingData?.crpDocumentBackUrl ?? "",
      bio: (existingData as any)?.bio ?? "",
      specialties: (existingData as any)?.specialties ?? [],
      sessionDuration: "50",
      sessionPrice: (existingData as any)?.sessionPrice ?? "",
      showPrice: true,
      socioConsciente: (existingData as any)?.socioConsciente ?? false,
      pixKey: (existingData as any)?.pixKey ?? "",
    };
    // Draft (localStorage) wins over DB data when both exist, but DB fills the gaps
    if (initialized?.data) {
      return { ...baseFromExisting, ...initialized.data };
    }
    return baseFromExisting;
  });
  const [isSaving, setIsSaving] = useState(false);
  // Tracks whether the current step is mid-upload (CRP/diploma/foto).
  // Used to prevent the user from clicking "Continuar" before the file
  // finishes uploading — which previously made the validation say
  // "Envie a frente/verso" even though the document was on its way.
  const [stepBusy, setStepBusy] = useState(false);

  // Persist draft to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      step: currentStep,
      data,
      savedAt: Date.now(),
    }));
  }, [currentStep, data]);

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Photo
        if (!data.imageUrl) { toast.error("Envie uma foto profissional para continuar"); return false; }
        return true;
      case 1: // Degree
        if (!data.degreeBase) { toast.error("Selecione sua formação base"); return false; }
        if (data.degreeTitle && (!data.degreeDocumentFrontUrl || !data.degreeDocumentBackUrl)) {
          toast.error("Envie frente e verso do diploma de titulação");
          return false;
        }
        return true;
      case 2: { // Documents — CRP number + both card photos required
        const crpRegex = /^\d{2}\/\d{4,6}$/;
        if (!data.crp.trim()) { toast.error("Informe seu número do CRP"); return false; }
        if (!crpRegex.test(data.crp.trim())) { toast.error("Formato de CRP inválido. Use XX/XXXXX (ex: 06/12345)"); return false; }
        if (!data.crpDocumentFrontUrl) { toast.error("Envie a frente da carteira do CRP"); return false; }
        if (!data.crpDocumentBackUrl) { toast.error("Envie o verso da carteira do CRP"); return false; }
        return true;
      }
      case 3: // Bio
        if (!data.bio.trim() || data.bio.length < 50) { toast.error("A bio deve ter pelo menos 50 caracteres"); return false; }
        return true;
      case 4: // Specialties
        if (data.specialties.length === 0) { toast.error("Selecione pelo menos uma especialidade"); return false; }
        return true;
      case 5: // Pricing
        return true;
      case 6: // Payment method
        return true;
      case 7: // Subscription - handled by its own flow
        return true;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // No intermediate DB saves — everything is saved only when all 8 steps are complete

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubscriptionComplete = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const combinedDegree = data.degreeTitle ? `${data.degreeBase}, ${data.degreeTitle}` : data.degreeBase;

      // Save all professional data at once
      const { error: profError } = await supabase
        .from("professionals")
        .update({
          bio: data.bio,
          crp: data.crp.trim(),
          degree: combinedDegree,
          specialties: data.specialties,
          hourly_rate: data.sessionPrice ? parseFloat(data.sessionPrice) : null,
          socio_consciente: data.socioConsciente,
          pix_key: data.pixKey.trim() || null,
          pix_key_type: data.pixKey.trim() ? "random" : null,
          crp_document_front_url: data.crpDocumentFrontUrl || null,
          crp_document_back_url: data.crpDocumentBackUrl || null,
          degree_document_front_url: data.degreeDocumentFrontUrl || null,
          degree_document_back_url: data.degreeDocumentBackUrl || null,
        })
        .eq("id", professionalId);

      if (profError) throw profError;

      // Save avatar to profile
      if (data.imageUrl) {
        await supabase.from("profiles").update({ avatar_url: data.imageUrl }).eq("user_id", user.id);
      }

      localStorage.removeItem(STORAGE_KEY);
      toast.success("Cadastro profissional concluído! 🎉");
      onComplete();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Erro ao salvar dados. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const isSubscriptionStep = currentStep === 7;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-card-foreground">
            Passo {currentStep + 1} de {STEPS.length}
          </span>
          <span className="text-xs text-muted-foreground">{STEPS[currentStep].label}</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-therapy rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-3">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => {
                if (i < currentStep) setCurrentStep(i);
                else if (i === currentStep + 1 && validateStep(currentStep)) setCurrentStep(i);
              }}
              className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                i === currentStep
                  ? "bg-therapy text-therapy-foreground scale-110"
                  : i < currentStep
                  ? "bg-therapy/30 text-therapy"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        {currentStep === 0 && (
          <StepPhoto
            professionalId={professionalId}
            imageUrl={data.imageUrl}
            onUpdate={(url) => updateData({ imageUrl: url })}
            onBusyChange={setStepBusy}
          />
        )}
        {currentStep === 1 && (
          <StepDegree
            professionalId={professionalId}
            data={data}
            onUpdate={updateData}
            onBusyChange={setStepBusy}
          />
        )}
        {currentStep === 2 && (
          <StepDocuments
            professionalId={professionalId}
            data={data}
            onUpdate={updateData}
            onBusyChange={setStepBusy}
          />
        )}
        {currentStep === 3 && (
          <StepBio bio={data.bio} onUpdate={(bio) => updateData({ bio })} />
        )}
        {currentStep === 4 && (
          <StepSpecialties
            specialties={data.specialties}
            onUpdate={(specialties) => updateData({ specialties })}
          />
        )}
        {currentStep === 5 && (
          <StepPricing data={data} onUpdate={updateData} />
        )}
        {currentStep === 6 && (
          <StepPaymentMethod
            professionalId={professionalId}
            pixKey={data.pixKey}
            onUpdate={(pixKey) => updateData({ pixKey })}
          />
        )}
        {currentStep === 7 && (
          <StepSubscription
            professionalId={professionalId}
            onSubscribed={handleSubscriptionComplete}
          />
        )}
      </div>

      {/* Navigation - hide on subscription step since it has its own CTA */}
      {!isSubscriptionStep && (
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={isSaving || stepBusy}
            className="flex-1 py-3 bg-therapy text-therapy-foreground rounded-xl font-medium hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {stepBusy ? "Enviando arquivo..." : "Continuar"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Back button only on subscription step */}
      {isSubscriptionStep && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleBack}
            className="w-full py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingWizard;
