import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { brazilianClubs } from "@/data/brazilianClubs";
import { toast } from "sonner";
import {
  Loader2, Plus, Pencil, Trash2, Star, ArrowLeft, Image as ImageIcon,
  Calendar, Save,
} from "lucide-react";

const BUCKET = "health-news";

interface NewsRow {
  id: string;
  rewritten_title: string;
  subtitle: string | null;
  rewritten_content: string;
  image_url: string | null;
  image_caption: string | null;
  image_credits: string | null;
  category: string | null;
  club_id: string | null;
  published_at: string;
  is_featured: boolean;
  source_site: string;
  original_url: string;
  original_title: string;
}

const emptyItem: Partial<NewsRow> = {
  rewritten_title: "",
  subtitle: "",
  rewritten_content: "",
  image_url: "",
  image_caption: "",
  image_credits: "",
  category: "Futebol",
  club_id: null,
  is_featured: false,
};

const toLocalInput = (iso?: string | null) => {
  const d = iso ? new Date(iso) : new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};

const FootballNewsManager = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<NewsRow> | null>(null);
  const [dateValue, setDateValue] = useState<string>(toLocalInput());
  const [uploading, setUploading] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-football-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("football_news")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as NewsRow[];
    },
  });

  const clubs = useMemo(
    () => [...brazilianClubs].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-football-news"] });
    qc.invalidateQueries({ queryKey: ["football-news"] });
  };

  const save = useMutation({
    mutationFn: async (item: Partial<NewsRow>) => {
      const publishedISO = new Date(dateValue).toISOString();
      const payload: any = {
        rewritten_title: (item.rewritten_title || "").trim(),
        subtitle: item.subtitle || null,
        rewritten_content: item.rewritten_content || "",
        image_url: item.image_url || null,
        image_caption: item.image_caption || null,
        image_credits: item.image_credits || null,
        category: item.category || "Futebol",
        club_id: item.club_id || null,
        published_at: publishedISO,
        is_featured: !!item.is_featured,
      };

      if (item.id) {
        const { error } = await supabase.from("football_news").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("football_news").insert({
          ...payload,
          original_title: payload.rewritten_title,
          original_content: payload.rewritten_content,
          original_url: `manual-${Date.now()}`,
          source_site: "Fanaticamente",
          is_original: true,
        });
        if (error) throw error;
      }

      // only one featured at a time
      if (payload.is_featured) {
        const q = supabase.from("football_news").update({ is_featured: false } as any).eq("is_featured", true);
        if (item.id) await q.neq("id", item.id);
        else await q.neq("original_url", `manual-${Date.now()}`);
      }
    },
    onSuccess: () => {
      toast.success("Notícia salva");
      invalidate();
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("football_news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Notícia excluída"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const setFeatured = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("football_news").update({ is_featured: false } as any).eq("is_featured", true);
      const { error } = await supabase.from("football_news").update({ is_featured: true } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Destaque atualizado"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `futebol/noticias/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || "image/jpeg",
      });
      if (error) throw error;
      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      setEditing((p) => ({ ...(p || {}), image_url: url }));
      toast.success("Imagem enviada");
    } catch (e: any) {
      toast.error(e.message || "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button variant="ghost" onClick={() => setEditing(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <Button
            className="bg-emerald-700 hover:bg-emerald-800"
            disabled={save.isPending}
            onClick={() => {
              if (!editing.rewritten_title?.trim()) return toast.error("Adicione um título");
              if (!editing.rewritten_content?.trim()) return toast.error("Adicione o conteúdo");
              save.mutate(editing);
            }}
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Publicar
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3 bg-white p-5 rounded-xl border border-gray-200">
            <div>
              <Label className="text-xs">Título</Label>
              <Input
                className="text-lg font-bold"
                value={editing.rewritten_title || ""}
                onChange={(e) => setEditing({ ...editing, rewritten_title: e.target.value })}
                placeholder="Título da notícia"
              />
            </div>
            <div>
              <Label className="text-xs">Subtítulo (opcional)</Label>
              <Input
                value={editing.subtitle || ""}
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Conteúdo</Label>
              <Textarea
                rows={16}
                value={editing.rewritten_content || ""}
                onChange={(e) => setEditing({ ...editing, rewritten_content: e.target.value })}
                placeholder="Escreva o texto da notícia. Separe os parágrafos com uma linha em branco."
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Mantenha o padrão: resumo objetivo, parágrafos curtos e título em caixa alta apenas nas iniciais.
              </p>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm">Imagem</h3>
              {editing.image_url ? (
                <div className="relative">
                  <img src={editing.image_url} alt="" className="w-full rounded-lg" />
                  <Button
                    variant="destructive" size="sm" className="absolute top-2 right-2"
                    onClick={() => setEditing({ ...editing, image_url: "" })}
                  >Remover</Button>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-gray-300 rounded-lg py-8 text-center cursor-pointer hover:border-emerald-500">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-500">Clique para enviar</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                </label>
              )}
              <Input placeholder="Legenda da imagem"
                value={editing.image_caption || ""}
                onChange={(e) => setEditing({ ...editing, image_caption: e.target.value })} />
              <Input placeholder="Créditos da imagem"
                value={editing.image_credits || ""}
                onChange={(e) => setEditing({ ...editing, image_credits: e.target.value })} />
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm">Publicação</h3>
              <div>
                <Label className="text-xs">Data e hora</Label>
                <Input type="datetime-local" value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Clube relacionado</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={editing.club_id || ""}
                  onChange={(e) => setEditing({ ...editing, club_id: e.target.value || null })}
                >
                  <option value="">Geral (sem clube)</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <Label className="font-medium flex items-center gap-1 text-sm">
                    <Star className="w-3 h-3 text-amber-500" /> Destaque da página
                  </Label>
                  <p className="text-xs text-gray-500">Aparece no topo "Em destaque"</p>
                </div>
                <Switch
                  checked={!!editing.is_featured}
                  onCheckedChange={(v) => setEditing({ ...editing, is_featured: v })}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Notícias publicadas</h3>
          <p className="text-xs text-gray-500">
            Publicação manual — a coleta automática está desativada.
          </p>
        </div>
        <Button
          size="lg"
          className="w-full bg-emerald-700 hover:bg-emerald-800 font-bold"
          onClick={() => { setDateValue(toLocalInput()); setEditing({ ...emptyItem }); }}
        >
          <Plus className="w-5 h-5 mr-2" /> Escrever nova notícia
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : !items || items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-sm text-gray-500">
          Nenhuma notícia cadastrada.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((it) => (
            <div key={it.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-center">
              {it.image_url ? (
                <img src={it.image_url} alt="" className="w-20 h-20 rounded-lg object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {it.is_featured && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" /> DESTAQUE
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{it.category || "Futebol"}</span>
                  <span className="text-[10px] text-gray-400">{it.source_site}</span>
                </div>
                <h4 className="font-bold text-gray-900 truncate">{it.rewritten_title}</h4>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(it.published_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!it.is_featured && (
                  <Button variant="ghost" size="icon" title="Definir como destaque"
                    onClick={() => setFeatured.mutate(it.id)}>
                    <Star className="w-4 h-4 text-amber-500" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" title="Editar"
                  onClick={() => { setDateValue(toLocalInput(it.published_at)); setEditing(it); }}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Excluir"
                  onClick={() => { if (confirm("Excluir esta notícia?")) remove.mutate(it.id); }}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FootballNewsManager;
