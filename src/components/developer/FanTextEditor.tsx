import { useMemo, useState } from "react";
import { Search, Save, RotateCcw, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppPages } from "@/hooks/useAppPages";
import { useAppContent } from "@/hooks/useAppContent";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import catalog from "@/generated/fanCopy.json";
import { fanCopyKey, fanStyleKey, type FanTextStyle } from "@/components/fan/EditableFanText";

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
const paths: Record<string, string> = {
  home: "/", terapeutas: "/terapeutas", cursos: "/cursos", quiz: "/quiz", radio: "/radio",
  futebol: "/futebol", comunidade: "/comunidade", ranking: "/comunidade", diario: "/diario",
  "bem-estar": "/bem-estar", "minha-temporada": "/minha-temporada", "setor-saude": "/setor-saude",
  osmf: "/osmf", "zona-mista": "/zona-mista", loja: "/loja", "fanaticaze-tv": "/fanaticaze-tv",
  perfil: "/perfil", notificacoes: "/notificacoes", configuracoes: "/configuracoes",
};

const FanTextEditor = ({ onSelectPage }: { onSelectPage?: (path: string) => void }) => {
  const { data: pages, isLoading } = useAppPages("mobile");
  const { data: copies } = useAppContent("fan_copy");
  const { data: styles } = useAppContent("fan_style");
  const qc = useQueryClient();
  const [page, setPage] = useState("home");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ value: "", style: {} });
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);

  const visiblePages = useMemo(() => (pages || []).filter(p =>
    p.is_visible && (p.platform === "mobile" || p.platform === "both") &&
    paths[p.page_id] && paths[p.page_id] === p.path &&
    !["auth", "agendamentos", "pagamentos"].includes(p.page_id)
  ), [pages]);
  const active = visiblePages.find(p => p.page_id === page) || visiblePages[0];
  const actualPage = active?.page_id === "ranking" ? "comunidade" : active?.page_id;
  const entries = useMemo(() => [...homeFields, ...(catalog as Entry[])].filter(item => item.page === actualPage &&
    (!search || `${item.text} ${item.section}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")))
  ), [actualPage, search]);
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
      setSelected(null);
      setRevision(n => n + 1);
      toast.success(reset ? "Padrão restaurado" : "Texto atualizado");
    } catch {
      toast.error("Não foi possível salvar o texto");
    } finally { setSaving(false); }
  };

  return <div className="space-y-4 text-foreground" data-revision={revision}>
    <div className="relative">
      <Search className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-muted-foreground" />
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar texto nesta página" className="pl-9" />
    </div>
    <Select value={active?.page_id || ""} onValueChange={v => { setPage(v); setSelected(null); const next = visiblePages.find(p => p.page_id === v); if (next) onSelectPage?.(next.path); }}>
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
            <div><Label htmlFor={`size-${entry.id}`}>Tamanho (px)</Label><Input id={`size-${entry.id}`} type="number" min={9} max={48} placeholder="Padrão" value={draft.style.size ?? ""} onChange={e => updateStyle({size: e.target.value ? Math.max(9, Math.min(48, Number(e.target.value))) : undefined})} /></div>
            <div><Label>Alinhamento</Label><div className="flex gap-1 mt-1">{(["left", "center", "right"] as const).map((align, i) => {
              const Icon = [AlignLeft, AlignCenter, AlignRight][i];
              return <Button key={align} variant={draft.style.align === align ? "default" : "outline"} size="icon" className="h-9 w-9" onClick={() => updateStyle({align})} title={align === "left" ? "Esquerda" : align === "center" ? "Centro" : "Direita"}><Icon className="h-4 w-4" /></Button>;
            })}</div></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label htmlFor={`x-${entry.id}`}>Horizontal (px)</Label><Input id={`x-${entry.id}`} type="number" min={-24} max={24} value={draft.style.offsetX ?? 0} onChange={e => updateStyle({offsetX: Math.max(-24, Math.min(24, Number(e.target.value)))})} /></div>
            <div><Label htmlFor={`y-${entry.id}`}>Vertical (px)</Label><Input id={`y-${entry.id}`} type="number" min={-24} max={24} value={draft.style.offsetY ?? 0} onChange={e => updateStyle({offsetY: Math.max(-24, Math.min(24, Number(e.target.value)))})} /></div>
          </div>
          <div className="flex gap-2"><Button size="sm" disabled={saving || !draft.value.trim()} onClick={() => persist(entry)}><Save className="h-4 w-4 mr-1" />Salvar</Button><Button variant="outline" size="sm" disabled={saving} onClick={() => persist(entry, true)}><RotateCcw className="h-4 w-4 mr-1" />Restaurar</Button></div>
        </div>}
      </div>)}
    </section>)}
    {!isLoading && visiblePages.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma página ativa do torcedor encontrada.</p>}
  </div>;
};
export default FanTextEditor;
