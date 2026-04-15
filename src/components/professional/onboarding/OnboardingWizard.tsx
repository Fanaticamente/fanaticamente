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

const OnboardingWizard = ({ professionalId, existingData, onComplete }: OnboardingWizardProps) => {
  const { user } = useAuth();

  const loadDraft = useCallback((): { step: number; data: Partial<OnboardingData> } | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.professionalId === professionalId) return parsed;
      }
    } catch {}
    return null;
  }, [professionalId]);

  const draft = loadDraft();

  const [currentStep, setCurrentStep] = useState(draft?.step ?? 0);
  const [data, setData] = useState<OnboardingData>({
    imageUrl: draft?.data?.imageUrl ?? existingData?.imageUrl ?? "",
    degreeBase: draft?.data?.degreeBase ?? existingData?.degreeBase ?? "",
    degreeTitle: draft?.data?.degreeTitle ?? existingData?.degreeTitle ?? "",
    degreeDocumentFrontUrl: draft?.data?.degreeDocumentFrontUrl ?? existingData?.degreeDocumentFrontUrl ?? "",
    degreeDocumentBackUrl: draft?.data?.degreeDocumentBackUrl ?? existingData?.degreeDocumentBackUrl ?? "",
    crpDocumentFrontUrl: existingData?.crpDocumentFrontUrl ?? draft?.data?.crpDocumentFrontUrl ?? "",
    crpDocumentBackUrl: existingData?.crpDocumentBackUrl ?? draft?.data?.crpDocumentBackUrl ?? "",
    bio: draft?.data?.bio ?? existingData?.bio ?? "",
    specialties: draft?.data?.specialties ?? existingData?.specialties ?? [],
    sessionDuration: draft?.data?.sessionDuration ?? existingData?.sessionDuration ?? "50",
    sessionPrice: draft?.data?.sessionPrice ?? existingData?.sessionPrice ?? "",
    showPrice: draft?.data?.showPrice ?? existingData?.showPrice ?? true,
    socioConsciente: draft?.data?.socioConsciente ?? existingData?.socioConsciente ?? false,
    pixKey: draft?.data?.pixKey ?? existingData?.pixKey ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Persist draft
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ professionalId, step: currentStep, data }));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [data, currentStep, professionalId]);

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
      case 2: // Documents
        return true;
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

    // Save profile data when leaving pricing step (step 5) before payment/subscription
    if (currentStep === 5) {
      setIsSaving(true);
      try {
        const combinedDegree = data.degreeTitle ? `${data.degreeBase}, ${data.degreeTitle}` : data.degreeBase;
        const { error } = await supabase
          .from("professionals")
          .update({
            bio: data.bio,
            degree: combinedDegree,
            specialties: data.specialties,
            hourly_rate: data.sessionPrice ? parseFloat(data.sessionPrice) : null,
            socio_consciente: data.socioConsciente,
          })
          .eq("id", professionalId);
        if (error) throw error;
      } catch (error) {
        console.error("Save error:", error);
        toast.error("Erro ao salvar dados. Tente novamente.");
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubscriptionComplete = () => {
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Cadastro profissional concluído! 🎉");
    onComplete();
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
          />
        )}
        {currentStep === 1 && (
          <StepDegree
            professionalId={professionalId}
            data={data}
            onUpdate={updateData}
          />
        )}
        {currentStep === 2 && (
          <StepDocuments
            professionalId={professionalId}
            data={data}
            onUpdate={updateData}
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
            disabled={isSaving}
            className="flex-1 py-3 bg-therapy text-therapy-foreground rounded-xl font-medium hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-therapy-foreground border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                Continuar
                <ChevronRight className="w-4 h-4" />
              </>
            )}
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
