import { useState, useEffect } from "react";
import { Bell, Info, AlertTriangle, AlertCircle, CheckCircle, X, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdminMessage {
  id: string;
  message: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

interface AdminMessagesAlertProps {
  professionalId: string;
}

const AdminMessagesAlert = ({ professionalId }: AdminMessagesAlertProps) => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMessages();
  }, [professionalId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_messages")
        .select("*")
        .eq("professional_id", professionalId)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (messageId: string) => {
    try {
      await supabase
        .from("admin_messages")
        .update({ is_read: true })
        .eq("id", messageId);

      setDismissedIds(prev => new Set([...prev, messageId]));
    } catch (error) {
      console.error("Error dismissing message:", error);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "approval":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejection":
        return <XCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case "info":
        return "bg-blue-500/10 border-blue-500/30";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "alert":
        return "bg-red-500/10 border-red-500/30";
      case "approval":
        return "bg-green-500/10 border-green-500/30";
      case "rejection":
        return "bg-orange-500/10 border-orange-500/30";
      default:
        return "bg-muted/50 border-border";
    }
  };

  const visibleMessages = messages.filter(m => !dismissedIds.has(m.id));

  if (loading || visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {visibleMessages.map((message) => (
        <div
          key={message.id}
          className={`p-4 rounded-xl border ${getMessageStyle(message.message_type)} flex items-start gap-3`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getMessageIcon(message.message_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-card-foreground">{message.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(parseISO(message.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <button
            onClick={() => handleDismiss(message.id)}
            className="flex-shrink-0 p-1 hover:bg-background/50 rounded-lg transition-colors"
            title="Dispensar"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AdminMessagesAlert;
