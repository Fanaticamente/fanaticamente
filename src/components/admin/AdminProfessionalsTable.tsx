import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundX,
  Users,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProfessionalDetailsDialog from "./ProfessionalDetailsDialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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

type StatusTab = "active" | "inactive" | "pending" | "deleted";

const STATUS_TABS: Array<{ id: StatusTab; label: string; icon: typeof ShieldCheck }> = [
  { id: "active", label: "Ativos", icon: ShieldCheck },
  { id: "inactive", label: "Inativos", icon: UserRoundX },
  { id: "pending", label: "Em análise", icon: Clock3 },
  { id: "deleted", label: "Deletados", icon: Archive },
];

const fetchProfessionalsData = async (): Promise<Professional[]> => {
  const { data: professionalsData, error: professionalsError } = await supabase
    .from("professionals")
    .select("*")
    .order("created_at", { ascending: false });
  if (professionalsError) throw professionalsError;

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

  return (professionalsData || []).map((professional) => {
    const profile = profilesMap.get(professional.user_id);
    return {
      ...professional,
      profile,
      email: emailsMap.get(professional.user_id),
      club: profile?.favorite_club_id ? clubsMap.get(profile.favorite_club_id) : undefined,
      appointmentsCount: appointmentCounts.get(professional.id) || 0,
    };
  });
};

const getSubscriptionLabel = (type: string | null) => {
  if (type === "annual") return "Anual";
  if (type === "semiannual") return "Semestral";
  if (type === "monthly") return "Mensal";
  return "Sem plano";
};

const getStatusLabel = (professional: Professional) => {
  if (professional.deleted_at) return "Deletado";
  if (professional.approval_status === "pending_approval") return "Em análise";
  if (professional.approval_status === "approved" && professional.is_active) return "Ativo";
  if (professional.approval_status === "needs_correction") return "Correção";
  if (professional.approval_status === "rejected") return "Reprovado";
  if (professional.approval_status === "pending_payment") return "Aguardando plano";
  return "Inativo";
};

const AdminProfessionalsTable = ({ themeStyles, searchTerm }: AdminProfessionalsTableProps) => {
  const queryClient = useQueryClient();
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<StatusTab>("active");
  const [showFilters, setShowFilters] = useState(false);
  const [clubFilter, setClubFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(searchTerm);

  const { data: professionals = [], isLoading: loading } = useQuery({
    queryKey: ["admin-professionals"],
    queryFn: fetchProfessionalsData,
    staleTime: 1000 * 60 * 5,
  });

  const groups = useMemo<Record<StatusTab, Professional[]>>(() => ({
    active: professionals.filter((professional) => !professional.deleted_at && professional.approval_status === "approved" && professional.is_active),
    inactive: professionals.filter((professional) => !professional.deleted_at && professional.approval_status !== "pending_approval" && !(professional.approval_status === "approved" && professional.is_active)),
    pending: professionals.filter((professional) => !professional.deleted_at && professional.approval_status === "pending_approval"),
    deleted: professionals.filter((professional) => Boolean(professional.deleted_at)),
  }), [professionals]);

  const clubOptions = useMemo(() => {
    const unique = new Map<string, string>();
    professionals.forEach((professional) => {
      if (professional.club) unique.set(professional.club.id, professional.club.name);
    });
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [professionals]);

  const filteredProfessionals = useMemo(() => {
    const query = localSearch.trim().toLocaleLowerCase("pt-BR");
    return groups[activeTab].filter((professional) => {
      const matchesClub = clubFilter === "all" || (clubFilter === "none" ? !professional.club : professional.club?.id === clubFilter);
      const matchesSearch = !query
        || professional.profile?.full_name?.toLocaleLowerCase("pt-BR").includes(query)
        || professional.crp?.toLocaleLowerCase("pt-BR").includes(query)
        || professional.specialties?.some((specialty) => specialty.toLocaleLowerCase("pt-BR").includes(query))
        || professional.club?.name.toLocaleLowerCase("pt-BR").includes(query);
      return matchesClub && matchesSearch;
    });
  }, [activeTab, clubFilter, groups, localSearch]);

  const professionalsByClub = useMemo(() => filteredProfessionals.reduce<Record<string, Professional[]>>((result, professional) => {
    const key = professional.club?.id || "sem-clube";
    result[key] = [...(result[key] || []), professional];
    return result;
  }, {}), [filteredProfessionals]);

  useEffect(() => {
    setExpandedClubs(new Set(Object.keys(professionalsByClub)));
  }, [activeTab, professionals.length]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-professionals"] });

  const toggleClub = (clubId: string) => {
    setExpandedClubs((current) => {
      const next = new Set(current);
      next.has(clubId) ? next.delete(clubId) : next.add(clubId);
      return next;
    });
  };

  const updateMarketplaceVisibility = async (professional: Professional, visible: boolean) => {
    if (professional.deleted_at || professional.approval_status !== "approved" || !professional.is_active) return;
    setUpdatingId(professional.id);
    const { error } = await supabase.from("professionals").update({ marketplace_visible: visible }).eq("id", professional.id);
    if (error) {
      toast.error("Não foi possível alterar a visibilidade");
    } else {
      queryClient.setQueryData<Professional[]>(["admin-professionals"], (current = []) => current.map((item) => (
        item.id === professional.id ? { ...item, marketplace_visible: visible } : item
      )));
      toast.success(visible ? "Perfil exibido no marketplace" : "Perfil ocultado do marketplace");
    }
    setUpdatingId(null);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><RefreshCw className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5 font-sans">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-primary">Rede de atendimento</p>
          <h1 className={cn("mt-1 text-2xl font-bold md:text-3xl", themeStyles.text)}>Profissionais parceiros</h1>
          <p className={cn("mt-1 text-sm", themeStyles.textMuted)}>Gerencie cadastros, clubes e presença no marketplace.</p>
        </div>
        <div className="flex w-full gap-2 lg:w-auto">
          <label className="relative min-w-0 flex-1 lg:w-80">
            <span className="sr-only">Buscar profissional</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder="Buscar nome, CRP ou clube"
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </label>
          <Button variant="outline" size="icon" onClick={() => setShowFilters((current) => !current)} aria-expanded={showFilters} aria-label="Mostrar filtros" title="Mostrar filtros">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={refresh} aria-label="Atualizar profissionais" title="Atualizar profissionais">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Situação dos profissionais">
        {STATUS_TABS.map(({ id, label, icon: Icon }) => {
          const selected = activeTab === id;
          return (
            <Button
              key={id}
              type="button"
              variant="outline"
              onClick={() => setActiveTab(id)}
              className={cn(
                "h-auto min-h-20 justify-between rounded-lg px-3 py-3 text-left",
                selected && "border-primary bg-primary/10 text-primary hover:bg-primary/10",
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-normal text-xs leading-tight">{label}</span>
              </span>
              <span className="text-xl font-bold">{groups[id].length}</span>
            </Button>
          );
        })}
      </section>

      {showFilters && (
        <section className={cn("grid gap-3 rounded-lg border p-4 md:grid-cols-[minmax(220px,320px)_1fr] md:items-end", themeStyles.card, themeStyles.border)}>
          <label className="space-y-1.5 text-sm font-semibold">
            Clube
            <select value={clubFilter} onChange={(event) => setClubFilter(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
              <option value="all">Todos os clubes</option>
              <option value="none">Sem clube</option>
              {clubOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <p className={cn("text-sm md:pb-2", themeStyles.textMuted)}>{filteredProfessionals.length} resultado{filteredProfessionals.length === 1 ? "" : "s"} nesta visualização</p>
        </section>
      )}

      <section className="space-y-3">
        {Object.entries(professionalsByClub).map(([clubId, clubProfessionals]) => {
          const club = clubProfessionals[0]?.club;
          const clubName = club?.name || "Sem clube";
          const isExpanded = expandedClubs.has(clubId);
          return (
            <article key={clubId} className={cn("overflow-hidden rounded-lg border bg-card shadow-sm", themeStyles.border)}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleClub(clubId)}
                className="h-auto w-full justify-between rounded-none border-l-4 border-l-primary px-4 py-3 hover:bg-muted/70"
                aria-expanded={isExpanded}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    {club?.badge_url ? <img src={club.badge_url} alt="" className="h-7 w-7 object-contain" /> : <Users className="h-4 w-4 text-muted-foreground" />}
                  </span>
                  <span className="truncate text-sm font-bold uppercase text-foreground">{clubName}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{clubProfessionals.length}</span>
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </Button>

              {isExpanded && (
                <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
                  {clubProfessionals.map((professional) => {
                    const canShow = professional.approval_status === "approved" && professional.is_active && !professional.deleted_at;
                    const specialties = professional.specialties?.filter(Boolean) || [];
                    return (
                      <div key={professional.id} className="flex min-w-0 flex-col gap-4 bg-card p-4 transition-colors hover:bg-muted/30">
                        <Button type="button" variant="ghost" onClick={() => setSelectedProfessional(professional)} className="h-auto min-w-0 justify-start gap-3 rounded-md p-0 text-left hover:bg-transparent">
                          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                            {professional.profile?.avatar_url
                              ? <img src={professional.profile.avatar_url} alt="" className="h-full w-full object-cover object-top" />
                              : <Users className="h-5 w-5 text-primary" />}
                            <span className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card", professional.is_active && !professional.deleted_at ? "bg-primary" : "bg-muted-foreground")} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-card-foreground">{professional.profile?.full_name || "Sem nome"}</span>
                            <span className="mt-1 block truncate text-xs text-muted-foreground">CRP {professional.crp || "não informado"}</span>
                          </span>
                          <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">{getSubscriptionLabel(professional.subscription_type)}</span>
                        </Button>

                        <div className="flex min-h-7 flex-wrap gap-1.5">
                          {specialties.length ? specialties.slice(0, 2).map((specialty) => (
                            <span key={specialty} className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">{specialty}</span>
                          )) : <span className="text-xs text-muted-foreground">Especialidades não informadas</span>}
                          {specialties.length > 2 && <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">+{specialties.length - 2}</span>}
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedProfessional(professional)} className="h-8 px-2 text-xs">
                            {professional.marketplace_visible && canShow ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            {getStatusLabel(professional)}
                          </Button>
                          <div className="flex items-center gap-2">
                            <span className="text-right text-[11px] leading-tight text-muted-foreground">
                              Marketplace<br /><strong className="font-semibold text-foreground">{canShow && professional.marketplace_visible ? "Visível" : "Oculto"}</strong>
                            </span>
                            <Switch
                              checked={canShow && professional.marketplace_visible}
                              disabled={!canShow || updatingId === professional.id}
                              onCheckedChange={(checked) => updateMarketplaceVisibility(professional, checked)}
                              aria-label={`Exibir ${professional.profile?.full_name || "profissional"} no marketplace`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}

        {filteredProfessionals.length === 0 && (
          <div className={cn("rounded-lg border bg-card px-6 py-14 text-center", themeStyles.border)}>
            <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold text-card-foreground">Nenhum profissional nesta visualização</p>
            <p className="mt-1 text-sm text-muted-foreground">Altere a busca, o clube ou a situação selecionada.</p>
          </div>
        )}
      </section>

      <ProfessionalDetailsDialog
        professional={selectedProfessional}
        open={Boolean(selectedProfessional)}
        onClose={() => setSelectedProfessional(null)}
        themeStyles={themeStyles}
        onRefresh={refresh}
      />
    </div>
  );
};

export default AdminProfessionalsTable;