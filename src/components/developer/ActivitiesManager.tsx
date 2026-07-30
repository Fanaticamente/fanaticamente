import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useQuizCategories,
  useQuizTopics,
  useQuizQuestions,
  useSeedQuizContent,
  useInvalidateQuizContent,
  type QuizCategory,
  type QuizTopic,
  type QuizQuestion,
  type QuizOption,
} from "@/hooks/useQuizContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Pencil,
  ChevronRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const emptyOptions = (): QuizOption[] => [
  { id: "a", text: "", isCorrect: false, feedback: "" },
  { id: "b", text: "", isCorrect: false, feedback: "" },
  { id: "c", text: "", isCorrect: true, feedback: "" },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const ActivitiesManager = () => {
  const { data: categories, isLoading } = useQuizCategories();
  const { data: topics } = useQuizTopics();
  const { data: questions } = useQuizQuestions();
  const invalidate = useInvalidateQuizContent();
  const seed = useSeedQuizContent();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);

  // Import the original Resenha Fanática content on first open.
  useEffect(() => {
    if (!isLoading && categories && categories.length === 0 && !seed.isPending) {
      seed.mutate(undefined, {
        onSuccess: (didSeed) => {
          if (didSeed) toast.success("Conteúdo original da Resenha Fanática importado");
        },
        onError: () => toast.error("Não foi possível importar o conteúdo inicial"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, categories]);

  const category = categories?.find((c) => c.id === categoryId) || null;
  const topic = topics?.find((t) => t.id === topicId) || null;
  const categoryTopics = (topics ?? []).filter((t) => t.category_id === categoryId);
  const listQuestions = (questions ?? []).filter((q) =>
    category?.has_topics ? q.topic_id === topicId : q.category_id === categoryId
  );

  /* ------------------------------ Category CRUD ----------------------------- */
  const [catDialog, setCatDialog] = useState<QuizCategory | "new" | null>(null);
  const [catForm, setCatForm] = useState({ label: "", description: "", image_url: "", has_topics: true, is_visible: true });

  const openCatDialog = (c: QuizCategory | "new") => {
    setCatDialog(c);
    setCatForm(
      c === "new"
        ? { label: "", description: "", image_url: "", has_topics: true, is_visible: true }
        : {
            label: c.label,
            description: c.description ?? "",
            image_url: c.image_url ?? "",
            has_topics: c.has_topics,
            is_visible: c.is_visible,
          }
    );
  };

  const saveCategory = async () => {
    if (!catForm.label.trim()) return toast.error("Informe o nome do menu");
    const payload = {
      label: catForm.label.trim(),
      description: catForm.description || null,
      image_url: catForm.image_url || null,
      has_topics: catForm.has_topics,
      is_visible: catForm.is_visible,
    };
    const error =
      catDialog === "new"
        ? (
            await supabase.from("quiz_categories").insert({
              ...payload,
              key: slugify(catForm.label) || `menu-${Date.now()}`,
              order_index: categories?.length ?? 0,
            })
          ).error
        : (await supabase.from("quiz_categories").update(payload).eq("id", (catDialog as QuizCategory).id)).error;

    if (error) return toast.error("Erro ao salvar menu");
    toast.success("Menu salvo");
    setCatDialog(null);
    invalidate();
  };

  const deleteCategory = async (c: QuizCategory) => {
    if (!confirm(`Excluir o menu "${c.label}" e todo o seu conteúdo?`)) return;
    const { error } = await supabase.from("quiz_categories").delete().eq("id", c.id);
    if (error) return toast.error("Erro ao excluir menu");
    toast.success("Menu excluído");
    if (categoryId === c.id) setCategoryId(null);
    invalidate();
  };

  /* ------------------------------- Topic CRUD ------------------------------- */
  const [topicDialog, setTopicDialog] = useState<QuizTopic | "new" | null>(null);
  const [topicForm, setTopicForm] = useState({ label: "", description: "", is_visible: true });

  const openTopicDialog = (t: QuizTopic | "new") => {
    setTopicDialog(t);
    setTopicForm(
      t === "new"
        ? { label: "", description: "", is_visible: true }
        : { label: t.label, description: t.description ?? "", is_visible: t.is_visible }
    );
  };

  const saveTopic = async () => {
    if (!categoryId) return;
    if (!topicForm.label.trim()) return toast.error("Informe o nome do tópico");
    const payload = {
      label: topicForm.label.trim(),
      description: topicForm.description || null,
      is_visible: topicForm.is_visible,
    };
    const error =
      topicDialog === "new"
        ? (
            await supabase.from("quiz_topics").insert({
              ...payload,
              category_id: categoryId,
              key: slugify(topicForm.label) || `topico-${Date.now()}`,
              order_index: categoryTopics.length,
            })
          ).error
        : (await supabase.from("quiz_topics").update(payload).eq("id", (topicDialog as QuizTopic).id)).error;

    if (error) return toast.error("Erro ao salvar tópico");
    toast.success("Tópico salvo");
    setTopicDialog(null);
    invalidate();
  };

  const deleteTopic = async (t: QuizTopic) => {
    if (!confirm(`Excluir o tópico "${t.label}" e suas perguntas?`)) return;
    const { error } = await supabase.from("quiz_topics").delete().eq("id", t.id);
    if (error) return toast.error("Erro ao excluir tópico");
    toast.success("Tópico excluído");
    if (topicId === t.id) setTopicId(null);
    invalidate();
  };

  /* ------------------------------ Question CRUD ----------------------------- */
  const [questionDialog, setQuestionDialog] = useState<QuizQuestion | "new" | null>(null);
  const [scenario, setScenario] = useState("");
  const [options, setOptions] = useState<QuizOption[]>(emptyOptions());

  const openQuestionDialog = (q: QuizQuestion | "new") => {
    setQuestionDialog(q);
    setScenario(q === "new" ? "" : q.scenario);
    setOptions(q === "new" ? emptyOptions() : q.options.map((o) => ({ ...o })));
  };

  const saveQuestion = async () => {
    if (!categoryId) return;
    if (!scenario.trim()) return toast.error("Descreva o cenário da pergunta");
    if (options.some((o) => !o.text.trim())) return toast.error("Preencha o texto de todas as alternativas");
    if (!options.some((o) => o.isCorrect)) return toast.error("Marque a alternativa construtiva (correta)");

    const payload = { scenario: scenario.trim(), options: options as unknown as never };
    const error =
      questionDialog === "new"
        ? (
            await supabase.from("quiz_questions").insert({
              ...payload,
              category_id: categoryId,
              topic_id: category?.has_topics ? topicId : null,
              order_index: listQuestions.length,
            })
          ).error
        : (await supabase.from("quiz_questions").update(payload).eq("id", (questionDialog as QuizQuestion).id)).error;

    if (error) return toast.error("Erro ao salvar pergunta");
    toast.success("Pergunta salva");
    setQuestionDialog(null);
    invalidate();
  };

  const deleteQuestion = async (q: QuizQuestion) => {
    if (!confirm("Remover esta pergunta?")) return;
    const { error } = await supabase.from("quiz_questions").delete().eq("id", q.id);
    if (error) return toast.error("Erro ao remover pergunta");
    toast.success("Pergunta removida");
    invalidate();
  };

  const moveQuestion = async (index: number, direction: -1 | 1) => {
    const target = listQuestions[index + direction];
    const current = listQuestions[index];
    if (!target || !current) return;
    await supabase.from("quiz_questions").update({ order_index: target.order_index }).eq("id", current.id);
    await supabase.from("quiz_questions").update({ order_index: current.order_index }).eq("id", target.id);
    invalidate();
  };

  const updateOption = (index: number, patch: Partial<QuizOption>) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));

  const setCorrect = (index: number) =>
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));

  if (isLoading || seed.isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  /* --------------------------------- Render -------------------------------- */
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => { setCategoryId(null); setTopicId(null); }} className="hover:text-foreground">
          Atividades
        </button>
        {category && (
          <>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => setTopicId(null)} className="hover:text-foreground">{category.label}</button>
          </>
        )}
        {topic && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{topic.label}</span>
          </>
        )}
      </div>

      {/* Level 1 — activity menus */}
      {!category && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-card-foreground">Menus de atividades</h2>
              <p className="text-sm text-muted-foreground">Menus exibidos na página Atividades do app (Resenha Fanática).</p>
            </div>
            <Button onClick={() => openCatDialog("new")} className="gap-2">
              <Plus className="w-4 h-4" /> Novo menu
            </Button>
          </div>

          <div className="grid gap-3">
            {categories?.map((c) => {
              const total = (questions ?? []).filter((q) => q.category_id === c.id).length;
              const topicCount = (topics ?? []).filter((t) => t.category_id === c.id).length;
              return (
                <div key={c.id} className="border border-border rounded-xl p-4 bg-card flex items-center gap-4">
                  <button className="flex-1 text-left" onClick={() => { setCategoryId(c.id); setTopicId(null); }}>
                    <p className="font-medium text-card-foreground">
                      {c.label} {!c.is_visible && <span className="text-xs text-muted-foreground">(oculto)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.description || "Sem descrição"} · {c.has_topics ? `${topicCount} tópicos · ` : ""}{total} perguntas
                    </p>
                  </button>
                  <Button variant="outline" size="sm" onClick={() => openCatDialog(c)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteCategory(c)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Level 2 — topics */}
      {category && category.has_topics && !topic && (
        <div className="space-y-4">
          <Button variant="ghost" className="gap-2" onClick={() => setCategoryId(null)}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-card-foreground">Tópicos de {category.label}</h2>
              <p className="text-sm text-muted-foreground">Submenus exibidos antes do quiz.</p>
            </div>
            <Button onClick={() => openTopicDialog("new")} className="gap-2">
              <Plus className="w-4 h-4" /> Novo tópico
            </Button>
          </div>

          <div className="grid gap-3">
            {categoryTopics.map((t) => (
              <div key={t.id} className="border border-border rounded-xl p-4 bg-card flex items-center gap-4">
                <button className="flex-1 text-left" onClick={() => setTopicId(t.id)}>
                  <p className="font-medium text-card-foreground">
                    {t.label} {!t.is_visible && <span className="text-xs text-muted-foreground">(oculto)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.description || "Sem descrição"} · {(questions ?? []).filter((q) => q.topic_id === t.id).length} perguntas
                  </p>
                </button>
                <Button variant="outline" size="sm" onClick={() => openTopicDialog(t)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTopic(t)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
            {categoryTopics.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum tópico cadastrado ainda.</p>
            )}
          </div>
        </div>
      )}

      {/* Level 3 — questions */}
      {category && (!category.has_topics || topic) && (
        <div className="space-y-4">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => (category.has_topics ? setTopicId(null) : setCategoryId(null))}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-card-foreground">
                Perguntas · {topic ? topic.label : category.label}
              </h2>
              <p className="text-sm text-muted-foreground">{listQuestions.length} cenários cadastrados</p>
            </div>
            <Button onClick={() => openQuestionDialog("new")} className="gap-2">
              <Plus className="w-4 h-4" /> Nova pergunta
            </Button>
          </div>

          <div className="space-y-3">
            {listQuestions.map((q, index) => (
              <div key={q.id} className="border border-border rounded-xl p-4 bg-card">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-muted-foreground mt-1 w-6">{index + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-card-foreground">{q.scenario}</p>
                    <ul className="mt-2 space-y-1">
                      {q.options.map((o) => (
                        <li key={o.id} className="text-xs text-muted-foreground flex items-start gap-2">
                          {o.isCorrect ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          ) : (
                            <span className="w-3.5 shrink-0" />
                          )}
                          <span>
                            <strong className="uppercase">{o.id}.</strong> {o.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => moveQuestion(index, -1)}>
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === listQuestions.length - 1}
                      onClick={() => moveQuestion(index, 1)}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="outline" size="sm" onClick={() => openQuestionDialog(q)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteQuestion(q)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {listQuestions.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma pergunta cadastrada ainda.</p>
            )}
          </div>
        </div>
      )}

      {/* Category dialog */}
      <Dialog open={!!catDialog} onOpenChange={(o) => !o && setCatDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{catDialog === "new" ? "Novo menu de atividade" : "Editar menu"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={catForm.label} onChange={(e) => setCatForm({ ...catForm, label: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>URL da imagem do card (opcional)</Label>
              <Input value={catForm.image_url} onChange={(e) => setCatForm({ ...catForm, image_url: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Usa tópicos (submenus)</Label>
              <Switch checked={catForm.has_topics} onCheckedChange={(v) => setCatForm({ ...catForm, has_topics: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Visível no app</Label>
              <Switch checked={catForm.is_visible} onCheckedChange={(v) => setCatForm({ ...catForm, is_visible: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(null)}>Cancelar</Button>
            <Button onClick={saveCategory}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Topic dialog */}
      <Dialog open={!!topicDialog} onOpenChange={(o) => !o && setTopicDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{topicDialog === "new" ? "Novo tópico" : "Editar tópico"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={topicForm.label} onChange={(e) => setTopicForm({ ...topicForm, label: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Visível no app</Label>
              <Switch checked={topicForm.is_visible} onCheckedChange={(v) => setTopicForm({ ...topicForm, is_visible: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialog(null)}>Cancelar</Button>
            <Button onClick={saveTopic}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question dialog */}
      <Dialog open={!!questionDialog} onOpenChange={(o) => !o && setQuestionDialog(null)}>
        <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{questionDialog === "new" ? "Nova pergunta" : "Editar pergunta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cenário</Label>
              <Textarea value={scenario} onChange={(e) => setScenario(e.target.value)} rows={3} />
            </div>

            {options.map((o, i) => (
              <div key={o.id} className="border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="uppercase">Alternativa {o.id}</Label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Construtiva</span>
                    <Switch checked={o.isCorrect} onCheckedChange={() => setCorrect(i)} />
                    {options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  value={o.text}
                  placeholder="Texto da alternativa"
                  onChange={(e) => updateOption(i, { text: e.target.value })}
                />
                <Textarea
                  value={o.feedback}
                  placeholder="Devolutiva exibida ao escolher esta alternativa"
                  rows={2}
                  onChange={(e) => updateOption(i, { feedback: e.target.value })}
                />
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() =>
                setOptions([
                  ...options,
                  {
                    id: String.fromCharCode(97 + options.length),
                    text: "",
                    isCorrect: false,
                    feedback: "",
                  },
                ])
              }
            >
              <Plus className="w-4 h-4" /> Adicionar alternativa
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialog(null)}>Cancelar</Button>
            <Button onClick={saveQuestion}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivitiesManager;