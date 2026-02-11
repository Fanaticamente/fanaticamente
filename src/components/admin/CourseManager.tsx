import { useState, useRef } from "react";
import { 
  Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, Upload, 
  Eye, EyeOff, Lock, Unlock, GripVertical, BookOpen, Video, FileText, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  useAllCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useCourseModules,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useModuleLessons,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useLessonActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  type Course,
  type CourseModule,
  type CourseLesson,
  type LessonActivity,
} from "@/hooks/useCourses";

const categories = ["Saúde Mental", "Resiliência", "Autoconhecimento", "Bem-estar", "Relacionamentos", "Finanças", "Geral"];

const CourseManager = () => {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [editingModule, setEditingModule] = useState<Partial<CourseModule> | null>(null);
  const [editingLesson, setEditingLesson] = useState<Partial<CourseLesson> | null>(null);
  const [editingActivity, setEditingActivity] = useState<Partial<LessonActivity> | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const { data: courses, isLoading } = useAllCourses();
  const { data: modules } = useCourseModules(selectedCourseId || undefined);
  const { data: lessons } = useModuleLessons(selectedModuleId || undefined);
  const { data: activities } = useLessonActivities(selectedLessonId || undefined);

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from("course-assets").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("course-assets").getPublicUrl(path);
      return urlData.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!editingCourse?.title) {
      toast.error("Título é obrigatório");
      return;
    }
    try {
      if (editingCourse.id) {
        await updateCourse.mutateAsync(editingCourse as Course & { id: string });
      } else {
        await createCourse.mutateAsync(editingCourse);
      }
      setShowCourseDialog(false);
      setEditingCourse(null);
    } catch (err: any) {
      console.error("Erro ao salvar curso:", err);
      toast.error(err?.message || "Erro ao salvar curso");
    }
  };

  const handleSaveModule = async () => {
    if (!editingModule?.title) {
      toast.error("Título do módulo é obrigatório");
      return;
    }
    if (!selectedCourseId) {
      toast.error("Nenhum curso selecionado");
      return;
    }
    try {
      const payload = { ...editingModule, course_id: selectedCourseId };
      if (editingModule.id) {
        await updateModule.mutateAsync(payload as CourseModule & { id: string });
      } else {
        await createModule.mutateAsync(payload);
      }
      setShowModuleDialog(false);
      setEditingModule(null);
    } catch (err: any) {
      console.error("Erro ao salvar módulo:", err);
      toast.error(err?.message || "Erro ao salvar módulo");
    }
  };

  const handleSaveLesson = async () => {
    if (!editingLesson?.title) {
      toast.error("Título da aula é obrigatório");
      return;
    }
    if (!selectedModuleId) {
      toast.error("Nenhum módulo selecionado");
      return;
    }
    try {
      const payload = { ...editingLesson, module_id: selectedModuleId };
      if (editingLesson.id) {
        await updateLesson.mutateAsync(payload as CourseLesson & { id: string });
      } else {
        await createLesson.mutateAsync(payload);
      }
      setShowLessonDialog(false);
      setEditingLesson(null);
    } catch (err: any) {
      console.error("Erro ao salvar aula:", err);
      toast.error(err?.message || "Erro ao salvar aula");
    }
  };

  const handleSaveActivity = async () => {
    if (!editingActivity?.title) {
      toast.error("Título da atividade é obrigatório");
      return;
    }
    if (!selectedLessonId) {
      toast.error("Nenhuma aula selecionada");
      return;
    }
    try {
      const payload = { ...editingActivity, lesson_id: selectedLessonId };
      if (editingActivity.id) {
        await updateActivity.mutateAsync(payload as LessonActivity & { id: string });
      } else {
        await createActivity.mutateAsync(payload);
      }
      setShowActivityDialog(false);
      setEditingActivity(null);
    } catch (err: any) {
      console.error("Erro ao salvar atividade:", err);
      toast.error(err?.message || "Erro ao salvar atividade");
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, "videos");
      setEditingLesson(prev => prev ? { ...prev, video_url: url } : null);
      toast.success("Vídeo enviado!");
    } catch {
      toast.error("Erro ao enviar vídeo");
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "course" | "lesson") => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, "thumbnails");
      if (target === "course") {
        setEditingCourse(prev => prev ? { ...prev, thumbnail_url: url } : null);
      } else {
        setEditingLesson(prev => prev ? { ...prev, thumbnail_url: url } : null);
      }
      toast.success("Imagem enviada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    }
  };

  const selectedCourse = courses?.find(c => c.id === selectedCourseId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course List / Detail View */}
      {!selectedCourseId ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-card-foreground">Cursos</h2>
              <p className="text-sm text-muted-foreground">{courses?.length || 0} cursos cadastrados</p>
            </div>
            <Button onClick={() => { setEditingCourse({}); setShowCourseDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Novo Curso
            </Button>
          </div>

          {/* Course Cards */}
          <div className="grid gap-4">
            {courses?.map(course => (
              <div
                key={course.id}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setSelectedCourseId(course.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-foreground font-medium truncate">{course.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{course.category}</span>
                      {course.is_premium ? (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Premium</span>
                      ) : (
                        <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">Gratuito</span>
                      )}
                      {course.is_published ? (
                        <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Publicado
                        </span>
                      ) : (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Rascunho
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingCourse(course); setShowCourseDialog(true); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Remover curso?")) deleteCourse.mutate(course.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!courses || courses.length === 0) && (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum curso cadastrado</p>
                <p className="text-xs mt-1">Crie seu primeiro curso clicando em "Novo Curso"</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Course Detail - Modules & Lessons */}
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedCourseId(null); setSelectedModuleId(null); setSelectedLessonId(null); }}>
              <ChevronDown className="w-4 h-4 rotate-90" /> Voltar
            </Button>
            <div>
              <h2 className="font-display text-xl text-card-foreground">{selectedCourse?.title}</h2>
              <p className="text-sm text-muted-foreground">Gerenciar módulos e aulas</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditingCourse(selectedCourse || {}); setShowCourseDialog(true); }}>
                <Edit2 className="w-4 h-4 mr-1" /> Editar Curso
              </Button>
              <Button size="sm" onClick={() => { setEditingModule({}); setShowModuleDialog(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Novo Módulo
              </Button>
            </div>
          </div>

          {/* Modules */}
          <div className="space-y-3">
            {modules?.map((mod, idx) => {
              const isSelected = selectedModuleId === mod.id;
              return (
                <div key={mod.id} className="border border-border rounded-xl overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => { setSelectedModuleId(isSelected ? null : mod.id); setSelectedLessonId(null); }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-foreground font-medium">{mod.title}</h3>
                      {mod.description && <p className="text-xs text-muted-foreground">{mod.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingModule(mod); setShowModuleDialog(true); }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Remover módulo e todas as aulas?")) deleteModule.mutate(mod.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
                  </div>

                  {/* Lessons inside module */}
                  {isSelected && (
                    <div className="border-t border-border bg-muted/20">
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-medium">Aulas do módulo</span>
                        <Button size="sm" variant="outline" onClick={() => { setEditingLesson({}); setShowLessonDialog(true); }}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> Aula
                        </Button>
                      </div>
                      {lessons?.map((lesson, lIdx) => (
                        <div key={lesson.id} className="border-t border-border">
                          <div
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 ${selectedLessonId === lesson.id ? "bg-primary/5" : ""}`}
                            onClick={() => setSelectedLessonId(selectedLessonId === lesson.id ? null : lesson.id)}
                          >
                            <Video className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm text-foreground truncate">{lesson.title}</h4>
                              <div className="flex gap-2 mt-0.5">
                                {lesson.duration && <span className="text-xs text-muted-foreground">{lesson.duration}</span>}
                                {lesson.is_free && <span className="text-xs text-green-600">Grátis</span>}
                                {lesson.video_url ? (
                                  <span className="text-xs text-primary">✓ Vídeo</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Sem vídeo</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingLesson(lesson); setShowLessonDialog(true); }}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Remover aula?")) deleteLesson.mutate(lesson.id); }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Activities */}
                          {selectedLessonId === lesson.id && (
                            <div className="bg-muted/30 border-t border-border px-6 py-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5" /> Atividades Complementares
                                </span>
                                <Button size="sm" variant="outline" onClick={() => { setEditingActivity({}); setShowActivityDialog(true); }}>
                                  <Plus className="w-3.5 h-3.5 mr-1" /> Atividade
                                </Button>
                              </div>
                              {activities?.map(act => (
                                <div key={act.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                                  <span className={`text-xs px-2 py-0.5 rounded ${act.is_required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                    {act.is_required ? "Obrigatória" : "Opcional"}
                                  </span>
                                  <span className="text-sm text-foreground flex-1">{act.title}</span>
                                  <Button size="sm" variant="ghost" onClick={() => { setEditingActivity(act); setShowActivityDialog(true); }}>
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Remover?")) deleteActivity.mutate(act.id); }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ))}
                              {(!activities || activities.length === 0) && (
                                <p className="text-xs text-muted-foreground py-2">Nenhuma atividade</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {(!lessons || lessons.length === 0) && (
                        <p className="text-xs text-muted-foreground text-center py-4">Nenhuma aula neste módulo</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {(!modules || modules.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum módulo. Crie o primeiro módulo do curso.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse?.id ? "Editar Curso" : "Novo Curso"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={editingCourse?.title || ""} onChange={(e) => setEditingCourse(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={editingCourse?.description || ""} onChange={(e) => setEditingCourse(prev => ({ ...prev, description: e.target.value }))} rows={3} />
            </div>
            <div>
              <Label>Instrutor</Label>
              <Input value={editingCourse?.instructor || ""} onChange={(e) => setEditingCourse(prev => ({ ...prev, instructor: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={editingCourse?.category || "Geral"} onValueChange={(v) => setEditingCourse(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duração Total</Label>
                <Input placeholder="ex: 2h 30min" value={editingCourse?.total_duration || ""} onChange={(e) => setEditingCourse(prev => ({ ...prev, total_duration: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Thumbnail</Label>
              <div className="flex gap-2 items-center">
                {editingCourse?.thumbnail_url && (
                  <img src={editingCourse.thumbnail_url} alt="" className="w-20 h-14 rounded-lg object-cover" />
                )}
                <input type="file" accept="image/*" ref={thumbRef} className="hidden" onChange={(e) => handleThumbnailUpload(e, "course")} />
                <Button variant="outline" size="sm" onClick={() => thumbRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                  Upload
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={editingCourse?.is_premium || false} onCheckedChange={(v) => setEditingCourse(prev => ({ ...prev, is_premium: v }))} />
                <Label>Conteúdo Premium</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingCourse?.is_published || false} onCheckedChange={(v) => setEditingCourse(prev => ({ ...prev, is_published: v }))} />
                <Label>Publicado</Label>
              </div>
            </div>
            {editingCourse?.is_premium && (
              <div>
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" value={editingCourse?.price || ""} onChange={(e) => setEditingCourse(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCourse} disabled={createCourse.isPending || updateCourse.isPending}>
              {(createCourse.isPending || updateCourse.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule?.id ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={editingModule?.title || ""} onChange={(e) => setEditingModule(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={editingModule?.description || ""} onChange={(e) => setEditingModule(prev => ({ ...prev, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={editingModule?.order_index ?? 0} onChange={(e) => setEditingModule(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveModule} disabled={createModule.isPending || updateModule.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson?.id ? "Editar Aula" : "Nova Aula"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={editingLesson?.title || ""} onChange={(e) => setEditingLesson(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={editingLesson?.description || ""} onChange={(e) => setEditingLesson(prev => ({ ...prev, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duração</Label>
                <Input placeholder="ex: 24min" value={editingLesson?.duration || ""} onChange={(e) => setEditingLesson(prev => ({ ...prev, duration: e.target.value }))} />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input type="number" value={editingLesson?.order_index ?? 0} onChange={(e) => setEditingLesson(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <Label>Vídeo</Label>
              <div className="flex gap-2 items-center">
                {editingLesson?.video_url && (
                  <span className="text-xs text-primary truncate max-w-48">✓ Vídeo enviado</span>
                )}
                <input type="file" accept="video/*" ref={videoRef} className="hidden" onChange={handleVideoUpload} />
                <Button variant="outline" size="sm" onClick={() => videoRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                  Upload Vídeo
                </Button>
              </div>
            </div>
            <div>
              <Label>Thumbnail da Aula</Label>
              <div className="flex gap-2 items-center">
                {editingLesson?.thumbnail_url && (
                  <img src={editingLesson.thumbnail_url} alt="" className="w-16 h-10 rounded object-cover" />
                )}
                <input type="file" accept="image/*" className="hidden" id="lesson-thumb" onChange={(e) => handleThumbnailUpload(e, "lesson")} />
                <Button variant="outline" size="sm" onClick={() => document.getElementById("lesson-thumb")?.click()} disabled={uploading}>
                  <Upload className="w-4 h-4 mr-1" /> Upload
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editingLesson?.is_free || false} onCheckedChange={(v) => setEditingLesson(prev => ({ ...prev, is_free: v }))} />
              <Label>Aula gratuita (acessível sem compra)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLessonDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveLesson} disabled={createLesson.isPending || updateLesson.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingActivity?.id ? "Editar Atividade" : "Nova Atividade"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={editingActivity?.title || ""} onChange={(e) => setEditingActivity(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={editingActivity?.description || ""} onChange={(e) => setEditingActivity(prev => ({ ...prev, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={editingActivity?.activity_type || "text"} onValueChange={(v) => setEditingActivity(prev => ({ ...prev, activity_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto/Reflexão</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="exercise">Exercício</SelectItem>
                    <SelectItem value="download">Material p/ Download</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ordem</Label>
                <Input type="number" value={editingActivity?.order_index ?? 0} onChange={(e) => setEditingActivity(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editingActivity?.is_required ?? true} onCheckedChange={(v) => setEditingActivity(prev => ({ ...prev, is_required: v }))} />
              <Label>Atividade obrigatória</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivityDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveActivity} disabled={createActivity.isPending || updateActivity.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseManager;
