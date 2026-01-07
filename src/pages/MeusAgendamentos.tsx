import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Loader2, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import SessionInfoDialog from "@/components/user/SessionInfoDialog";

interface Appointment {
  id: string;
  professional_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  consultation_link: string | null;
  created_at: string;
  professional?: {
    crp: string;
    degree: string | null;
    hourly_rate: number | null;
  } | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    phone?: string | null;
  } | null;
  professional_email?: string;
}

const MeusAgendamentos = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time", { ascending: false });

      if (appointmentsError) throw appointmentsError;

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        return;
      }

      // Get unique professional IDs
      const professionalIds = [...new Set(appointmentsData.map(a => a.professional_id))];

      // Fetch professionals
      const { data: professionalsData } = await supabase
        .from("professionals")
        .select("id, user_id, crp, degree, hourly_rate")
        .in("id", professionalIds);

      // Get user IDs from professionals to fetch their profiles
      const professionalUserIds = professionalsData?.map(p => p.user_id) || [];

      // Fetch profiles for professionals
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", professionalUserIds);

      // Create maps for quick lookup
      const professionalsMap = new Map(
        (professionalsData || []).map(p => [p.id, p])
      );
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      // Enrich appointments with professional and profile data
      const enrichedAppointments = appointmentsData.map(apt => {
        const professional = professionalsMap.get(apt.professional_id);
        const profile = professional ? profilesMap.get(professional.user_id) : null;
        return {
          ...apt,
          professional: professional ? {
            crp: professional.crp,
            degree: professional.degree,
            hourly_rate: professional.hourly_rate
          } : null,
          profile: profile || null
        };
      });

      setAppointments(enrichedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, date: string) => {
    const appointmentDate = parseISO(date);
    const past = isPast(appointmentDate) && !isToday(appointmentDate);

    if (status === "in_progress") {
      return {
        label: "Em Atendimento",
        className: "bg-blue-500/20 text-blue-500",
        icon: Clock
      };
    } else if (status === "link_sent") {
      return {
        label: "Link Enviado",
        className: "bg-cyan-500/20 text-cyan-500",
        icon: CheckCircle
      };
    } else if (status === "confirmed") {
      return {
        label: past ? "Realizada" : "Confirmada",
        className: "bg-green-500/20 text-green-500",
        icon: CheckCircle
      };
    } else if (status === "completed") {
      return {
        label: "Concluída",
        className: "bg-purple-500/20 text-purple-500",
        icon: CheckCircle
      };
    } else if (status === "cancelled") {
      return {
        label: "Cancelada",
        className: "bg-red-500/20 text-red-500",
        icon: XCircle
      };
    } else {
      return {
        label: "Pendente",
        className: "bg-yellow-500/20 text-yellow-500",
        icon: AlertCircle
      };
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const appointmentDate = parseISO(apt.scheduled_date);
    const past = isPast(appointmentDate) && !isToday(appointmentDate);

    if (filter === "upcoming") return !past;
    if (filter === "past") return past;
    return true;
  });

  const upcomingCount = appointments.filter(apt => {
    const appointmentDate = parseISO(apt.scheduled_date);
    return !isPast(appointmentDate) || isToday(appointmentDate);
  }).length;

  const pastCount = appointments.filter(apt => {
    const appointmentDate = parseISO(apt.scheduled_date);
    return isPast(appointmentDate) && !isToday(appointmentDate);
  }).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/perfil")}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="font-display text-xl text-card-foreground">
              Meus Agendamentos
            </h1>
            <p className="text-muted-foreground text-sm">
              {appointments.length} consulta{appointments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-8 px-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              filter === "upcoming"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Próximas
            {upcomingCount > 0 && (
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                filter === "upcoming" ? "bg-white/20" : "bg-primary text-primary-foreground"
              }`}>
                {upcomingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              filter === "past"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Realizadas
            {pastCount > 0 && (
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                filter === "past" ? "bg-white/20" : "bg-muted-foreground/20"
              }`}>
                {pastCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Todas
          </button>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-card-foreground font-medium mb-2">
              {filter === "upcoming" 
                ? "Nenhuma consulta agendada" 
                : filter === "past" 
                ? "Nenhuma consulta realizada" 
                : "Nenhum agendamento"}
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              {filter === "upcoming" 
                ? "Agende uma sessão com um dos nossos especialistas" 
                : "Suas consultas passadas aparecerão aqui"}
            </p>
            {filter === "upcoming" && (
              <button
                onClick={() => navigate("/terapeutas")}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Ver Especialistas
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => {
              const statusBadge = getStatusBadge(apt.status, apt.scheduled_date);
              const StatusIcon = statusBadge.icon;
              const appointmentDate = parseISO(apt.scheduled_date);
              const isPastAppointment = isPast(appointmentDate) && !isToday(appointmentDate);

              return (
                <div
                  key={apt.id}
                  className={`bg-card border border-border rounded-2xl p-4 transition-colors ${
                    isPastAppointment ? "opacity-75" : ""
                  }`}
                >
                  {/* Header with status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-therapy/20 flex items-center justify-center overflow-hidden">
                        {apt.profile?.avatar_url ? (
                          <img 
                            src={apt.profile.avatar_url} 
                            alt={apt.profile.full_name || "Profissional"} 
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <User className="w-6 h-6 text-therapy" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-card-foreground">
                          {apt.profile?.full_name || "Profissional"}
                        </h3>
                        {apt.professional && (
                          <p className="text-muted-foreground text-sm">
                            CRP {apt.professional.crp}
                            {apt.professional.degree && ` • ${apt.professional.degree}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.className}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-card-foreground text-sm">
                        {format(appointmentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-card-foreground text-sm">
                        {apt.scheduled_time}
                      </span>
                    </div>
                  </div>

                  {/* Price if available */}
                  {apt.professional?.hourly_rate && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Valor da sessão</span>
                      <span className="text-card-foreground font-bold">
                        R$ {apt.professional.hourly_rate.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  )}


                  {/* Session Info Button - for confirmed, link_sent, and in_progress appointments */}
                  {!isPastAppointment && (apt.status === "confirmed" || apt.status === "link_sent" || apt.status === "in_progress") && (
                    <button
                      onClick={() => setSelectedAppointment(apt)}
                      className="w-full mt-3 py-3 bg-therapy text-therapy-foreground rounded-xl font-medium hover:bg-therapy/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      Informações da Sessão
                    </button>
                  )}

                  {/* Pending status info */}
                  {apt.status === "pending" && (
                    <div className="mt-3 p-3 bg-yellow-500/10 rounded-xl">
                      <p className="text-yellow-600 text-sm text-center">
                        Aguardando confirmação do profissional
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Session Info Dialog */}
        {selectedAppointment && (
          <SessionInfoDialog
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
          />
        )}
      </main>
    </div>
  );
};

export default MeusAgendamentos;