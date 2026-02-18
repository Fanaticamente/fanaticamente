import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Trash2, BookOpen, Calendar, CreditCard, Info, AlertTriangle, Gift, BellOff } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "appointment":
      return <Calendar className="w-5 h-5 text-therapy" />;
    case "course":
      return <BookOpen className="w-5 h-5 text-amber-400" />;
    case "payment":
      return <CreditCard className="w-5 h-5 text-green-400" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    case "promo":
      return <Gift className="w-5 h-5 text-pink-400" />;
    default:
      return <Info className="w-5 h-5 text-blue-400" />;
  }
};

const getNotificationIconBg = (type: string) => {
  switch (type) {
    case "appointment":
      return "bg-therapy/15";
    case "course":
      return "bg-amber-400/15";
    case "payment":
      return "bg-green-400/15";
    case "warning":
      return "bg-yellow-400/15";
    case "promo":
      return "bg-pink-400/15";
    default:
      return "bg-blue-400/15";
  }
};

const formatNotificationDate = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
};

const Notificacoes = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, isLoading: pushLoading, permission: pushPermission, subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushNotifications();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setNotifications((data as Notification[]) || []);
      setDataLoading(false);
    };
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("user_notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("user_notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success("Todas as notificações marcadas como lidas");
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("user_notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) markAsRead(notification.id);
    if (notification.link) navigate(notification.link);
  };

  const Content = () => (
    <div className="space-y-4">
      {/* Push notification toggle */}
      {pushSupported && pushPermission !== "denied" && (
        <div className={`flex items-center justify-between p-4 rounded-xl border ${
          pushSubscribed ? "bg-primary/5 border-primary/20" : "bg-card border-border"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pushSubscribed ? "bg-primary/15" : "bg-muted"}`}>
              {pushSubscribed ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">Notificações Push</p>
              <p className="text-xs text-muted-foreground">
                {pushSubscribed ? "Ativas — você receberá alertas mesmo com o app fechado" : "Receba alertas mesmo com o app fechado"}
              </p>
            </div>
          </div>
          <button
            onClick={() => pushSubscribed ? unsubscribePush() : subscribePush()}
            disabled={pushLoading}
            className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${
              pushSubscribed ? "bg-primary" : "bg-muted-foreground/30"
            } disabled:opacity-50`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${pushSubscribed ? "right-1" : "left-1"}`} />
          </button>
        </div>
      )}

      {/* Header actions */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo lido"}
          </p>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como lidas
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!dataLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg text-card-foreground mb-1">Nenhuma notificação</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Suas notificações de agendamentos, cursos e pagamentos aparecerão aqui.
          </p>
        </div>
      )}

      {/* Notifications list */}
      <div className="space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer group ${
              notification.is_read
                ? "bg-card border-border hover:border-muted-foreground/30"
                : "bg-primary/5 border-primary/20 hover:border-primary/40"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationIconBg(notification.type)}`}>
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-medium ${notification.is_read ? "text-card-foreground" : "text-card-foreground"}`}>
                  {notification.title}
                </p>
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {formatNotificationDate(notification.created_at)} · {format(parseISO(notification.created_at), "HH:mm")}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(notification.id);
              }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all flex-shrink-0"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading || dataLoading) return null;

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 px-4 pb-28">
          <h1 className="font-display text-xl text-card-foreground mb-4">Notificações</h1>
          <Content />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <UserDesktopLayout title="Notificações" subtitle="Acompanhe seus alertas e atualizações">
      <Content />
    </UserDesktopLayout>
  );
};

export default Notificacoes;
