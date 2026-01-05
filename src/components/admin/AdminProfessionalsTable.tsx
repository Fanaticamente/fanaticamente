import { useState, useEffect } from "react";
import { MoreVertical, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThemeStyles {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  hoverBg: string;
  tableBg: string;
}

interface AdminProfessionalsTableProps {
  themeStyles: ThemeStyles;
  searchTerm: string;
}

interface Professional {
  id: string;
  user_id: string;
  crp: string;
  bio: string | null;
  specialties: string[] | null;
  hourly_rate: number | null;
  experience_years: number | null;
  is_active: boolean;
  is_verified: boolean;
  subscription_type: string | null;
  subscription_expires_at: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  appointmentsCount: number;
}

const AdminProfessionalsTable = ({ themeStyles, searchTerm }: AdminProfessionalsTableProps) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);

      // Fetch professionals
      const { data: professionalsData, error: professionalsError } = await supabase
        .from("professionals")
        .select("*")
        .order("created_at", { ascending: false });

      if (professionalsError) throw professionalsError;

      // Fetch profiles for names
      const userIds = (professionalsData || []).map(p => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      // Fetch appointment counts
      const { data: appointments } = await supabase
        .from("appointments")
        .select("professional_id");

      const appointmentCounts = new Map<string, number>();
      (appointments || []).forEach(a => {
        const count = appointmentCounts.get(a.professional_id) || 0;
        appointmentCounts.set(a.professional_id, count + 1);
      });

      // Map profiles and counts to professionals
      const profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      (profiles || []).forEach(p => {
        profilesMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url });
      });

      const professionalsWithDetails = (professionalsData || []).map(p => ({
        ...p,
        profile: profilesMap.get(p.user_id),
        appointmentsCount: appointmentCounts.get(p.id) || 0
      }));

      setProfessionals(professionalsWithDetails);
    } catch (error) {
      console.error("Error fetching professionals:", error);
      toast.error("Erro ao carregar profissionais");
    } finally {
      setLoading(false);
    }
  };

  const filteredProfessionals = professionals.filter(prof => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      prof.profile?.full_name?.toLowerCase().includes(search) ||
      prof.crp?.toLowerCase().includes(search) ||
      prof.specialties?.some(s => s.toLowerCase().includes(search))
    );
  });

  const getSubscriptionLabel = (type: string | null) => {
    switch (type) {
      case "annual": return "Anual";
      case "semiannual": return "Semestral";
      case "monthly": return "Mensal";
      default: return "Nenhum";
    }
  };

  const getStatusInfo = (prof: Professional) => {
    if (!prof.is_active) {
      return { label: "Inativo", className: "bg-gray-500/20 text-gray-500", icon: XCircle };
    }
    if (!prof.is_verified) {
      return { label: "Pendente", className: "bg-yellow-500/20 text-yellow-500", icon: Clock };
    }
    return { label: "Ativo", className: "bg-green-500/20 text-green-500", icon: CheckCircle2 };
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
          Profissionais Parceiros ({filteredProfessionals.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={themeStyles.tableBg}>
            <tr>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Profissional</th>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>CRP</th>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Especialidades</th>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Plano</th>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Consultas</th>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Status</th>
              <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfessionals.length > 0 ? (
              filteredProfessionals.map((prof) => {
                const statusInfo = getStatusInfo(prof);
                return (
                  <tr key={prof.id} className={`border-b ${themeStyles.border} ${themeStyles.hoverBg}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                          {prof.profile?.avatar_url ? (
                            <img 
                              src={prof.profile.avatar_url} 
                              alt="" 
                              className="w-8 h-8 rounded-full object-cover object-top"
                            />
                          ) : (
                            <span className="text-sm">🧑‍⚕️</span>
                          )}
                        </div>
                        <span className={themeStyles.text}>
                          {prof.profile?.full_name || "Sem nome"}
                        </span>
                      </div>
                    </td>
                    <td className={`p-4 ${themeStyles.textMuted}`}>{prof.crp}</td>
                    <td className={`p-4 ${themeStyles.text}`}>
                      {prof.specialties?.slice(0, 2).join(", ") || "-"}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                        {getSubscriptionLabel(prof.subscription_type)}
                      </span>
                    </td>
                    <td className={`p-4 ${themeStyles.text}`}>{prof.appointmentsCount}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${statusInfo.className}`}>
                        <statusInfo.icon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className={`p-2 ${themeStyles.hoverBg} rounded-lg transition-colors`}>
                        <MoreVertical className={`w-4 h-4 ${themeStyles.textMuted}`} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className={`p-8 text-center ${themeStyles.textMuted}`}>
                  {searchTerm ? "Nenhum profissional encontrado" : "Nenhum profissional cadastrado"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProfessionalsTable;
