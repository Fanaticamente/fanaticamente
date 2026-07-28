import { useEffect, useMemo, useState } from "react";
import { useAppModules, useUpdateModule, type AppModule } from "@/hooks/useAppModules";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ClubBadgeToggles from "@/components/studio/ClubBadgeToggles";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, ArrowUp, ArrowDown, Save, Upload,
  LayoutTemplate, Newspaper, Trophy, Play, Headphones, Lightbulb, Eye,
} from "lucide-react";

type Cfg = Record<string, any>;

const BUCKET = "health-news";

const uploadFile = async (file: File, folder: string): Promise<string> => {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `futebol/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
};

const FileField = ({
  label, accept, folder, value, onChange, hint,
}: {
  label: string; accept: string; folder: string;
  value?: string; onChange: (url: string) => void; hint?: string;
}) => {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="h-9 text-sm"
        />
        <label className="shrink-0">
          <Button asChild size="sm" variant="outline" className="h-9" disabled={busy}>
            <span className="cursor-pointer">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </span>
          </Button>
          <input
            type="file" accept={accept} className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              try {
                onChange(await uploadFile(f, folder));
                toast.success("Arquivo enviado");
              } catch (err: any) {
                toast.error(err.message || "Erro no upload");
              } finally { setBusy(false); }
            }}
          />
        </label>
      </div>
      {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
    </div>
  );
};

// ------------------------------------------------------------------
// Generic list editor (vídeos / podcasts / dicas)
// ------------------------------------------------------------------
type FieldDef =
  | { type: "text"; key: string; label: string; placeholder?: string }
  | { type: "textarea"; key: string; label: string }
  | { type: "file"; key: string; label: string; accept: string; folder: string; hint?: string };

const ListEditor = ({
  module, fields, itemLabel, folder,
}: { module: AppModule; fields: FieldDef[]; itemLabel: string; folder: string }) => {
  const update = useUpdateModule();
  const initial = (module.config as Cfg) || {};
  const [items, setItems] = useState<Cfg[]>(initial.items || []);
  const [emptyText, setEmptyText] = useState<string>(initial.empty_text || "");
  const [visible, setVisible] = useState(module.is_visible);

  useEffect(() => {
    const c = (module.config as Cfg) || {};
    setItems(c.items || []);
    setEmptyText(c.empty_text || "");
    setVisible(module.is_visible);
  }, [module.id, module.updated_at]);

  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  const save = () =>
    update.mutate({
      id: module.id,
      updates: { is_visible: visible, config: { ...initial, items, empty_text: emptyText } as any },
    });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <Label className="font-medium">Seção visível no app</Label>
          <p className="text-xs text-gray-500">Desative para ocultar esta aba do aplicativo</p>
        </div>
        <Switch checked={visible} onCheckedChange={setVisible} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <Label className="text-xs">Texto quando não houver conteúdo</Label>
        <Input value={emptyText} onChange={(e) => setEmptyText(e.target.value)} className="h-9 mt-1 text-sm" />
      </div>

      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">{itemLabel} {i + 1}</span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => move(i, -1)}><ArrowUp className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => move(i, 1)}><ArrowDown className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, k) => k !== i))}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>

          {fields.map((f) => {
            const set = (v: any) => setItems(items.map((it, k) => (k === i ? { ...it, [f.key]: v } : it)));
            if (f.type === "file")
              return (
                <FileField
                  key={f.key} label={f.label} accept={f.accept} folder={f.folder}
                  hint={f.hint} value={item[f.key]} onChange={set}
                />
              );
            if (f.type === "textarea")
              return (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}</Label>
                  <Textarea value={item[f.key] || ""} onChange={(e) => set(e.target.value)} rows={2} className="mt-1 text-sm" />
                </div>
              );
            return (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Input
                  value={item[f.key] || ""}
                  onChange={(e) => set(e.target.value)}
                  placeholder={f.placeholder}
                  className="h-9 mt-1 text-sm"
                />
              </div>
            );
          })}

          {item.audio_url && (
            <audio controls src={item.audio_url} className="w-full h-9" />
          )}

          <div className="flex items-center justify-between pt-1">
            <Label className="text-xs text-gray-500">Publicado</Label>
            <Switch
              checked={item.published !== false}
              onCheckedChange={(v) => setItems(items.map((it, k) => (k === i ? { ...it, published: v } : it)))}
            />
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setItems([...items, { published: true }])}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar {itemLabel.toLowerCase()}
        </Button>
        <Button onClick={save} disabled={update.isPending} className="bg-emerald-700 hover:bg-emerald-800">
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Salvar
        </Button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Tabs (menus/submenus) editor
// ------------------------------------------------------------------
const TabsEditor = ({ module }: { module: AppModule }) => {
  const update = useUpdateModule();
  const initial = (module.config as Cfg) || {};
  const [tabs, setTabs] = useState<Cfg[]>(initial.tabs || []);

  useEffect(() => setTabs(((module.config as Cfg) || {}).tabs || []), [module.id, module.updated_at]);

  const move = (i: number, dir: -1 | 1) => {
    const next = [...tabs];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setTabs(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Ordem, nome e visibilidade das abas da página Conteúdo no aplicativo.
      </p>
      {tabs.map((t, i) => (
        <div key={t.key} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
          <div className="flex flex-col">
            <button onClick={() => move(i, -1)} className="text-gray-400 hover:text-gray-700"><ArrowUp className="w-3.5 h-3.5" /></button>
            <button onClick={() => move(i, 1)} className="text-gray-400 hover:text-gray-700"><ArrowDown className="w-3.5 h-3.5" /></button>
          </div>
          <code className="text-[11px] text-gray-400 w-20 truncate">{t.key}</code>
          <Input
            value={t.label || ""}
            onChange={(e) => setTabs(tabs.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))}
            className="h-9 text-sm flex-1"
          />
          <Switch
            checked={t.visible !== false}
            onCheckedChange={(v) => setTabs(tabs.map((x, k) => (k === i ? { ...x, visible: v } : x)))}
          />
        </div>
      ))}
      <div className="flex justify-end">
        <Button
          className="bg-emerald-700 hover:bg-emerald-800"
          disabled={update.isPending}
          onClick={() => update.mutate({ id: module.id, updates: { config: { ...initial, tabs } as any } })}
        >
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Salvar abas
        </Button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// News section editor
// ------------------------------------------------------------------
const NewsEditor = ({ module }: { module: AppModule }) => {
  const update = useUpdateModule();
  const initial = (module.config as Cfg) || {};
  const [cfg, setCfg] = useState<Cfg>(initial);
  const [visible, setVisible] = useState(module.is_visible);

  useEffect(() => {
    setCfg((module.config as Cfg) || {});
    setVisible(module.is_visible);
  }, [module.id, module.updated_at]);

  const set = (k: string, v: any) => setCfg((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-medium">Seção visível no app</Label>
          <Switch checked={visible} onCheckedChange={setVisible} />
        </div>
        <div>
          <Label className="text-xs">Subtítulo</Label>
          <Input value={cfg.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} className="h-9 mt-1 text-sm" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Título "Em destaque"</Label>
            <Input value={cfg.featured_title || ""} onChange={(e) => set("featured_title", e.target.value)} className="h-9 mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Título "Mais recentes"</Label>
            <Input value={cfg.recent_title || ""} onChange={(e) => set("recent_title", e.target.value)} className="h-9 mt-1 text-sm" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 items-end">
          <div>
            <Label className="text-xs">Máximo de notícias na lista</Label>
            <Input
              type="number" min={5} max={50}
              value={cfg.max_items ?? 20}
              onChange={(e) => set("max_items", Number(e.target.value))}
              className="h-9 mt-1 text-sm"
            />
          </div>
          <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 h-9">
            <Label className="text-xs">Filtro por clube</Label>
            <Switch checked={cfg.show_club_filter !== false} onCheckedChange={(v) => set("show_club_filter", v)} />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          className="bg-emerald-700 hover:bg-emerald-800"
          disabled={update.isPending}
          onClick={() => update.mutate({ id: module.id, updates: { is_visible: visible, config: cfg as any } })}
        >
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Salvar
        </Button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Table (championships) editor
// ------------------------------------------------------------------
const TableEditor = ({ module }: { module: AppModule }) => {
  const update = useUpdateModule();
  const initial = (module.config as Cfg) || {};
  const [cfg, setCfg] = useState<Cfg>(initial);
  const [visible, setVisible] = useState(module.is_visible);

  useEffect(() => {
    setCfg((module.config as Cfg) || {});
    setVisible(module.is_visible);
  }, [module.id, module.updated_at]);

  const leagues: Cfg[] = cfg.leagues || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <Label className="font-medium">Aba Tabela visível</Label>
          <p className="text-xs text-gray-500">Oculta toda a seção de tabelas no app</p>
        </div>
        <Switch checked={visible} onCheckedChange={setVisible} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="font-bold text-gray-900 mb-1">Identidade visual dos clubes</h4>
        <p className="text-xs text-gray-500 mb-3">
          Com escudos e bandeirinhas desativados, aparece apenas a abreviação do clube.
        </p>
        <ClubBadgeToggles
          showBadges={cfg.show_badges !== false}
          onShowBadgesChange={(v) => setCfg((p) => ({ ...p, show_badges: v }))}
          hiddenBadges={(cfg.hidden_badges as string[]) || []}
          onHiddenBadgesChange={(b) => setCfg((p) => ({ ...p, hidden_badges: b }))}
          displayMode={(cfg.club_display_mode as "badge" | "flag") || "badge"}
          onDisplayModeChange={(m) => setCfg((p) => ({ ...p, club_display_mode: m }))}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
        <h4 className="font-bold text-gray-900 mb-1">Campeonatos exibidos</h4>
        {leagues.map((l, i) => (
          <div key={l.key} className="flex items-center gap-3 py-1.5 border-t border-gray-100 first:border-0">
            <Input
              value={l.label || ""}
              onChange={(e) =>
                setCfg((p) => ({ ...p, leagues: leagues.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) }))
              }
              className="h-9 text-sm flex-1"
            />
            <Switch
              checked={l.visible !== false}
              onCheckedChange={(v) =>
                setCfg((p) => ({ ...p, leagues: leagues.map((x, k) => (k === i ? { ...x, visible: v } : x)) }))
              }
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          className="bg-emerald-700 hover:bg-emerald-800"
          disabled={update.isPending}
          onClick={() => update.mutate({ id: module.id, updates: { is_visible: visible, config: cfg as any } })}
        >
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Salvar
        </Button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Root
// ------------------------------------------------------------------
const SECTIONS = [
  { id: "football_tabs", label: "Abas / Submenus", icon: LayoutTemplate },
  { id: "football_news_section", label: "Notícias", icon: Newspaper },
  { id: "football_table", label: "Tabelas", icon: Trophy },
  { id: "football_videos", label: "Vídeos", icon: Play },
  { id: "football_podcasts", label: "Podcasts", icon: Headphones },
  { id: "football_dicas", label: "Dicas", icon: Lightbulb },
] as const;

const FootballManager = ({ onPreview }: { onPreview?: () => void }) => {
  const { data: modules, isLoading } = useAppModules("futebol");
  const [active, setActive] = useState<string>("football_tabs");

  const mod = useMemo(
    () => modules?.find((m) => m.module_id === active) ?? null,
    [modules, active]
  );

  if (isLoading) {
    return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Página Futebol / Conteúdo</h2>
          <p className="text-xs text-gray-500">Menus, submenus e conteúdos exibidos no app do torcedor</p>
        </div>
        {onPreview && (
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="w-4 h-4 mr-1" /> Ver no app
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-[220px_1fr]">
        <nav className="border-r border-gray-200 bg-gray-50 p-2 flex md:flex-col gap-1 overflow-x-auto">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const on = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  on ? "bg-emerald-700 text-white font-semibold" : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" /> {s.label}
              </button>
            );
          })}
        </nav>

        <div className="p-5 bg-gray-50 min-h-[420px]">
          {!mod ? (
            <p className="text-sm text-gray-500">Módulo não encontrado.</p>
          ) : active === "football_tabs" ? (
            <TabsEditor module={mod} />
          ) : active === "football_news_section" ? (
            <NewsEditor module={mod} />
          ) : active === "football_table" ? (
            <TableEditor module={mod} />
          ) : active === "football_videos" ? (
            <ListEditor
              module={mod}
              itemLabel="Vídeo"
              folder="videos"
              fields={[
                { type: "text", key: "title", label: "Título" },
                { type: "textarea", key: "description", label: "Descrição" },
                { type: "text", key: "url", label: "Link do vídeo (YouTube ou MP4)", placeholder: "https://youtube.com/..." },
                { type: "file", key: "image", label: "Capa (thumbnail)", accept: "image/*", folder: "videos", hint: "Recomendado 16:9" },
              ]}
            />
          ) : active === "football_podcasts" ? (
            <ListEditor
              module={mod}
              itemLabel="Episódio"
              folder="podcasts"
              fields={[
                { type: "text", key: "title", label: "Título do episódio" },
                { type: "textarea", key: "description", label: "Descrição" },
                { type: "file", key: "audio_url", label: "Áudio do episódio", accept: "audio/*", folder: "podcasts", hint: "MP3, M4A ou WAV" },
                { type: "file", key: "image", label: "Capa do episódio", accept: "image/*", folder: "podcasts" },
                { type: "text", key: "duration", label: "Duração", placeholder: "32 min" },
              ]}
            />
          ) : (
            <ListEditor
              module={mod}
              itemLabel="Dica"
              folder="dicas"
              fields={[
                { type: "text", key: "title", label: "Título da dica" },
                { type: "textarea", key: "description", label: "Conteúdo" },
                { type: "file", key: "image", label: "Imagem", accept: "image/*", folder: "dicas" },
                { type: "text", key: "url", label: "Link (opcional)", placeholder: "https://..." },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FootballManager;
