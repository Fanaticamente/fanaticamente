import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Target, Clock, Search, Trash2, Edit } from "lucide-react";
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
import ProfessionalDesktopLayout from "@/components/layout/ProfessionalDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";

interface TherapeuticPlanData {
  id: string;
  patient_code: string;
  general_objectives: string | null;
  strategies: string | null;
  created_at: string;
  updated_at: string;
}

const TherapeuticPlan = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [plans, setPlans] = useState<TherapeuticPlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TherapeuticPlanData | null>(null);
  const [formData, setFormData] = useState({
    patient_code: "",
    general_objectives: "",
    strategies: ""
  });
  const [saving, setSaving] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  // Force light theme for professional environment
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

  useEffect(() => {
    fetchProfessionalAndPlans();
  }, [user]);

  const fetchProfessionalAndPlans = async () => {
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
          .from("therapeutic_plans")
          .select("*")
          .eq("professional_id", professional.id)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        setPlans(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      toast.error("Erro ao carregar planos terapêuticos");
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
      if (editingPlan) {
        const { error } = await supabase
          .from("therapeutic_plans")
          .update({
            patient_code: formData.patient_code,
            general_objectives: formData.general_objectives || null,
            strategies: formData.strategies || null
          })
          .eq("id", editingPlan.id);

        if (error) throw error;
        toast.success("Plano atualizado");
      } else {
        const { error } = await supabase
          .from("therapeutic_plans")
          .insert({
            professional_id: professionalId,
            patient_code: formData.patient_code,
            general_objectives: formData.general_objectives || null,
            strategies: formData.strategies || null
          });

        if (error) throw error;
        toast.success("Plano salvo");
      }

      resetForm();
      fetchProfessionalAndPlans();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar plano");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (plan: TherapeuticPlanData) => {
    setEditingPlan(plan);
    setFormData({
      patient_code: plan.patient_code,
      general_objectives: plan.general_objectives || "",
      strategies: plan.strategies || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("therapeutic_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Plano excluído");
      setPlans(plans.filter(p => p.id !== id));
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir plano");
    }
  };

  const resetForm = () => {
    setFormData({
      patient_code: "",
      general_objectives: "",
      strategies: ""
    });
    setEditingPlan(null);
    setIsDialogOpen(false);
  };

  const filteredPlans = plans.filter(plan => 
    plan.patient_code.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-xl font-bold text-gray-900">Plano Terapêutico</h1>
            <p className="text-sm text-gray-500">Objetivos e estratégias</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPlan ? "Editar" : "Novo"} Plano Terapêutico</DialogTitle>
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
                  <Label htmlFor="general_objectives">Objetivos Terapêuticos Gerais</Label>
                  <Textarea
                    id="general_objectives"
                    placeholder="Quais são os objetivos gerais do processo terapêutico?"
                    value={formData.general_objectives}
                    onChange={(e) => setFormData({ ...formData, general_objectives: e.target.value })}
                    className="mt-1.5 min-h-[100px]"
                  />
                </div>
                <div>
                  <Label htmlFor="strategies">Estratégias Pensadas</Label>
                  <Textarea
                    id="strategies"
                    placeholder="Quais abordagens e técnicas você planeja utilizar?"
                    value={formData.strategies}
                    onChange={(e) => setFormData({ ...formData, strategies: e.target.value })}
                    className="mt-1.5 min-h-[100px]"
                  />
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Salvando..." : editingPlan ? "Atualizar" : "Salvar"}
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
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum plano encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Clique no + para criar um novo plano</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          {plan.patient_code}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {format(new Date(plan.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {plan.general_objectives && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            <span className="font-medium">Objetivos:</span> {plan.general_objectives}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-primary"
                        onClick={() => handleEdit(plan)}
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
                            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(plan.id)}>
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

export default TherapeuticPlan;
