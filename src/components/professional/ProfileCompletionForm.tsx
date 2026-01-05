import { useState, useRef } from "react";
import { Upload, X, Plus, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
interface ProfileData {
  bio: string;
  degree: string;
  specializations: string;
  specialties: string[];
  sessionDuration: string;
  sessionPrice: string;
  showPrice: boolean;
  imageUrl: string;
  pixKey: string;
}

interface ProfileCompletionFormProps {
  professionalId: string;
  existingData?: Partial<ProfileData>;
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

const ProfileCompletionForm = ({ professionalId, existingData, onComplete }: ProfileCompletionFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    bio: existingData?.bio || "",
    degree: existingData?.degree || "",
    specializations: existingData?.specializations || "",
    specialties: existingData?.specialties || [],
    sessionDuration: existingData?.sessionDuration || "50",
    sessionPrice: existingData?.sessionPrice || "",
    showPrice: existingData?.showPrice ?? true,
    imageUrl: existingData?.imageUrl || "",
    pixKey: existingData?.pixKey || ""
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const fileExt = file.name.split('.').pop();
      const fileName = `${professionalId}-${Date.now()}.${fileExt}`;
      const filePath = `professionals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Salvar a URL no banco de dados imediatamente
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('user_id', user.id);

        if (updateError) {
          console.error("Error updating avatar_url:", updateError);
          toast.error("Erro ao salvar foto no perfil");
          return;
        }
      }

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
      toast.success("Imagem enviada e salva com sucesso!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const addSpecialty = (specialty: string) => {
    if (formData.specialties.length >= 6) {
      toast.error("Máximo de 6 especialidades");
      return;
    }
    if (!formData.specialties.includes(specialty)) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty]
      }));
    }
    setNewSpecialty("");
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.bio.trim() || formData.bio.length < 50) {
      toast.error("A bio deve ter pelo menos 50 caracteres");
      return;
    }
    if (!formData.degree.trim()) {
      toast.error("Informe sua formação");
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

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('professionals')
        .update({
          bio: formData.bio,
          degree: formData.degree,
          specialties: formData.specialties,
          hourly_rate: formData.sessionPrice ? parseFloat(formData.sessionPrice) : null,
          pix_key: formData.pixKey || null,
          pix_key_type: null
        })
        .eq('id', professionalId);

      if (error) throw error;

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
                className="w-full h-full object-cover"
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
        <input
          type="text"
          value={formData.degree}
          onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
          className={inputClassName}
          placeholder="Ex: Mestre em Psicologia Clínica - USP"
        />
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
          Especialidades de Atendimento * <span className="text-muted-foreground font-normal">(máx. 6)</span>
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
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.filter(s => !formData.specialties.includes(s)).slice(0, 12).map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => addSpecialty(specialty)}
              className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full hover:bg-therapy/20 hover:text-therapy transition-colors"
            >
              + {specialty}
            </button>
          ))}
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

      {/* PIX Key */}
      <div className="border-t border-border pt-6">
        <label className="block text-card-foreground text-sm font-medium mb-2">
          Chave PIX para Recebimentos (opcional)
        </label>
        <p className="text-muted-foreground text-xs mb-3">
          Informe sua chave PIX (CPF, CNPJ, e-mail, telefone ou chave aleatória) para receber pagamentos diretamente dos pacientes
        </p>
        <input
          type="text"
          value={formData.pixKey}
          onChange={(e) => setFormData(prev => ({ ...prev, pixKey: e.target.value }))}
          className={inputClassName}
          placeholder="CPF, e-mail, telefone ou chave aleatória"
        />
      </div>

      {/* Show Price Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="showPrice"
          checked={formData.showPrice}
          onChange={(e) => setFormData(prev => ({ ...prev, showPrice: e.target.checked }))}
          className="w-4 h-4 rounded border-border text-therapy focus:ring-therapy"
        />
        <label htmlFor="showPrice" className="text-card-foreground text-sm">
          Exibir valor da sessão no meu card
        </label>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full py-4 bg-therapy text-therapy-foreground rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50"
      >
        {isSaving ? "Salvando..." : "Salvar e Continuar"}
      </button>
    </form>
  );
};

export default ProfileCompletionForm;
