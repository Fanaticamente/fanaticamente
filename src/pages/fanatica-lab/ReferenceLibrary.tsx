import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, BookOpen, Clock, Search, Trash2, Edit, ExternalLink, Link as LinkIcon } from "lucide-react";
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

interface ReferenceData {
  id: string;
  title: string;
  link: string | null;
  notes: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

const ReferenceLibrary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [references, setReferences] = useState<ReferenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRef, setEditingRef] = useState<ReferenceData | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    notes: "",
    category: ""
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
    fetchProfessionalAndReferences();
  }, [user]);

  const fetchProfessionalAndReferences = async () => {
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
          .from("reference_library")
          .select("*")
          .eq("professional_id", professional.id)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        setReferences(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar referências:", error);
      toast.error("Erro ao carregar biblioteca");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!professionalId || !formData.title) {
      toast.error("Informe o título da referência");
      return;
    }

    setSaving(true);
    try {
      if (editingRef) {
        const { error } = await supabase
          .from("reference_library")
          .update({
            title: formData.title,
            link: formData.link || null,
            notes: formData.notes || null,
            category: formData.category || null
          })
          .eq("id", editingRef.id);

        if (error) throw error;
        toast.success("Referência atualizada");
      } else {
        const { error } = await supabase
          .from("reference_library")
          .insert({
            professional_id: professionalId,
            title: formData.title,
            link: formData.link || null,
            notes: formData.notes || null,
            category: formData.category || null
          });

        if (error) throw error;
        toast.success("Referência salva");
      }

      resetForm();
      fetchProfessionalAndReferences();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar referência");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ref: ReferenceData) => {
    setEditingRef(ref);
    setFormData({
      title: ref.title,
      link: ref.link || "",
      notes: ref.notes || "",
      category: ref.category || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reference_library")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Referência excluída");
      setReferences(references.filter(r => r.id !== id));
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir referência");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      link: "",
      notes: "",
      category: ""
    });
    setEditingRef(null);
    setIsDialogOpen(false);
  };

  const filteredReferences = references.filter(ref => 
    ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ref.category && ref.category.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <h1 className="text-xl font-bold text-gray-900">Biblioteca de Referências</h1>
            <p className="text-sm text-gray-500">Links, textos e ideias clínicas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRef ? "Editar" : "Nova"} Referência</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Nome do livro, artigo ou ideia"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    placeholder="Ex: TCC, Psicanálise, Gestalt..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="link">Link (opcional)</Label>
                  <Input
                    id="link"
                    placeholder="https://..."
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Observações Pessoais</Label>
                  <Textarea
                    id="notes"
                    placeholder="Suas anotações sobre esta referência..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1.5 min-h-[100px]"
                  />
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Salvando..." : editingRef ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por título ou categoria..."
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
        ) : filteredReferences.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma referência encontrada</p>
            <p className="text-sm text-gray-400 mt-1">Clique no + para adicionar uma referência</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReferences.map((ref) => (
              <Card key={ref.id} className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {ref.category && (
                          <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full">
                            {ref.category}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {format(new Date(ref.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{ref.title}</h3>
                      {ref.link && (
                        <a 
                          href={ref.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary flex items-center gap-1 hover:underline mb-1"
                        >
                          <LinkIcon className="w-3 h-3" />
                          Abrir link
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {ref.notes && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{ref.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-primary"
                        onClick={() => handleEdit(ref)}
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
                            <AlertDialogTitle>Excluir referência?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(ref.id)}>
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

export default ReferenceLibrary;
