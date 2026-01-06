import { useState, useEffect } from "react";
import { 
  Clock, AlertTriangle, CreditCard, CheckCircle2, XCircle, 
  ChevronDown, ChevronUp, Users, Eye, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProfessionalDetailsDialog from "./ProfessionalDetailsDialog";
import { format, isPast, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ThemeStyles {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  hoverBg: string;
  tableBg: string;
}

interface AdminProfessionalsManagementProps {
  themeStyles: ThemeStyles;
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

type ManagementSection = "pending_approval" | "needs_correction" | "pending_payment" | "expiring_soon";

const AdminProfessionalsManagement = ({ themeStyles }: AdminProfessionalsManagementProps) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<ManagementSection>>(
    new Set(["pending_approval", "needs_correction", "pending_payment", "expiring_soon"])
  );

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);

      const { data: professionalsData, error: professionalsError } = await supabase
        .from("professionals")
        .select("*")
        .order("created_at", { ascending: false });

      if (professionalsError) throw professionalsError;

      const userIds = (professionalsData || []).map(p => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, phone, birth_date, city, state, favorite_club_id")
        .in("user_id", userIds);

      const clubIds = [...new Set((profiles || []).map(p => p.favorite_club_id).filter(Boolean))];
      const { data: clubsData } = await supabase
        .from("clubs")
        .select("id, name, primary_color, badge_url")
        .in("id", clubIds);

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

      const { data: appointments } = await supabase
        .from("appointments")
        .select("professional_id");

      const appointmentCounts = new Map<string, number>();
      (appointments || []).forEach(a => {
        const count = appointmentCounts.get(a.professional_id) || 0;
        appointmentCounts.set(a.professional_id, count + 1);
      });

      const profilesMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const clubsMap = new Map((clubsData || []).map(c => [c.id, c]));

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
    } catch (error) {
      console.error("Error fetching professionals:", error);
      toast.error("Erro ao carregar profissionais");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: ManagementSection) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Filter professionals by status
  const pendingApproval = professionals.filter(p => p.approval_status === "pending_approval");
  const needsCorrection = professionals.filter(p => p.approval_status === "needs_correction");
  const pendingPayment = professionals.filter(p => p.approval_status === "pending_payment");
  
  // Expiring subscriptions (within 30 days or already expired)
  const expiringSoon = professionals.filter(p => {
    if (!p.subscription_expires_at || p.approval_status !== "approved") return false;
    const expiresAt = new Date(p.subscription_expires_at);
    const thirtyDaysFromNow = addDays(new Date(), 30);
    return expiresAt <= thirtyDaysFromNow;
  });

  const getSubscriptionLabel = (type: string | null) => {
    switch (type) {
      case "annual": return "Anual";
      case "semiannual": return "Semestral";
      case "monthly": return "Mensal";
      default: return "Nenhum";
    }
  };

  const getExpirationStatus = (expiresAt: string | null) => {
    if (!expiresAt) return { label: "Sem data", className: "bg-gray-500/20 text-gray-500" };
    const date = new Date(expiresAt);
    if (isPast(date)) {
      return { label: "Expirado", className: "bg-red-500/20 text-red-500" };
    }
    const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      return { label: `${daysLeft} dias`, className: "bg-red-500/20 text-red-500" };
    }
    if (daysLeft <= 30) {
      return { label: `${daysLeft} dias`, className: "bg-orange-500/20 text-orange-500" };
    }
    return { label: format(date, "dd/MM/yyyy"), className: "bg-green-500/20 text-green-500" };
  };

  const renderProfessionalCard = (prof: Professional, showExpiration?: boolean) => {
    const expirationStatus = showExpiration ? getExpirationStatus(prof.subscription_expires_at) : null;
    
    return (
      <div
        key={prof.id}
        onClick={() => setSelectedProfessional(prof)}
        className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-4 ${themeStyles.hoverBg} cursor-pointer transition-colors`}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {prof.profile?.avatar_url ? (
              <img
                src={prof.profile.avatar_url}
                alt=""
                className="w-12 h-12 rounded-full object-cover object-top"
              />
            ) : (
              <span className="text-lg">🧑‍⚕️</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {prof.club?.badge_url && (
                <img src={prof.club.badge_url} alt="" className="w-5 h-5 object-contain" />
              )}
              <h4 className={`font-medium ${themeStyles.text} truncate`}>
                {prof.profile?.full_name || "Sem nome"}
              </h4>
            </div>
            <p className={`text-sm ${themeStyles.textMuted}`}>
              CRP {prof.crp} • {prof.club?.name || "Sem clube"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                prof.subscription_type === "annual" ? "bg-purple-500/20 text-purple-500" :
                prof.subscription_type === "semiannual" ? "bg-blue-500/20 text-blue-500" :
                prof.subscription_type === "monthly" ? "bg-green-500/20 text-green-500" :
                "bg-gray-500/20 text-gray-500"
              }`}>
                {getSubscriptionLabel(prof.subscription_type)}
              </span>
              {expirationStatus && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${expirationStatus.className}`}>
                  {expirationStatus.label}
                </span>
              )}
            </div>
          </div>

          {/* Action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProfessional(prof);
            }}
            className="p-2 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors"
          >
            <Eye className="w-4 h-4 text-secondary" />
          </button>
        </div>
      </div>
    );
  };

  const renderSection = (
    section: ManagementSection,
    title: string,
    icon: React.ElementType,
    items: Professional[],
    borderColor: string,
    bgColor: string,
    textColor: string,
    showExpiration?: boolean
  ) => {
    const Icon = icon;
    const isExpanded = expandedSections.has(section);

    return (
      <div className={`${themeStyles.card} border-2 ${borderColor} rounded-xl overflow-hidden`}>
        <button
          onClick={() => toggleSection(section)}
          className={`w-full p-4 ${bgColor} border-b ${borderColor} flex items-center justify-between hover:opacity-90 transition-opacity`}
        >
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${textColor}`} />
            <h3 className={`font-display text-lg ${themeStyles.text}`}>
              {title}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${textColor} bg-white/20`}>
              {items.length}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className={`w-5 h-5 ${themeStyles.textMuted}`} />
          ) : (
            <ChevronDown className={`w-5 h-5 ${themeStyles.textMuted}`} />
          )}
        </button>

        {isExpanded && (
          <div className="p-4">
            {items.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map(prof => renderProfessionalCard(prof, showExpiration))}
              </div>
            ) : (
              <div className={`text-center py-8 ${themeStyles.textMuted}`}>
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum item pendente</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
      </div>
    );
  }

  const totalPending = pendingApproval.length + needsCorrection.length + pendingPayment.length + expiringSoon.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-display text-2xl ${themeStyles.text}`}>
            Gestão de Profissionais
          </h2>
          <p className={`${themeStyles.textMuted} text-sm mt-1`}>
            {totalPending > 0 
              ? `${totalPending} item(s) pendente(s) de ação`
              : "Tudo em dia!"}
          </p>
        </div>
        <button
          onClick={fetchProfessionals}
          className={`flex items-center gap-2 px-4 py-2 ${themeStyles.card} border ${themeStyles.border} rounded-lg hover:bg-muted transition-colors`}
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Atualizar</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${themeStyles.text}`}>{pendingApproval.length}</p>
              <p className={`text-xs ${themeStyles.textMuted}`}>Aguardando Aprovação</p>
            </div>
          </div>
        </div>
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${themeStyles.text}`}>{needsCorrection.length}</p>
              <p className={`text-xs ${themeStyles.textMuted}`}>Ajustes Solicitados</p>
            </div>
          </div>
        </div>
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${themeStyles.text}`}>{pendingPayment.length}</p>
              <p className={`text-xs ${themeStyles.textMuted}`}>Aguardando Assinatura</p>
            </div>
          </div>
        </div>
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${themeStyles.text}`}>{expiringSoon.length}</p>
              <p className={`text-xs ${themeStyles.textMuted}`}>Renovações Pendentes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {renderSection(
        "pending_approval",
        "Aguardando Aprovação",
        Clock,
        pendingApproval,
        "border-yellow-500/50",
        "bg-yellow-500/10",
        "text-yellow-500"
      )}

      {renderSection(
        "needs_correction",
        "Ajustes Solicitados",
        AlertTriangle,
        needsCorrection,
        "border-orange-500/50",
        "bg-orange-500/10",
        "text-orange-500"
      )}

      {renderSection(
        "pending_payment",
        "Aguardando Assinatura",
        CreditCard,
        pendingPayment,
        "border-blue-500/50",
        "bg-blue-500/10",
        "text-blue-500"
      )}

      {renderSection(
        "expiring_soon",
        "Renovações Pendentes",
        XCircle,
        expiringSoon,
        "border-red-500/50",
        "bg-red-500/10",
        "text-red-500",
        true
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

export default AdminProfessionalsManagement;
