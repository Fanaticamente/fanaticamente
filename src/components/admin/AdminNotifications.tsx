import { useState } from "react";
import { Bell, Send, Users, User, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminNotificationsProps {
  themeStyles: {
    bg: string;
    sidebar: string;
    card: string;
    text: string;
    textMuted: string;
    border: string;
    inputBg: string;
    hoverBg: string;
    tableBg: string;
  };
}

type NotifType = "info" | "appointment" | "course" | "payment" | "warning" | "promo";
type TargetType = "all" | "specific";

interface SendResult {
  in_app_sent: number;
  push_sent: number;
  push_failed: number;
  vapid_configured: boolean;
}

const notifTypes: { value: NotifType; label: string; emoji: string }[] = [
  { value: "info", label: "Informação", emoji: "ℹ️" },
  { value: "appointment", label: "Agendamento", emoji: "📅" },
  { value: "course", label: "Curso", emoji: "📚" },
  { value: "payment", label: "Pagamento", emoji: "💳" },
  { value: "warning", label: "Aviso", emoji: "⚠️" },
  { value: "promo", label: "Promoção", emoji: "🎁" },
];

const AdminNotifications = ({ themeStyles }: AdminNotificationsProps) => {
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetUserEmail, setTargetUserEmail] = useState("");
  const [searchingUser, setSearchingUser] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotifType>("info");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<SendResult | null>(null);

  const searchUser = async () => {
    if (!targetUserEmail.trim()) return;
    setSearchingUser(true);
    setTargetUserId("");
    try {
      const { data, error } = await supabase.functions.invoke("get-user-emails", {
        body: { search: targetUserEmail.trim() },
      });
      if (error) throw error;
      if (data?.users?.length > 0) {
        const found = data.users[0];
        setTargetUserId(found.id);
        toast.success(`Usuário encontrado: ${found.email}`);
      } else {
        toast.error("Nenhum usuário encontrado com esse e-mail.");
      }
    } catch (e) {
      toast.error("Erro ao buscar usuário.");
    } finally {
      setSearchingUser(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Título e mensagem são obrigatórios.");
      return;
    }
    if (targetType === "specific" && !targetUserId) {
      toast.error("Busque e selecione um usuário primeiro.");
      return;
    }

    setSending(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          title: title.trim(),
          message: message.trim(),
          type,
          link: link.trim() || undefined,
          target_user_id: targetType === "specific" ? targetUserId : undefined,
        },
      });

      if (error) throw error;

      setLastResult(data);
      toast.success(`Notificação enviada para ${data.in_app_sent} usuário(s)!`);

      // Reset form
      setTitle("");
      setMessage("");
      setLink("");
      setType("info");
      setTargetUserId("");
      setTargetUserEmail("");
      setTargetType("all");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar notificação.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`font-display text-2xl ${themeStyles.text} mb-1`}>Notificações</h2>
        <p className={`${themeStyles.textMuted} text-sm`}>
          Envie notificações in-app e push para usuários da plataforma.
        </p>
      </div>

      {/* VAPID info card */}
      <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-4`}>
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className={`${themeStyles.text} text-sm font-medium mb-1`}>Sobre as Push Notifications</p>
            <p className={`${themeStyles.textMuted} text-xs leading-relaxed`}>
              As notificações <strong>in-app</strong> funcionam sempre. Para notificações <strong>push nativas</strong> (celular fechado),
              é necessário configurar as chaves VAPID. Gere em{" "}
              <a
                href="https://vapidkeys.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary underline"
              >
                vapidkeys.com
              </a>{" "}
              e adicione como secrets: <code className="text-xs bg-black/20 px-1 rounded">VAPID_PUBLIC_KEY</code>,{" "}
              <code className="text-xs bg-black/20 px-1 rounded">VAPID_PRIVATE_KEY</code> e{" "}
              <code className="text-xs bg-black/20 px-1 rounded">VAPID_SUBJECT</code> (ex: mailto:seu@email.com).
            </p>
          </div>
        </div>
      </div>

      <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6 space-y-5`}>
        {/* Target */}
        <div>
          <label className={`block text-sm font-medium ${themeStyles.text} mb-2`}>Destinatário</label>
          <div className="flex gap-3">
            <button
              onClick={() => setTargetType("all")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm transition-colors ${
                targetType === "all"
                  ? "bg-secondary border-secondary text-secondary-foreground"
                  : `${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.textMuted}`
              }`}
            >
              <Users className="w-4 h-4" />
              Todos os usuários
            </button>
            <button
              onClick={() => setTargetType("specific")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm transition-colors ${
                targetType === "specific"
                  ? "bg-secondary border-secondary text-secondary-foreground"
                  : `${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.textMuted}`
              }`}
            >
              <User className="w-4 h-4" />
              Usuário específico
            </button>
          </div>
        </div>

        {/* User search */}
        {targetType === "specific" && (
          <div>
            <label className={`block text-sm font-medium ${themeStyles.text} mb-2`}>E-mail do usuário</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={targetUserEmail}
                onChange={(e) => setTargetUserEmail(e.target.value)}
                placeholder="usuario@email.com"
                className={`flex-1 px-3 py-2.5 rounded-xl border ${themeStyles.border} ${themeStyles.inputBg} ${themeStyles.text} text-sm focus:border-secondary focus:outline-none`}
                onKeyDown={(e) => e.key === "Enter" && searchUser()}
              />
              <button
                onClick={searchUser}
                disabled={searchingUser}
                className="px-4 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm disabled:opacity-50"
              >
                {searchingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
              </button>
            </div>
            {targetUserId && (
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Usuário selecionado
              </p>
            )}
          </div>
        )}

        {/* Type */}
        <div>
          <label className={`block text-sm font-medium ${themeStyles.text} mb-2`}>Tipo</label>
          <div className="flex flex-wrap gap-2">
            {notifTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                  type === t.value
                    ? "bg-secondary border-secondary text-secondary-foreground"
                    : `${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.textMuted}`
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className={`block text-sm font-medium ${themeStyles.text} mb-2`}>Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da notificação"
            maxLength={80}
            className={`w-full px-3 py-2.5 rounded-xl border ${themeStyles.border} ${themeStyles.inputBg} ${themeStyles.text} text-sm focus:border-secondary focus:outline-none`}
          />
          <p className={`text-xs ${themeStyles.textMuted} mt-1`}>{title.length}/80</p>
        </div>

        {/* Message */}
        <div>
          <label className={`block text-sm font-medium ${themeStyles.text} mb-2`}>Mensagem</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Texto da notificação..."
            rows={3}
            maxLength={250}
            className={`w-full px-3 py-2.5 rounded-xl border ${themeStyles.border} ${themeStyles.inputBg} ${themeStyles.text} text-sm focus:border-secondary focus:outline-none resize-none`}
          />
          <p className={`text-xs ${themeStyles.textMuted} mt-1`}>{message.length}/250</p>
        </div>

        {/* Link (optional) */}
        <div>
          <label className={`block text-sm font-medium ${themeStyles.text} mb-2`}>
            Link interno <span className={`${themeStyles.textMuted} font-normal`}>(opcional)</span>
          </label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/cursos ou /meus-agendamentos"
            className={`w-full px-3 py-2.5 rounded-xl border ${themeStyles.border} ${themeStyles.inputBg} ${themeStyles.text} text-sm focus:border-secondary focus:outline-none`}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium disabled:opacity-50 transition-opacity"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar notificação
            </>
          )}
        </button>

        {/* Result */}
        {lastResult && (
          <div className={`rounded-xl border ${themeStyles.border} p-4 space-y-2`}>
            <p className={`text-sm font-medium ${themeStyles.text} flex items-center gap-2`}>
              <CheckCircle className="w-4 h-4 text-green-400" />
              Resultado do envio
            </p>
            <div className={`text-xs ${themeStyles.textMuted} space-y-1`}>
              <p>📬 In-app enviadas: <strong className={themeStyles.text}>{lastResult.in_app_sent}</strong></p>
              <p>📲 Push enviadas: <strong className={themeStyles.text}>{lastResult.push_sent}</strong></p>
              {lastResult.push_failed > 0 && (
                <p>❌ Push com falha: <strong className="text-red-400">{lastResult.push_failed}</strong></p>
              )}
              {!lastResult.vapid_configured && (
                <p className="flex items-center gap-1 text-amber-400">
                  <AlertCircle className="w-3 h-3" />
                  VAPID não configurado — push nativo desabilitado
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
