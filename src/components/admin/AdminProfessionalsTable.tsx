import { useState, useEffect } from "react";
import { MoreVertical, CheckCircle2, Clock, XCircle, AlertTriangle, CreditCard, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProfessionalDetailsDialog from "./ProfessionalDetailsDialog";

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
  degree: string | null;
  document_type: string | null;
  document_number: string | null;
  approval_status: string | null;
  rejection_reason: string | null;
  crp_document_front_url: string | null;
  crp_document_back_url: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    birth_date: string | null;
    city: string | null;
    state: string | null;
    favorite_club_id: string | null;
  };
  email?: string;
  club?: {
    id: string;
    name: string;
    primary_color: string;
    badge_url: string | null;
  };
  appointmentsCount: number;
}

interface Club {
  id: string;
  name: string;
  primary_color: string;
  badge_url: string | null;
}

const AdminProfessionalsTable = ({ themeStyles, searchTerm }: AdminProfessionalsTableProps) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchProfessionals();
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const { data: clubsData } = await supabase
        .from("clubs")
        .select("id, name, primary_color, badge_url")
        .order("name");

      if (clubsData) {
        setClubs(clubsData);
      }
    } catch (error) {
      console.error("Error fetching clubs:", error);
    }
  };

  const fetchProfessionals = async () => {
    try {
      setLoading(true);

      // Fetch professionals with all new fields
      const { data: professionalsData, error: professionalsError } = await supabase
        .from("professionals")
        .select("*")
        .order("created_at", { ascending: false });

      if (professionalsError) throw professionalsError;

      // Fetch profiles for names and club info
      const userIds = (professionalsData || []).map(p => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, phone, birth_date, city, state, favorite_club_id")
        .in("user_id", userIds);

      // Fetch clubs for professionals
      const clubIds = [...new Set((profiles || []).map(p => p.favorite_club_id).filter(Boolean))];
      const { data: clubsData } = await supabase
        .from("clubs")
        .select("id, name, primary_color, badge_url")
        .in("id", clubIds);

      // Fetch emails via edge function
      let emailsMap = new Map<string, string>();
      try {
        const { data: emailsData } = await supabase.functions.invoke("get-user-emails", {
          body: { userIds }
        });
        if (emailsData?.emails) {
          emailsMap = new Map(Object.entries(emailsData.emails));
        }
      } catch (error) {
        console.error("Error fetching emails:", error);
      }

      // Fetch appointment counts
      const { data: appointments } = await supabase
        .from("appointments")
        .select("professional_id");

      const appointmentCounts = new Map<string, number>();
      (appointments || []).forEach(a => {
        const count = appointmentCounts.get(a.professional_id) || 0;
        appointmentCounts.set(a.professional_id, count + 1);
      });

      // Create maps
      const profilesMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );
      const clubsMap = new Map(
        (clubsData || []).map(c => [c.id, c])
      );

      // Combine data
      const professionalsWithDetails = (professionalsData || []).map(p => {
        const profile = profilesMap.get(p.user_id);
        return {
          ...p,
          profile,
          email: emailsMap.get(p.user_id),
          club: profile?.favorite_club_id ? clubsMap.get(profile.favorite_club_id) : undefined,
          appointmentsCount: appointmentCounts.get(p.id) || 0
        };
      });

      setProfessionals(professionalsWithDetails);
      
      // Auto-expand clubs that have professionals
      const clubsWithProfessionals = new Set(
        professionalsWithDetails
          .filter(p => p.club?.id)
          .map(p => p.club!.id)
      );
      setExpandedClubs(clubsWithProfessionals);
    } catch (error) {
      console.error("Error fetching professionals:", error);
      toast.error("Erro ao carregar profissionais");
    } finally {
      setLoading(false);
    }
  };

  const filteredProfessionals = professionals.filter(prof => {
    // Search filter
    const matchesSearch = !searchTerm || 
      prof.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.crp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === "all" || prof.approval_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Separate pending approvals
  const pendingApprovals = filteredProfessionals.filter(p => p.approval_status === "pending_approval");
  const regularProfessionals = filteredProfessionals.filter(p => p.approval_status !== "pending_approval");

  // Group by club
  const professionalsByClub = regularProfessionals.reduce((acc, prof) => {
    const clubId = prof.club?.id || "sem-clube";
    if (!acc[clubId]) {
      acc[clubId] = [];
    }
    acc[clubId].push(prof);
    return acc;
  }, {} as Record<string, Professional[]>);

  const toggleClub = (clubId: string) => {
    setExpandedClubs(prev => {
      const next = new Set(prev);
      if (next.has(clubId)) {
        next.delete(clubId);
      } else {
        next.add(clubId);
      }
      return next;
    });
  };

  const getSubscriptionLabel = (type: string | null) => {
    switch (type) {
      case "annual": return "Anual";
      case "semiannual": return "Semestral";
      case "monthly": return "Mensal";
      default: return "Nenhum";
    }
  };

  const getSubscriptionColor = (type: string | null) => {
    switch (type) {
      case "annual": return "bg-purple-500/20 text-purple-500";
      case "semiannual": return "bg-blue-500/20 text-blue-500";
      case "monthly": return "bg-green-500/20 text-green-500";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

  const getApprovalStatusInfo = (status: string | null) => {
    switch (status) {
      case "approved":
        return { label: "Ativo", className: "bg-green-500/20 text-green-500", icon: CheckCircle2 };
      case "pending_approval":
        return { label: "Aguardando Aprovação", className: "bg-yellow-500/20 text-yellow-500", icon: Clock };
      case "rejected":
        return { label: "Reprovado", className: "bg-red-500/20 text-red-500", icon: XCircle };
      case "needs_correction":
        return { label: "Correção", className: "bg-orange-500/20 text-orange-500", icon: AlertTriangle };
      case "pending_payment":
        return { label: "Aguardando Pgto", className: "bg-blue-500/20 text-blue-500", icon: CreditCard };
      default:
        return { label: "Inativo", className: "bg-gray-500/20 text-gray-500", icon: XCircle };
    }
  };

  const renderProfessionalRow = (prof: Professional) => {
    const statusInfo = getApprovalStatusInfo(prof.approval_status);
    return (
      <tr
        key={prof.id}
        onClick={() => setSelectedProfessional(prof)}
        className={`border-b ${themeStyles.border} ${themeStyles.hoverBg} cursor-pointer transition-colors`}
      >
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center overflow-hidden">
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
          <span className={`px-2 py-1 rounded-full text-xs ${getSubscriptionColor(prof.subscription_type)}`}>
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProfessional(prof);
            }}
            className={`p-2 ${themeStyles.hoverBg} rounded-lg transition-colors`}
          >
            <MoreVertical className={`w-4 h-4 ${themeStyles.textMuted}`} />
          </button>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Button */}
      <div className="flex items-center justify-between">
        <h2 className={`font-display text-xl ${themeStyles.text}`}>
          Profissionais Parceiros ({filteredProfessionals.length})
        </h2>
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex items-center gap-2 px-3 py-2 ${themeStyles.card} border ${themeStyles.border} rounded-lg hover:bg-muted transition-colors`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filtrar</span>
          </button>
          {showFilterMenu && (
            <div className={`absolute right-0 mt-2 w-48 ${themeStyles.card} border ${themeStyles.border} rounded-lg shadow-lg z-10`}>
              {[
                { value: "all", label: "Todos" },
                { value: "approved", label: "Aprovados" },
                { value: "pending_approval", label: "Aguardando Aprovação" },
                { value: "pending_payment", label: "Aguardando Pagamento" },
                { value: "needs_correction", label: "Correção Necessária" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setShowFilterMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
                    statusFilter === option.value ? "bg-primary/10 text-primary" : ""
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Approvals Section */}
      {pendingApprovals.length > 0 && (
        <div className={`${themeStyles.card} border-2 border-yellow-500/50 rounded-xl overflow-hidden`}>
          <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <h3 className={`font-display text-lg ${themeStyles.text}`}>
              Aprovações Pendentes ({pendingApprovals.length})
            </h3>
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
                {pendingApprovals.map(renderProfessionalRow)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Professionals by Club */}
      {Object.entries(professionalsByClub).map(([clubId, clubProfessionals]) => {
        const club = clubs.find(c => c.id === clubId);
        const isExpanded = expandedClubs.has(clubId);
        const clubName = club?.name || "Sem Clube";
        const clubColor = club?.primary_color || "#6B7280";

        return (
          <div key={clubId} className={`${themeStyles.card} border ${themeStyles.border} rounded-xl overflow-hidden`}>
            {/* Club Header */}
            <button
              onClick={() => toggleClub(clubId)}
              className={`w-full p-4 border-b ${themeStyles.border} flex items-center justify-between hover:bg-muted/50 transition-colors`}
            >
              <div className="flex items-center gap-3">
                {club?.badge_url && (
                  <img
                    src={club.badge_url}
                    alt={clubName}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <h3 className={`font-display text-lg ${themeStyles.text}`} style={{ color: clubColor }}>
                  {clubName} ({clubProfessionals.length})
                </h3>
              </div>
              {isExpanded ? (
                <ChevronUp className={`w-5 h-5 ${themeStyles.textMuted}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${themeStyles.textMuted}`} />
              )}
            </button>

            {/* Professionals Table */}
            {isExpanded && (
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
                    {clubProfessionals.map(renderProfessionalRow)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {filteredProfessionals.length === 0 && (
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-8 text-center`}>
          <p className={themeStyles.textMuted}>
            {searchTerm ? "Nenhum profissional encontrado" : "Nenhum profissional cadastrado"}
          </p>
        </div>
      )}

      {/* Details Dialog */}
      <ProfessionalDetailsDialog
        professional={selectedProfessional}
        open={!!selectedProfessional}
        onClose={() => setSelectedProfessional(null)}
        themeStyles={themeStyles}
        onRefresh={fetchProfessionals}
      />
    </div>
  );
};

export default AdminProfessionalsTable;
