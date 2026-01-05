import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Clock, Users, TrendingUp, LogOut, Plus, CheckCircle, XCircle, Edit2, ChevronRight, User, ChevronLeft, Upload, Lock, Loader2 } from "lucide-react";
import AccountSettingsDialog from "@/components/profile/AccountSettingsDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProfileStatusCard from "@/components/professional/ProfileStatusCard";
import ProfileCompletionForm from "@/components/professional/ProfileCompletionForm";
import SubscriptionPlans from "@/components/professional/SubscriptionPlans";
import StripeConnectCard from "@/components/professional/StripeConnectCard";
import PixPaymentCard from "@/components/professional/PixPaymentCard";
import SubscriptionManager from "@/components/professional/SubscriptionManager";

interface Professional {
  id: string;
  user_id: string;
  crp: string;
  bio: string | null;
  degree: string | null;
  experience_years: number | null;
  hourly_rate: number | null;
  specialties: string[] | null;
  is_active: boolean;
  is_verified: boolean;
  subscription_type: string | null;
  subscription_expires_at: string | null;
  location: string | null;
}

interface Profile {
  full_name: string | null;
  favorite_club_id: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
}

interface Club {
  id: string;
  name: string;
  primary_color: string;
  badge_url: string | null;
}

type OnboardingStep = "status" | "profile" | "subscription";
type DashboardTab = "agenda" | "disponibilidade" | "metricas" | "perfil" | "assinatura";

const ProfessionalDashboard = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupError, setSetupError] = useState(false);
  
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("status");
  const [activeTab, setActiveTab] = useState<DashboardTab>("perfil");
  
  const [availableDates, setAvailableDates] = useState<{ date: string; times: string[] }[]>([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTimes, setNewTimes] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Check for checkout success and verify subscription
  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    const planId = searchParams.get("plan");
    
    if (checkoutStatus === "success" && planId) {
      toast.success("Pagamento processado! Verificando assinatura...");
      // Clear URL params
      setSearchParams({});
      // Verify subscription with Stripe
      verifySubscription();
    } else if (checkoutStatus === "cancelled") {
      toast.info("Checkout cancelado");
      setSearchParams({});
    }
  }, [searchParams]);

  const verifySubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-professional-subscription');
      
      if (error) {
        console.error("Error verifying subscription:", error);
        return;
      }
      
      if (data?.subscribed) {
        toast.success("Assinatura ativada! Seu perfil está agora visível no marketplace.");
        fetchProfessionalData();
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  useEffect(() => {
    if (!hasRole("professional")) {
      navigate("/");
      return;
    }
    fetchProfessionalData();
  }, [hasRole, navigate, user]);

  const fetchProfessionalData = async () => {
    if (!user) return;

    try {
      // Fetch profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, favorite_club_id, avatar_url, city, state")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Fetch club data if user has favorite club
        if (profileData.favorite_club_id) {
          const { data: clubData } = await supabase
            .from("clubs")
            .select("id, name, primary_color, badge_url")
            .eq("id", profileData.favorite_club_id)
            .single();

          if (clubData) {
            setClub(clubData);
          }
        }
      }

      // Fetch professional record
      let { data: profData } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!profData) {
        // Professional record doesn't exist - try to complete signup via edge function
        const pendingData = localStorage.getItem('pendingProfileUpdate');
        
        if (pendingData) {
          const parsed = JSON.parse(pendingData);
          const crp = parsed.crp;
          
          if (crp) {
            console.log("[Dashboard] Retrying professional signup via edge function");
            const { crp: pendingCrp, ...profileFields } = parsed;
            
            const { error: fnError } = await supabase.functions.invoke("complete-professional-signup", {
              body: {
                crp: pendingCrp,
                profile: profileFields,
              },
            });

            if (!fnError) {
              console.log("[Dashboard] Professional signup completed, refetching data");
              localStorage.removeItem('pendingProfileUpdate');
              
              // Refetch professional data
              const { data: newProfData } = await supabase
                .from("professionals")
                .select("*")
                .eq("user_id", user.id)
                .single();
              
              profData = newProfData;
            } else {
              console.error("[Dashboard] Edge function failed:", fnError);
              toast.error("Erro ao completar cadastro profissional. Tente novamente.");
            }
          }
        }
        
        if (!profData) {
          console.log("[Dashboard] No professional record found and no pending CRP data");
          setSetupError(true);
          setIsLoading(false);
          return;
        }
      }

      if (profData) {
        setProfessional(profData);
        
        // Determine onboarding step
        const isProfileComplete = !!(profData.bio && profData.degree && profData.specialties?.length);
        const isSubscribed = !!(profData.subscription_type && profData.is_active);
        
        if (!isProfileComplete) {
          setOnboardingStep("profile");
        } else if (!isSubscribed) {
          setOnboardingStep("subscription");
        } else {
          setOnboardingStep("status");
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isProfileComplete = !!(professional?.bio && professional?.degree && professional?.specialties?.length);
  const isSubscribed = !!(professional?.subscription_type && professional?.is_active);

  // Fetch appointments when professional is loaded and subscribed
  useEffect(() => {
    if (professional && isSubscribed) {
      fetchAppointments();
    }
  }, [professional, isSubscribed]);

  const fetchAppointments = async () => {
    if (!professional) return;
    setLoadingAppointments(true);
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            phone
          )
        `)
        .eq('professional_id', professional.id)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;
      
      toast.success(newStatus === 'confirmed' ? 'Agendamento confirmado!' : 'Agendamento recusado');
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Erro ao atualizar agendamento');
    }
  };

  const handleViewReceipt = async (receiptPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .createSignedUrl(receiptPath, 3600); // 1 hour expiry

      if (error) throw error;
      
      if (data?.signedUrl) {
        setSelectedReceipt(data.signedUrl);
      }
    } catch (error) {
      console.error('Error getting receipt:', error);
      toast.error('Erro ao carregar comprovante');
    }
  };

  const stats = [
    { label: "Consultas este mês", value: isSubscribed ? appointments.length.toString() : "0", icon: Calendar, color: "text-therapy" },
    { label: "Pacientes atendidos", value: isSubscribed ? appointments.filter(a => a.status === 'confirmed').length.toString() : "0", icon: Users, color: "text-secondary" },
    { label: "Taxa de conclusão", value: isSubscribed && appointments.length > 0 ? `${Math.round((appointments.filter(a => a.status === 'confirmed').length / appointments.length) * 100)}%` : "—", icon: TrendingUp, color: "text-green-500" },
    { label: "Pendentes", value: isSubscribed ? appointments.filter(a => a.status === 'pending').length.toString() : "—", icon: Clock, color: "text-yellow-500" },
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

  const handleProfileComplete = () => {
    setOnboardingStep("subscription");
    fetchProfessionalData();
  };

  const handleSubscriptionComplete = () => {
    setOnboardingStep("status");
    fetchProfessionalData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-therapy border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (setupError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="font-display text-2xl text-card-foreground mb-2">
            Cadastro Incompleto
          </h2>
          <p className="text-muted-foreground mb-6">
            Não encontramos seu cadastro profissional. Por favor, faça o cadastro novamente como profissional.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/auth?mode=professional")}
              className="w-full py-3 bg-therapy text-therapy-foreground rounded-xl font-medium hover:scale-[1.02] transition-transform"
            >
              Cadastrar como Profissional
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            {profile?.avatar_url ? (
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-md">
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl text-therapy">
                Painel do Profissional
              </h1>
              <p className="text-muted-foreground text-sm">
                {profile?.full_name || user?.email} {club && `• ${club.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AccountSettingsDialog />
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
        {/* Profile Status */}
        <div className="mb-6">
          <ProfileStatusCard 
            isProfileComplete={isProfileComplete}
            isSubscribed={isSubscribed}
            clubName={club?.name || null}
          />
        </div>

        {/* Tabs - Always visible, some disabled without subscription */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "perfil", label: "Meu Perfil", locked: false },
            { id: "assinatura", label: "Assinatura", locked: false },
            { id: "agenda", label: "Agendamentos", locked: !isSubscribed },
            { id: "disponibilidade", label: "Disponibilidade", locked: !isSubscribed },
            { id: "metricas", label: "Métricas", locked: !isSubscribed },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.locked) {
                  toast.info("Complete sua assinatura para acessar esta funcionalidade");
                  return;
                }
                setActiveTab(tab.id as DashboardTab);
              }}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-therapy text-therapy-foreground"
                  : tab.locked 
                    ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
              {tab.locked && <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />}
            </button>
          ))}
        </div>

        {/* Onboarding Progress (only shown when not subscribed) */}
        {!isSubscribed && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setActiveTab("perfil")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  isProfileComplete ? "bg-therapy/20 text-therapy" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold">
                  {isProfileComplete ? <CheckCircle className="w-4 h-4" /> : "1"}
                </span>
                <span className="text-sm font-medium hidden sm:inline">Completar Perfil</span>
              </button>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={() => setActiveTab("assinatura")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  isSubscribed ? "bg-therapy/20 text-therapy" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold">
                  {isSubscribed ? <CheckCircle className="w-4 h-4" /> : "2"}
                </span>
                <span className="text-sm font-medium hidden sm:inline">Assinar Plano</span>
              </button>
            </div>
          </div>
        )}

        {/* Stats (only shown when subscribed) */}
        {isSubscribed && (
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
        )}

        {/* Perfil Tab */}
        {activeTab === "perfil" && professional && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-card-foreground mb-4">
              Editar Perfil
            </h2>
            <ProfileCompletionForm 
              professionalId={professional.id}
              existingData={{
                bio: professional.bio || "",
                degree: professional.degree || "",
                specialties: professional.specialties || [],
                sessionPrice: professional.hourly_rate?.toString() || "",
                imageUrl: profile?.avatar_url || ""
              }}
              onComplete={() => {
                toast.success("Perfil atualizado!");
                fetchProfessionalData();
              }}
            />
            
            {/* Payment Cards */}
            <div className="space-y-4 mt-8">
              <h3 className="font-display text-xl text-card-foreground">
                Métodos de Recebimento
              </h3>
              <PixPaymentCard 
                professionalId={professional.id}
                pixKey={(professional as any).pix_key || null} 
                onUpdate={fetchProfessionalData}
              />
              <StripeConnectCard professionalId={professional.id} />
            </div>
          </div>
        )}

        {/* Assinatura Tab */}
        {activeTab === "assinatura" && professional && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-card-foreground mb-4">
              {isSubscribed ? "Gerenciar Assinatura" : "Escolha seu Plano"}
            </h2>
            {isSubscribed && professional.subscription_type && professional.subscription_expires_at ? (
              <SubscriptionManager 
                professionalId={professional.id}
                currentPlan={professional.subscription_type}
                expiresAt={professional.subscription_expires_at}
                onUpdate={fetchProfessionalData}
              />
            ) : (
              <SubscriptionPlans 
                professionalId={professional.id}
                onSubscribe={handleSubscriptionComplete}
              />
            )}
          </div>
        )}

        {/* Content only available with subscription */}
        {isSubscribed && (
          <>

            {/* Agenda Tab */}
            {activeTab === "agenda" && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl text-card-foreground mb-4">
                  Agendamentos
                </h2>
                
                {loadingAppointments ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-therapy" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum agendamento ainda</p>
                  </div>
                ) : (
                  appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-card border border-border rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-therapy/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-therapy" />
                          </div>
                          <div>
                            <h3 className="font-medium text-card-foreground">
                              {apt.profiles?.full_name || 'Paciente'}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              {format(new Date(apt.scheduled_date), "dd/MM/yyyy")} às {apt.scheduled_time}
                            </p>
                            {apt.profiles?.phone && (
                              <p className="text-muted-foreground text-xs mt-1">
                                Tel: {apt.profiles.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            apt.status === "confirmed"
                              ? "bg-green-500/20 text-green-500"
                              : apt.status === "cancelled"
                              ? "bg-red-500/20 text-red-500"
                              : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {apt.status === "confirmed" ? "Confirmado" : apt.status === "cancelled" ? "Recusado" : "Pendente"}
                        </span>
                      </div>
                      
                      {/* Receipt Section */}
                      {apt.receipt_url && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <button
                            onClick={() => handleViewReceipt(apt.receipt_url)}
                            className="flex items-center gap-2 text-sm text-therapy hover:underline"
                          >
                            <Upload className="w-4 h-4" />
                            Ver Comprovante de Pagamento
                          </button>
                        </div>
                      )}
                      
                      {/* Action Buttons for Pending */}
                      {apt.status === "pending" && (
                        <div className="mt-4 pt-4 border-t border-border flex gap-2">
                          <button 
                            onClick={() => handleUpdateAppointmentStatus(apt.id, 'confirmed')}
                            className="flex-1 py-2 bg-green-500/20 text-green-600 rounded-lg font-medium hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirmar
                          </button>
                          <button 
                            onClick={() => handleUpdateAppointmentStatus(apt.id, 'cancelled')}
                            className="flex-1 py-2 bg-red-500/20 text-red-600 rounded-lg font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Receipt Modal */}
                {selectedReceipt && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReceipt(null)}>
                    <div className="bg-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <h3 className="font-medium text-card-foreground">Comprovante de Pagamento</h3>
                        <button onClick={() => setSelectedReceipt(null)} className="p-2 hover:bg-muted rounded-lg">
                          <XCircle className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="p-4">
                        {selectedReceipt.includes('.pdf') ? (
                          <a 
                            href={selectedReceipt} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-therapy hover:underline"
                          >
                            <Upload className="w-5 h-5" />
                            Abrir PDF em nova aba
                          </a>
                        ) : (
                          <img 
                            src={selectedReceipt} 
                            alt="Comprovante" 
                            className="w-full rounded-lg"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                    className="flex items-center gap-2 px-4 py-2 bg-therapy text-therapy-foreground rounded-xl font-medium hover:scale-[1.02] transition-transform"
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
                                ? "bg-therapy text-therapy-foreground"
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
                        className="flex-1 py-3 bg-therapy text-therapy-foreground rounded-xl font-medium"
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
                              className="px-3 py-1 bg-therapy/20 text-therapy text-sm rounded-full"
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

          </>
        )}
      </main>
    </div>
  );
};

export default ProfessionalDashboard;
