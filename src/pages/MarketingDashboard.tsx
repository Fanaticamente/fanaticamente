import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useHealthNewsAdmin, type HealthNewsItem } from "@/hooks/useHealthNews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import RichEditor from "@/components/marketing/RichEditor";
import { toast } from "sonner";
import {
  Loader2, Plus, Pencil, Trash2, Star, Eye, EyeOff, ArrowLeft,
  LogOut, Megaphone, Image as ImageIcon, Calendar, LayoutTemplate,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppModules } from "@/hooks/useAppModules";
import ModuleEditor from "@/components/studio/ModuleEditor";

type Mode = "list" | "edit";

const empty: Partial<HealthNewsItem> = {
  title: "",
  subtitle: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  image_caption: "",
  image_credits: "",
  category: "Saúde e Bem-estar",
  author_name: "",
  is_featured_home: false,
  is_published: false,
};

const MarketingDashboard = () => {
  const { user, hasRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<Partial<HealthNewsItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [section, setSection] = useState<"news" | "carousel">("news");

  const { data: items, isLoading } = useHealthNewsAdmin();
  const { data: modules } = useAppModules("home");
  const heroModule = useMemo(
    () => modules?.find((m) => m.module_id === "hero_carousel") ?? null,
    [modules]
  );

  const allowed = useMemo(
    () => hasRole("marketing") || hasRole("admin") || hasRole("developer"),
    [hasRole]
  );

  useEffect(() => {
    if (!loading && (!user || !allowed)) navigate("/admin-access");
  }, [user, allowed, loading, navigate]);

  const handleNew = () => {
    setEditing({ ...empty, author_name: user?.email?.split("@")[0] || "" });
    setMode("edit");
  };
  const handleEdit = (i: HealthNewsItem) => { setEditing(i); setMode("edit"); };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta notícia? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("health_news").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Notícia excluída");
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { error } = await supabase.storage.from("health-news").upload(path, file, {
        contentType: file.type || "image/jpeg",
      });
      if (error) throw error;
      const { data } = supabase.storage.from("health-news").getPublicUrl(path);
      setEditing((p) => ({ ...(p || {}), cover_image_url: data.publicUrl }));
      toast.success("Imagem de capa enviada");
    } catch (e: any) {
      toast.error(e.message || "Erro no upload");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async (publishNow: boolean) => {
    if (!editing) return;
    if (!editing.title?.trim()) return toast.error("Adicione um título");
    if (!editing.content || editing.content === "<p></p>") return toast.error("Adicione conteúdo");

    setSaving(true);
    try {
      const payload: any = {
        title: editing.title,
        subtitle: editing.subtitle || null,
        excerpt: editing.excerpt || null,
        content: editing.content,
        cover_image_url: editing.cover_image_url || null,
        image_caption: editing.image_caption || null,
        image_credits: editing.image_credits || null,
        category: editing.category || "Saúde e Bem-estar",
        author_name: editing.author_name || null,
        author_id: user?.id || null,
        is_featured_home: !!editing.is_featured_home,
        is_published: publishNow ? true : !!editing.is_published,
        published_at:
          publishNow || editing.is_published
            ? editing.published_at || new Date().toISOString()
            : null,
      };

      if (editing.id) {
        const { error } = await supabase.from("health_news").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("health_news").insert(payload);
        if (error) throw error;
      }
      toast.success(publishNow ? "Publicado!" : "Salvo");
      setMode("list");
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h1 className="font-display text-lg text-gray-900">Marketing & Conteúdo</h1>
            <p className="text-xs text-gray-500">Setor Saúde — gestão de matérias</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/setor-saude")}>
            <Eye className="w-4 h-4 mr-1" /> Ver no app
          </Button>
          <Button variant="destructive" size="sm" onClick={async () => { await signOut(); navigate("/admin-access"); }}>
            <LogOut className="w-4 h-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={section} onValueChange={(v) => setSection(v as "news" | "carousel")} className="mb-6">
          <TabsList>
            <TabsTrigger value="news">
              <Megaphone className="w-4 h-4 mr-1" /> Matérias
            </TabsTrigger>
            <TabsTrigger value="carousel">
              <LayoutTemplate className="w-4 h-4 mr-1" /> Carrossel Principal
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {section === "carousel" ? (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Carrossel Principal da Home</h2>
                <p className="text-xs text-gray-500">
                  Banner rotativo no topo da página inicial. Recomendado: 750 × 960 px.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                <Eye className="w-4 h-4 mr-1" /> Ver na home
              </Button>
            </div>
            {!heroModule ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="dark bg-background text-foreground">
                <ModuleEditor
                  module={heroModule}
                  onClose={() => setSection("news")}
                />
              </div>
            )}
          </div>
        ) : mode === "list" ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Matérias</h2>
              <Button onClick={handleNew} className="bg-emerald-700 hover:bg-emerald-800">
                <Plus className="w-4 h-4 mr-1" /> Nova matéria
              </Button>
            </div>

            {isLoading ? (
              <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : !items || items.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma matéria ainda. Clique em "Nova matéria" para começar.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {items.map((it) => (
                  <div key={it.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-center">
                    {it.cover_image_url ? (
                      <img src={it.cover_image_url} alt="" className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          it.is_published ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {it.is_published ? "PUBLICADO" : "RASCUNHO"}
                        </span>
                        {it.is_featured_home && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center gap-1">
                            <Star className="w-3 h-3" /> DESTAQUE HOME
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{it.category}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 truncate">{it.title}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {it.published_at
                          ? new Date(it.published_at).toLocaleDateString("pt-BR")
                          : "Não publicado"}
                        {it.author_name && <> • por {it.author_name}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(it)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(it.id)} title="Excluir">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          editing && (
            <>
              <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
                <Button variant="ghost" onClick={() => { setMode("list"); setEditing(null); }}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" disabled={saving} onClick={() => handleSave(false)}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4 mr-1" />}
                    Salvar rascunho
                  </Button>
                  <Button disabled={saving} className="bg-emerald-700 hover:bg-emerald-800" onClick={() => handleSave(true)}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {editing.is_published ? "Atualizar e publicar" : "Publicar"}
                  </Button>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
                    <div>
                      <Label>Título</Label>
                      <Input
                        value={editing.title || ""}
                        onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                        placeholder="Como cuidar da saúde mental no dia do clássico"
                        className="text-lg font-bold"
                      />
                    </div>
                    <div>
                      <Label>Subtítulo (opcional)</Label>
                      <Input
                        value={editing.subtitle || ""}
                        onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Resumo (aparece nas listagens)</Label>
                      <Textarea
                        value={editing.excerpt || ""}
                        onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Conteúdo da matéria</Label>
                    <RichEditor
                      value={editing.content || ""}
                      onChange={(html) => setEditing({ ...editing, content: html })}
                      placeholder="Escreva sua matéria aqui..."
                    />
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
                    <h3 className="font-bold text-gray-900">Publicação</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Publicada</Label>
                        <p className="text-xs text-gray-500">Visível no app</p>
                      </div>
                      <Switch
                        checked={!!editing.is_published}
                        onCheckedChange={(v) => setEditing({ ...editing, is_published: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" /> Destaque na Home
                        </Label>
                        <p className="text-xs text-gray-500">Aparece no carrossel principal</p>
                      </div>
                      <Switch
                        checked={!!editing.is_featured_home}
                        onCheckedChange={(v) => setEditing({ ...editing, is_featured_home: v })}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
                    <h3 className="font-bold text-gray-900">Imagem de capa</h3>
                    {editing.cover_image_url ? (
                      <div className="relative">
                        <img src={editing.cover_image_url} alt="" className="w-full rounded-lg" />
                        <Button
                          variant="destructive" size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setEditing({ ...editing, cover_image_url: "" })}
                        >Remover</Button>
                      </div>
                    ) : (
                      <label className="block border-2 border-dashed border-gray-300 rounded-lg py-8 text-center cursor-pointer hover:border-emerald-500 transition-colors">
                        {uploadingCover ? (
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <span className="text-sm text-gray-500">Clique para enviar</span>
                          </>
                        )}
                        <input
                          type="file" accept="image/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }}
                        />
                      </label>
                    )}
                    <Input
                      placeholder="Legenda da imagem"
                      value={editing.image_caption || ""}
                      onChange={(e) => setEditing({ ...editing, image_caption: e.target.value })}
                    />
                    <Input
                      placeholder="Créditos da imagem"
                      value={editing.image_credits || ""}
                      onChange={(e) => setEditing({ ...editing, image_credits: e.target.value })}
                    />
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
                    <h3 className="font-bold text-gray-900">Metadados</h3>
                    <div>
                      <Label>Categoria</Label>
                      <Input
                        value={editing.category || ""}
                        onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Autor</Label>
                      <Input
                        value={editing.author_name || ""}
                        onChange={(e) => setEditing({ ...editing, author_name: e.target.value })}
                      />
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
};

export default MarketingDashboard;