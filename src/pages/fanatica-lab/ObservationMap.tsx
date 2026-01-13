import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Map, Clock, Search, Trash2, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProfessionalBottomNav from "@/components/layout/ProfessionalBottomNav";

interface Observation {
  id: string;
  patient_code: string;
  recurring_themes: string | null;
  observed_emotions: string | null;
  trigger_situations: string | null;
  patient_resources: string | null;
  attention_points: string | null;
  created_at: string;
  updated_at: string;
}

const ObservationMap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);
  const [formData, setFormData] = useState({
    patient_code: "",
    recurring_themes: "",
    observed_emotions: "",
    trigger_situations: "",
    patient_resources: "",
    attention_points: ""
  });
  const [saving, setSaving] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  // Force light theme
  useLayoutEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  useEffect(() => {
    fetchProfessionalAndObservations();
  }, [user]);

  const fetchProfessionalAndObservations = async () => {
    if (!user) return;
    
    try {
      const { data: professional } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (professional) {
        setProfessionalId(professional.id);
        
        const { data, error } = await supabase
          .from("clinical_observations")
          .select("*")
          .eq("professional_id", professional.id)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        setObservations(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar observações:", error);
      toast.error("Erro ao carregar mapas de observação");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!professionalId || !formData.patient_code) {
      toast.error("Informe o código do paciente");
      return;
    }

    setSaving(true);
    try {
      if (editingObservation) {
        const { error } = await supabase
          .from("clinical_observations")
          .update({
            patient_code: formData.patient_code,
            recurring_themes: formData.recurring_themes || null,
            observed_emotions: formData.observed_emotions || null,
            trigger_situations: formData.trigger_situations || null,
            patient_resources: formData.patient_resources || null,
            attention_points: formData.attention_points || null
          })
          .eq("id", editingObservation.id);

        if (error) throw error;
        toast.success("Observação atualizada");
      } else {
        const { error } = await supabase
          .from("clinical_observations")
          .insert({
            professional_id: professionalId,
            patient_code: formData.patient_code,
            recurring_themes: formData.recurring_themes || null,
            observed_emotions: formData.observed_emotions || null,
            trigger_situations: formData.trigger_situations || null,
            patient_resources: formData.patient_resources || null,
            attention_points: formData.attention_points || null
          });

        if (error) throw error;
        toast.success("Observação salva");
      }

      resetForm();
      fetchProfessionalAndObservations();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar observação");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (observation: Observation) => {
    setEditingObservation(observation);
    setFormData({
      patient_code: observation.patient_code,
      recurring_themes: observation.recurring_themes || "",
      observed_emotions: observation.observed_emotions || "",
      trigger_situations: observation.trigger_situations || "",
      patient_resources: observation.patient_resources || "",
      attention_points: observation.attention_points || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clinical_observations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Observação excluída");
      setObservations(observations.filter(o => o.id !== id));
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir observação");
    }
  };

  const resetForm = () => {
    setFormData({
      patient_code: "",
      recurring_themes: "",
      observed_emotions: "",
      trigger_situations: "",
      patient_resources: "",
      attention_points: ""
    });
    setEditingObservation(null);
    setIsDialogOpen(false);
  };

  const filteredObservations = observations.filter(obs => 
    obs.patient_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/fanatica-lab")}
            className="text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Mapa de Observação</h1>
            <p className="text-sm text-gray-500">Campos reflexivos guiados</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingObservation ? "Editar" : "Novo"} Mapa de Observação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="patient_code">Código/Pseudônimo do Paciente *</Label>
                  <Input
                    id="patient_code"
                    placeholder="Ex: PAC001"
                    value={formData.patient_code}
                    onChange={(e) => setFormData({ ...formData, patient_code: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="recurring_themes">Temas Recorrentes</Label>
                  <Textarea
                    id="recurring_themes"
                    placeholder="Quais temas aparecem frequentemente nas sessões?"
                    value={formData.recurring_themes}
                    onChange={(e) => setFormData({ ...formData, recurring_themes: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="observed_emotions">Emoções Observadas</Label>
                  <Textarea
                    id="observed_emotions"
                    placeholder="Quais emoções você observa no paciente?"
                    value={formData.observed_emotions}
                    onChange={(e) => setFormData({ ...formData, observed_emotions: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="trigger_situations">Situações Gatilho</Label>
                  <Textarea
                    id="trigger_situations"
                    placeholder="Quais situações parecem disparar reações?"
                    value={formData.trigger_situations}
                    onChange={(e) => setFormData({ ...formData, trigger_situations: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="patient_resources">Recursos do Paciente</Label>
                  <Textarea
                    id="patient_resources"
                    placeholder="Quais forças e recursos o paciente demonstra?"
                    value={formData.patient_resources}
                    onChange={(e) => setFormData({ ...formData, patient_resources: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="attention_points">Pontos de Atenção</Label>
                  <Textarea
                    id="attention_points"
                    placeholder="O que requer atenção especial?"
                    value={formData.attention_points}
                    onChange={(e) => setFormData({ ...formData, attention_points: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Salvando..." : editingObservation ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* List */}
      <div className="p-4 pb-32">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredObservations.length === 0 ? (
          <div className="text-center py-12">
            <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma observação encontrada</p>
            <p className="text-sm text-gray-400 mt-1">Clique no + para criar um novo mapa</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredObservations.map((obs) => (
              <Card key={obs.id} className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          {obs.patient_code}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {format(new Date(obs.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {obs.recurring_themes && (
                          <p className="text-sm text-gray-600 line-clamp-1">
                            <span className="font-medium">Temas:</span> {obs.recurring_themes}
                          </p>
                        )}
                        {obs.attention_points && (
                          <p className="text-sm text-gray-600 line-clamp-1">
                            <span className="font-medium">Atenção:</span> {obs.attention_points}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-primary"
                        onClick={() => handleEdit(obs)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir observação?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(obs.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProfessionalBottomNav />
    </div>
  );
};

export default ObservationMap;
