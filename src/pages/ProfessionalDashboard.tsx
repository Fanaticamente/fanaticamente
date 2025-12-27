import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Users, TrendingUp, Settings, LogOut, Plus, CheckCircle, XCircle, Edit2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  user_id: string;
}

const ProfessionalDashboard = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableDates, setAvailableDates] = useState<{ date: string; times: string[] }[]>([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTimes, setNewTimes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"agenda" | "disponibilidade" | "metricas">("agenda");

  useEffect(() => {
    if (!hasRole("professional")) {
      navigate("/");
      return;
    }
  }, [hasRole, navigate]);

  const stats = [
    { label: "Consultas este mês", value: "24", icon: Calendar, color: "text-primary" },
    { label: "Pacientes atendidos", value: "18", icon: Users, color: "text-secondary" },
    { label: "Taxa de conclusão", value: "94%", icon: TrendingUp, color: "text-green-500" },
    { label: "Avaliação média", value: "4.9", icon: CheckCircle, color: "text-yellow-500" },
  ];

  const demoAppointments = [
    { id: "1", patientName: "João Silva", date: format(addDays(new Date(), 1), "dd/MM/yyyy"), time: "09:00", status: "confirmed" },
    { id: "2", patientName: "Maria Santos", date: format(addDays(new Date(), 1), "dd/MM/yyyy"), time: "10:00", status: "pending" },
    { id: "3", patientName: "Pedro Costa", date: format(addDays(new Date(), 2), "dd/MM/yyyy"), time: "14:00", status: "confirmed" },
    { id: "4", patientName: "Ana Oliveira", date: format(addDays(new Date(), 3), "dd/MM/yyyy"), time: "15:00", status: "pending" },
  ];

  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

  const handleAddAvailability = () => {
    if (!newDate || newTimes.length === 0) {
      toast.error("Selecione data e horários");
      return;
    }
    setAvailableDates([...availableDates, { date: newDate, times: newTimes }]);
    toast.success("Disponibilidade adicionada!");
    setShowAddSlot(false);
    setNewDate("");
    setNewTimes([]);
  };

  const toggleTime = (time: string) => {
    if (newTimes.includes(time)) {
      setNewTimes(newTimes.filter((t) => t !== time));
    } else {
      setNewTimes([...newTimes, time]);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="font-display text-2xl text-primary">
              Painel do Profissional
            </h1>
            <p className="text-muted-foreground text-sm">
              Bem-vindo, {user?.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-8 px-4 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-muted-foreground text-sm">{stat.label}</span>
              </div>
              <p className="font-display text-3xl text-card-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "agenda", label: "Agenda" },
            { id: "disponibilidade", label: "Disponibilidade" },
            { id: "metricas", label: "Métricas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Agenda Tab */}
        {activeTab === "agenda" && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl text-card-foreground mb-4">
              Próximos Agendamentos
            </h2>
            {demoAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-card-foreground">{apt.patientName}</h3>
                    <p className="text-muted-foreground text-sm">
                      {apt.date} às {apt.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      apt.status === "confirmed"
                        ? "bg-secondary/20 text-secondary"
                        : "bg-yellow-500/20 text-yellow-500"
                    }`}
                  >
                    {apt.status === "confirmed" ? "Confirmado" : "Pendente"}
                  </span>
                  {apt.status === "pending" && (
                    <div className="flex gap-1">
                      <button className="p-2 hover:bg-secondary/20 rounded-lg transition-colors">
                        <CheckCircle className="w-5 h-5 text-secondary" />
                      </button>
                      <button className="p-2 hover:bg-destructive/20 rounded-lg transition-colors">
                        <XCircle className="w-5 h-5 text-destructive" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disponibilidade Tab */}
        {activeTab === "disponibilidade" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-card-foreground">
                Seus Horários
              </h2>
              <button
                onClick={() => setShowAddSlot(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:scale-[1.02] transition-transform"
              >
                <Plus className="w-5 h-5" />
                Adicionar
              </button>
            </div>

            {showAddSlot && (
              <div className="bg-card border border-border rounded-xl p-4 mb-4 animate-fade-in">
                <h3 className="font-medium text-card-foreground mb-4">Nova Disponibilidade</h3>
                <div className="mb-4">
                  <label className="block text-muted-foreground text-sm mb-2">Data</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-card-foreground"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-muted-foreground text-sm mb-2">Horários</label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => toggleTime(time)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          newTimes.includes(time)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddAvailability}
                    className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setShowAddSlot(false)}
                    className="flex-1 py-3 bg-muted text-muted-foreground rounded-xl font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {availableDates.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma disponibilidade cadastrada
                  </p>
                </div>
              ) : (
                availableDates.map((slot, index) => (
                  <div
                    key={index}
                    className="bg-card border border-border rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-card-foreground">
                        {format(new Date(slot.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </h3>
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slot.times.map((time) => (
                        <span
                          key={time}
                          className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Métricas Tab */}
        {activeTab === "metricas" && (
          <div>
            <h2 className="font-display text-2xl text-card-foreground mb-4">
              Métricas de Desempenho
            </h2>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-card-foreground mb-4">Consultas por Semana</h3>
                  <div className="h-48 bg-muted/50 rounded-xl flex items-center justify-center">
                    <span className="text-muted-foreground">Gráfico em breve</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-card-foreground mb-4">Taxa de Satisfação</h3>
                  <div className="h-48 bg-muted/50 rounded-xl flex items-center justify-center">
                    <span className="text-muted-foreground">Gráfico em breve</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfessionalDashboard;
