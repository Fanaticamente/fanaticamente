import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save, Play, Pause, Loader2, Sparkles, Beaker } from "lucide-react";

interface Rule {
  id: string;
  name: string;
  event_type: string;
  audience: string;
  title_template: string;
  body_template: string;
  link_template: string | null;
  type: string;
  cooldown_hours: number;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  is_active: boolean;
}

const EVENT_TYPES = [
  { value: "appointment_created", label: "Agendamento criado (avisa profissional)" },
  { value: "appointment_confirmed", label: "Agendamento confirmado (avisa paciente)" },
  { value: "appointment_cancelled", label: "Agendamento cancelado (avisa paciente)" },
  { value: "appointment_24h_before", label: "Lembrete 24h antes da sessão" },
  { value: "mood_low_3days", label: "Humor baixo 3 dias seguidos" },
  { value: "subscription_expiring", label: "Assinatura expirando" },
  { value: "inactive_7days", label: "Usuário inativo há 7 dias" },
  { value: "favorite_club_match_starting", label: "Jogo do clube favorito começando" },
];

const AUDIENCES = [
  { value: "event_user", label: "Usuário do evento" },
  { value: "event_payload_target", label: "Alvo definido no payload" },
  { value: "role:professional", label: "Todos os profissionais" },
  { value: "role:user", label: "Todos os usuários" },
];

const TYPES = ["info", "success", "warning", "appointment", "payment", "promo"];

const empty: Omit<Rule, "id"> = {
  name: "",
  event_type: "appointment_created",
  audience: "event_user",
  title_template: "",
  body_template: "",
  link_template: "",
  type: "info",
  cooldown_hours: 0,
  quiet_hours_start: 22,
  quiet_hours_end: 8,
  is_active: true,
};

export default function SmartRulesTab() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Rule | (Omit<Rule, "id"> & { id?: string }) | null>(null);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notification_rules")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar regras: " + error.message);
    setRules((data as Rule[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.name || !editing.title_template || !editing.body_template) {
      toast.error("Preencha nome, título e mensagem");
      return;
    }
    const payload = { ...editing };
    if ("id" in payload && payload.id) {
      const { id, ...rest } = payload as Rule;
      const { error } = await supabase.from("notification_rules").update(rest).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("notification_rules").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Regra salva");
    setEditing(null);
    load();
  };

  const toggle = async (r: Rule) => {
    await supabase.from("notification_rules").update({ is_active: !r.is_active }).eq("id", r.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta regra?")) return;
    await supabase.from("notification_rules").delete().eq("id", id);
    load();
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("dispatch-notifications", { body: {} });
      if (error) throw error;
      toast.success(`Processadas: ${data?.processed || 0} • Enviadas: ${data?.dispatched || 0}`);
    } catch (e) {
      toast.error("Falha: " + String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-card-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Regras Inteligentes
          </h3>
          <p className="text-xs text-muted-foreground">
            Reage automaticamente a eventos do app. Use {`{{variavel}}`} no título e mensagem.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runNow}
            disabled={running}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/50"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Beaker className="w-4 h-4" />}
            Rodar agora
          </button>
          <button
            onClick={() => setEditing({ ...empty })}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm"
          >
            <Plus className="w-4 h-4" /> Nova regra
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3">
          {rules.map((r) => (
            <div key={r.id} className="border border-border rounded-2xl p-4 bg-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${r.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
                    <h4 className="font-medium text-card-foreground truncate">{r.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Evento: <code className="bg-muted/50 px-1.5 py-0.5 rounded">{r.event_type}</code> • Público:{" "}
                    <code className="bg-muted/50 px-1.5 py-0.5 rounded">{r.audience}</code>
                  </p>
                  <p className="text-sm text-card-foreground">
                    <strong>{r.title_template}</strong> — {r.body_template}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggle(r)} className="p-2 rounded-lg hover:bg-muted/50" title={r.is_active ? "Pausar" : "Ativar"}>
                    {r.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditing(r)} className="p-2 rounded-lg hover:bg-muted/50" title="Editar">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(r.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-destructive" title="Remover">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">Nenhuma regra ainda.</p>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg mb-4">{("id" in editing && editing.id) ? "Editar regra" : "Nova regra"}</h3>
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Nome interno</label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-card-foreground"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Evento</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-card-foreground"
                    value={editing.event_type}
                    onChange={(e) => setEditing({ ...editing, event_type: e.target.value })}
                  >
                    {EVENT_TYPES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Público</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-card-foreground"
                    value={editing.audience}
                    onChange={(e) => setEditing({ ...editing, audience: e.target.value })}
                  >
                    {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Título (template)</label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-card-foreground"
                  value={editing.title_template}
                  onChange={(e) => setEditing({ ...editing, title_template: e.target.value })}
                  placeholder="Novo agendamento"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Mensagem (template)</label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-card-foreground"
                  rows={3}
                  value={editing.body_template}
                  onChange={(e) => setEditing({ ...editing, body_template: e.target.value })}
                  placeholder="Você tem agendamento em {{scheduled_date}} às {{scheduled_time}}"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Link (opcional)</label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-card-foreground"
                  value={editing.link_template || ""}
                  onChange={(e) => setEditing({ ...editing, link_template: e.target.value })}
                  placeholder="/meus-agendamentos"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Tipo</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-card-foreground"
                    value={editing.type}
                    onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                  >
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Cooldown (h)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-card-foreground"
                    value={editing.cooldown_hours}
                    onChange={(e) => setEditing({ ...editing, cooldown_hours: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Silêncio (UTC-3)</label>
                  <div className="flex gap-1">
                    <input
                      type="number" min={0} max={23}
                      className="w-full px-2 py-2 rounded-xl border border-border bg-background text-card-foreground"
                      value={editing.quiet_hours_start ?? ""}
                      onChange={(e) => setEditing({ ...editing, quiet_hours_start: e.target.value === "" ? null : parseInt(e.target.value) })}
                    />
                    <input
                      type="number" min={0} max={23}
                      className="w-full px-2 py-2 rounded-xl border border-border bg-background text-card-foreground"
                      value={editing.quiet_hours_end ?? ""}
                      onChange={(e) => setEditing({ ...editing, quiet_hours_end: e.target.value === "" ? null : parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                Regra ativa
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-border text-sm">Cancelar</button>
                <button onClick={save} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}