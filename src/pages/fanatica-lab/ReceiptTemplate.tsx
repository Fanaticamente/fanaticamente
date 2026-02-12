import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProfessionalBottomNav from "@/components/layout/ProfessionalBottomNav";
import ProfessionalDesktopLayout from "@/components/layout/ProfessionalDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";

const ReceiptTemplate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [crp, setCrp] = useState("");
  const [documentType, setDocumentType] = useState("CPF");
  const [documentNumber, setDocumentNumber] = useState("");
  const [serviceDescription, setServiceDescription] = useState("Sessão de Psicoterapia");

  useLayoutEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light', 'professional-theme');
    document.documentElement.style.colorScheme = 'light';
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#1a1a1a';
    return () => {
      document.documentElement.classList.remove('professional-theme');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  // Fetch professional data
  const { data: professional } = useQuery({
    queryKey: ["professional-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch existing template
  const { data: template, isLoading } = useQuery({
    queryKey: ["receipt-template", professional?.id],
    queryFn: async () => {
      if (!professional?.id) return null;
      const { data, error } = await supabase
        .from("receipt_templates")
        .select("*")
        .eq("professional_id", professional.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!professional?.id,
  });

  // Pre-fill from template or professional data
  useEffect(() => {
    if (template) {
      setFullName(template.full_name);
      setCrp(template.crp);
      setDocumentType(template.document_type);
      setDocumentNumber(template.document_number);
      setServiceDescription(template.service_description);
    } else if (professional) {
      setCrp(professional.crp || "");
      setDocumentType(professional.document_type || "CPF");
      setDocumentNumber(professional.document_number || "");
    }
  }, [template, professional]);

  // Pre-fill name from profile
  const { data: profile } = useQuery({
    queryKey: ["professional-profile-name", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !template,
  });

  useEffect(() => {
    if (!template && profile?.full_name && !fullName) {
      setFullName(profile.full_name);
    }
  }, [profile, template, fullName]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!professional?.id) throw new Error("Perfil profissional não encontrado");
      if (!fullName.trim() || !crp.trim() || !documentNumber.trim()) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      const payload = {
        professional_id: professional.id,
        full_name: fullName.trim(),
        crp: crp.trim(),
        document_type: documentType,
        document_number: documentNumber.trim(),
        service_description: serviceDescription.trim(),
      };

      if (template) {
        const { error } = await supabase
          .from("receipt_templates")
          .update(payload)
          .eq("id", template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("receipt_templates")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipt-template"] });
      toast.success("Modelo de recibo salvo com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const formContent = (
    <div className="space-y-6">
      {/* Info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Receipt className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 leading-relaxed">
              Configure os dados que aparecerao nos recibos gerados automaticamente
              ao encerrar uma consulta. Esses dados sao de uso exclusivo do profissional
              e nao incluem informacoes da plataforma.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-gray-900">Nome Completo *</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            className="bg-white border-gray-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="crp" className="text-gray-900">Registro CRP *</Label>
          <Input
            id="crp"
            value={crp}
            onChange={(e) => setCrp(e.target.value)}
            placeholder="Ex: CRP 06/123456"
            className="bg-white border-gray-200"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label className="text-gray-900">Tipo Doc. *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="documentNumber" className="text-gray-900">Numero do Documento *</Label>
            <Input
              id="documentNumber"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder={documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
              className="bg-white border-gray-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceDescription" className="text-gray-900">Descricao do Servico</Label>
          <Textarea
            id="serviceDescription"
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
            placeholder="Ex: Sessão de Psicoterapia"
            className="bg-white border-gray-200 resize-none"
            rows={2}
          />
          <p className="text-xs text-gray-500">
            Texto que aparecera como descricao do servico no recibo.
          </p>
        </div>
      </div>

      {/* Preview */}
      {fullName && crp && documentNumber && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Pre-visualizacao</h3>
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4 space-y-2 text-sm text-gray-700">
              <p className="font-bold text-gray-900 text-base">{fullName}</p>
              <p>{crp}</p>
              <p>{documentType}: {documentNumber}</p>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-gray-500">Servico: {serviceDescription}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending || !fullName.trim() || !crp.trim() || !documentNumber.trim()}
        className="w-full bg-primary hover:bg-primary/90"
      >
        <Save className="w-4 h-4 mr-2" />
        {saveMutation.isPending ? "Salvando..." : template ? "Atualizar Modelo" : "Salvar Modelo"}
      </Button>
    </div>
  );

  if (!isMobile) {
    return (
      <ProfessionalDesktopLayout title="Modelo de Recibo" subtitle="Configure os dados do seu recibo">
        {formContent}
      </ProfessionalDesktopLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/fanatica-lab")} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Modelo de Recibo</h1>
            <p className="text-sm text-gray-500">Configure os dados do seu recibo</p>
          </div>
        </div>
      </div>
      <div className="p-4 pb-32">
        {formContent}
      </div>
      <ProfessionalBottomNav />
    </div>
  );
};

export default ReceiptTemplate;
