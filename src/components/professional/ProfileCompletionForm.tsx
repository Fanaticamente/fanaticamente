import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, X, Plus, Info, Edit2, FileText, CheckCircle, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { uploadProfessionalFile } from "@/lib/professionalUploads";

interface ProfileData {
  bio: string;
  degreeBase: string; // Psicólogo or Psicóloga
  degreeTitle: string; // Optional: Mestre/Mestra/Dr./Dra.
  specializations: string;
  specialties: string[];
  sessionDuration: string;
  sessionPrice: string;
  showPrice: boolean;
  imageUrl: string;
  crpDocumentFrontUrl: string;
  crpDocumentBackUrl: string;
  degreeDocumentFrontUrl: string;
  degreeDocumentBackUrl: string;
  socioConsciente: boolean;
}

const DEGREE_BASE_OPTIONS = [
  { value: "Psicólogo", label: "Psicólogo" },
  { value: "Psicóloga", label: "Psicóloga" }
];

const DEGREE_TITLE_OPTIONS_MALE = [
  { value: "", label: "Nenhuma titulação adicional" },
  { value: "Mestre em Psicologia", label: "Mestre em Psicologia" },
  { value: "Dr. em Psicologia", label: "Dr. em Psicologia" }
];

const DEGREE_TITLE_OPTIONS_FEMALE = [
  { value: "", label: "Nenhuma titulação adicional" },
  { value: "Mestra em Psicologia", label: "Mestra em Psicologia" },
  { value: "Dra. em Psicologia", label: "Dra. em Psicologia" }
];

// Props interface with degree as input (for backwards compatibility)
interface ExistingProfileData {
  bio?: string;
  degree?: string; // Combined degree string from database
  specializations?: string;
  specialties?: string[];
  sessionDuration?: string;
  sessionPrice?: string;
  showPrice?: boolean;
  imageUrl?: string;
  crpDocumentFrontUrl?: string;
  crpDocumentBackUrl?: string;
  degreeDocumentFrontUrl?: string;
  degreeDocumentBackUrl?: string;
  socioConsciente?: boolean;
}

interface ProfileCompletionFormProps {
  professionalId: string;
  existingData?: ExistingProfileData;
  onComplete: () => void;
}

const SPECIALTY_OPTIONS = [
  "Ansiedade",
  "Depressão",
  "Terapia de Casais",
  "Relacionamentos",
  "Estresse",
  "Traumas",
  "Burnout",
  "Autoestima",
  "Luto",
  "Fobias",
  "TOC",
  "TDAH",
  "Psicologia Esportiva",
  "Saúde Mental no Esporte",
  "Performance",
  "Desenvolvimento Pessoal",
  "Conflitos Familiares",
  "Transtornos Alimentares"
];

const LOCAL_STORAGE_KEY = "professional_profile_draft";

const ProfileCompletionForm = ({ professionalId, existingData, onComplete }: ProfileCompletionFormProps) => {
  const { user } = useAuth();
  
  // Função para carregar dados do localStorage
  const loadDraftFromStorage = useCallback((): Partial<ProfileData> | null => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Verificar se o draft é do mesmo profissional
        if (parsed.professionalId === professionalId) {
          return parsed.data;
        }
      }
    } catch (e) {
      console.error("Error loading draft:", e);
    }
    return null;
  }, [professionalId]);

  // Parse existing degree into base and title
  const parseDegree = (degree: string | undefined): { base: string; title: string } => {
    if (!degree) return { base: "", title: "" };
    
    // Check if degree contains a title
    const titles = ["Mestre em Psicologia", "Mestra em Psicologia", "Dr. em Psicologia", "Dra. em Psicologia"];
    for (const title of titles) {
      if (degree.includes(title)) {
        // Extract base (Psicólogo/Psicóloga) if present
        const base = degree.includes("Psicóloga") ? "Psicóloga" : degree.includes("Psicólogo") ? "Psicólogo" : "";
        return { base, title };
      }
    }
    
    // Only base degree
    if (degree === "Psicólogo" || degree === "Psicóloga") {
      return { base: degree, title: "" };
    }
    
    // Legacy format - try to determine base from degree string
    return { base: degree.includes("a") ? "Psicóloga" : "Psicólogo", title: "" };
  };

  // Carregar draft ou dados existentes
  const getInitialData = useCallback((): ProfileData => {
    const draft = loadDraftFromStorage();
    const parsedDegree = parseDegree(existingData?.degree);
    
    // Priorizar draft local sobre dados existentes (exceto URLs de imagens que são persistidos no banco)
    return {
      bio: draft?.bio ?? existingData?.bio ?? "",
      degreeBase: draft?.degreeBase ?? parsedDegree.base ?? "",
      degreeTitle: draft?.degreeTitle ?? parsedDegree.title ?? "",
      specializations: draft?.specializations ?? existingData?.specializations ?? "",
      specialties: draft?.specialties ?? existingData?.specialties ?? [],
      sessionDuration: draft?.sessionDuration ?? existingData?.sessionDuration ?? "50",
      sessionPrice: draft?.sessionPrice ?? existingData?.sessionPrice ?? "",
      showPrice: draft?.showPrice ?? existingData?.showPrice ?? true,
      // Imagens sempre vêm do banco de dados (são salvas imediatamente no upload)
      imageUrl: existingData?.imageUrl ?? draft?.imageUrl ?? "",
      crpDocumentFrontUrl: existingData?.crpDocumentFrontUrl ?? draft?.crpDocumentFrontUrl ?? "",
      crpDocumentBackUrl: existingData?.crpDocumentBackUrl ?? draft?.crpDocumentBackUrl ?? "",
      degreeDocumentFrontUrl: existingData?.degreeDocumentFrontUrl ?? draft?.degreeDocumentFrontUrl ?? "",
      degreeDocumentBackUrl: existingData?.degreeDocumentBackUrl ?? draft?.degreeDocumentBackUrl ?? "",
      socioConsciente: draft?.socioConsciente ?? existingData?.socioConsciente ?? false
    };
  }, [existingData, loadDraftFromStorage]);

  const [formData, setFormData] = useState<ProfileData>(getInitialData);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCrpFront, setIsUploadingCrpFront] = useState(false);
  const [isUploadingCrpBack, setIsUploadingCrpBack] = useState(false);
  const [isUploadingDegreeFront, setIsUploadingDegreeFront] = useState(false);
  const [isUploadingDegreeBack, setIsUploadingDegreeBack] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [socioInfoOpen, setSocioInfoOpen] = useState(false);
  const [customSpecialty, setCustomSpecialty] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const crpFrontInputRef = useRef<HTMLInputElement>(null);
  const crpBackInputRef = useRef<HTMLInputElement>(null);
  const degreeFrontInputRef = useRef<HTMLInputElement>(null);
  const degreeBackInputRef = useRef<HTMLInputElement>(null);
  const customSpecialtyInputRef = useRef<HTMLInputElement>(null);

  // Salvar draft no localStorage sempre que formData mudar
  useEffect(() => {
    const saveDraft = () => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          professionalId,
          data: formData,
          savedAt: new Date().toISOString()
        }));
      } catch (e) {
        console.error("Error saving draft:", e);
      }
    };
    
    // Debounce para não salvar a cada keystroke
    const timeoutId = setTimeout(saveDraft, 500);
    return () => clearTimeout(timeoutId);
  }, [formData, professionalId]);

  // Limpar draft após salvar com sucesso
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("Error clearing draft:", e);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await uploadProfessionalFile(file, "avatar");
      const { data: { session } } = await supabase.auth.getSession();
      const userId = user?.id ?? session?.user?.id;

      // Salvar a URL no banco de dados imediatamente
      if (userId) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: url })
          .eq('user_id', userId);

        if (updateError) {
          console.error("Error updating avatar_url:", updateError);
          toast.error("Erro ao salvar foto no perfil");
          return;
        }
      }

      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success("Imagem enviada e salva com sucesso!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCrpDocumentUpload = async (file: File, side: 'front' | 'back') => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error("Por favor, selecione uma imagem ou PDF");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      return;
    }

    if (side === 'front') {
      setIsUploadingCrpFront(true);
    } else {
      setIsUploadingCrpBack(true);
    }

    try {
      const { url: documentUrl } = await uploadProfessionalFile(file, side === 'front' ? 'crp-front' : 'crp-back');

      // Save to professionals table
      const updateField = side === 'front' ? 'crp_document_front_url' : 'crp_document_back_url';
      const { error: updateError } = await supabase
        .from('professionals')
        .update({ [updateField]: documentUrl })
        .eq('id', professionalId);

      if (updateError) throw updateError;

      if (side === 'front') {
        setFormData(prev => ({ ...prev, crpDocumentFrontUrl: documentUrl }));
      } else {
        setFormData(prev => ({ ...prev, crpDocumentBackUrl: documentUrl }));
      }

      toast.success(`Documento (${side === 'front' ? 'frente' : 'verso'}) enviado com sucesso!`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar documento. Tente novamente.");
    } finally {
      if (side === 'front') {
        setIsUploadingCrpFront(false);
        if (crpFrontInputRef.current) crpFrontInputRef.current.value = "";
      } else {
        setIsUploadingCrpBack(false);
        if (crpBackInputRef.current) crpBackInputRef.current.value = "";
      }
    }
  };

  const handleDegreeDocumentUpload = async (file: File, side: 'front' | 'back') => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error("Por favor, selecione uma imagem ou PDF");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      return;
    }

    if (side === 'front') {
      setIsUploadingDegreeFront(true);
    } else {
      setIsUploadingDegreeBack(true);
    }

    try {
      const { url: documentUrl } = await uploadProfessionalFile(file, side === 'front' ? 'degree-front' : 'degree-back');

      // Save to professionals table
      const updateField = side === 'front' ? 'degree_document_front_url' : 'degree_document_back_url';
      const { error: updateError } = await supabase
        .from('professionals')
        .update({ [updateField]: documentUrl })
        .eq('id', professionalId);

      if (updateError) throw updateError;

      if (side === 'front') {
        setFormData(prev => ({ ...prev, degreeDocumentFrontUrl: documentUrl }));
      } else {
        setFormData(prev => ({ ...prev, degreeDocumentBackUrl: documentUrl }));
      }

      toast.success(`Diploma (${side === 'front' ? 'frente' : 'verso'}) enviado com sucesso!`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar diploma. Tente novamente.");
    } finally {
      if (side === 'front') {
        setIsUploadingDegreeFront(false);
        if (degreeFrontInputRef.current) degreeFrontInputRef.current.value = "";
      } else {
        setIsUploadingDegreeBack(false);
        if (degreeBackInputRef.current) degreeBackInputRef.current.value = "";
      }
    }
  };

  const addSpecialty = (specialty: string) => {
    if (formData.specialties.length >= 6) {
      toast.error("Máximo de 6 especialidades");
      return;
    }
    const trimmed = specialty.trim();
    if (trimmed && !formData.specialties.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, trimmed]
      }));
    }
    setNewSpecialty("");
  };

  const addCustomSpecialty = () => {
    const trimmed = customSpecialty.trim();
    if (!trimmed) {
      toast.error("Digite o nome da especialidade");
      return;
    }
    if (trimmed.length > 30) {
      toast.error("Máximo de 30 caracteres");
      return;
    }
    addSpecialty(trimmed);
    setCustomSpecialty("");
    setIsAddingCustom(false);
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  // Combine degree base and title for storage
  const getCombinedDegree = (): string => {
    if (formData.degreeTitle) {
      return `${formData.degreeBase}, ${formData.degreeTitle}`;
    }
    return formData.degreeBase;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.bio.trim() || formData.bio.length < 50) {
      toast.error("A bio deve ter pelo menos 50 caracteres");
      return;
    }
    if (!formData.degreeBase) {
      toast.error("Selecione sua formação base (Psicólogo/Psicóloga)");
      return;
    }
    if (formData.specialties.length === 0) {
      toast.error("Selecione pelo menos uma especialidade");
      return;
    }
    if (!formData.imageUrl) {
      toast.error("Faça upload de uma foto profissional");
      return;
    }
    // Validate degree documents when title is selected
    if (formData.degreeTitle) {
      if (!formData.degreeDocumentFrontUrl) {
        toast.error("Envie a frente do diploma/certificado de titulação");
        return;
      }
      if (!formData.degreeDocumentBackUrl) {
        toast.error("Envie o verso do diploma/certificado de titulação");
        return;
      }
    }

    setIsSaving(true);
    try {
      const combinedDegree = getCombinedDegree();
      const { error } = await supabase
        .from('professionals')
        .update({
          bio: formData.bio,
          degree: combinedDegree,
          specialties: formData.specialties,
          hourly_rate: formData.sessionPrice ? parseFloat(formData.sessionPrice) : null,
          socio_consciente: formData.socioConsciente
        })
        .eq('id', professionalId);

      if (error) throw error;

      // Limpar o rascunho após salvar com sucesso
      clearDraft();
      
      toast.success("Perfil atualizado com sucesso!");
      onComplete();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClassName = "w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground focus:border-therapy focus:outline-none transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <div>
        <label className="block text-card-foreground text-sm font-medium mb-2">
          Foto Profissional *
        </label>
        <div className="flex items-start gap-4">
          <div 
            className="w-28 h-36 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-muted/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-therapy transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {formData.imageUrl ? (
              <img 
                src={formData.imageUrl} 
                alt="Preview" 
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="text-center p-2">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                <span className="text-xs text-muted-foreground">Enviar foto</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex-1">
            <div className="bg-muted/30 rounded-lg p-3 border border-border">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-therapy mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-card-foreground mb-1">Proporção ideal: 7:9 (vertical)</p>
                  <p>• Foto profissional com fundo neutro</p>
                  <p>• Rosto visível e boa iluminação</p>
                  <p>• Máximo 5MB (JPG ou PNG)</p>
                  <p className="mt-2 text-therapy">Sugestões de pose:</p>
                  <p>• Meio corpo com braços cruzados</p>
                  <p>• Retrato com sorriso natural</p>
                </div>
              </div>
            </div>
            {isUploading && (
              <p className="text-therapy text-sm mt-2">Enviando...</p>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-card-foreground text-sm font-medium mb-2">
          Bio / Apresentação * <span className="text-muted-foreground font-normal">(mín. 50 caracteres)</span>
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          className={`${inputClassName} min-h-[120px] resize-none`}
          placeholder="Conte sobre você, sua abordagem terapêutica e como ajuda seus pacientes..."
          maxLength={500}
        />
        <p className="text-muted-foreground text-xs mt-1">{formData.bio.length}/500</p>
      </div>

      {/* Degree / Formation */}
      <div>
        <label className="block text-card-foreground text-sm font-medium mb-2">
          Formação / Titulação *
        </label>
        <div className="space-y-3">
          {/* Base degree selection */}
          <div>
            <p className="text-muted-foreground text-xs mb-2">Formação base:</p>
            <div className="flex gap-2">
              {DEGREE_BASE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    degreeBase: option.value,
                    // Clear title when base changes to avoid gender mismatch
                    degreeTitle: prev.degreeBase !== option.value ? "" : prev.degreeTitle,
                    // Clear degree documents when title is cleared
                    degreeDocumentFrontUrl: prev.degreeBase !== option.value ? "" : prev.degreeDocumentFrontUrl,
                    degreeDocumentBackUrl: prev.degreeBase !== option.value ? "" : prev.degreeDocumentBackUrl
                  }))}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                    formData.degreeBase === option.value
                      ? "border-therapy bg-therapy/10 text-therapy"
                      : "border-border bg-background text-muted-foreground hover:border-therapy/50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title selection */}
          <div>
            <p className="text-muted-foreground text-xs mb-2">Titulação adicional (opcional):</p>
            <select
              value={formData.degreeTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, degreeTitle: e.target.value }))}
              className={inputClassName}
              disabled={!formData.degreeBase}
            >
              {(formData.degreeBase === "Psicóloga" ? DEGREE_TITLE_OPTIONS_FEMALE : DEGREE_TITLE_OPTIONS_MALE).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Degree Document Upload - only visible when title is selected */}
          {formData.degreeTitle && (
            <div className="border border-border rounded-xl p-4 bg-background">
              <label className="block text-card-foreground text-sm font-medium mb-2">
                Diploma/Certificado de Titulação <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-4">
                Envie uma foto frente e verso do seu diploma ou certificado de {formData.degreeTitle}.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {/* Front */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Frente</label>
                  <div 
                    className="h-28 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-muted/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-therapy transition-colors"
                    onClick={() => degreeFrontInputRef.current?.click()}
                  >
                    {formData.degreeDocumentFrontUrl ? (
                      <div className="flex items-center gap-2 text-therapy">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">Enviado</span>
                      </div>
                    ) : isUploadingDegreeFront ? (
                      <span className="text-sm text-therapy">Enviando...</span>
                    ) : (
                      <div className="text-center p-2">
                        <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                        <span className="text-xs text-muted-foreground">Clique para enviar</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={degreeFrontInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDegreeDocumentUpload(file, 'front');
                    }}
                    className="hidden"
                  />
                </div>

                {/* Back */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Verso</label>
                  <div 
                    className="h-28 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-muted/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-therapy transition-colors"
                    onClick={() => degreeBackInputRef.current?.click()}
                  >
                    {formData.degreeDocumentBackUrl ? (
                      <div className="flex items-center gap-2 text-therapy">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">Enviado</span>
                      </div>
                    ) : isUploadingDegreeBack ? (
                      <span className="text-sm text-therapy">Enviando...</span>
                    ) : (
                      <div className="text-center p-2">
                        <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                        <span className="text-xs text-muted-foreground">Clique para enviar</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={degreeBackInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDegreeDocumentUpload(file, 'back');
                    }}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preview of combined degree */}
          {formData.degreeBase && (
            <div className="bg-muted/30 rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Exibição no card:</p>
              <p className="text-sm text-card-foreground font-medium">
                {formData.degreeTitle 
                  ? `${formData.degreeBase}, ${formData.degreeTitle}` 
                  : formData.degreeBase}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CRP Document Upload */}
      <div className="border border-border rounded-xl p-4 bg-muted/30">
        <label className="block text-card-foreground text-sm font-medium mb-3">
          Carteira de Identificação de Psicólogo (CRP) *
        </label>
        <p className="text-xs text-muted-foreground mb-4">
          Envie uma foto frente e verso da sua carteira do CRP para verificação.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {/* Front */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Frente</label>
            <div 
              className="h-28 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-background flex items-center justify-center overflow-hidden cursor-pointer hover:border-therapy transition-colors"
              onClick={() => crpFrontInputRef.current?.click()}
            >
              {formData.crpDocumentFrontUrl ? (
                <div className="flex items-center gap-2 text-therapy">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">Enviado</span>
                </div>
              ) : isUploadingCrpFront ? (
                <span className="text-sm text-therapy">Enviando...</span>
              ) : (
                <div className="text-center p-2">
                  <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <span className="text-xs text-muted-foreground">Clique para enviar</span>
                </div>
              )}
            </div>
            <input
              ref={crpFrontInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCrpDocumentUpload(file, 'front');
              }}
              className="hidden"
            />
          </div>

          {/* Back */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Verso</label>
            <div 
              className="h-28 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-background flex items-center justify-center overflow-hidden cursor-pointer hover:border-therapy transition-colors"
              onClick={() => crpBackInputRef.current?.click()}
            >
              {formData.crpDocumentBackUrl ? (
                <div className="flex items-center gap-2 text-therapy">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">Enviado</span>
                </div>
              ) : isUploadingCrpBack ? (
                <span className="text-sm text-therapy">Enviando...</span>
              ) : (
                <div className="text-center p-2">
                  <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <span className="text-xs text-muted-foreground">Clique para enviar</span>
                </div>
              )}
            </div>
            <input
              ref={crpBackInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCrpDocumentUpload(file, 'back');
              }}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Specializations */}
      <div>
        <label className="block text-card-foreground text-sm font-medium mb-2">
          Especializações (opcional)
        </label>
        <input
          type="text"
          value={formData.specializations}
          onChange={(e) => setFormData(prev => ({ ...prev, specializations: e.target.value }))}
          className={inputClassName}
          placeholder="Ex: Terapia Cognitivo-Comportamental, EMDR"
        />
      </div>

      {/* Specialties Tags */}
      <div>
        <label className="block text-card-foreground text-sm font-medium mb-2">
          Atendo principalmente demandas relacionadas a: * <span className="text-muted-foreground font-normal">(máx. 6)</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.specialties.map((specialty) => (
            <span
              key={specialty}
              className="px-3 py-1 bg-therapy/20 text-therapy text-sm rounded-full flex items-center gap-1"
            >
              {specialty}
              <button
                type="button"
                onClick={() => removeSpecialty(specialty)}
                className="hover:bg-therapy/30 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        
        {/* Input para especialidade personalizada */}
        {isAddingCustom ? (
          <div className="flex gap-2 mb-3">
            <input
              ref={customSpecialtyInputRef}
              type="text"
              value={customSpecialty}
              onChange={(e) => setCustomSpecialty(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSpecialty();
                } else if (e.key === 'Escape') {
                  setIsAddingCustom(false);
                  setCustomSpecialty("");
                }
              }}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-card-foreground text-sm focus:border-therapy focus:outline-none"
              placeholder="Digite sua especialidade..."
              maxLength={30}
              autoFocus
            />
            <button
              type="button"
              onClick={addCustomSpecialty}
              className="px-3 py-2 bg-therapy text-white text-sm rounded-lg hover:bg-therapy/90 transition-colors"
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingCustom(false);
                setCustomSpecialty("");
              }}
              className="px-3 py-2 bg-muted text-muted-foreground text-sm rounded-lg hover:bg-muted/80 transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : null}
        
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.filter(s => !formData.specialties.includes(s)).slice(0, 12).map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => addSpecialty(specialty)}
              disabled={formData.specialties.length >= 6}
              className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full hover:bg-therapy/20 hover:text-therapy transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + {specialty}
            </button>
          ))}
          {/* Botão "Outro" */}
          {!isAddingCustom && formData.specialties.length < 6 && (
            <button
              type="button"
              onClick={() => {
                setIsAddingCustom(true);
                setTimeout(() => customSpecialtyInputRef.current?.focus(), 100);
              }}
              className="px-3 py-1 bg-therapy/10 text-therapy text-sm rounded-full hover:bg-therapy/20 transition-colors border border-therapy/30"
            >
              + Outro
            </button>
          )}
        </div>
      </div>

      {/* Session Price and Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-card-foreground text-sm font-medium mb-2">
            Duração da Sessão
          </label>
          <select
            value={formData.sessionDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, sessionDuration: e.target.value }))}
            className={inputClassName}
          >
            <option value="30">30 minutos</option>
            <option value="50">50 minutos</option>
            <option value="60">60 minutos</option>
            <option value="90">90 minutos</option>
          </select>
        </div>
        <div>
          <label className="block text-card-foreground text-sm font-medium mb-2">
            Valor da Sessão (R$)
          </label>
          <input
            type="number"
            value={formData.sessionPrice}
            onChange={(e) => setFormData(prev => ({ ...prev, sessionPrice: e.target.value }))}
            className={inputClassName}
            placeholder="150"
            min="0"
            step="10"
          />
        </div>
      </div>

      {/* Show Price Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="showPrice"
          checked={formData.showPrice}
          onChange={(e) => setFormData(prev => ({ ...prev, showPrice: e.target.checked }))}
          className="w-4 h-4 rounded border-border accent-emerald-500 focus:ring-emerald-500"
        />
        <label htmlFor="showPrice" className="text-card-foreground text-sm">
          Exibir valor da sessão no meu card
        </label>
      </div>

      {/* Sócio Consciente Toggle */}
      <div className="border border-therapy/30 rounded-xl p-4 bg-therapy/5">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="socioConsciente"
            checked={formData.socioConsciente}
            onChange={(e) => setFormData(prev => ({ ...prev, socioConsciente: e.target.checked }))}
            className="w-5 h-5 rounded border-border accent-emerald-500 focus:ring-emerald-500 mt-0.5"
          />
          <div>
            <label htmlFor="socioConsciente" className="text-card-foreground text-sm font-semibold block">
              ⚽ Programa Sócio Consciente
            </label>
            <p className="text-muted-foreground text-xs mt-1">
              O programa aplica uma redução de 15% no valor praticado como incentivo aos sócios-torcedores.
            </p>
            <button
              type="button"
              onClick={() => setSocioInfoOpen(true)}
              className="text-xs font-medium mt-2 flex items-center gap-1 hover:underline"
              style={{ color: '#3b82f6' }}
            >
              <Info className="w-3.5 h-3.5" />
              Saiba mais
            </button>
          </div>
        </div>
      </div>

      {/* Sócio Consciente Info Dialog */}
      <Dialog open={socioInfoOpen} onOpenChange={setSocioInfoOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-800 flex items-center gap-2">
              ⚽ Programa Sócio Consciente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              O Sócio Consciente é um programa criado para ampliar e incentivar o acesso de sócios-torcedores dos clubes ao cuidado com a saúde mental, por meio de parcerias com profissionais comprometidos com uma prática ética e responsável.
            </p>
            <p>
              Ao optar por atender pelo programa, você mantém integralmente sua autonomia profissional e seu valor de referência. A adesão consiste em conceder, de forma voluntária, uma condição específica aos torcedores elegíveis, aplicada ao valor da sessão como incentivo ao acesso e à continuidade do cuidado, correspondente a uma redução de 15% sobre o valor habitualmente praticado.
            </p>
            <p>
              Além de beneficiar os sócios-torcedores, o programa também favorece profissionais que desejam ampliar seu alcance de forma ética, considerando que os clubes reúnem milhares de associados continuamente incentivados a cuidar da saúde mental.
            </p>
            <p className="text-xs text-gray-500 italic border-t border-gray-200 pt-3 mt-2">
              Ao selecionar a caixa de seleção do programa, você declara estar ciente e de acordo com os termos acima, comprometendo-se a atender pelo Sócio Consciente.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Button */}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full py-3 bg-therapy text-therapy-foreground rounded-xl font-medium hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <>
            <div className="w-4 h-4 border-2 border-therapy-foreground border-t-transparent rounded-full animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Edit2 className="w-4 h-4" />
            Salvar Alterações
          </>
        )}
      </button>
    </form>
  );
};

export default ProfileCompletionForm;
