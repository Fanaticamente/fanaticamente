import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { parseISO, format } from "date-fns";

interface ThemeStyles {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  hoverBg: string;
  tableBg: string;
}

interface AdminAppointmentsTableProps {
  themeStyles: ThemeStyles;
  searchTerm: string;
}

interface Appointment {
  id: string;
  user_id: string;
  professional_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  consultation_link: string | null;
  created_at: string;
  userName?: string;
  professionalName?: string;
}

const fetchAppointmentsData = async (): Promise<Appointment[]> => {
  // Fetch appointments
  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from("appointments")
    .select("*")
    .order("scheduled_date", { ascending: false });

  if (appointmentsError) throw appointmentsError;

  // Fetch user profiles
  const userIds = [...new Set((appointmentsData || []).map(a => a.user_id))];
  const { data: userProfiles } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", userIds);

  // Fetch professionals with profiles
  const professionalIds = [...new Set((appointmentsData || []).map(a => a.professional_id))];
  const { data: professionals } = await supabase
    .from("professionals")
    .select("id, user_id")
    .in("id", professionalIds);

  const profUserIds = (professionals || []).map(p => p.user_id);
  const { data: profProfiles } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", profUserIds);

  // Create maps
  const userNamesMap = new Map<string, string>();
  (userProfiles || []).forEach(p => {
    userNamesMap.set(p.user_id, p.full_name || "Sem nome");
  });

  const profIdToUserIdMap = new Map<string, string>();
  (professionals || []).forEach(p => {
    profIdToUserIdMap.set(p.id, p.user_id);
  });

  const profUserNamesMap = new Map<string, string>();
  (profProfiles || []).forEach(p => {
    profUserNamesMap.set(p.user_id, p.full_name || "Sem nome");
  });

  return (appointmentsData || []).map(a => ({
    ...a,
    userName: userNamesMap.get(a.user_id) || "Usuário desconhecido",
    professionalName: profUserNamesMap.get(profIdToUserIdMap.get(a.professional_id) || "") || "Profissional desconhecido"
  }));
};

const AdminAppointmentsTable = ({ themeStyles, searchTerm }: AdminAppointmentsTableProps) => {
  const { data: appointments = [], isLoading: loading } = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: fetchAppointmentsData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const filteredAppointments = appointments.filter(apt => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      apt.userName?.toLowerCase().includes(search) ||
      apt.professionalName?.toLowerCase().includes(search) ||
      apt.status?.toLowerCase().includes(search)
    );
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "confirmed":
        return { label: "Confirmado", className: "bg-green-500/20 text-green-500", icon: CheckCircle2 };
      case "pending":
        return { label: "Pendente", className: "bg-yellow-500/20 text-yellow-500", icon: Clock };
      case "in_progress":
        return { label: "Em Atendimento", className: "bg-purple-500/20 text-purple-500", icon: Play };
      case "completed":
        return { label: "Concluído", className: "bg-blue-500/20 text-blue-500", icon: CheckCircle2 };
      case "cancelled":
        return { label: "Cancelado", className: "bg-red-500/20 text-red-500", icon: XCircle };
      default:
        return { label: status, className: "bg-gray-500/20 text-gray-500", icon: AlertCircle };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl overflow-hidden`}>
      <div className={`p-4 border-b ${themeStyles.border} flex items-center justify-between`}>
        <h2 className={`font-display text-xl ${themeStyles.text}`}>
          Agendamentos ({filteredAppointments.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={themeStyles.tableBg}>
            <tr>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Paciente</th>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Profissional</th>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Data</th>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Horário</th>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Status</th>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Link</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((apt) => {
                const statusInfo = getStatusInfo(apt.status);
                return (
                  <tr key={apt.id} className={`border-b ${themeStyles.border} ${themeStyles.hoverBg}`}>
                    <td className="p-4">
                      <span className={themeStyles.text}>{apt.userName}</span>
                    </td>
                    <td className={`p-4 ${themeStyles.text}`}>{apt.professionalName}</td>
                    <td className={`p-4 ${themeStyles.textMuted}`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(apt.scheduled_date), "dd/MM/yyyy")}
                      </div>
                    </td>
                    <td className={`p-4 ${themeStyles.textMuted}`}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {apt.scheduled_time}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${statusInfo.className}`}>
                        <statusInfo.icon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className={`p-4 ${themeStyles.textMuted}`}>
                      {apt.consultation_link ? (
                        <a 
                          href={apt.consultation_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          Acessar
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className={`p-8 text-center ${themeStyles.textMuted}`}>
                  {searchTerm ? "Nenhum agendamento encontrado" : "Nenhum agendamento registrado"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAppointmentsTable;
