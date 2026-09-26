import { useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Clock3, Eye, EyeOff, RefreshCw, Search, ShieldCheck, UserRoundX, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProfessionalDetailsDialog from "./ProfessionalDetailsDialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  marketplace_visible: boolean;
  deleted_at: string | null;
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

type ManagementTab = "active" | "inactive" | "pending" | "deleted";

const TAB_LABELS: Record<ManagementTab, string> = {
  active: "Ativos",
  inactive: "Inativos",
  pending: "Aguardando aprovação",
  deleted: "Deletados",
};

const AdminProfessionalsManagement = ({ themeStyles }: AdminProfessionalsManagementProps) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [activeTab, setActiveTab] = useState<ManagementTab>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const { data: professionalsData, error } = await supabase
        .from("professionals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = (professionalsData || []).map((professional) => professional.user_id);
      const professionalIds = (professionalsData || []).map((professional) => professional.id);
      const [{ data: profiles }, { data: appointments }] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("user_id, full_name, avatar_url, phone, birth_date, city, state, favorite_club_id").in("user_id", userIds)
          : Promise.resolve({ data: [] }),
        professionalIds.length
          ? supabase.from("appointments").select("professional_id").in("professional_id", professionalIds).limit(5000)
          : Promise.resolve({ data: [] }),
      ]);

      const clubIds = [...new Set((profiles || []).map((profile) => profile.favorite_club_id).filter((id): id is string => Boolean(id)))];
      const { data: clubs } = clubIds.length
        ? await supabase.from("clubs").select("id, name, primary_color, badge_url").in("id", clubIds)
        : { data: [] };

      let emailsMap = new Map<string, string>();
      if (userIds.length) {
        const { data: emailData } = await supabase.functions.invoke("get-user-emails", { body: { userIds } });
        if (emailData?.emails) emailsMap = new Map(Object.entries(emailData.emails));
      }

      const profilesMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
      const clubsMap = new Map((clubs || []).map((club) => [club.id, club]));
      const appointmentCounts = new Map<string, number>();
      (appointments || []).forEach((appointment) => {
        appointmentCounts.set(appointment.professional_id, (appointmentCounts.get(appointment.professional_id) || 0) + 1);
      });

      setProfessionals((professionalsData || []).map((professional) => {
        const profile = profilesMap.get(professional.user_id);
        return {
          ...professional,
          profile,
          email: emailsMap.get(professional.user_id),
          club: profile?.favorite_club_id ? clubsMap.get(profile.favorite_club_id) : undefined,
          appointmentsCount: appointmentCounts.get(professional.id) || 0,
        };
      }));
    } catch (error) {
      console.error("Error fetching professionals:", error);
      toast.error("Erro ao carregar profissionais");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const groups = useMemo<Record<ManagementTab, Professional[]>>(() => ({
    active: professionals.filter((professional) => !professional.deleted_at && professional.approval_status === "approved" && professional.is_active),
    inactive: professionals.filter((professional) => !professional.deleted_at && professional.approval_status !== "pending_approval" && !(professional.approval_status === "approved" && professional.is_active)),
    pending: professionals.filter((professional) => !professional.deleted_at && professional.approval_status === "pending_approval"),
    deleted: professionals.filter((professional) => Boolean(professional.deleted_at)),
  }), [professionals]);

  const visibleProfessionals = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("pt-BR");
    if (!query) return groups[activeTab];
    return groups[activeTab].filter((professional) =>
      professional.profile?.full_name?.toLocaleLowerCase("pt-BR").includes(query)
      || professional.crp?.toLocaleLowerCase("pt-BR").includes(query)
      || professional.club?.name.toLocaleLowerCase("pt-BR").includes(query)
      || professional.email?.toLocaleLowerCase("pt-BR").includes(query)
    );
  }, [activeTab, groups, searchTerm]);

  const updateMarketplaceVisibility = async (professional: Professional, visible: boolean) => {
    if (professional.deleted_at || professional.approval_status !== "approved" || !professional.is_active) return;
    setUpdatingId(professional.id);
    const { error } = await supabase.from("professionals").update({ marketplace_visible: visible }).eq("id", professional.id);
    if (error) {
      toast.error("Não foi possível alterar a visibilidade");
    } else {
      setProfessionals((current) => current.map((item) => item.id === professional.id ? { ...item, marketplace_visible: visible } : item));
      toast.success(visible ? "Perfil exibido no marketplace" : "Perfil ocultado do marketplace");
    }
    setUpdatingId(null);
  };

  const restoreProfessional = async (professional: Professional) => {
    setUpdatingId(professional.id);
    const { error } = await supabase
      .from("professionals")
      .update({ deleted_at: null, is_active: false, marketplace_visible: false, approval_status: "cancelled" })
      .eq("id", professional.id);
    if (error) {
      toast.error("Não foi possível restaurar o cadastro");
    } else {
      toast.success("Cadastro restaurado como inativo");
      await fetchProfessionals();
      setActiveTab("inactive");
    }
    setUpdatingId(null);
  };

  const summaryCards = [
    { key: "active" as const, label: "Profissionais ativos", icon: ShieldCheck, accent: "text-emerald-600", iconBg: "bg-emerald-100" },
    { key: "inactive" as const, label: "Profissionais inativos", icon: UserRoundX, accent: "text-gray-600", iconBg: "bg-gray-100" },
    { key: "pending" as const, label: "Aguardando aprovação", icon: Clock3, accent: "text-amber-600", iconBg: "bg-amber-100" },
    { key: "deleted" as const, label: "Profissionais deletados", icon: Archive, accent: "text-red-600", iconBg: "bg-red-100" },
  ];

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><RefreshCw className="h-7 w-7 animate-spin text-secondary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={`text-sm font-semibold uppercase ${themeStyles.textMuted}`}>Administração</p>
          <h2 className={`font-display text-3xl ${themeStyles.text}`}>Gestão de profissionais</h2>
          <p className={`mt-1 text-sm ${themeStyles.textMuted}`}>Acompanhe cadastros, aprovações e presença no marketplace.</p>
        </div>
        <Button variant="outline" onClick={fetchProfessionals} className={`${themeStyles.card} ${themeStyles.border}`}>
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ key, label, icon: Icon, accent, iconBg }) => (
          <button key={key} type="button" onClick={() => setActiveTab(key)} className={`${themeStyles.card} ${themeStyles.border} border rounded-lg p-4 text-left transition-shadow hover:shadow-md`}>
            <div className="flex items-center justify-between gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}><Icon className={`h-5 w-5 ${accent}`} /></div>
              <span className={`text-3xl font-bold ${themeStyles.text}`}>{groups[key].length}</span>
            </div>
            <p className={`mt-4 text-sm font-medium ${themeStyles.text}`}>{label}</p>
          </button>
        ))}
      </div>

      <div className={`${themeStyles.card} ${themeStyles.border} overflow-hidden rounded-lg border`}>
        <div className={`border-b p-4 ${themeStyles.border}`}>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ManagementTab)}>
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 lg:grid-cols-4">
              {(Object.keys(TAB_LABELS) as ManagementTab[]).map((tab) => (
                <TabsTrigger key={tab} value={tab} className="min-h-10 gap-2">
                  {TAB_LABELS[tab]} <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{groups[tab].length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative mt-4 max-w-xl">
            <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${themeStyles.textMuted}`} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome, CRP, clube ou e-mail"
              className={`w-full rounded-md border bg-transparent py-2.5 pl-10 pr-4 text-sm ${themeStyles.border} ${themeStyles.text} focus:border-secondary focus:outline-none`}
            />
          </div>
        </div>

        {visibleProfessionals.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className={`mx-auto h-9 w-9 ${themeStyles.textMuted}`} />
            <p className={`mt-3 font-medium ${themeStyles.text}`}>Nenhum profissional nesta aba</p>
            <p className={`mt-1 text-sm ${themeStyles.textMuted}`}>{searchTerm ? "Tente outro termo de busca." : "Os cadastros aparecerão aqui quando houver movimentação."}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visibleProfessionals.map((professional) => {
              const canShow = professional.approval_status === "approved" && professional.is_active && !professional.deleted_at;
              return (
                <div key={professional.id} className={`grid gap-4 p-4 md:grid-cols-[minmax(240px,1.4fr)_minmax(160px,0.8fr)_minmax(200px,1fr)_auto] md:items-center ${themeStyles.hoverBg}`}>
                  <button type="button" onClick={() => setSelectedProfessional(professional)} className="flex min-w-0 items-center gap-3 text-left">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary/15">
                      {professional.profile?.avatar_url ? <img src={professional.profile.avatar_url} alt="" className="h-full w-full object-cover object-top" /> : <Users className="h-5 w-5 text-secondary" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate font-semibold ${themeStyles.text}`}>{professional.profile?.full_name || "Sem nome"}</p>
                      <p className={`truncate text-sm ${themeStyles.textMuted}`}>CRP {professional.crp || "não informado"} · {professional.club?.name || "Sem clube"}</p>
                    </div>
                  </button>

                  <div>
                    <p className={`text-xs font-medium uppercase ${themeStyles.textMuted}`}>Situação</p>
                    <p className={`mt-1 text-sm font-semibold ${themeStyles.text}`}>{professional.deleted_at ? "Deletado" : professional.approval_status === "approved" && professional.is_active ? "Ativo" : professional.approval_status === "pending_approval" ? "Em análise" : "Inativo"}</p>
                  </div>

                  <div className="flex items-center justify-between gap-4 md:justify-start">
                    <div>
                      <p className={`text-sm font-semibold ${themeStyles.text}`}>Exibir no marketplace</p>
                      <p className={`text-xs ${themeStyles.textMuted}`}>{canShow ? (professional.marketplace_visible ? "Perfil público" : "Perfil oculto") : "Disponível após ativação"}</p>
                    </div>
                    <Switch
                      checked={canShow && professional.marketplace_visible}
                      disabled={!canShow || updatingId === professional.id}
                      onCheckedChange={(checked) => updateMarketplaceVisibility(professional, checked)}
                      aria-label={`Exibir ${professional.profile?.full_name || "profissional"} no marketplace`}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    {professional.deleted_at && (
                      <Button variant="outline" size="sm" disabled={updatingId === professional.id} onClick={() => restoreProfessional(professional)}>
                        Restaurar
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setSelectedProfessional(professional)} title="Ver detalhes" aria-label="Ver detalhes">
                      {professional.marketplace_visible && canShow ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProfessionalDetailsDialog professional={selectedProfessional} open={Boolean(selectedProfessional)} onClose={() => setSelectedProfessional(null)} themeStyles={themeStyles} onRefresh={fetchProfessionals} />
    </div>
  );
};

export default AdminProfessionalsManagement;
