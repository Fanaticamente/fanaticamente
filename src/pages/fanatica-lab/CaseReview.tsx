import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, RefreshCw, Clock, Search, Trash2, Edit, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProfessionalBottomNav from "@/components/layout/ProfessionalBottomNav";

interface CaseReviewData {
  id: string;
  patient_code: string;
  whats_working: string | null;
  difficulties: string | null;
  feelings: string | null;
  needs_supervision: boolean;
  supervision_notes: string | null;
  created_at: string;
  updated_at: string;
}

const CaseReview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<CaseReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<CaseReviewData | null>(null);
  const [formData, setFormData] = useState({
    patient_code: "",
    whats_working: "",
    difficulties: "",
    feelings: "",
    needs_supervision: false,
    supervision_notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  // Force light theme
  useLayoutEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  useEffect(() => {
    fetchProfessionalAndReviews();
  }, [user]);

  const fetchProfessionalAndReviews = async () => {
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
          .from("case_reviews")
          .select("*")
          .eq("professional_id", professional.id)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar revisões:", error);
      toast.error("Erro ao carregar revisões de caso");
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
      if (editingReview) {
        const { error } = await supabase
          .from("case_reviews")
          .update({
            patient_code: formData.patient_code,
            whats_working: formData.whats_working || null,
            difficulties: formData.difficulties || null,
            feelings: formData.feelings || null,
            needs_supervision: formData.needs_supervision,
            supervision_notes: formData.supervision_notes || null
          })
          .eq("id", editingReview.id);

        if (error) throw error;
        toast.success("Revisão atualizada");
      } else {
        const { error } = await supabase
          .from("case_reviews")
          .insert({
            professional_id: professionalId,
            patient_code: formData.patient_code,
            whats_working: formData.whats_working || null,
            difficulties: formData.difficulties || null,
            feelings: formData.feelings || null,
            needs_supervision: formData.needs_supervision,
            supervision_notes: formData.supervision_notes || null
          });

        if (error) throw error;
        toast.success("Revisão salva");
      }

      resetForm();
      fetchProfessionalAndReviews();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar revisão");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (review: CaseReviewData) => {
    setEditingReview(review);
    setFormData({
      patient_code: review.patient_code,
      whats_working: review.whats_working || "",
      difficulties: review.difficulties || "",
      feelings: review.feelings || "",
      needs_supervision: review.needs_supervision,
      supervision_notes: review.supervision_notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("case_reviews")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Revisão excluída");
      setReviews(reviews.filter(r => r.id !== id));
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir revisão");
    }
  };

  const resetForm = () => {
    setFormData({
      patient_code: "",
      whats_working: "",
      difficulties: "",
      feelings: "",
      needs_supervision: false,
      supervision_notes: ""
    });
    setEditingReview(null);
    setIsDialogOpen(false);
  };

  const filteredReviews = reviews.filter(review => 
    review.patient_code.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-xl font-bold text-gray-900">Revisão de Caso</h1>
            <p className="text-sm text-gray-500">Auto-supervisão reflexiva</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingReview ? "Editar" : "Nova"} Revisão de Caso</DialogTitle>
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
                  <Label htmlFor="whats_working">O que está funcionando neste processo?</Label>
                  <Textarea
                    id="whats_working"
                    placeholder="Reflita sobre os aspectos positivos..."
                    value={formData.whats_working}
                    onChange={(e) => setFormData({ ...formData, whats_working: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulties">Onde estou encontrando dificuldades?</Label>
                  <Textarea
                    id="difficulties"
                    placeholder="Quais desafios você enfrenta?"
                    value={formData.difficulties}
                    onChange={(e) => setFormData({ ...formData, difficulties: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="feelings">Que sentimentos este caso desperta em mim?</Label>
                  <Textarea
                    id="feelings"
                    placeholder="Reflita sobre suas reações emocionais..."
                    value={formData.feelings}
                    onChange={(e) => setFormData({ ...formData, feelings: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    <Label htmlFor="needs_supervision" className="text-sm text-primary">
                      Preciso discutir em supervisão?
                    </Label>
                  </div>
                  <Switch
                    id="needs_supervision"
                    checked={formData.needs_supervision}
                    onCheckedChange={(checked) => setFormData({ ...formData, needs_supervision: checked })}
                  />
                </div>
                {formData.needs_supervision && (
                  <div>
                    <Label htmlFor="supervision_notes">Notas para supervisão</Label>
                    <Textarea
                      id="supervision_notes"
                      placeholder="O que gostaria de discutir?"
                      value={formData.supervision_notes}
                      onChange={(e) => setFormData({ ...formData, supervision_notes: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                )}
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Salvando..." : editingReview ? "Atualizar" : "Salvar"}
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
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma revisão encontrada</p>
            <p className="text-sm text-gray-400 mt-1">Clique no + para criar uma nova revisão</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          {review.patient_code}
                        </span>
                        {review.needs_supervision && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Supervisão
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {format(new Date(review.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {review.difficulties && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            <span className="font-medium">Dificuldades:</span> {review.difficulties}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-primary"
                        onClick={() => handleEdit(review)}
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
                            <AlertDialogTitle>Excluir revisão?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(review.id)}>
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

export default CaseReview;
