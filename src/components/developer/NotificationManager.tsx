import { useState, useEffect } from "react";
import {
  Bell, Send, Users, User, CheckCircle, AlertCircle, Loader2,
  BookTemplate, Zap, History, BarChart3, Plus, Trash2, Edit3,
  Play, Pause, Clock, ArrowRight, RefreshCw, Filter, Search,
  TrendingUp, MessageSquare, Smartphone, Globe, ChevronRight,
  X, Save, Eye, Copy, Calendar, Target, Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { brazilianClubs } from "@/data/brazilianClubs";

type NotifType = "info" | "appointment" | "course" | "payment" | "warning" | "promo";
type TabId = "send" | "templates" | "automations" | "history" | "metrics";

interface Template {
  id: string;
  name: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  created_at: string;
}

interface Automation {
  id: string;
  name: string;
  trigger_event: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  target_role: string;
  is_active: boolean;
  delay_minutes: number;
  created_at: string;
}

interface NotifLog {
  id: string;
  title: string;
  message: string;
  type: string;
  target: string;
  in_app_sent: number;
  push_sent: number;
  push_failed: number;
  sent_at: string;
}

interface SendResult {
  in_app_sent: number;
  push_sent: number;
  push_failed: number;
  vapid_configured: boolean;
}

const notifTypes: { value: NotifType; label: string; emoji: string; color: string }[] = [
  { value: "info", label: "Informação", emoji: "ℹ️", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "appointment", label: "Agendamento", emoji: "📅", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "course", label: "Curso", emoji: "📚", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "payment", label: "Pagamento", emoji: "💳", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "warning", label: "Aviso", emoji: "⚠️", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { value: "promo", label: "Promoção", emoji: "🎁", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
];

const triggerEvents = [
  { value: "appointment_confirmed", label: "Agendamento confirmado" },
  { value: "appointment_rejected", label: "Agendamento rejeitado" },
  { value: "payment_approved", label: "Pagamento aprovado" },
  { value: "session_completed", label: "Sessão concluída" },
  { value: "new_course_published", label: "Novo curso publicado" },
  { value: "subscription_expiring", label: "Assinatura expirando" },
  { value: "new_professional_approved", label: "Profissional aprovado" },
  { value: "user_registered", label: "Novo usuário registrado" },
];

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "send", label: "Enviar", icon: Send },
  { id: "templates", label: "Templates", icon: BookTemplate },
  { id: "automations", label: "Automações", icon: Zap },
  { id: "history", label: "Histórico", icon: History },
  { id: "metrics", label: "Métricas", icon: BarChart3 },
];

const NotifTypeBadge = ({ type }: { type: string }) => {
  const t = notifTypes.find(n => n.value === type);
  if (!t) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${t.color}`}>
      {t.emoji} {t.label}
    </span>
  );
};

// ─── SEND TAB ────────────────────────────────────────────────────────────────
const SendTab = () => {
  const [targetType, setTargetType] = useState<"all" | "specific" | "club">("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetUserEmail, setTargetUserEmail] = useState("");
  const [targetClubId, setTargetClubId] = useState("");
  const [clubFanCount, setClubFanCount] = useState<number | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [loadingClubCount, setLoadingClubCount] = useState(false);
  const [emailSearchResults, setEmailSearchResults] = useState<{ id: string; email: string }[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotifType>("info");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<SendResult | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    supabase.from("notification_templates").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setTemplates(data as Template[]);
    });
  }, []);

  // Load fan count when club changes
  useEffect(() => {
    if (targetType !== "club" || !targetClubId) { setClubFanCount(null); return; }
    setLoadingClubCount(true);
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("favorite_club_id", targetClubId).then(({ count }) => {
      setClubFanCount(count ?? 0);
      setLoadingClubCount(false);
    });
  }, [targetClubId, targetType]);

  const searchUserByEmail = async () => {
    if (!targetUserEmail.trim()) return;
    setSearchingUser(true);
    setEmailSearchResults([]);
    setTargetUserId("");
    try {
      const { data, error } = await supabase.functions.invoke("get-user-emails", {
        body: { search: targetUserEmail.trim() },
      });
      if (error) throw error;
      if (data?.users?.length > 0) {
        setEmailSearchResults(data.users);
        if (data.users.length === 1) {
          setTargetUserId(data.users[0].id);
          toast.success(`Usuário encontrado: ${data.users[0].email}`);
        }
      } else {
        toast.error("Nenhum usuário encontrado com esse email.");
      }
    } catch {
      toast.error("Erro ao buscar usuário.");
    } finally {
      setSearchingUser(false);
    }
  };

  const applyTemplate = (t: Template) => {
    setTitle(t.title);
    setMessage(t.message);
    setType(t.type as NotifType);
    setLink(t.link || "");
    setShowTemplates(false);
    toast.success("Template aplicado!");
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Título e mensagem são obrigatórios.");
      return;
    }
    if (targetType === "specific" && !targetUserId) {
      toast.error("Selecione um usuário primeiro.");
      return;
    }
    if (targetType === "club" && !targetClubId) {
      toast.error("Selecione um clube primeiro.");
      return;
    }
    setSending(true);
    setLastResult(null);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        message: message.trim(),
        type,
        link: link.trim() || undefined,
      };
      if (targetType === "specific") payload.target_user_id = targetUserId;
      if (targetType === "club") payload.target_club_id = targetClubId;

      const { data, error } = await supabase.functions.invoke("send-push-notification", { body: payload });
      
      // Log the error details for debugging
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Erro na edge function");
      }
      if (!data) throw new Error("Resposta vazia da edge function");
      if (data.error) throw new Error(data.error);
      
      setLastResult(data);
      toast.success(`Notificação enviada para ${data.in_app_sent ?? 0} usuário(s)!`);

      // Log the send (non-blocking - don't fail if log fails)
      try {
        const selectedClub = brazilianClubs.find(c => c.id === targetClubId);
        await supabase.from("notification_logs").insert({
          title: title.trim(),
          message: message.trim(),
          type,
          link: link.trim() || null,
          target: targetType === "club" ? `club:${selectedClub?.name || targetClubId}` : targetType,
          target_user_id: targetType === "specific" ? targetUserId : null,
          in_app_sent: data.in_app_sent ?? 0,
          push_sent: data.push_sent ?? 0,
          push_failed: data.push_failed ?? 0,
        });
      } catch (logErr) {
        console.warn("Falha ao salvar log de notificação:", logErr);
      }
      setTitle(""); setMessage(""); setLink(""); setType("info");
      setTargetUserId(""); setTargetUserEmail(""); setTargetType("all");
      setTargetClubId(""); setClubFanCount(null); setEmailSearchResults([]);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar notificação.");
    } finally {
      setSending(false);
    }
  };

  const selectedClub = brazilianClubs.find(c => c.id === targetClubId);

  const targetOptions = [
    { value: "all", label: "Todos os usuários", icon: Users, desc: "Envia para todos com role user" },
    { value: "specific", label: "Usuário por e-mail", icon: User, desc: "Busca e seleciona um usuário" },
    { value: "club", label: "Torcedores de um clube", icon: Shield, desc: "Filtra por clube favorito" },
  ] as const;

  return (
    <div className="grid grid-cols-5 gap-6 h-full">
      {/* Form */}
      <div className="col-span-3 space-y-5">
        {/* Template picker */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-card-foreground">Compor notificação</h3>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/20 border border-secondary/30 text-secondary text-xs hover:bg-secondary/30 transition-colors"
          >
            <BookTemplate className="w-3.5 h-3.5" />
            Usar template
          </button>
        </div>

        {showTemplates && (
          <div className="border border-border rounded-xl bg-muted/20 p-3 space-y-2 max-h-48 overflow-y-auto">
            {templates.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum template criado ainda.</p>
            ) : templates.map(t => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/10 border border-transparent hover:border-secondary/20 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BookTemplate className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.title}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        )}

        {/* Destinatário */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Destinatário</label>
          <div className="grid grid-cols-3 gap-2">
            {targetOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => { setTargetType(opt.value); setTargetUserId(""); setEmailSearchResults([]); setTargetClubId(""); }}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-sm transition-all ${
                    targetType === opt.value
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-card-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-xs">{opt.label}</span>
                  </div>
                  <span className={`text-[10px] ${targetType === opt.value ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>{opt.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Specific user search */}
          {targetType === "specific" && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={targetUserEmail}
                  onChange={e => { setTargetUserEmail(e.target.value); setTargetUserId(""); setEmailSearchResults([]); }}
                  placeholder="Digite o e-mail do usuário..."
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted/30 text-card-foreground text-sm focus:border-primary focus:outline-none"
                  onKeyDown={e => e.key === "Enter" && searchUserByEmail()}
                />
                <button
                  onClick={searchUserByEmail}
                  disabled={searchingUser || !targetUserEmail.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  {searchingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {searchingUser ? "" : "Buscar"}
                </button>
              </div>
              {emailSearchResults.length > 0 && (
                <div className="border border-border rounded-xl bg-card overflow-hidden">
                  {emailSearchResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setTargetUserId(u.id); setEmailSearchResults([]); setTargetUserEmail(u.email); toast.success(`Selecionado: ${u.email}`); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/10 transition-colors text-left border-b border-border last:border-0 ${targetUserId === u.id ? "bg-primary/10" : ""}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-card-foreground">{u.email}</span>
                      {targetUserId === u.id && <CheckCircle className="w-4 h-4 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
              {targetUserId && emailSearchResults.length === 0 && (
                <p className="text-xs text-green-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Usuário selecionado: {targetUserEmail}
                </p>
              )}
            </div>
          )}

          {/* Club filter */}
          {targetType === "club" && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Selecione o clube</label>
                <select
                  value={targetClubId}
                  onChange={e => setTargetClubId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-card-foreground text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">— Selecione um clube —</option>
                  {["serie_a", "serie_b", "serie_c"].map(league => {
                    const leagueClubs = brazilianClubs.filter(c => c.league === league);
                    if (!leagueClubs.length) return null;
                    return (
                      <optgroup key={league} label={league === "serie_a" ? "Série A" : league === "serie_b" ? "Série B" : "Série C"}>
                        {leagueClubs.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
              {targetClubId && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                  {selectedClub && (
                    <img src={selectedClub.badgeUrl} alt={selectedClub.name} className="w-8 h-8 object-contain" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{selectedClub?.name}</p>
                    {loadingClubCount ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Contando torcedores...</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-semibold text-primary">{clubFanCount ?? 0}</span> torcedores cadastrados no app
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tipo</label>
          <div className="flex flex-wrap gap-2">
            {notifTypes.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  type === t.value ? t.color + " shadow-sm" : "bg-muted/20 border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Título */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título</label>
            <span className="text-xs text-muted-foreground">{title.length}/80</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título da notificação"
            maxLength={80}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-card-foreground text-sm focus:border-primary focus:outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Mensagem */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mensagem</label>
            <span className="text-xs text-muted-foreground">{message.length}/250</span>
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Texto da notificação..."
            rows={4}
            maxLength={250}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-card-foreground text-sm focus:border-primary focus:outline-none placeholder:text-muted-foreground/50 resize-none"
          />
        </div>

        {/* Link */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Link interno <span className="normal-case font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="/cursos ou /meus-agendamentos"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-card-foreground text-sm focus:border-primary focus:outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-40 hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
        >
          {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4" /> Enviar notificação</>}
        </button>
      </div>

      {/* Preview + Result */}
      <div className="col-span-2 space-y-4">
        {/* Preview */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Preview
          </h3>
          <div className="bg-muted/20 border border-border rounded-2xl p-4 space-y-3">
            {/* Push notification preview */}
            <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-xs font-semibold text-card-foreground truncate">
                      {title || "Título da notificação"}
                    </p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">agora</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {message || "Mensagem da notificação aparece aqui..."}
                  </p>
                  {link && (
                    <p className="text-[10px] text-primary mt-1 flex items-center gap-0.5">
                      <ChevronRight className="w-3 h-3" /> {link}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Smartphone className="w-3 h-3" />
              <span>Push nativo</span>
              <span>·</span>
              <Globe className="w-3 h-3" />
              <span>In-app</span>
            </div>
            <NotifTypeBadge type={type} />
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <p>Para: {
                targetType === "all" ? "Todos os usuários" :
                targetType === "club" && selectedClub ? `Torcedores do ${selectedClub.name}${clubFanCount !== null ? ` (${clubFanCount})` : ""}` :
                targetType === "club" ? "Selecione um clube..." :
                targetUserId ? targetUserEmail : "Aguardando seleção..."
              }</p>
              {targetType === "club" && selectedClub && (
                <div className="flex items-center gap-1 mt-1">
                  <img src={selectedClub.badgeUrl} alt="" className="w-4 h-4 object-contain" />
                  <span className="text-primary font-medium">{selectedClub.shortName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Result */}
        {lastResult && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Envio concluído!
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-card/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-card-foreground">{lastResult.in_app_sent}</p>
                <p className="text-[10px] text-muted-foreground">In-app</p>
              </div>
              <div className="bg-card/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-card-foreground">{lastResult.push_sent}</p>
                <p className="text-[10px] text-muted-foreground">Push nativo</p>
              </div>
            </div>
            {lastResult.push_failed > 0 && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {lastResult.push_failed} push(es) falharam
              </p>
            )}
            {!lastResult.vapid_configured && (
              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> VAPID não configurado — push desabilitado
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TEMPLATES TAB ────────────────────────────────────────────────────────────
const TemplatesTab = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", title: "", message: "", type: "info", link: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("notification_templates").select("*").order("created_at", { ascending: false });
    if (data) setTemplates(data as Template[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.title || !form.message) {
      toast.error("Nome, título e mensagem são obrigatórios.");
      return;
    }
    if (editId) {
      await supabase.from("notification_templates").update({ ...form, link: form.link || null }).eq("id", editId);
      toast.success("Template atualizado!");
    } else {
      await supabase.from("notification_templates").insert({ ...form, link: form.link || null });
      toast.success("Template criado!");
    }
    setCreating(false); setEditId(null);
    setForm({ name: "", title: "", message: "", type: "info", link: "" });
    load();
  };

  const del = async (id: string) => {
    await supabase.from("notification_templates").delete().eq("id", id);
    toast.success("Template excluído.");
    load();
  };

  const startEdit = (t: Template) => {
    setEditId(t.id);
    setForm({ name: t.name, title: t.title, message: t.message, type: t.type, link: t.link || "" });
    setCreating(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Templates de notificação</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Crie e reutilize mensagens pré-configuradas</p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditId(null); setForm({ name: "", title: "", message: "", type: "info", link: "" }); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Novo template
        </button>
      </div>

      {creating && (
        <div className="border border-primary/30 bg-primary/5 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <BookTemplate className="w-4 h-4 text-primary" />
            {editId ? "Editar template" : "Novo template"}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nome do template</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Boas-vindas, Promo mensal..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none"
              >
                {notifTypes.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Título</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Título da notificação"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Mensagem</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Texto da notificação..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Link interno (opcional)</label>
            <input
              value={form.link}
              onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
              placeholder="/cursos"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              <Save className="w-4 h-4" /> Salvar
            </button>
            <button onClick={() => { setCreating(false); setEditId(null); }} className="flex items-center gap-1.5 px-4 py-2 bg-muted border border-border text-muted-foreground rounded-xl text-sm hover:bg-muted/80 transition-colors">
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookTemplate className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum template criado ainda</p>
          <p className="text-xs mt-1">Crie templates para reutilizar mensagens facilmente</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {templates.map(t => (
            <div key={t.id} className="border border-border rounded-2xl p-4 hover:border-primary/30 transition-all group bg-card/50">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{t.name}</p>
                  <NotifTypeBadge type={t.type} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-secondary/20 text-muted-foreground hover:text-secondary transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => del(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs font-medium text-card-foreground mb-1">{t.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{t.message}</p>
              {t.link && <p className="text-[10px] text-primary mt-2 flex items-center gap-0.5"><ChevronRight className="w-3 h-3" />{t.link}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── AUTOMATIONS TAB ─────────────────────────────────────────────────────────
const AutomationsTab = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", trigger_event: "appointment_confirmed", title: "", message: "",
    type: "info", link: "", target_role: "user", delay_minutes: 0,
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("notification_automations").select("*").order("created_at", { ascending: false });
    if (data) setAutomations(data as Automation[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.title || !form.message) {
      toast.error("Nome, título e mensagem são obrigatórios.");
      return;
    }
    if (editId) {
      await supabase.from("notification_automations").update({ ...form, link: form.link || null }).eq("id", editId);
      toast.success("Automação atualizada!");
    } else {
      await supabase.from("notification_automations").insert({ ...form, link: form.link || null });
      toast.success("Automação criada!");
    }
    setCreating(false); setEditId(null);
    setForm({ name: "", trigger_event: "appointment_confirmed", title: "", message: "", type: "info", link: "", target_role: "user", delay_minutes: 0 });
    load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("notification_automations").update({ is_active: !current }).eq("id", id);
    toast.success(!current ? "Automação ativada!" : "Automação pausada.");
    load();
  };

  const del = async (id: string) => {
    await supabase.from("notification_automations").delete().eq("id", id);
    toast.success("Automação excluída.");
    load();
  };

  const startEdit = (a: Automation) => {
    setEditId(a.id);
    setForm({
      name: a.name, trigger_event: a.trigger_event, title: a.title, message: a.message,
      type: a.type, link: a.link || "", target_role: a.target_role, delay_minutes: a.delay_minutes,
    });
    setCreating(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Automações de notificação</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Configure envios automáticos baseados em eventos do sistema</p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditId(null); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Nova automação
        </button>
      </div>

      {creating && (
        <div className="border border-primary/30 bg-primary/5 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            {editId ? "Editar automação" : "Nova automação"}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nome</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Confirmação de agendamento" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Evento disparador</label>
              <select value={form.trigger_event} onChange={e => setForm(f => ({ ...f, trigger_event: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none">
                {triggerEvents.map(ev => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none">
                {notifTypes.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Destinatário</label>
              <select value={form.target_role} onChange={e => setForm(f => ({ ...f, target_role: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none">
                <option value="user">Usuários (torcedores)</option>
                <option value="professional">Profissionais</option>
                <option value="all">Todos</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Delay (minutos)</label>
              <input type="number" min={0} value={form.delay_minutes} onChange={e => setForm(f => ({ ...f, delay_minutes: +e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Link interno (opcional)</label>
              <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="/meus-agendamentos" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Título da notificação</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Mensagem</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Mensagem automática..." rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground text-sm focus:border-primary focus:outline-none resize-none" />
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400 flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>As automações ficam salvas como configuração. Para que sejam disparadas automaticamente, os eventos precisam chamar a edge function <code className="bg-black/20 px-1 rounded">send-push-notification</code> com o parâmetro <code className="bg-black/20 px-1 rounded">automation_trigger</code>.</span>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              <Save className="w-4 h-4" /> Salvar
            </button>
            <button onClick={() => { setCreating(false); setEditId(null); }} className="flex items-center gap-1.5 px-4 py-2 bg-muted border border-border text-muted-foreground rounded-xl text-sm hover:bg-muted/80 transition-colors">
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : automations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma automação configurada</p>
          <p className="text-xs mt-1">Automatize o envio de notificações baseado em eventos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map(a => {
            const ev = triggerEvents.find(e => e.value === a.trigger_event);
            return (
              <div key={a.id} className={`border rounded-2xl p-4 transition-all group ${a.is_active ? "border-border bg-card/50" : "border-border/50 bg-muted/10 opacity-60"}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.is_active ? "bg-primary/20" : "bg-muted/30"}`}>
                    <Zap className={`w-5 h-5 ${a.is_active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-card-foreground">{a.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.is_active ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                        {a.is_active ? "Ativo" : "Pausado"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Gatilho: <span className="text-card-foreground">{ev?.label || a.trigger_event}</span>
                      {a.delay_minutes > 0 && <span className="ml-2 text-muted-foreground flex items-center gap-1 inline-flex"><Clock className="w-3 h-3" /> {a.delay_minutes}min delay</span>}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <NotifTypeBadge type={a.type} />
                      <span className="text-[10px] text-muted-foreground">→ {a.target_role === "user" ? "Torcedores" : a.target_role === "professional" ? "Profissionais" : "Todos"}</span>
                    </div>
                    <p className="text-xs text-card-foreground font-medium mt-2">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.message}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleActive(a.id, a.is_active)} className={`p-2 rounded-lg transition-colors ${a.is_active ? "hover:bg-orange-500/20 text-muted-foreground hover:text-orange-400" : "hover:bg-green-500/20 text-muted-foreground hover:text-green-400"}`}>
                      {a.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button onClick={() => startEdit(a)} className="p-2 rounded-lg hover:bg-secondary/20 text-muted-foreground hover:text-secondary transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => del(a.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────
const HistoryTab = () => {
  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("notification_logs").select("*").order("sent_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("type", filter);
    const { data } = await q;
    if (data) setLogs(data as NotifLog[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Histórico de envios</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Últimos 100 disparos de notificações</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/30 border border-border rounded-xl p-1">
            <button onClick={() => setFilter("all")} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === "all" ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground"}`}>Todos</button>
            {notifTypes.map(t => (
              <button key={t.value} onClick={() => setFilter(t.value)} className={`px-2 py-1 rounded-lg text-xs transition-colors ${filter === t.value ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground"}`}>{t.emoji}</button>
            ))}
          </div>
          <button onClick={load} className="p-2 rounded-xl border border-border hover:bg-muted/50 text-muted-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum envio registrado ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="border border-border rounded-xl p-4 bg-card/30 hover:bg-card/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-medium text-card-foreground">{log.title}</p>
                      <NotifTypeBadge type={log.type} />
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${log.target === "all" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}`}>
                        {log.target === "all" ? "Broadcast" : "Individual"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{log.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {log.in_app_sent} in-app
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> {log.push_sent} push
                      </span>
                      {log.push_failed > 0 && (
                        <span className="text-[10px] text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {log.push_failed} falhou
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                  {format(new Date(log.sent_at), "dd/MM HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── METRICS TAB ─────────────────────────────────────────────────────────────
const MetricsTab = () => {
  const [stats, setStats] = useState({
    total_sent: 0,
    total_in_app: 0,
    total_push: 0,
    total_failed: 0,
    subscribers: 0,
    by_type: {} as Record<string, number>,
    recent_7d: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [logsRes, subsRes] = await Promise.all([
        supabase.from("notification_logs").select("*"),
        supabase.from("push_subscriptions").select("id", { count: "exact" }),
      ]);

      const logs = (logsRes.data || []) as NotifLog[];
      const total_in_app = logs.reduce((s, l) => s + l.in_app_sent, 0);
      const total_push = logs.reduce((s, l) => s + l.push_sent, 0);
      const total_failed = logs.reduce((s, l) => s + l.push_failed, 0);
      const by_type: Record<string, number> = {};
      logs.forEach(l => { by_type[l.type] = (by_type[l.type] || 0) + l.in_app_sent; });
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent_7d = logs.filter(l => new Date(l.sent_at) > sevenDaysAgo).reduce((s, l) => s + l.in_app_sent, 0);

      setStats({
        total_sent: logs.length,
        total_in_app,
        total_push,
        total_failed,
        subscribers: subsRes.count || 0,
        by_type,
        recent_7d,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const maxType = Math.max(...Object.values(stats.by_type), 1);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-card-foreground">Métricas de notificações</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Visão geral do desempenho do sistema de notificações</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Disparos totais", value: stats.total_sent, icon: Send, color: "text-primary", bg: "bg-primary/10" },
          { label: "In-app enviadas", value: stats.total_in_app, icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Push enviadas", value: stats.total_push, icon: Smartphone, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Assinantes push", value: stats.subscribers, icon: Bell, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="border border-border rounded-2xl p-5 bg-card/50">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-3xl font-bold text-card-foreground">{kpi.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Por tipo */}
        <div className="border border-border rounded-2xl p-5 bg-card/50">
          <h4 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Notificações por tipo
          </h4>
          {Object.entries(stats.by_type).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum dado ainda.</p>
          ) : (
            <div className="space-y-3">
              {notifTypes.map(t => {
                const count = stats.by_type[t.value] || 0;
                const pct = maxType > 0 ? (count / maxType) * 100 : 0;
                return (
                  <div key={t.value}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{t.emoji} {t.label}</span>
                      <span className="text-card-foreground font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="border border-border rounded-2xl p-5 bg-card/50 space-y-4">
          <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Resumo de desempenho
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <p className="text-xs text-muted-foreground flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Enviadas últimos 7 dias</p>
              <p className="text-sm font-bold text-card-foreground">{stats.recent_7d.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <p className="text-xs text-muted-foreground flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Taxa de entrega push</p>
              <p className="text-sm font-bold text-green-400">
                {stats.total_push + stats.total_failed > 0
                  ? `${Math.round((stats.total_push / (stats.total_push + stats.total_failed)) * 100)}%`
                  : "—"}
              </p>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <p className="text-xs text-muted-foreground flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> Push com falha</p>
              <p className="text-sm font-bold text-red-400">{stats.total_failed.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between py-2">
              <p className="text-xs text-muted-foreground flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Média por disparo</p>
              <p className="text-sm font-bold text-card-foreground">
                {stats.total_sent > 0 ? Math.round(stats.total_in_app / stats.total_sent) : "—"} in-app
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const NotificationManager = () => {
  const [activeTab, setActiveTab] = useState<TabId>("send");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-0 flex-shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl text-card-foreground">Central de Notificações</h2>
            <p className="text-xs text-muted-foreground">Gerencie, configure e automatize notificações da plataforma</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/30 border border-border rounded-2xl p-1 w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-card-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === "send" && <SendTab />}
        {activeTab === "templates" && <TemplatesTab />}
        {activeTab === "automations" && <AutomationsTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "metrics" && <MetricsTab />}
      </div>
    </div>
  );
};

export default NotificationManager;
