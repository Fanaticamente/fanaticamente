import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Save, RotateCcw, AlignLeft, AlignCenter, AlignRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppPages } from "@/hooks/useAppPages";
import { useAppContent } from "@/hooks/useAppContent";
import { useAppModules } from "@/hooks/useAppModules";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import catalog from "@/generated/fanCopy.json";
import { fanCopyKey, fanStyleKey, FAN_TEXT_PREVIEW_KEY, type FanTextStyle } from "@/components/fan/EditableFanText";

type Entry = { id: string; page: string; text: string; section: string; tag: string };
type Draft = { value: string; style: FanTextStyle };
const homeFields: Entry[] = [
  ["home_greeting_subtitle", "Saúde Mental agora é papo de arquibancada!", "Saudação"],
  ["home_checkin_kicker", "Check-in emocional", "Como você está hoje?"],
  ["home_checkin_title", "Como você está hoje?", "Como você está hoje?"],
  ["home_checkin_subtitle", "Cada dia é uma rodada!", "Como você está hoje?"],
  ["home_shortcuts_title", "Acesso rápido", "Atalhos"],
  ["home_journey_title", "Sua jornada", "Jornada"],
  ["home_fanbase_title", "Juntos na arquibancada e na evolução!", "Torcida"],
  ["home_fanbase_subtitle", "Veja os torcedores que estão cuidando da mente.", "Torcida"],
  ["home_fanbase_cta", "Ver ranking", "Torcida"],
].map(([id, text, section]) => ({ id, page: "home", text, section, tag: "texto" }));
const defaultSuggestions = [
  { path: "/diario", kicker: "Sugestão para você", title: "Campo das emoções", subtitle: "Escale seu time e gere uma reflexão" },
  { path: "/curso/c6c7600e-de31-4adc-935e-75a9dd30beba", kicker: "Curso em destaque", title: "Ética & Responsabilidade Social no Futebol", subtitle: "Comece agora mesmo" },
  { path: "/terapeutas", kicker: "Cuide de você", title: "Converse com um(a) especialista", subtitle: "Terapeutas disponíveis" },
  { path: "/radio", kicker: "Ao vivo", title: "Alambrado FM", subtitle: "Acompanhe as rádios esportivas" },
  { path: "/futebol", kicker: "Fique por dentro", title: "Conteúdos sobre Futebol & Saúde", subtitle: "Últimas atualizações" },
  { path: "/comunidade?openClubs=1", kicker: "Comunidade", title: "Brasileirão da Saúde Mental", subtitle: "Veja como estão os clubes e torcida" },
];
const paths: Record<string, string> = {
  home: "/", terapeutas: "/terapeutas", cursos: "/cursos", "meus-cursos": "/meus-cursos", quiz: "/quiz", radio: "/radio",
  futebol: "/futebol", comunidade: "/comunidade", ranking: "/comunidade", diario: "/diario",
  "bem-estar": "/bem-estar", "minha-temporada": "/minha-temporada", "setor-saude": "/setor-saude",
  osmf: "/osmf", "zona-mista": "/zona-mista", loja: "/loja", "fanaticaze-tv": "/fanaticaze-tv",
  perfil: "/perfil", notificacoes: "/notificacoes", configuracoes: "/configuracoes",
};

const FanTextEditor = ({ onSelectPage }: { onSelectPage?: (path: string) => void }) => {
  const { data: pages, isLoading } = useAppPages("mobile");
  const { data: copies } = useAppContent("fan_copy");
  const { data: styles } = useAppContent("fan_style");
  const { data: homeModules } = useAppModules("home");
  const qc = useQueryClient();
  const [page, setPage] = useState("home");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ value: "", style: {} });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!preview) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setPreview(false); };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; sessionStorage.removeItem(FAN_TEXT_PREVIEW_KEY); };
  }, [preview]);

  const visiblePages = useMemo(() => (pages || []).filter(p =>
    p.is_visible && (p.platform === "mobile" || p.platform === "both") &&
    paths[p.page_id] && (paths[p.page_id] === p.path || p.page_id === "diario" && p.path === "/bem-estar") &&
    !["auth", "agendamentos", "pagamentos"].includes(p.page_id)
  ), [pages]);
  const active = visiblePages.find(p => p.page_id === page) || visiblePages[0];
  const actualPage = active?.page_id === "ranking" ? "comunidade" : active?.page_id;
  const suggestionFields = useMemo(() => {
    const config = homeModules?.find(m => m.module_id === "home_suggestions")?.config;
    const configured = config && typeof config === "object" && "items" in config && Array.isArray(config.items) ? config.items : [];
    const suggestions = configured.length ? configured : defaultSuggestions;
    return suggestions.flatMap((item: unknown) => {
      if (!item || typeof item !== "object" || !("path" in item) || typeof item.path !== "string") return [];
      const suggestion = item as { path: string; kicker?: string; title?: string; subtitle?: string };
      if (/agend|consult|sess|pagamento/i.test(`${suggestion.path} ${suggestion.title || ""} ${suggestion.subtitle || ""}`)) return [];
      const path = suggestion.path || "/";
      return (["kicker", "title", "subtitle"] as const).filter(field => suggestion[field]).map(field => ({
        id: `home_suggestion_${path.replace(/[^a-z0-9]/gi, "_")}_${field}`,
        page: "home", text: suggestion[field] || "", section: "Sugestões", tag: field === "title" ? "título" : "texto",
      }));
    });
  }, [homeModules]);
  const entries = useMemo(() => [...homeFields, ...suggestionFields, ...(catalog as Entry[])].filter(item => item.page === actualPage &&
    (!search || `${item.text} ${item.section}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")))
  ), [actualPage, search, suggestionFields]);
  const grouping = useMemo(() => Object.entries(entries.reduce<Record<string, Entry[]>>((acc, item) => {
    (acc[item.section] ||= []).push(item); return acc;
  }, {})), [entries]);

  const currentValue = (entry: Entry) => copies?.find(c => c.key === fanCopyKey(entry.id))?.value ?? entry.text;
  const currentStyle = (entry: Entry): FanTextStyle => {
    try { return JSON.parse(styles?.find(c => c.key === fanStyleKey(entry.id))?.value || "{}"); }
    catch { return {}; }
  };
  const open = (entry: Entry) => {
    setSelected(entry.id);
    setDraft({ value: currentValue(entry), style: currentStyle(entry) });
  };
  const updateStyle = (changes: FanTextStyle) => setDraft(old => ({ ...old, style: { ...old.style, ...changes } }));
  const adjust = (axis: "offsetX" | "offsetY", delta: number) => updateStyle({ [axis]: Math.max(-24, Math.min(24, (draft.style[axis] ?? 0) + delta)) });
  const openPreview = (entry: Entry) => {
    sessionStorage.setItem(FAN_TEXT_PREVIEW_KEY, JSON.stringify({ id: entry.id, value: draft.value, style: draft.style }));
    setPreview(true);
  };
  const previewPath = active?.path || paths[actualPage || "home"] || "/";
  const previewUrl = `${previewPath}${previewPath.includes("?") ? "&" : "?"}forceMobile=1&fanTextPreview=1`;
  const persist = async (entry: Entry, reset = false) => {
    setSaving(true);
    try {
      if (reset) {
        const { error } = await supabase.from("app_content").delete().in("key", [fanCopyKey(entry.id), fanStyleKey(entry.id)]);
        if (error) throw error;
      } else {
        const rows = [
          { key: fanCopyKey(entry.id), value: draft.value.trim(), type: "text", category: "fan_copy", description: `${entry.page}: ${entry.text}` },
          { key: fanStyleKey(entry.id), value: JSON.stringify(draft.style), type: "text", category: "fan_style", description: `${entry.page}: apresentação de ${entry.text}` },
        ];
        const { error } = await supabase.from("app_content").upsert(rows, { onConflict: "key" });
        if (error) throw error;
      }
      await qc.invalidateQueries({ queryKey: ["app-content"] });
      setPreview(false);
      setSelected(null);
      toast.success(reset ? "Padrão restaurado" : "Texto atualizado");
    } catch {
      toast.error("Não foi possível salvar o texto");
    } finally { setSaving(false); }
  };

  return <div className="space-y-4 text-foreground">
    <div className="relative">
      <Search className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-muted-foreground" />
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar texto nesta página" className="pl-9" />
    </div>
    <Select value={active?.page_id || ""} onValueChange={v => { setPage(v); setSelected(null); setSearch(""); const next = visiblePages.find(p => p.page_id === v); if (next) onSelectPage?.(next.path); }}>
      <SelectTrigger><SelectValue placeholder={isLoading ? "Carregando páginas..." : "Selecionar página"} /></SelectTrigger>
      <SelectContent>{visiblePages.map(p => <SelectItem key={p.id} value={p.page_id}>{p.name}</SelectItem>)}</SelectContent>
    </Select>
    <p className="text-xs text-muted-foreground">{entries.length} textos nesta página</p>
    {grouping.map(([section, group]) => <section key={section} className="space-y-2">
      <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">{section.replace(/([a-z])([A-Z])/g, "$1 $2")}</h3>
      {group.map(entry => <div key={entry.id} className="border border-border rounded-lg p-3 space-y-3 bg-card min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><span className="text-[11px] uppercase text-muted-foreground">{entry.tag}</span><p className="text-sm font-medium break-words">{currentValue(entry)}</p></div>
          <Button variant="outline" size="sm" onClick={() => selected === entry.id ? setSelected(null) : open(entry)} aria-label={`Editar ${entry.text}`} className="shrink-0">Editar</Button>
        </div>
        {selected === entry.id && <div className="space-y-3 border-t border-border pt-3">
          <div><Label>Texto</Label><Textarea value={draft.value} onChange={e => setDraft(d => ({...d, value: e.target.value}))} maxLength={500} className="mt-1 min-h-20" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Tamanho atual</Label><div className="flex items-center gap-2 mt-1 min-w-0"><span className="h-9 flex-1 min-w-0 flex items-center px-2 rounded-md border border-input text-sm tabular-nums" aria-label={`Tamanho atual: ${(draft.style.scale ?? 1).toFixed(1).replace(".", ",")} vezes o tamanho padrão`}>{(draft.style.scale ?? 1).toFixed(1).replace(".", ",")}×{draft.style.size ? ` · ${draft.style.size}px` : ""}</span><div className="flex flex-col gap-0.5"><Button type="button" variant="outline" size="icon" className="h-[18px] w-7" title="Aumentar tamanho" aria-label="Aumentar tamanho" disabled={(draft.style.scale ?? 1) >= 2} onClick={() => updateStyle({scale: Math.min(2, Math.round(((draft.style.scale ?? 1) + 0.1) * 10) / 10)})}><ChevronUp className="h-3 w-3" /></Button><Button type="button" variant="outline" size="icon" className="h-[18px] w-7" title="Diminuir tamanho" aria-label="Diminuir tamanho" disabled={(draft.style.scale ?? 1) <= 0.5} onClick={() => updateStyle({scale: Math.max(0.5, Math.round(((draft.style.scale ?? 1) - 0.1) * 10) / 10)})}><ChevronDown className="h-3 w-3" /></Button></div></div></div>
            <div><Label>Alinhamento</Label><div className="flex gap-1 mt-1">{(["left", "center", "right"] as const).map((align, i) => {
              const Icon = [AlignLeft, AlignCenter, AlignRight][i];
              return <Button key={align} variant={draft.style.align === align ? "default" : "outline"} size="icon" className="h-9 w-9" onClick={() => updateStyle({align})} title={align === "left" ? "Esquerda" : align === "center" ? "Centro" : "Direita"}><Icon className="h-4 w-4" /></Button>;
            })}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Horizontal (px)</Label><div className="flex items-center gap-1 mt-1"><Button type="button" variant="outline" size="icon" className="h-9 w-8 shrink-0" title="Mover para esquerda" aria-label="Mover para esquerda" disabled={(draft.style.offsetX ?? 0) <= -24} onClick={() => adjust("offsetX", -1)}><ChevronLeft className="h-4 w-4" /></Button><span className="h-9 flex-1 min-w-0 border border-input rounded-md flex items-center justify-center tabular-nums text-sm" aria-label={`Posição horizontal: ${draft.style.offsetX ?? 0} pixels`}>{draft.style.offsetX ?? 0}</span><Button type="button" variant="outline" size="icon" className="h-9 w-8 shrink-0" title="Mover para direita" aria-label="Mover para direita" disabled={(draft.style.offsetX ?? 0) >= 24} onClick={() => adjust("offsetX", 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
            <div><Label>Vertical (px)</Label><div className="flex items-center gap-1 mt-1"><Button type="button" variant="outline" size="icon" className="h-9 w-8 shrink-0" title="Mover para cima" aria-label="Mover para cima" disabled={(draft.style.offsetY ?? 0) <= -24} onClick={() => adjust("offsetY", -1)}><ChevronUp className="h-4 w-4" /></Button><span className="h-9 flex-1 min-w-0 border border-input rounded-md flex items-center justify-center tabular-nums text-sm" aria-label={`Posição vertical: ${draft.style.offsetY ?? 0} pixels`}>{draft.style.offsetY ?? 0}</span><Button type="button" variant="outline" size="icon" className="h-9 w-8 shrink-0" title="Mover para baixo" aria-label="Mover para baixo" disabled={(draft.style.offsetY ?? 0) >= 24} onClick={() => adjust("offsetY", 1)}><ChevronDown className="h-4 w-4" /></Button></div></div>
          </div>
          <div className="flex flex-wrap gap-2"><Button size="sm" disabled={saving || !draft.value.trim()} onClick={() => persist(entry)}><Save className="h-4 w-4 mr-1" />Salvar</Button><Button variant="outline" size="sm" disabled={saving} onClick={() => persist(entry, true)}><RotateCcw className="h-4 w-4 mr-1" />Restaurar</Button><Button variant="outline" size="sm" onClick={() => openPreview(entry)}><Eye className="h-4 w-4 mr-1" />Visualizar</Button></div>
        </div>}
      </div>)}
    </section>)}
    {!isLoading && visiblePages.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma página ativa do torcedor encontrada.</p>}
    {preview && createPortal(<div role="dialog" aria-modal="true" aria-label="Visualização do texto" className="fixed inset-0 z-[100] bg-background text-foreground flex flex-col">
      <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-border bg-card"><span className="font-semibold">Visualização</span><Button type="button" variant="ghost" size="icon" onClick={() => setPreview(false)} aria-label="Fechar visualização" title="Fechar visualização"><X className="h-5 w-5" /></Button></div>
      <div className="flex-1 min-h-0 w-full flex justify-center bg-muted/30"><iframe key={`${selected}-${preview}`} src={previewUrl} title="Visualização da página com o texto em edição" className="w-full max-w-[428px] h-full border-0 bg-background" /></div>
    </div>, document.body)}
  </div>;
};
export default FanTextEditor;
